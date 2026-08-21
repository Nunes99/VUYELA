import type { AdminCapability } from "@/lib/auth/admin-permissions";
import type { ProfileRole } from "@/lib/auth/rbac";

export const adminViews = [
  "overview",
  "businesses",
  "users",
  "subscriptions",
  "support",
  "fraud",
  "audit"
] as const;

export type AdminView = (typeof adminViews)[number];

export interface PlatformMetrics {
  totalBusinesses: number;
  pendingBusinesses: number;
  activeBusinesses: number;
  totalProfiles: number;
  activeSubscriptions: number;
  openSupportTickets: number;
  unresolvedFraudEvents: number;
  completedTransactions: number;
  grossVolumeMznMinor: number;
  pointsIssued: number;
  businessesCreatedLast30Days: number;
  transactionsLast30Days: number;
}

export interface AdminBusiness {
  id: string;
  name: string;
  slug: string;
  status: string;
  ownerName: string;
  createdAt: string;
  reviewedAt: string | null;
  reviewNote: string | null;
}

export interface AdminUser {
  id: string;
  displayName: string;
  email: string;
  phone: string;
  role: ProfileRole;
  createdAt: string;
}

export interface AdminSubscription {
  id: string;
  businessId: string;
  planId: string;
  businessName: string;
  planName: string;
  monthlyPriceMznMinor: number | null;
  status: string;
  currentPeriodEnd: string | null;
  trialEndsAt: string | null;
}

export interface AdminPlan {
  id: string;
  slug: string;
  name: string;
  description: string;
  monthlyPriceMznMinor: number | null;
  trialDays: number;
  branchLimit: number | null;
  staffLimit: number | null;
  campaignLimit: number | null;
  analyticsLevel: string;
  featureFlags: string[];
  isPublic: boolean;
  isActive: boolean;
}

export interface AdminOperator {
  id: string;
  label: string;
  role: ProfileRole;
}

export interface AdminSupportTicket {
  id: string;
  subject: string;
  description: string;
  status: string;
  priority: string;
  requesterName: string;
  businessName: string;
  assignedToProfileId: string | null;
  assignedToName: string;
  resolutionNote: string;
  resolvedAt: string | null;
  createdAt: string;
}

export interface AdminFraudEvent {
  id: string;
  eventType: string;
  severity: string;
  businessName: string;
  profileName: string;
  detailsSummary: string;
  resolvedByName: string;
  resolutionNote: string;
  resolvedAt: string | null;
  createdAt: string;
}

export interface AdminAuditEntry {
  id: string;
  action: string;
  entityTable: string;
  entityId: string | null;
  actorName: string;
  businessName: string;
  operation: string;
  changeSummary: string;
  ipAddress: string;
  createdAt: string;
}

export interface AdminDashboardReadyState {
  status: "ready";
  view: AdminView;
  query: string;
  capabilities: AdminCapability[];
  metrics: PlatformMetrics | null;
  businesses: AdminBusiness[];
  users: AdminUser[];
  subscriptions: AdminSubscription[];
  plans: AdminPlan[];
  tickets: AdminSupportTicket[];
  operators: AdminOperator[];
  fraudEvents: AdminFraudEvent[];
  auditEntries: AdminAuditEntry[];
}

export type AdminDashboardState =
  | AdminDashboardReadyState
  | { status: "denied"; view: AdminView; message: string; capabilities: AdminCapability[] }
  | { status: "error"; view: AdminView; message: string; capabilities: AdminCapability[] };

export function parseAdminView(value: string | string[] | undefined): AdminView {
  const candidate = Array.isArray(value) ? value[0] : value;

  return adminViews.includes(candidate as AdminView) ? (candidate as AdminView) : "overview";
}

export function normalizeAdminQuery(value: string | string[] | undefined): string {
  const candidate = Array.isArray(value) ? value[0] : value;

  return (candidate ?? "").trim().slice(0, 80);
}

export function formatMznMinor(value: number): string {
  return new Intl.NumberFormat("pt-MZ", {
    style: "currency",
    currency: "MZN",
    maximumFractionDigits: 2
  }).format(value / 100);
}

export function formatAdminDate(value: string | null): string {
  if (!value) {
    return "Sem data";
  }

  return new Intl.DateTimeFormat("pt-MZ", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

export function summarizeJson(value: unknown, limit = 180): string {
  if (!value || (typeof value === "object" && Object.keys(value).length === 0)) {
    return "Sem detalhes";
  }

  const serialized = JSON.stringify(value);

  return serialized.length > limit ? `${serialized.slice(0, limit)}...` : serialized;
}

export function describeAuditChange(beforeData: unknown, afterData: unknown): string {
  const before = isRecord(beforeData) ? beforeData : {};
  const after = isRecord(afterData) ? afterData : {};
  const keys = Array.from(new Set([...Object.keys(before), ...Object.keys(after)]));
  const changes = keys
    .filter((key) => JSON.stringify(before[key]) !== JSON.stringify(after[key]))
    .slice(0, 3)
    .map((key) => `${key}: ${formatValue(before[key])} -> ${formatValue(after[key])}`);

  return changes.length > 0 ? changes.join("; ") : "Registo criado ou atualizado";
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) {
    return "vazio";
  }

  return String(value).slice(0, 60);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
