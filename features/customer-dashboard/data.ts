import "server-only";

import {
  getCustomerCards,
  rowFrom,
  rowsFrom,
  toMap,
  uniqueValues
} from "@/features/customer-cards/data";
import { createSupabaseServerClient } from "@/lib/supabase/server";

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
  points_earned: number;
  points_redeemed: number;
  net_amount_mzn_minor: number;
  occurred_at: string;
}

interface BusinessNameRow {
  id: string;
  name: string;
}

interface OfferRow {
  id: string;
  business_id: string;
  title: string;
  description: string;
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
    { data: offerData, error: offerError }
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
            "id, business_id, points_earned, points_redeemed, net_amount_mzn_minor, occurred_at"
          )
          .in("customer_card_id", cardIds)
          .order("occurred_at", { ascending: false })
          .limit(8)
      : Promise.resolve({ data: [], error: null }),
    supabase
      .from("offers")
      .select("id, business_id, title, description")
      .eq("is_public", true)
      .eq("is_active", true)
      .limit(6)
  ]);

  if (profileError || transactionError || offerError) {
    return { status: "error", message: "Nao foi possivel carregar o dashboard do cliente." };
  }

  const offerRows = rowsFrom<OfferRow>(offerData);
  const offerBusinessIds = uniqueValues(offerRows.map((offer) => offer.business_id));
  const businessesToFetch = uniqueValues([...businessIds, ...offerBusinessIds]);
  const { data: businessData, error: businessError } =
    businessesToFetch.length > 0
      ? await supabase.from("businesses").select("id, name").in("id", businessesToFetch)
      : { data: [], error: null };

  if (businessError) {
    return { status: "error", message: "Nao foi possivel carregar negocios do dashboard." };
  }

  const businessById = toMap(rowsFrom<BusinessNameRow>(businessData), (business) => business.id);
  const dashboard = buildCustomerDashboardViewModel({
    cards,
    activity: buildActivity(rowsFrom<TransactionRow>(transactionData), businessById),
    offers: buildOffers(offerRows, businessById),
    profile: buildProfile(rowFrom<ProfileRow>(profileData))
  });

  if (!dashboard.hasCards && !dashboard.hasActivity && !dashboard.hasOffers) {
    return { status: "empty", dashboard };
  }

  return { status: "populated", dashboard };
}

function buildActivity(
  rows: TransactionRow[],
  businessById: Map<string, BusinessNameRow>
): CustomerActivityItem[] {
  return rows.map((row) => {
    const points = getActivityPoints({
      pointsEarned: row.points_earned,
      pointsRedeemed: row.points_redeemed
    });

    return {
      id: row.id,
      businessName: businessById.get(row.business_id)?.name ?? "Negocio VUYELA",
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
  businessById: Map<string, BusinessNameRow>
): CustomerExploreOffer[] {
  return rows.map((row) => ({
    id: row.id,
    businessName: businessById.get(row.business_id)?.name ?? "Negocio VUYELA",
    title: row.title,
    description: row.description
  }));
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
