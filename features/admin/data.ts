import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { assertAdminCapability } from "@/lib/auth/admin-access";
import { getAdminCapabilities, hasAdminCapability } from "@/lib/auth/admin-permissions";
import type { AdminCapability } from "@/lib/auth/admin-permissions";
import { isProfileRole } from "@/lib/auth/rbac";
import type { AuthPrincipal } from "@/lib/auth/rbac";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/admin";

import { describeAuditChange, summarizeJson } from "./model";
import type {
  AdminAuditEntry,
  AdminBusiness,
  AdminDashboardReadyState,
  AdminDashboardState,
  AdminFraudEvent,
  AdminOperator,
  AdminSubscription,
  AdminSupportTicket,
  AdminUser,
  AdminView,
  PlatformMetrics
} from "./model";

interface ProfileRow {
  id: string;
  display_name: string | null;
  email: string | null;
  phone: string | null;
  role: string;
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
}

interface PlanRow {
  id: string;
  name: string;
  monthly_price_mzn_minor: number | null;
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
  users: "users_read",
  subscriptions: "subscriptions_read",
  support: "support_manage",
  fraud: "fraud_review",
  audit: "audit_read"
};

export async function getAdminDashboardState(
  principal: AuthPrincipal,
  view: AdminView,
  query: string
): Promise<AdminDashboardState> {
  const capabilities = getAdminCapabilities(principal.profileRole);

  if (!hasAdminCapability(principal.profileRole, viewCapabilities[view])) {
    return {
      status: "denied",
      view,
      capabilities,
      message: "A sua funcao nao permite consultar esta area administrativa."
    };
  }

  try {
    assertAdminCapability(principal, viewCapabilities[view]);
    const supabase = createSupabaseServiceRoleClient();
    const baseState: AdminDashboardReadyState = {
      status: "ready",
      view,
      query,
      capabilities,
      metrics: null,
      businesses: [],
      users: [],
      subscriptions: [],
      tickets: [],
      operators: [],
      fraudEvents: [],
      auditEntries: []
    };

    if (view === "overview") {
      baseState.metrics = await loadMetrics(supabase, principal.profileId);
    } else if (view === "businesses") {
      baseState.businesses = await loadBusinesses(supabase, query);
    } else if (view === "users") {
      baseState.users = await loadUsers(supabase, query);
    } else if (view === "subscriptions") {
      baseState.subscriptions = await loadSubscriptions(supabase, query);
    } else if (view === "support") {
      const [tickets, operators] = await Promise.all([
        loadSupportTickets(supabase, query),
        loadOperators(supabase)
      ]);
      baseState.tickets = tickets;
      baseState.operators = operators;
    } else if (view === "fraud") {
      baseState.fraudEvents = await loadFraudEvents(supabase, query);
    } else {
      baseState.auditEntries = await loadAuditEntries(supabase, query);
    }

    return baseState;
  } catch (error) {
    console.error("Admin dashboard data load failed", {
      view,
      errorCode: getAdminDataErrorCode(error)
    });

    return {
      status: "error",
      view,
      capabilities,
      message: "Nao foi possivel carregar os dados administrativos. Tente novamente."
    };
  }
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
    .limit(100);

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
        : "Sem owner",
      createdAt: row.created_at,
      reviewedAt: row.reviewed_at,
      reviewNote: row.review_note
    }));
}

async function loadUsers(supabase: SupabaseClient, query: string): Promise<AdminUser[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, display_name, email, phone, role, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

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
          email: row.email ?? "Sem email",
          phone: row.phone ?? "Sem telefone",
          role: row.role,
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
    .limit(100);

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
      const businessName = businesses.get(row.business_id) ?? "Negocio removido";
      const plan = plans.get(row.plan_id);
      return {
        id: row.id,
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
    .limit(100);

  if (error) {
    throw error;
  }

  const rows = (data ?? []) as SupportTicketRow[];
  const [profiles, businesses] = await Promise.all([
    loadProfileMap(
      supabase,
      rows.flatMap((row) =>
        [row.profile_id, row.assigned_to_profile_id].filter((id): id is string => Boolean(id))
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
      subject: row.subject,
      description: row.description ?? "Sem descricao",
      status: row.status,
      priority: row.priority,
      requesterName: getProfileLabel(row.profile_id ? profiles.get(row.profile_id) : undefined),
      businessName: row.business_id
        ? (businesses.get(row.business_id) ?? "Negocio removido")
        : "Plataforma",
      assignedToProfileId: row.assigned_to_profile_id,
      assignedToName: row.assigned_to_profile_id
        ? getProfileLabel(profiles.get(row.assigned_to_profile_id))
        : "Nao atribuido",
      resolutionNote: row.resolution_note ?? "",
      resolvedAt: row.resolved_at,
      createdAt: row.created_at
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
    .select("id, display_name, email, phone, role, created_at")
    .in("role", ["support_agent", "platform_admin", "super_admin"])
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
      "id, business_id, profile_id, event_type, severity, details, resolved_by_profile_id, resolution_note, resolved_at, created_at"
    )
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    throw error;
  }

  const rows = (data ?? []) as FraudEventRow[];
  const [profiles, businesses] = await Promise.all([
    loadProfileMap(
      supabase,
      rows.flatMap((row) =>
        [row.profile_id, row.resolved_by_profile_id].filter((id): id is string => Boolean(id))
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
        ? (businesses.get(row.business_id) ?? "Negocio removido")
        : "Plataforma",
      profileName: getProfileLabel(row.profile_id ? profiles.get(row.profile_id) : undefined),
      detailsSummary: summarizeJson(row.details),
      resolvedByName: row.resolved_by_profile_id
        ? getProfileLabel(profiles.get(row.resolved_by_profile_id))
        : "Por rever",
      resolutionNote: row.resolution_note ?? "",
      resolvedAt: row.resolved_at,
      createdAt: row.created_at
    }))
    .filter((row) =>
      matchesQuery(
        query,
        row.eventType,
        row.severity,
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
    .limit(100);

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
          ? (businesses.get(row.business_id) ?? "Negocio removido")
          : "Plataforma",
        operation: typeof context.operation === "string" ? context.operation : "operacao_sensivel",
        changeSummary: describeAuditChange(row.before_data, row.after_data),
        ipAddress: row.ip_address ?? "Nao registado",
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
    .select("id, name, monthly_price_mzn_minor")
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
