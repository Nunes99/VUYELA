export const analyticsLevels = ["none", "basic", "standard", "advanced"] as const;

export type AnalyticsLevel = (typeof analyticsLevels)[number];

export interface PlanEntitlements {
  branchLimit: number | null;
  staffLimit: number | null;
  campaignLimit: number | null;
  analyticsLevel: AnalyticsLevel;
  featureFlags: string[];
}

export interface SubscriptionPlan extends PlanEntitlements {
  id: string;
  slug: string;
  name: string;
  description: string;
  monthlyPriceMznMinor: number | null;
  trialDays: number;
}

export interface BusinessSubscription {
  id: string;
  status: string;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  trialEndsAt: string | null;
  plan: Omit<SubscriptionPlan, keyof PlanEntitlements | "trialDays">;
}

export interface SubscriptionUsage {
  branches: number;
  staff: number;
  campaigns: number;
}

export interface BusinessSubscriptionOverview {
  businessId: string;
  subscription: BusinessSubscription | null;
  entitlements: PlanEntitlements | null;
  usage: SubscriptionUsage;
  availablePlans: SubscriptionPlan[];
}

export function parseBusinessSubscriptionOverview(
  value: unknown
): BusinessSubscriptionOverview | null {
  const row = recordFrom(value);

  if (!row || typeof row.businessId !== "string") {
    return null;
  }

  const usage = parseUsage(row.usage);
  const subscription = row.subscription === null ? null : parseSubscription(row.subscription);
  const entitlements =
    row.entitlements === null ? null : parseEntitlements(row.entitlements, false);
  const availablePlans = Array.isArray(row.availablePlans)
    ? row.availablePlans.flatMap((plan) => {
        const parsed = parsePlan(plan);
        return parsed ? [parsed] : [];
      })
    : [];

  if (
    !usage ||
    (row.subscription !== null && !subscription) ||
    (row.entitlements !== null && !entitlements)
  ) {
    return null;
  }

  return {
    businessId: row.businessId,
    subscription,
    entitlements,
    usage,
    availablePlans
  };
}

export function formatEntitlementLimit(value: number | null): string {
  return value === null ? "Ilimitado" : value.toLocaleString("pt-MZ");
}

export function getUsageRatio(used: number, limit: number | null): number {
  if (limit === null || limit <= 0) {
    return 0;
  }

  return Math.min(1, Math.max(0, used / limit));
}

export function getAnalyticsLabel(level: AnalyticsLevel): string {
  const labels: Record<AnalyticsLevel, string> = {
    none: "Sem analítica",
    basic: "Básica",
    standard: "Padrão",
    advanced: "Avançada"
  };

  return labels[level];
}

export function getFeatureLabel(feature: string): string {
  const labels: Record<string, string> = {
    loyalty: "Fidelização",
    pos: "POS",
    referrals: "Indicações",
    campaign_delivery: "Envio de campanhas",
    priority_support: "Suporte prioritario"
  };

  return labels[feature] ?? feature.replaceAll("_", " ");
}

function parseSubscription(value: unknown): BusinessSubscription | null {
  const row = recordFrom(value);
  const plan = recordFrom(row?.plan);

  if (
    !row ||
    !plan ||
    typeof row.id !== "string" ||
    typeof row.status !== "string" ||
    typeof plan.id !== "string" ||
    typeof plan.slug !== "string" ||
    typeof plan.name !== "string"
  ) {
    return null;
  }

  return {
    id: row.id,
    status: row.status,
    currentPeriodStart: nullableString(row.currentPeriodStart),
    currentPeriodEnd: nullableString(row.currentPeriodEnd),
    trialEndsAt: nullableString(row.trialEndsAt),
    plan: {
      id: plan.id,
      slug: plan.slug,
      name: plan.name,
      description: stringFrom(plan.description),
      monthlyPriceMznMinor: nullableNumber(plan.monthlyPriceMznMinor)
    }
  };
}

function parsePlan(value: unknown): SubscriptionPlan | null {
  const row = recordFrom(value);
  const entitlements = parseEntitlements(value, true);

  if (
    !row ||
    !entitlements ||
    typeof row.id !== "string" ||
    typeof row.slug !== "string" ||
    typeof row.name !== "string"
  ) {
    return null;
  }

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: stringFrom(row.description),
    monthlyPriceMznMinor: nullableNumber(row.monthlyPriceMznMinor),
    trialDays: numberFrom(row.trialDays),
    ...entitlements
  };
}

function parseEntitlements(value: unknown, allowFlattened: boolean): PlanEntitlements | null {
  const row = recordFrom(value);
  const analyticsLevel = row?.analyticsLevel;

  if (
    !row ||
    typeof analyticsLevel !== "string" ||
    !analyticsLevels.includes(analyticsLevel as AnalyticsLevel)
  ) {
    return null;
  }

  const featureFlags = Array.isArray(row.featureFlags)
    ? row.featureFlags.filter((feature): feature is string => typeof feature === "string")
    : [];

  if (!allowFlattened && !Array.isArray(row.featureFlags)) {
    return null;
  }

  return {
    branchLimit: nullableNumber(row.branchLimit),
    staffLimit: nullableNumber(row.staffLimit),
    campaignLimit: nullableNumber(row.campaignLimit),
    analyticsLevel: analyticsLevel as AnalyticsLevel,
    featureFlags
  };
}

function parseUsage(value: unknown): SubscriptionUsage | null {
  const row = recordFrom(value);

  if (!row) {
    return null;
  }

  return {
    branches: numberFrom(row.branches),
    staff: numberFrom(row.staff),
    campaigns: numberFrom(row.campaigns)
  };
}

function recordFrom(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function nullableString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function nullableNumber(value: unknown): number | null {
  return value === null || value === undefined ? null : numberFrom(value);
}

function numberFrom(value: unknown): number {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function stringFrom(value: unknown): string {
  return typeof value === "string" ? value : "";
}
