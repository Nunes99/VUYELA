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
  getLedgerActivityDescription,
  getActivityTone
} from "./model";
import type {
  CustomerActivityFilters,
  CustomerActivityItem,
  CustomerDashboardViewModel,
  CustomerExploreOffer,
  CustomerNotificationCategory,
  CustomerProfileSummary
} from "./model";

interface ProfileRow {
  id: string;
  display_name: string | null;
  email: string | null;
  phone: string | null;
  locale: string | null;
  marketing_consent_at: string | null;
  date_of_birth: string | null;
}

interface LedgerRow {
  id: string;
  business_id: string;
  customer_card_id: string;
  transaction_id: string | null;
  type: string;
  amount: number;
  reason: string | null;
  created_at: string;
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
  image_url: string | null;
}

interface CustomerPreferenceRow {
  businessId: string;
  preferredBranchId: string | null;
  isFavorite: boolean;
  offerNotificationsEnabled: boolean;
}

interface OfferClaimRow {
  id: string;
  businessId: string;
  offerId: string;
  customerCardId: string;
  claimCode: string;
  status: "activated" | "redeemed" | "expired" | "cancelled";
  activatedAt: string;
  expiresAt: string | null;
}

interface CustomerEngagementRow {
  preferences: unknown;
  offer_claims: unknown;
}

interface NotificationRow {
  id: string;
  business_id: string | null;
  subject: string | null;
  body: string;
  created_at: string;
  read_at: string | null;
  campaign_id: string | null;
  metadata: unknown;
}

export interface CustomerDashboardQuery {
  activityPage?: number;
  activityMovement?: CustomerActivityFilters["movement"];
  activityPeriod?: CustomerActivityFilters["period"];
  activityQuery?: string;
  notificationPage?: number;
  notificationCategory?: CustomerNotificationCategory;
}

const activityPageSize = 25;
const notificationPageSize = 20;

export type CustomerDashboardState =
  | { status: "empty"; dashboard: CustomerDashboardViewModel }
  | { status: "error"; message: string }
  | { status: "populated"; dashboard: CustomerDashboardViewModel };

