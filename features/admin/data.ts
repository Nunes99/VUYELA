import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { assertAdminCapability } from "@/lib/auth/admin-access";
import { getAdminCapabilities, hasAdminCapability } from "@/lib/auth/admin-permissions";
import type { AdminCapability } from "@/lib/auth/admin-permissions";
import { isProfileRole } from "@/lib/auth/rbac";
import type { AuthPrincipal } from "@/lib/auth/rbac";
import { getSiteUrl, isNotificationEmailConfigured, isSupabaseConfigured } from "@/lib/env";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/admin";

import { describeAuditChange, summarizeJson } from "./model";
import type {
  AdminAnalyticsData,
  AdminAnalyticsPoint,
  AdminAnalyticsShare,
  AdminAuditEntry,
  AdminBusiness,
  AdminBusinessDetail,
  AdminCategory,
  AdminDashboardReadyState,
  AdminDashboardState,
  AdminFraudEvent,
  AdminOperator,
  AdminPlan,
  AdminSubscription,
  AdminSupportTicket,
  AdminUser,
  AdminUserDetail,
  AdminViewer,
  AdminView,
  PlatformMetrics
} from "./model";

interface ProfileRow {
  id: string;
  display_name: string | null;
  email: string | null;
  phone: string | null;
  role: string;
  account_status?: string;
  suspended_at?: string | null;
  suspension_reason?: string | null;
  locale?: string;
  marketing_consent_at?: string | null;
  terms_accepted_at?: string | null;
  created_at: string;
}

interface SupportMessageRow {
  id: string;
  ticket_id: string;
  author_profile_id: string | null;
  author_type: string;
  body: string;
  is_internal: boolean;
  delivery_status: string;
  created_at: string;
}

interface BusinessRow {
  id: string;
  name: string;
  slug: string;
  status: string;
  owner_profile_id: string | null;
  created_at: string;
  reviewed_at: string | null;
  review_note: string | null;
  category_id?: string | null;
  legal_name?: string | null;
  nuit?: string | null;
  description?: string | null;
  phone?: string | null;
  email?: string | null;
  website_url?: string | null;
  activated_at?: string | null;
}

interface AnalyticsTransactionRow {
  id: string;
  business_id: string;
  gross_amount_mzn_minor: number;
  points_earned: number;
  points_redeemed: number;
  occurred_at: string;
}

interface AnalyticsPaymentRow {
  method: string;
  amount_mzn_minor: number;
}

interface CustomerCardRow {
  id: string;
  business_id: string;
  card_number: string;
  status: string;
}

interface PointWalletRow {
  customer_card_id: string;
  available_balance: number;
}

interface CategoryRow {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  sort_order: number;
  is_active: boolean;
}

interface PlanRow {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  monthly_price_mzn_minor: number | null;
  trial_days: number;
  is_public: boolean;
  is_active: boolean;
  sort_order: number;
}

interface PlanEntitlementRow {
  plan_id: string;
  branch_limit: number | null;
  staff_limit: number | null;
  campaign_limit: number | null;
  analytics_level: string;
  feature_flags: unknown;
}

interface SubscriptionRow {
  id: string;
  business_id: string;
  plan_id: string;
  status: string;
  current_period_end: string | null;
  trial_ends_at: string | null;
}

interface SupportTicketRow {
  id: string;
  business_id: string | null;
  profile_id: string | null;
  subject: string;
  description: string | null;
  status: string;
  priority: string;
  assigned_to_profile_id: string | null;
  resolution_note: string | null;
  resolved_at: string | null;
  created_at: string;
}

interface FraudEventRow {
  id: string;
  business_id: string | null;
  profile_id: string | null;
  event_type: string;
  severity: string;
  details: unknown;
  resolved_by_profile_id: string | null;
  resolution_note: string | null;
  resolved_at: string | null;
  triage_status: string;
  assigned_to_profile_id: string | null;
  reviewed_at: string | null;
  created_at: string;
}

interface AuditLogRow {
  id: string;
  business_id: string | null;
  actor_profile_id: string | null;
  action: string;
  entity_table: string;
  entity_id: string | null;
  before_data: unknown;
  after_data: unknown;
  ip_address: string | null;
  context: unknown;
  created_at: string;
}

const viewCapabilities: Record<AdminView, AdminCapability> = {
  overview: "platform_metrics_read",
  businesses: "businesses_read",
  categories: "categories_manage",
  users: "users_read",
  subscriptions: "subscriptions_read",
  support: "support_manage",
  fraud: "fraud_review",
  audit: "audit_read",
  analytics: "platform_metrics_read",
  settings: "users_manage",
  "business-detail": "businesses_read",
  "user-detail": "users_read"
};

