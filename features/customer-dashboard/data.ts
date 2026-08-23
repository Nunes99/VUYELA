import "server-only";

import {
  getCustomerCards,
  rowFrom,
  rowsFrom,
  toMap,
  uniqueValues
} from "@/features/customer-cards/data";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { CustomerNotification } from "@/features/notifications/model";

import {
  buildCustomerDashboardViewModel,
  getActivityDescription,
  getActivityPoints,
  getActivityTone
} from "./model";
import type {
  CustomerActivityItem,
  CustomerDashboardViewModel,
  CustomerExploreOffer,
  CustomerProfileSummary
} from "./model";

interface ProfileRow {
  id: string;
  display_name: string | null;
  email: string | null;
  phone: string | null;
  locale: string | null;
  marketing_consent_at: string | null;
}

interface TransactionRow {
  id: string;
  business_id: string;
  customer_card_id: string;
  points_earned: number;
  points_redeemed: number;
  net_amount_mzn_minor: number;
  occurred_at: string;
}

interface BusinessNameRow {
  id: string;
  name: string;
  slug: string | null;
  category_id: string | null;
}

interface CategoryRow {
  id: string;
  slug: string;
  name: string;
}

interface OfferRow {
  id: string;
  business_id: string;
  title: string;
  description: string;
}

interface NotificationRow {
  id: string;
  business_id: string | null;
  subject: string | null;
  body: string;
  created_at: string;
  read_at: string | null;
}

export type CustomerDashboardState =
  | { status: "empty"; dashboard: CustomerDashboardViewModel }
  | { status: "error"; message: string }
  | { status: "populated"; dashboard: CustomerDashboardViewModel };

export async function getCustomerDashboard(profileId: string): Promise<CustomerDashboardState> {
  const supabase = await createSupabaseServerClient();
  const cardsState = await getCustomerCards(profileId);

  if (cardsState.status === "error") {
    return { status: "error", message: cardsState.message };
  }

  const cards = cardsState.status === "populated" ? cardsState.cards : [];
  const cardIds = cards.map((card) => card.id);
  const businessIds = uniqueValues(cards.map((card) => card.businessId));

  const [
    { data: profileData, error: profileError },
    { data: transactionData, error: transactionError },
    { data: offerData, error: offerError },
    { data: notificationData, error: notificationError }
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, display_name, email, phone, locale, marketing_consent_at")
      .eq("id", profileId)
      .maybeSingle(),
    cardIds.length > 0
      ? supabase
          .from("transactions")
          .select(
            "id, business_id, customer_card_id, points_earned, points_redeemed, net_amount_mzn_minor, occurred_at"
          )
          .in("customer_card_id", cardIds)
          .order("occurred_at", { ascending: false })
          .limit(8)
      : Promise.resolve({ data: [], error: null }),
    supabase
      .from("offers")
      .select("id, business_id, title, description")
      .eq("is_public", true)
      .eq("is_active", true),
    supabase
      .from("notifications")
      .select("id, business_id, subject, body, created_at, read_at")
      .eq("channel", "in_app")
      .in("status", ["sent", "delivered"])
      .order("created_at", { ascending: false })
      .limit(12)
  ]);

  if (profileError || transactionError || offerError || notificationError) {
    return { status: "error", message: "Não foi possível carregar o painel do cliente." };
  }

  const offerRows = rowsFrom<OfferRow>(offerData);
  const notificationRows = rowsFrom<NotificationRow>(notificationData);
  const offerBusinessIds = uniqueValues(offerRows.map((offer) => offer.business_id));
  const notificationBusinessIds = notificationRows
    .map((notification) => notification.business_id)
    .filter((businessId): businessId is string => Boolean(businessId));
  const businessesToFetch = uniqueValues([
    ...businessIds,
    ...offerBusinessIds,
    ...notificationBusinessIds
  ]);
  const { data: businessData, error: businessError } =
    businessesToFetch.length > 0
      ? await supabase
          .from("businesses")
          .select("id, name, slug, category_id")
          .in("id", businessesToFetch)
      : { data: [], error: null };

  if (businessError) {
    return { status: "error", message: "Não foi possível carregar negócios do painel." };
  }

  const businessRows = rowsFrom<BusinessNameRow>(businessData);
  const categoryIds = uniqueValues(
    businessRows
      .map((business) => business.category_id)
      .filter((categoryId): categoryId is string => Boolean(categoryId))
  );
  const { data: categoryData, error: categoryError } =
    categoryIds.length > 0
      ? await supabase.from("business_categories").select("id, slug, name").in("id", categoryIds)
      : { data: [], error: null };

  if (categoryError) {
    return { status: "error", message: "Não foi possível carregar categorias das ofertas." };
  }

  const businessById = toMap(businessRows, (business) => business.id);
  const categoryById = toMap(rowsFrom<CategoryRow>(categoryData), (category) => category.id);
  const cardById = toMap(cards, (card) => card.id);
  const dashboard = buildCustomerDashboardViewModel({
    cards,
    activity: buildActivity(rowsFrom<TransactionRow>(transactionData), businessById, cardById),
    offers: buildOffers(offerRows, businessById, categoryById),
    notifications: buildNotifications(notificationRows, businessById),
    profile: buildProfile(rowFrom<ProfileRow>(profileData))
  });

  if (
    !dashboard.hasCards &&
    !dashboard.hasActivity &&
    !dashboard.hasOffers &&
    !dashboard.hasNotifications
  ) {
    return { status: "empty", dashboard };
  }

  return { status: "populated", dashboard };
}