export async function getCustomerDashboard(
  profileId: string,
  query: CustomerDashboardQuery = {}
): Promise<CustomerDashboardState> {
  const supabase = await createSupabaseServerClient();
  const cardsState = await getCustomerCards(profileId);

  if (cardsState.status === "error") {
    return { status: "error", message: cardsState.message };
  }

  const cards = cardsState.status === "populated" ? cardsState.cards : [];
  const cardIds = cards.map((card) => card.id);
  const businessIds = uniqueValues(cards.map((card) => card.businessId));
  const activityFilters = normalizeActivityFilters(query);
  const activityPage = normalizePage(query.activityPage);
  const notificationPage = normalizePage(query.notificationPage);
  const notificationCategory = normalizeNotificationCategory(query.notificationCategory);
  const matchingBusinessIds = activityFilters.query
    ? cards
        .filter((card) =>
          card.businessName.toLocaleLowerCase("pt-MZ").includes(activityFilters.query)
        )
        .map((card) => card.businessId)
    : businessIds;
  const ledgerRequest = buildLedgerRequest({
    supabase,
    cardIds,
    matchingBusinessIds,
    filters: activityFilters,
    page: activityPage
  });
  const notificationRequest = buildNotificationRequest({
    supabase,
    category: notificationCategory,
    page: notificationPage
  });

  const [
    { data: profileData, error: profileError },
    { data: ledgerData, error: ledgerError, count: ledgerCount },
    { data: offerData, error: offerError },
    { data: notificationData, error: notificationError, count: notificationCount },
    { error: unreadNotificationError, count: unreadNotificationCount },
    { data: engagementData, error: engagementError }
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, display_name, email, phone, locale, marketing_consent_at, date_of_birth")
      .eq("id", profileId)
      .maybeSingle(),
    ledgerRequest,
    supabase
      .from("offers")
      .select("id, business_id, title, description, image_url")
      .eq("is_public", true)
      .eq("is_active", true),
    notificationRequest,
    supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("channel", "in_app")
      .in("status", ["sent", "delivered"])
      .is("read_at", null),
    supabase.rpc("get_customer_engagement")
  ]);

  const resolvedActivityPage = clampPage(activityPage, activityPageSize, ledgerCount ?? 0);
  const resolvedNotificationPage = clampPage(
    notificationPage,
    notificationPageSize,
    notificationCount ?? 0
  );
  let resolvedLedgerData = ledgerData;
  let resolvedLedgerError = ledgerError;
  let resolvedNotificationData = notificationData;
  let resolvedNotificationError = notificationError;

  if (!ledgerError && resolvedActivityPage !== activityPage) {
    const result = await buildLedgerRequest({
      supabase,
      cardIds,
      matchingBusinessIds,
      filters: activityFilters,
      page: resolvedActivityPage
    });
    resolvedLedgerData = result.data;
    resolvedLedgerError = result.error;
  }

  if (!notificationError && resolvedNotificationPage !== notificationPage) {
    const result = await buildNotificationRequest({
      supabase,
      category: notificationCategory,
      page: resolvedNotificationPage
    });
    resolvedNotificationData = result.data;
    resolvedNotificationError = result.error;
  }

  if (
    profileError ||
    resolvedLedgerError ||
    offerError ||
    resolvedNotificationError ||
    unreadNotificationError ||
    engagementError
  ) {
    return { status: "error", message: "Não foi possível carregar o painel do cliente." };
  }

  const offerRows = rowsFrom<OfferRow>(offerData);
  const notificationRows = rowsFrom<NotificationRow>(resolvedNotificationData);
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
  const engagement = parseEngagement(engagementData);
  const favoriteBusinessIds = new Set(
    engagement.preferences
      .filter((preference) => preference.isFavorite)
      .map((preference) => preference.businessId)
  );
  const cardsWithPreferences = cards.map((card) => ({
    ...card,
    isFavorite: favoriteBusinessIds.has(card.businessId)
  }));
  const dashboard = buildCustomerDashboardViewModel({
    cards: cardsWithPreferences,
    activity: buildActivity(rowsFrom<LedgerRow>(resolvedLedgerData), businessById, cardById),
    offers: buildOffers(
      offerRows,
      businessById,
      categoryById,
      cards,
      engagement.preferences,
      engagement.claims
    ),
    notifications: buildNotifications(notificationRows, businessById),
    profile: buildProfile(rowFrom<ProfileRow>(profileData)),
    activityFilters,
    activityPagination: buildPagination(resolvedActivityPage, activityPageSize, ledgerCount ?? 0),
    notificationCategory,
    notificationPagination: buildPagination(
      resolvedNotificationPage,
      notificationPageSize,
      notificationCount ?? 0
    ),
    unreadNotificationCount: unreadNotificationCount ?? 0
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
    readAt: row.read_at,
    category: getNotificationCategory(row)
  }));
}

function buildActivity(
  rows: LedgerRow[],
  businessById: Map<string, BusinessNameRow>,
  cardById: Map<string, CustomerDashboardViewModel["cards"][number]>
): CustomerActivityItem[] {
  return rows.map((row) => {
    return {
      id: row.id,
      businessName: businessById.get(row.business_id)?.name ?? "Negócio VUYELA",
      cardName: cardById.get(row.customer_card_id)?.currentTierName ?? "Cartão VUYELA",
      description: getLedgerActivityDescription({ type: row.type, reason: row.reason }),
      points: row.amount,
      occurredAt: row.created_at,
      tone: getActivityTone(row.amount)
    };
  });
}

function buildOffers(
  rows: OfferRow[],
  businessById: Map<string, BusinessNameRow>,
  categoryById: Map<string, CategoryRow>,
  cards: CustomerDashboardViewModel["cards"],
  preferences: CustomerPreferenceRow[],
  claims: OfferClaimRow[]
): CustomerExploreOffer[] {
  const cardByBusinessId = toMap(cards, (card) => card.businessId);
  const preferenceByBusinessId = toMap(preferences, (preference) => preference.businessId);
  const claimByOfferId = toMap(claims, (claim) => claim.offerId);

  return rows.map((row) => {
    const business = businessById.get(row.business_id);
    const category = business?.category_id ? categoryById.get(business.category_id) : null;

    const preference = preferenceByBusinessId.get(row.business_id);
    const claim = claimByOfferId.get(row.id);

    return {
      id: row.id,
      businessId: row.business_id,
      businessName: business?.name ?? "Negócio VUYELA",
      title: row.title,
      description: row.description,
      imageUrl: row.image_url,
      categorySlug: category?.slug ?? null,
      categoryName: category?.name ?? null,
      href: business?.slug ? `/estabelecimentos/${business.slug}` : "/ofertas",
      customerCardId: cardByBusinessId.get(row.business_id)?.id ?? null,
      isFavorite: preference?.isFavorite ?? false,
      offerNotificationsEnabled: preference?.offerNotificationsEnabled ?? true,
      claimId: claim?.id ?? null,
      claimCode: claim?.claimCode ?? null,
      claimStatus: claim?.status ?? null,
      claimExpiresAt: claim?.expiresAt ?? null
    };
  });
}