export async function getAdminDashboardState(
  principal: AuthPrincipal,
  view: AdminView,
  query: string,
  selectedId = "",
  filter = "",
  page = 1,
  paginateResults = true
): Promise<AdminDashboardState> {
  const capabilities = getAdminCapabilities(principal.profileRole);

  if (!hasAdminCapability(principal.profileRole, viewCapabilities[view])) {
    return {
      status: "denied",
      view,
      capabilities,
      message: "A sua função não permite consultar esta área administrativa."
    };
  }

  try {
    assertAdminCapability(principal, viewCapabilities[view]);
    const supabase = createSupabaseServiceRoleClient();
    const viewer = await loadViewer(supabase, principal.profileId);
    const baseState: AdminDashboardReadyState = {
      status: "ready",
      view,
      query,
      filter,
      pagination: null,
      capabilities,
      viewer,
      metrics: null,
      analytics: null,
      businesses: [],
      businessDetail: null,
      categories: [],
      users: [],
      userDetail: null,
      subscriptions: [],
      plans: [],
      tickets: [],
      operators: [],
      fraudEvents: [],
      auditEntries: [],
      settings: null
    };

    if (view === "overview") {
      const [metrics, analytics, auditEntries] = await Promise.all([
        loadMetrics(supabase, principal.profileId),
        loadAnalytics(supabase),
        loadAuditEntries(supabase, "")
      ]);
      baseState.metrics = metrics;
      baseState.analytics = analytics;
      baseState.auditEntries = auditEntries.slice(0, 4);
    } else if (view === "businesses") {
      baseState.businesses = await loadBusinesses(supabase, query);
    } else if (view === "categories") {
      baseState.categories = await loadCategories(supabase, query);
    } else if (view === "users") {
      baseState.users = await loadUsers(supabase, query);
    } else if (view === "subscriptions") {
      const [subscriptions, plans] = await Promise.all([
        loadSubscriptions(supabase, query),
        loadAdminPlans(supabase)
      ]);
      baseState.subscriptions = subscriptions;
      baseState.plans = plans;
    } else if (view === "support") {
      const [tickets, operators] = await Promise.all([
        loadSupportTickets(supabase, query),
        loadOperators(supabase)
      ]);
      baseState.tickets = tickets;
      baseState.operators = operators;
    } else if (view === "fraud") {
      const [fraudEvents, operators] = await Promise.all([
        loadFraudEvents(supabase, query),
        loadOperators(supabase)
      ]);
      baseState.fraudEvents = fraudEvents;
      baseState.operators = operators;
    } else if (view === "audit") {
      baseState.auditEntries = await loadAuditEntries(supabase, query);
    } else if (view === "analytics") {
      const [metrics, analytics] = await Promise.all([
        loadMetrics(supabase, principal.profileId),
        loadAnalytics(supabase, analyticsWindowDays(filter))
      ]);
      baseState.metrics = metrics;
      baseState.analytics = analytics;
    } else if (view === "business-detail") {
      baseState.businessDetail = selectedId ? await loadBusinessDetail(supabase, selectedId) : null;
    } else if (view === "user-detail") {
      baseState.userDetail = selectedId ? await loadUserDetail(supabase, selectedId) : null;
    } else {
      baseState.settings = await loadSystemSettings(supabase);
    }

    applyCollectionFilter(baseState, view, filter);
    if (paginateResults) {
      applyCollectionPagination(baseState, view, page);
    }

    return baseState;
  } catch (error) {
    console.error("Admin painel data load failed", {
      view,
      errorCode: getAdminDataErrorCode(error)
    });

    return {
      status: "error",
      view,
      capabilities,
      message: "Não foi possível carregar os dados administrativos. Tente novamente."
    };
  }
}

