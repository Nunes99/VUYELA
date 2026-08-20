import "server-only";

import { isSupabaseConfigured } from "@/lib/env";
import { createSupabasePublicClient } from "@/lib/supabase/public";

import type { AnalyticsLevel, SubscriptionPlan } from "./model";
import { analyticsLevels } from "./model";

interface PlanRow {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  monthly_price_mzn_minor: number | null;
  trial_days: number;
}

interface EntitlementRow {
  plan_id: string;
  branch_limit: number | null;
  staff_limit: number | null;
  campaign_limit: number | null;
  analytics_level: string;
  feature_flags: unknown;
}

export async function getPublicSubscriptionPlans(): Promise<SubscriptionPlan[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  const supabase = createSupabasePublicClient();
  const [{ data: planData, error: planError }, { data: entitlementData, error: entitlementError }] =
    await Promise.all([
      supabase
        .from("plans")
        .select("id, slug, name, description, monthly_price_mzn_minor, trial_days")
        .eq("is_public", true)
        .eq("is_active", true)
        .order("sort_order", { ascending: true }),
      supabase
        .from("plan_entitlements")
        .select(
          "plan_id, branch_limit, staff_limit, campaign_limit, analytics_level, feature_flags"
        )
    ]);

  if (planError || entitlementError) {
    return [];
  }

  const entitlements = new Map(
    (Array.isArray(entitlementData) ? (entitlementData as EntitlementRow[]) : []).map((row) => [
      row.plan_id,
      row
    ])
  );

  return (Array.isArray(planData) ? (planData as PlanRow[]) : []).flatMap((plan) => {
    const entitlement = entitlements.get(plan.id);

    if (!entitlement || !isAnalyticsLevel(entitlement.analytics_level)) {
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
          : []
      }
    ];
  });
}

function isAnalyticsLevel(value: string): value is AnalyticsLevel {
  return analyticsLevels.includes(value as AnalyticsLevel);
}