function parseEngagement(data: unknown): {
  preferences: CustomerPreferenceRow[];
  claims: OfferClaimRow[];
} {
  const row = Array.isArray(data) ? (data[0] as CustomerEngagementRow | undefined) : undefined;

  return {
    preferences: Array.isArray(row?.preferences)
      ? (row.preferences as CustomerPreferenceRow[])
      : [],
    claims: Array.isArray(row?.offer_claims) ? (row.offer_claims as OfferClaimRow[]) : []
  };
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
    marketingConsent: Boolean(profile?.marketing_consent_at),
    dateOfBirth: profile?.date_of_birth ?? null
  };
}

function normalizePage(value: number | undefined): number {
  return Number.isSafeInteger(value) && (value ?? 0) > 0 ? (value as number) : 1;
}

function normalizeActivityFilters(query: CustomerDashboardQuery): CustomerActivityFilters {
  return {
    movement:
      query.activityMovement === "earn" || query.activityMovement === "redeem"
        ? query.activityMovement
        : "all",
    period:
      query.activityPeriod === "90" || query.activityPeriod === "all" ? query.activityPeriod : "30",
    query: query.activityQuery?.trim().toLocaleLowerCase("pt-MZ").slice(0, 80) ?? ""
  };
}

function normalizeNotificationCategory(
  value: CustomerNotificationCategory | undefined
): CustomerNotificationCategory {
  return value === "offers" || value === "transactions" || value === "system" ? value : "all";
}

function buildLedgerRequest({
  supabase,
  cardIds,
  matchingBusinessIds,
  filters,
  page
}: {
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>;
  cardIds: string[];
  matchingBusinessIds: string[];
  filters: CustomerActivityFilters;
  page: number;
}) {
  if (cardIds.length === 0 || matchingBusinessIds.length === 0) {
    return Promise.resolve({ data: [], error: null, count: 0 });
  }

  const from = (page - 1) * activityPageSize;
  let request = supabase
    .from("point_ledger")
    .select("id, business_id, customer_card_id, transaction_id, type, amount, reason, created_at", {
      count: "exact"
    })
    .in("customer_card_id", cardIds)
    .in("business_id", matchingBusinessIds);

  if (filters.movement === "earn") request = request.gt("amount", 0);
  if (filters.movement === "redeem") request = request.lt("amount", 0);
  if (filters.period !== "all") {
    const start = new Date();
    start.setUTCDate(start.getUTCDate() - Number(filters.period));
    request = request.gte("created_at", start.toISOString());
  }

  return request.order("created_at", { ascending: false }).range(from, from + activityPageSize - 1);
}

function buildNotificationRequest({
  supabase,
  category,
  page
}: {
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>;
  category: CustomerNotificationCategory;
  page: number;
}) {
  const from = (page - 1) * notificationPageSize;
  let request = supabase
    .from("notifications")
    .select("id, business_id, subject, body, created_at, read_at, campaign_id, metadata", {
      count: "exact"
    })
    .eq("channel", "in_app")
    .in("status", ["sent", "delivered"]);

  if (category === "offers") request = request.not("campaign_id", "is", null);
  if (category === "transactions") request = request.eq("metadata->>source", "transaction");
  if (category === "system") request = request.is("business_id", null);

  return request
    .order("created_at", { ascending: false })
    .range(from, from + notificationPageSize - 1);
}

function getNotificationCategory(
  row: NotificationRow
): Exclude<CustomerNotificationCategory, "all"> {
  const source =
    row.metadata && typeof row.metadata === "object" && "source" in row.metadata
      ? String((row.metadata as { source?: unknown }).source ?? "")
      : "";

  if (source === "transaction") return "transactions";
  if (row.campaign_id || source === "campaign") return "offers";
  return "system";
}

function buildPagination(page: number, pageSize: number, total: number) {
  return {
    page,
    pageSize,
    total,
    totalPages: Math.max(Math.ceil(total / pageSize), 1)
  };
}

function clampPage(page: number, pageSize: number, total: number): number {
  return Math.min(page, Math.max(Math.ceil(total / pageSize), 1));
}