async function loadViewer(supabase: SupabaseClient, profileId: string): Promise<AdminViewer> {
  const { data, error } = await supabase
    .from("profiles")
    .select("display_name, email")
    .eq("id", profileId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  const row = data as { display_name: string | null; email: string | null } | null;

  return {
    displayName: row?.display_name ?? "Admin VUYELA",
    email: row?.email ?? "Administração da plataforma"
  };
}

async function loadSystemSettings(
  supabase: SupabaseClient
): Promise<AdminDashboardReadyState["settings"]> {
  const { data, error } = await supabase
    .from("platform_settings")
    .select("key, value")
    .in("key", [
      "platform.name",
      "platform.locale",
      "platform.currency",
      "platform.timezone",
      "security.contact_email",
      "security.privileged_mfa_required",
      "notifications.fraud_alerts",
      "notifications.support_alerts"
    ]);

  if (error) {
    throw error;
  }

  const values = new Map(
    ((data ?? []) as Array<{ key: string; value: unknown }>).map((row) => [row.key, row.value])
  );

  return {
    platformName: settingText(values, "platform.name", "VUYELA"),
    publicUrl: getSiteUrl(),
    locale: settingText(values, "platform.locale", "pt-MZ"),
    currency: settingText(values, "platform.currency", "MZN"),
    timeZone: settingText(values, "platform.timezone", "Africa/Maputo"),
    privilegedMfaRequired: settingBoolean(values, "security.privileged_mfa_required", true),
    leakedPasswordProtection: process.env.SUPABASE_LEAKED_PASSWORD_PROTECTION_ENABLED === "true",
    supabaseConnected: isSupabaseConfigured(),
    emailConfigured: isNotificationEmailConfigured(),
    vercelDeployment: Boolean(process.env.VERCEL),
    securityEmail: settingText(
      values,
      "security.contact_email",
      process.env.SECURITY_EMAIL?.trim() || "seguranca@vuyela.co.mz"
    ),
    fraudAlerts: settingBoolean(values, "notifications.fraud_alerts", true),
    supportAlerts: settingBoolean(values, "notifications.support_alerts", true)
  };
}

async function loadAnalytics(
  supabase: SupabaseClient,
  windowDays = 7
): Promise<AdminAnalyticsData> {
  const now = new Date();
  const firstMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 5, 1));
  const firstDay = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - (windowDays - 1))
  );
  const [transactionResult, paymentResult, businessResult, categoryResult] = await Promise.all([
    supabase
      .from("transactions")
      .select(
        "id, business_id, gross_amount_mzn_minor, points_earned, points_redeemed, occurred_at"
      )
      .eq("status", "completed")
      .gte("occurred_at", firstMonth.toISOString())
      .order("occurred_at", { ascending: true })
      .limit(5000),
    supabase
      .from("transaction_payments")
      .select("method, amount_mzn_minor")
      .gte("created_at", firstMonth.toISOString())
      .limit(5000),
    supabase.from("businesses").select("id, name, category_id"),
    supabase.from("business_categories").select("id, name")
  ]);

  const error =
    transactionResult.error ?? paymentResult.error ?? businessResult.error ?? categoryResult.error;
  if (error) {
    throw error;
  }

  const transactions = (transactionResult.data ?? []) as AnalyticsTransactionRow[];
  const payments = (paymentResult.data ?? []) as AnalyticsPaymentRow[];
  const businesses = (businessResult.data ?? []) as Array<{
    id: string;
    name: string;
    category_id: string | null;
  }>;
  const categoryNames = new Map(
    ((categoryResult.data ?? []) as Array<{ id: string; name: string }>).map((row) => [
      row.id,
      row.name
    ])
  );
  const businessMap = new Map(businesses.map((row) => [row.id, row]));
  const monthly = createAnalyticsBuckets(firstMonth, 6, "month");
  const daily = createAnalyticsBuckets(firstDay, windowDays, "day");

  for (const transaction of transactions) {
    addToAnalyticsBucket(monthly, transaction, "month");
    addToAnalyticsBucket(daily, transaction, "day");
  }

  const paymentMethods = buildShares(
    payments.reduce((totals, payment) => {
      totals.set(payment.method, (totals.get(payment.method) ?? 0) + payment.amount_mzn_minor);
      return totals;
    }, new Map<string, number>()),
    paymentMethodLabel
  );

  const categoryTotals = new Map<string, number>();
  const businessTotals = new Map<
    string,
    { transactions: number; volumeMznMinor: number; pointsIssued: number }
  >();
  let issued = 0;
  let redeemed = 0;

  for (const transaction of transactions) {
    const business = businessMap.get(transaction.business_id);
    const category = business?.category_id
      ? (categoryNames.get(business.category_id) ?? "Outros")
      : "Outros";
    categoryTotals.set(
      category,
      (categoryTotals.get(category) ?? 0) + transaction.gross_amount_mzn_minor
    );
    const aggregate = businessTotals.get(transaction.business_id) ?? {
      transactions: 0,
      volumeMznMinor: 0,
      pointsIssued: 0
    };
    aggregate.transactions += 1;
    aggregate.volumeMznMinor += transaction.gross_amount_mzn_minor;
    aggregate.pointsIssued += transaction.points_earned;
    businessTotals.set(transaction.business_id, aggregate);
    issued += transaction.points_earned;
    redeemed += transaction.points_redeemed;
  }

  const topBusinesses = Array.from(businessTotals.entries())
    .map(([businessId, totals]) => ({
      businessId,
      name: businessMap.get(businessId)?.name ?? "Negócio removido",
      ...totals
    }))
    .sort((left, right) => right.volumeMznMinor - left.volumeMznMinor)
    .slice(0, 5);

  return {
    monthly,
    daily,
    paymentMethods,
    categories: buildShares(categoryTotals),
    topBusinesses,
    redemptionRate: issued + redeemed === 0 ? 0 : Math.round((redeemed / (issued + redeemed)) * 100)
  };
}

function createAnalyticsBuckets(
  start: Date,
  count: number,
  unit: "month" | "day"
): AdminAnalyticsPoint[] {
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(start);
    if (unit === "month") {
      date.setUTCMonth(start.getUTCMonth() + index);
    } else {
      date.setUTCDate(start.getUTCDate() + index);
    }

    return {
      label:
        unit === "month"
          ? new Intl.DateTimeFormat("pt-MZ", { month: "short" }).format(date)
          : new Intl.DateTimeFormat("pt-MZ", { weekday: "short" }).format(date),
      transactions: 0,
      volumeMznMinor: 0,
      pointsIssued: 0
    };
  });
}

function addToAnalyticsBucket(
  buckets: AdminAnalyticsPoint[],
  transaction: AnalyticsTransactionRow,
  unit: "month" | "day"
) {
  const transactionDate = new Date(transaction.occurred_at);
  const bucket = buckets.find((candidate, index) => {
    const bucketDate = new Date(transactionDate);
    if (unit === "month") {
      const first = new Date();
      first.setUTCMonth(first.getUTCMonth() - (buckets.length - 1 - index), 1);
      return (
        first.getUTCFullYear() === transactionDate.getUTCFullYear() &&
        first.getUTCMonth() === transactionDate.getUTCMonth()
      );
    }

    const expected = new Date();
    expected.setUTCDate(expected.getUTCDate() - (buckets.length - 1 - index));
    return expected.toISOString().slice(0, 10) === bucketDate.toISOString().slice(0, 10);
  });

  if (bucket) {
    bucket.transactions += 1;
    bucket.volumeMznMinor += transaction.gross_amount_mzn_minor;
    bucket.pointsIssued += transaction.points_earned;
  }
}

function buildShares(
  totals: Map<string, number>,
  labeler: (value: string) => string = (value) => value
): AdminAnalyticsShare[] {
  const total = Array.from(totals.values()).reduce((sum, value) => sum + value, 0);

  return Array.from(totals.entries())
    .map(([label, value]) => ({
      label: labeler(label),
      value,
      percentage: total === 0 ? 0 : Math.round((value / total) * 100)
    }))
    .sort((left, right) => right.value - left.value);
}