function buildNotifications(
  rows: NotificationRow[],
  businessById: Map<string, BusinessNameRow>
): CustomerNotification[] {
  return rows.map((row) => ({
    id: row.id,
    businessName: row.business_id
      ? (businessById.get(row.business_id)?.name ?? "Negócio VUYELA")
      : "VUYELA",
    subject: row.subject?.trim() || "Nova notificação",
    body: row.body,
    createdAt: row.created_at,
    readAt: row.read_at
  }));
}

function buildActivity(
  rows: TransactionRow[],
  businessById: Map<string, BusinessNameRow>,
  cardById: Map<string, CustomerDashboardViewModel["cards"][number]>
): CustomerActivityItem[] {
  return rows.map((row) => {
    const points = getActivityPoints({
      pointsEarned: row.points_earned,
      pointsRedeemed: row.points_redeemed
    });

    return {
      id: row.id,
      businessName: businessById.get(row.business_id)?.name ?? "Negócio VUYELA",
      cardName: cardById.get(row.customer_card_id)?.currentTierName ?? "Cartão VUYELA",
      description: getActivityDescription({
        pointsEarned: row.points_earned,
        pointsRedeemed: row.points_redeemed,
        netAmountMznMinor: row.net_amount_mzn_minor
      }),
      points,
      occurredAt: row.occurred_at,
      tone: getActivityTone(points)
    };
  });
}

function buildOffers(
  rows: OfferRow[],
  businessById: Map<string, BusinessNameRow>,
  categoryById: Map<string, CategoryRow>
): CustomerExploreOffer[] {
  return rows.map((row) => {
    const business = businessById.get(row.business_id);
    const category = business?.category_id ? categoryById.get(business.category_id) : null;

    return {
      id: row.id,
      businessName: business?.name ?? "Negócio VUYELA",
      title: row.title,
      description: row.description,
      categorySlug: category?.slug ?? null,
      categoryName: category?.name ?? null,
      href: business?.slug ? `/estabelecimentos/${business.slug}` : "/ofertas"
    };
  });
}

function buildProfile(profile: ProfileRow | null): CustomerProfileSummary {
  return {
    displayName:
      profile?.display_name?.trim() ||
      profile?.email?.trim() ||
      profile?.phone?.trim() ||
      "Cliente VUYELA",
    email: profile?.email?.trim() || null,
    phone: profile?.phone?.trim() || null,
    locale: profile?.locale?.trim() || "pt-MZ",
    marketingConsent: Boolean(profile?.marketing_consent_at)
  };
}
