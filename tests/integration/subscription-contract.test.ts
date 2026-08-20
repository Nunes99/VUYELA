import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const migration = readFileSync(
  join(process.cwd(), "supabase/migrations/implement_subscription_entitlements.sql"),
  "utf8"
);
const adminActions = readFileSync(join(process.cwd(), "features/admin/actions.ts"), "utf8");
const campaignData = readFileSync(
  join(process.cwd(), "features/business-campaigns/data.ts"),
  "utf8"
);
const subscriptionPage = readFileSync(
  join(process.cwd(), "app/negocio/subscricao/page.tsx"),
  "utf8"
);

function getFunctionBlock(functionName: string): string {
  const match = migration.match(
    new RegExp(`create or replace function public\\.${functionName}\\([\\s\\S]+?\\n\\$\\$;`, "i")
  );

  if (!match) {
    throw new Error(`Missing function ${functionName}`);
  }

  return match[0];
}

describe("subscription system contract", () => {
  it("stores plan limits and features as configurable database entities", () => {
    expect(migration).toContain("create table public.plan_entitlements");
    expect(migration).toContain("branch_limit integer");
    expect(migration).toContain("staff_limit integer");
    expect(migration).toContain("campaign_limit integer");
    expect(migration).toContain("analytics_level text");
    expect(migration).toContain("feature_flags jsonb");
    expect(migration).toContain("trial_days integer");
  });

  it("enforces tenant resource limits under one advisory transaction lock", () => {
    const block = getFunctionBlock("enforce_business_resource_limit");

    expect(block).toContain("pg_advisory_xact_lock");
    expect(block).toContain("resolve_business_entitlements");
    expect(block).toContain("from public.branches");
    expect(block).toContain("from public.business_members");
    expect(block).toContain("from public.campaigns");
    expect(migration).toContain("branches_enforce_subscription_limit");
    expect(migration).toContain("business_members_enforce_subscription_limit");
    expect(migration).toContain("campaigns_enforce_subscription_limit");
  });

  it("automatically provisions and audits a default business trial", () => {
    const block = getFunctionBlock("start_business_trial_subscription");

    expect(block).toContain("where p.slug = 'teste'");
    expect(block).toContain("insert into public.subscriptions");
    expect(block).toContain("insert into public.audit_logs");
    expect(migration).toContain("businesses_start_trial_subscription");
  });

  it("keeps plan mutations server-only, locked, usage-safe, and audited", () => {
    for (const functionName of [
      "admin_assign_subscription_plan",
      "admin_update_plan_entitlements"
    ]) {
      const block = getFunctionBlock(functionName);
      expect(block).toContain("assert_platform_actor");
      expect(block).toContain("insert into public.audit_logs");
      expect(block).toContain("p_note");
    }

    expect(getFunctionBlock("admin_assign_subscription_plan")).toContain("pg_advisory_xact_lock");
    expect(getFunctionBlock("admin_update_plan_entitlements")).toContain(
      "assert_plan_supports_business_usage"
    );
    expect(migration).not.toMatch(
      /grant execute on function public\.admin_(?:assign_subscription_plan|update_plan_entitlements)[\s\S]+?to authenticated;/i
    );
    expect(migration.match(/\) to service_role;/g)?.length).toBeGreaterThanOrEqual(2);
    expect(adminActions).toContain('getActionPrincipal("subscriptions_manage")');
  });

  it("exposes a tenant-checked overview and applies campaign capacity", () => {
    const block = getFunctionBlock("get_business_subscription_overview");

    expect(block).toContain("public.can_manage_business(p_business_id)");
    expect(migration).toContain(
      "grant execute on function public.get_business_subscription_overview(uuid) to authenticated"
    );
    expect(campaignData).toContain('supabase.rpc("get_business_subscription_overview"');
    expect(campaignData).toContain("campaignUsage < campaignLimit");
    expect(subscriptionPage).toContain('getProtectedRouteState("/negocio", "/negocio/subscricao")');
  });
});