function paymentMethodLabel(value: string): string {
  const labels: Record<string, string> = {
    mpesa: "M-Pesa",
    emola: "e-Mola",
    mkesh: "mKesh",
    cash: "Dinheiro",
    card: "Cartão",
    bank_transfer: "Transferência"
  };

  return labels[value] ?? value;
}

async function loadBusinessDetail(
  supabase: SupabaseClient,
  businessId: string
): Promise<AdminBusinessDetail | null> {
  const [
    businessResult,
    branchResult,
    memberResult,
    cardResult,
    transactionResult,
    subscriptionResult
  ] = await Promise.all([
    supabase
      .from("businesses")
      .select(
        "id, name, slug, status, owner_profile_id, category_id, legal_name, nuit, description, phone, email, website_url, created_at, reviewed_at, review_note, activated_at"
      )
      .eq("id", businessId)
      .maybeSingle(),
    supabase
      .from("branches")
      .select("id", { count: "exact", head: true })
      .eq("business_id", businessId),
    supabase
      .from("business_members")
      .select("id", { count: "exact", head: true })
      .eq("business_id", businessId)
      .eq("status", "active"),
    supabase
      .from("customer_cards")
      .select("id", { count: "exact", head: true })
      .eq("business_id", businessId),
    supabase
      .from("transactions")
      .select("gross_amount_mzn_minor")
      .eq("business_id", businessId)
      .eq("status", "completed")
      .limit(5000),
    supabase
      .from("subscriptions")
      .select("id, business_id, plan_id, status, current_period_end, trial_ends_at")
      .eq("business_id", businessId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()
  ]);

  const error =
    businessResult.error ??
    branchResult.error ??
    memberResult.error ??
    cardResult.error ??
    transactionResult.error ??
    subscriptionResult.error;
  if (error) {
    throw error;
  }
  if (!businessResult.data) {
    return null;
  }

  const business = businessResult.data as BusinessRow;
  const [profiles, categories, plans] = await Promise.all([
    loadProfileMap(supabase, business.owner_profile_id ? [business.owner_profile_id] : []),
    supabase.from("business_categories").select("id, name"),
    loadAdminPlans(supabase)
  ]);
  if (categories.error) {
    throw categories.error;
  }
  const categoryName = new Map(
    ((categories.data ?? []) as Array<{ id: string; name: string }>).map((row) => [
      row.id,
      row.name
    ])
  ).get(business.category_id ?? "");
  const subscriptionRow = subscriptionResult.data as SubscriptionRow | null;
  const plan = subscriptionRow
    ? (plans.find((item) => item.id === subscriptionRow.plan_id) ?? null)
    : null;
  const subscription: AdminSubscription | null = subscriptionRow
    ? {
        id: subscriptionRow.id,
        businessId: business.id,
        planId: subscriptionRow.plan_id,
        businessName: business.name,
        planName: plan?.name ?? "Plano removido",
        monthlyPriceMznMinor: plan?.monthlyPriceMznMinor ?? null,
        status: subscriptionRow.status,
        currentPeriodEnd: subscriptionRow.current_period_end,
        trialEndsAt: subscriptionRow.trial_ends_at
      }
    : null;
  const transactions = (transactionResult.data ?? []) as Array<{ gross_amount_mzn_minor: number }>;

  return {
    id: business.id,
    name: business.name,
    slug: business.slug,
    status: business.status,
    ownerName: business.owner_profile_id
      ? getProfileLabel(profiles.get(business.owner_profile_id))
      : "Sem proprietário",
    createdAt: business.created_at,
    reviewedAt: business.reviewed_at,
    reviewNote: business.review_note,
    legalName: business.legal_name ?? "Não indicada",
    nuit: business.nuit ?? "Não indicado",
    description: business.description ?? "Sem descrição",
    phone: business.phone ?? "Não indicado",
    email: business.email ?? "Não indicado",
    websiteUrl: business.website_url ?? "Não indicado",
    categoryName: categoryName ?? "Sem categoria",
    activatedAt: business.activated_at ?? null,
    branchCount: branchResult.count ?? 0,
    memberCount: memberResult.count ?? 0,
    cardCount: cardResult.count ?? 0,
    transactionCount: transactions.length,
    grossVolumeMznMinor: transactions.reduce(
      (sum, transaction) => sum + transaction.gross_amount_mzn_minor,
      0
    ),
    subscription,
    plan
  };
}

async function loadUserDetail(
  supabase: SupabaseClient,
  profileId: string
): Promise<AdminUserDetail | null> {
  const { data: profileData, error: profileError } = await supabase
    .from("profiles")
    .select(
      "id, display_name, email, phone, role, account_status, suspended_at, suspension_reason, locale, marketing_consent_at, terms_accepted_at, created_at"
    )
    .eq("id", profileId)
    .maybeSingle();

  if (profileError) {
    throw profileError;
  }
  const profile = profileData as ProfileRow | null;
  if (!profile || !isProfileRole(profile.role)) {
    return null;
  }

  const { data: cardData, error: cardError } = await supabase
    .from("customer_cards")
    .select("id, business_id, card_number, status")
    .eq("customer_profile_id", profileId)
    .order("created_at", { ascending: false });
  if (cardError) {
    throw cardError;
  }
  const cardRows = (cardData ?? []) as CustomerCardRow[];
  const cardIds = cardRows.map((card) => card.id);
  const [walletResult, transactionResult, businesses] = await Promise.all([
    cardIds.length > 0
      ? supabase
          .from("point_wallets")
          .select("customer_card_id, available_balance")
          .in("customer_card_id", cardIds)
      : Promise.resolve({ data: [], error: null }),
    cardIds.length > 0
      ? supabase
          .from("transactions")
          .select(
            "id, business_id, gross_amount_mzn_minor, points_earned, points_redeemed, occurred_at"
          )
          .in("customer_card_id", cardIds)
          .eq("status", "completed")
          .order("occurred_at", { ascending: false })
          .limit(10)
      : Promise.resolve({ data: [], error: null }),
    loadBusinessMap(supabase, Array.from(new Set(cardRows.map((card) => card.business_id))))
  ]);

  if (walletResult.error || transactionResult.error) {
    throw walletResult.error ?? transactionResult.error;
  }
  const wallets = new Map(
    ((walletResult.data ?? []) as PointWalletRow[]).map((wallet) => [
      wallet.customer_card_id,
      wallet.available_balance
    ])
  );

  return {
    id: profile.id,
    displayName: profile.display_name ?? "Utilizador sem nome",
    email: profile.email ?? "Sem e-mail",
    phone: profile.phone ?? "Sem telefone",
    role: profile.role,
    accountStatus: profile.account_status ?? "active",
    suspendedAt: profile.suspended_at ?? null,
    suspensionReason: profile.suspension_reason ?? "",
    createdAt: profile.created_at,
    locale: profile.locale ?? "pt-MZ",
    marketingConsentAt: profile.marketing_consent_at ?? null,
    termsAcceptedAt: profile.terms_accepted_at ?? null,
    cards: cardRows.map((card) => ({
      id: card.id,
      businessName: businesses.get(card.business_id) ?? "Negócio removido",
      cardNumber: card.card_number,
      status: card.status,
      availablePoints: wallets.get(card.id) ?? 0
    })),
    transactions: ((transactionResult.data ?? []) as AnalyticsTransactionRow[]).map(
      (transaction) => ({
        id: transaction.id,
        businessName: businesses.get(transaction.business_id) ?? "Negócio removido",
        occurredAt: transaction.occurred_at,
        points:
          transaction.points_redeemed > 0
            ? -transaction.points_redeemed
            : transaction.points_earned,
        type: transaction.points_redeemed > 0 ? ("redeem" as const) : ("earn" as const)
      })
    )
  };
}

async function loadCategories(supabase: SupabaseClient, query: string): Promise<AdminCategory[]> {
  const [
    { data: categoryData, error: categoryError },
    { data: businessData, error: businessError }
  ] = await Promise.all([
    supabase
      .from("business_categories")
      .select("id, slug, name, description, sort_order, is_active")
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true }),
    supabase.from("businesses").select("category_id")
  ]);

  if (categoryError || businessError) {
    throw categoryError ?? businessError;
  }

  const counts = new Map<string, number>();
  for (const row of (businessData ?? []) as Array<{ category_id: string | null }>) {
    if (row.category_id) {
      counts.set(row.category_id, (counts.get(row.category_id) ?? 0) + 1);
    }
  }

  return ((categoryData ?? []) as CategoryRow[])
    .filter((row) => matchesQuery(query, row.name, row.slug, row.description))
    .map((row) => ({
      id: row.id,
      slug: row.slug,
      name: row.name,
      description: row.description ?? "",
      sortOrder: row.sort_order,
      isActive: row.is_active,
      businessCount: counts.get(row.id) ?? 0
    }));
}

function getAdminDataErrorCode(error: unknown) {
  if (isRecord(error) && typeof error.code === "string") {
    return error.code.slice(0, 64);
  }

  if (error instanceof Error) {
    return error.name;
  }

  return "unknown";
}

async function loadMetrics(
  supabase: SupabaseClient,
  actorProfileId: string
): Promise<PlatformMetrics> {
  const { data, error } = await supabase.rpc("admin_get_platform_metrics", {
    p_actor_profile_id: actorProfileId
  });

  if (error || !isRecord(data)) {
    throw new Error("Platform metrics unavailable");
  }

  return {
    totalBusinesses: toNumber(data.totalBusinesses),
    pendingBusinesses: toNumber(data.pendingBusinesses),
    activeBusinesses: toNumber(data.activeBusinesses),
    totalProfiles: toNumber(data.totalProfiles),
    activeSubscriptions: toNumber(data.activeSubscriptions),
    openSupportTickets: toNumber(data.openSupportTickets),
    unresolvedFraudEvents: toNumber(data.unresolvedFraudEvents),
    completedTransactions: toNumber(data.completedTransactions),
    grossVolumeMznMinor: toNumber(data.grossVolumeMznMinor),
    pointsIssued: toNumber(data.pointsIssued),
    businessesCreatedLast30Days: toNumber(data.businessesCreatedLast30Days),
    transactionsLast30Days: toNumber(data.transactionsLast30Days)
  };
}

async function loadBusinesses(supabase: SupabaseClient, query: string): Promise<AdminBusiness[]> {
  const { data, error } = await supabase
    .from("businesses")
    .select("id, name, slug, status, owner_profile_id, created_at, reviewed_at, review_note")
    .order("created_at", { ascending: false })
    .limit(1000);

  if (error) {
    throw error;
  }

  const rows = (data ?? []) as BusinessRow[];
  const profiles = await loadProfileMap(
    supabase,
    rows.flatMap((row) => (row.owner_profile_id ? [row.owner_profile_id] : []))
  );

  return rows
    .filter((row) => matchesQuery(query, row.name, row.slug, row.status))
    .map((row) => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      status: row.status,
      ownerName: row.owner_profile_id
        ? getProfileLabel(profiles.get(row.owner_profile_id))
        : "Sem proprietário",
      createdAt: row.created_at,
      reviewedAt: row.reviewed_at,
      reviewNote: row.review_note
    }));
}

async function loadUsers(supabase: SupabaseClient, query: string): Promise<AdminUser[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select(
      "id, display_name, email, phone, role, account_status, suspended_at, suspension_reason, created_at"
    )
    .order("created_at", { ascending: false })
    .limit(1000);

  if (error) {
    throw error;
  }

  return ((data ?? []) as ProfileRow[])
    .filter((row) => matchesQuery(query, row.display_name, row.email, row.phone, row.role))
    .flatMap((row) => {
      if (!isProfileRole(row.role)) {
        return [];
      }

      return [
        {
          id: row.id,
          displayName: row.display_name ?? "Utilizador sem nome",
          email: row.email ?? "Sem e-mail",
          phone: row.phone ?? "Sem telefone",
          role: row.role,
          accountStatus: row.account_status ?? "active",
          suspendedAt: row.suspended_at ?? null,
          suspensionReason: row.suspension_reason ?? "",
          createdAt: row.created_at
        }
      ];
    });
}

async function loadSubscriptions(
  supabase: SupabaseClient,
  query: string
): Promise<AdminSubscription[]> {
  const { data, error } = await supabase
    .from("subscriptions")
    .select("id, business_id, plan_id, status, current_period_end, trial_ends_at")
    .order("created_at", { ascending: false })
    .limit(1000);

  if (error) {
    throw error;
  }

  const rows = (data ?? []) as SubscriptionRow[];
  const [businesses, plans] = await Promise.all([
    loadBusinessMap(
      supabase,
      rows.map((row) => row.business_id)
    ),
    loadPlanMap(
      supabase,
      rows.map((row) => row.plan_id)
    )
  ]);

  return rows
    .map((row) => {
      const businessName = businesses.get(row.business_id) ?? "Negócio removido";
      const plan = plans.get(row.plan_id);
      return {
        id: row.id,
        businessId: row.business_id,
        planId: row.plan_id,
        businessName,
        planName: plan?.name ?? "Plano removido",
        monthlyPriceMznMinor: plan?.monthly_price_mzn_minor ?? null,
        status: row.status,
        currentPeriodEnd: row.current_period_end,
        trialEndsAt: row.trial_ends_at
      };
    })
    .filter((row) => matchesQuery(query, row.businessName, row.planName, row.status));
}

async function loadAdminPlans(supabase: SupabaseClient): Promise<AdminPlan[]> {
  const [{ data: planData, error: planError }, { data: entitlementData, error: entitlementError }] =
    await Promise.all([
      supabase
        .from("plans")
        .select(
          "id, slug, name, description, monthly_price_mzn_minor, trial_days, is_public, is_active, sort_order"
        )
        .order("sort_order", { ascending: true })
        .order("name", { ascending: true }),
      supabase
        .from("plan_entitlements")
        .select(
          "plan_id, branch_limit, staff_limit, campaign_limit, analytics_level, feature_flags"
        )
    ]);

  if (planError || entitlementError) {
    throw planError ?? entitlementError;
  }

  const entitlements = new Map(
    ((entitlementData ?? []) as PlanEntitlementRow[]).map((row) => [row.plan_id, row])
  );

  return ((planData ?? []) as PlanRow[]).flatMap((plan) => {
    const entitlement = entitlements.get(plan.id);

    if (!entitlement) {
      return [];
    }

    return [
      {
        id: plan.id,
        slug: plan.slug,
        name: plan.name,
        description: plan.description ?? "",
        monthlyPriceMznMinor: plan.monthly_price_mzn_minor,
        trialDays: plan.trial_days,
        branchLimit: entitlement.branch_limit,
        staffLimit: entitlement.staff_limit,
        campaignLimit: entitlement.campaign_limit,
        analyticsLevel: entitlement.analytics_level,
        featureFlags: Array.isArray(entitlement.feature_flags)
          ? entitlement.feature_flags.filter(
              (feature): feature is string => typeof feature === "string"
            )
          : [],
        isPublic: plan.is_public,
        isActive: plan.is_active
      }
    ];
  });
}

async function loadSupportTickets(
  supabase: SupabaseClient,
  query: string
): Promise<AdminSupportTicket[]> {
  const { data, error } = await supabase
    .from("support_tickets")
    .select(
      "id, business_id, profile_id, subject, description, status, priority, assigned_to_profile_id, resolution_note, resolved_at, created_at"
    )
    .order("created_at", { ascending: false })
    .limit(1000);

  if (error) {
    throw error;
  }

  const rows = (data ?? []) as SupportTicketRow[];
  const { data: messageData, error: messageError } =
    rows.length > 0
      ? await supabase
          .from("support_ticket_messages")
          .select(
            "id, ticket_id, author_profile_id, author_type, body, is_internal, delivery_status, created_at"
          )
          .in(
            "ticket_id",
            rows.map((row) => row.id)
          )
          .order("created_at", { ascending: true })
      : { data: [], error: null };

  if (messageError) {
    throw messageError;
  }

  const messages = (messageData ?? []) as SupportMessageRow[];
  const [profiles, businesses] = await Promise.all([
    loadProfileMap(
      supabase,
      [
        ...rows.flatMap((row) => [row.profile_id, row.assigned_to_profile_id]),
        ...messages.map((message) => message.author_profile_id)
      ].filter((id): id is string => Boolean(id))
    ),
    loadBusinessMap(
      supabase,
      rows.flatMap((row) => (row.business_id ? [row.business_id] : []))
    )
  ]);

  return rows
    .map((row) => ({
      id: row.id,
      subject: row.subject,
      description: row.description ?? "Sem descrição",
      status: row.status,
      priority: row.priority,
      requesterName: getProfileLabel(row.profile_id ? profiles.get(row.profile_id) : undefined),
      businessName: row.business_id
        ? (businesses.get(row.business_id) ?? "Negócio removido")
        : "Plataforma",
      assignedToProfileId: row.assigned_to_profile_id,
      assignedToName: row.assigned_to_profile_id
        ? getProfileLabel(profiles.get(row.assigned_to_profile_id))
        : "Não atribuído",
      resolutionNote: row.resolution_note ?? "",
      resolvedAt: row.resolved_at,
      createdAt: row.created_at,
      messages: messages
        .filter((message) => message.ticket_id === row.id)
        .map((message) => ({
          id: message.id,
          authorName:
            message.author_type === "system"
              ? "Sistema VUYELA"
              : getProfileLabel(
                  message.author_profile_id ? profiles.get(message.author_profile_id) : undefined
                ),
          authorType: message.author_type,
          body: message.body,
          isInternal: message.is_internal,
          deliveryStatus: message.delivery_status,
          createdAt: message.created_at
        }))
    }))
    .filter((row) =>
      matchesQuery(
        query,
        row.subject,
        row.description,
        row.status,
        row.priority,
        row.requesterName,
        row.businessName
      )
    );
}

async function loadOperators(supabase: SupabaseClient): Promise<AdminOperator[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, display_name, email, phone, role, account_status, created_at")
    .in("role", ["support_agent", "platform_admin", "super_admin"])
    .eq("account_status", "active")
    .order("display_name", { ascending: true });

  if (error) {
    throw error;
  }

  return ((data ?? []) as ProfileRow[]).flatMap((row) => {
    if (!isProfileRole(row.role)) {
      return [];
    }

    return [{ id: row.id, label: getProfileLabel(row), role: row.role }];
  });
}

async function loadFraudEvents(
  supabase: SupabaseClient,
  query: string
): Promise<AdminFraudEvent[]> {
  const { data, error } = await supabase
    .from("fraud_events")
    .select(
      "id, business_id, profile_id, event_type, severity, details, triage_status, assigned_to_profile_id, reviewed_at, resolved_by_profile_id, resolution_note, resolved_at, created_at"
    )
    .order("created_at", { ascending: false })
    .limit(1000);

  if (error) {
    throw error;
  }

  const rows = (data ?? []) as FraudEventRow[];
  const [profiles, businesses] = await Promise.all([
    loadProfileMap(
      supabase,
      rows.flatMap((row) =>
        [row.profile_id, row.assigned_to_profile_id, row.resolved_by_profile_id].filter(
          (id): id is string => Boolean(id)
        )
      )
    ),
    loadBusinessMap(
      supabase,
      rows.flatMap((row) => (row.business_id ? [row.business_id] : []))
    )
  ]);

  return rows
    .map((row) => ({
      id: row.id,
      eventType: row.event_type,
      severity: row.severity,
      businessName: row.business_id
        ? (businesses.get(row.business_id) ?? "Negócio removido")
        : "Plataforma",
      profileName: getProfileLabel(row.profile_id ? profiles.get(row.profile_id) : undefined),
      detailsSummary: summarizeJson(row.details),
      resolvedByName: row.resolved_by_profile_id
        ? getProfileLabel(profiles.get(row.resolved_by_profile_id))
        : "Por rever",
      triageStatus: row.triage_status,
      assignedToProfileId: row.assigned_to_profile_id,
      assignedToName: row.assigned_to_profile_id
        ? getProfileLabel(profiles.get(row.assigned_to_profile_id))
        : "Não atribuído",
      reviewedAt: row.reviewed_at,
      resolutionNote: row.resolution_note ?? "",
      resolvedAt: row.resolved_at,
      createdAt: row.created_at
    }))
    .filter((row) =>
      matchesQuery(
        query,
        row.eventType,
        row.severity,
        row.triageStatus,
        row.businessName,
        row.profileName,
        row.detailsSummary
      )
    );
}

async function loadAuditEntries(
  supabase: SupabaseClient,
  query: string
): Promise<AdminAuditEntry[]> {
  const { data, error } = await supabase
    .from("audit_logs")
    .select(
      "id, business_id, actor_profile_id, action, entity_table, entity_id, before_data, after_data, ip_address, context, created_at"
    )
    .order("created_at", { ascending: false })
    .limit(1000);

  if (error) {
    throw error;
  }

  const rows = (data ?? []) as AuditLogRow[];
  const [profiles, businesses] = await Promise.all([
    loadProfileMap(
      supabase,
      rows.flatMap((row) => (row.actor_profile_id ? [row.actor_profile_id] : []))
    ),
    loadBusinessMap(
      supabase,
      rows.flatMap((row) => (row.business_id ? [row.business_id] : []))
    )
  ]);

  return rows
    .map((row) => {
      const context = isRecord(row.context) ? row.context : {};
      return {
        id: row.id,
        action: row.action,
        entityTable: row.entity_table,
        entityId: row.entity_id,
        actorName: getProfileLabel(
          row.actor_profile_id ? profiles.get(row.actor_profile_id) : undefined
        ),
        businessName: row.business_id
          ? (businesses.get(row.business_id) ?? "Negócio removido")
          : "Plataforma",
        operation: typeof context.operation === "string" ? context.operation : "operacao_sensivel",
        changeSummary: describeAuditChange(row.before_data, row.after_data),
        ipAddress: row.ip_address ?? "Não registado",
        createdAt: row.created_at
      };
    })
    .filter((row) =>
      matchesQuery(
        query,
        row.action,
        row.entityTable,
        row.actorName,
        row.businessName,
        row.operation
      )
    );
}

function settingText(values: Map<string, unknown>, key: string, fallback: string): string {
  const value = values.get(key);
  if (!isRecord(value) || typeof value.value !== "string") {
    return fallback;
  }

  return value.value;
}

function settingBoolean(values: Map<string, unknown>, key: string, fallback: boolean): boolean {
  const value = values.get(key);
  if (!isRecord(value) || typeof value.enabled !== "boolean") {
    return fallback;
  }

  return value.enabled;
}

function analyticsWindowDays(filter: string): number {
  if (filter === "30d") {
    return 30;
  }
  if (filter === "90d") {
    return 90;
  }
  return 7;
}

function applyCollectionFilter(state: AdminDashboardReadyState, view: AdminView, filter: string) {
  if (!filter) {
    return;
  }

  if (view === "businesses") {
    state.businesses = state.businesses.filter((item) => item.status === filter);
  } else if (view === "categories") {
    state.categories = state.categories.filter((item) =>
      filter === "active" ? item.isActive : filter === "archived" ? !item.isActive : true
    );
  } else if (view === "users") {
    state.users = state.users.filter(
      (item) => item.role === filter || item.accountStatus === filter
    );
  } else if (view === "subscriptions") {
    state.subscriptions = state.subscriptions.filter((item) => item.status === filter);
  } else if (view === "support") {
    state.tickets = state.tickets.filter(
      (item) => item.status === filter || item.priority === filter
    );
  } else if (view === "fraud") {
    state.fraudEvents = state.fraudEvents.filter(
      (item) => item.severity === filter || item.triageStatus === filter
    );
  } else if (view === "audit") {
    state.auditEntries = state.auditEntries.filter(
      (item) => item.action === filter || item.operation === filter
    );
  }
}

function applyCollectionPagination(
  state: AdminDashboardReadyState,
  view: AdminView,
  requestedPage: number
) {
  const pageSize = 20;
  const paginate = <T>(items: T[]): T[] => {
    const totalItems = items.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    const page = Math.min(Math.max(1, requestedPage), totalPages);
    state.pagination = { page, pageSize, totalItems, totalPages };
    return items.slice((page - 1) * pageSize, page * pageSize);
  };

  if (view === "businesses") {
    state.businesses = paginate(state.businesses);
  } else if (view === "categories") {
    state.categories = paginate(state.categories);
  } else if (view === "users") {
    state.users = paginate(state.users);
  } else if (view === "subscriptions") {
    state.subscriptions = paginate(state.subscriptions);
  } else if (view === "support") {
    state.tickets = paginate(state.tickets);
  } else if (view === "fraud") {
    state.fraudEvents = paginate(state.fraudEvents);
  } else if (view === "audit") {
    state.auditEntries = paginate(state.auditEntries);
  }
}

async function loadProfileMap(
  supabase: SupabaseClient,
  ids: string[]
): Promise<Map<string, ProfileRow>> {
  const uniqueIds = Array.from(new Set(ids));

  if (uniqueIds.length === 0) {
    return new Map();
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("id, display_name, email, phone, role, created_at")
    .in("id", uniqueIds);

  if (error) {
    throw error;
  }

  return new Map(((data ?? []) as ProfileRow[]).map((row) => [row.id, row]));
}

async function loadBusinessMap(
  supabase: SupabaseClient,
  ids: string[]
): Promise<Map<string, string>> {
  const uniqueIds = Array.from(new Set(ids));

  if (uniqueIds.length === 0) {
    return new Map();
  }

  const { data, error } = await supabase.from("businesses").select("id, name").in("id", uniqueIds);

  if (error) {
    throw error;
  }

  return new Map(
    ((data ?? []) as Array<{ id: string; name: string }>).map((row) => [row.id, row.name])
  );
}

async function loadPlanMap(supabase: SupabaseClient, ids: string[]): Promise<Map<string, PlanRow>> {
  const uniqueIds = Array.from(new Set(ids));

  if (uniqueIds.length === 0) {
    return new Map();
  }

  const { data, error } = await supabase
    .from("plans")
    .select(
      "id, slug, name, description, monthly_price_mzn_minor, trial_days, is_public, is_active, sort_order"
    )
    .in("id", uniqueIds);

  if (error) {
    throw error;
  }

  return new Map(((data ?? []) as PlanRow[]).map((row) => [row.id, row]));
}

function getProfileLabel(profile: ProfileRow | undefined): string {
  return profile?.display_name ?? profile?.email ?? profile?.phone ?? "Utilizador removido";
}

function matchesQuery(query: string, ...values: Array<string | null>): boolean {
  if (!query) {
    return true;
  }

  const normalized = query.toLocaleLowerCase("pt-MZ");
  return values.some((value) => value?.toLocaleLowerCase("pt-MZ").includes(normalized));
}

function toNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
