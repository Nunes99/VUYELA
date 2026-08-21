import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const migration = readFileSync(
  join(process.cwd(), "supabase/migrations/implement_platform_administration.sql"),
  "utf8"
);
const hardeningMigration = readFileSync(
  join(process.cwd(), "supabase/migrations/harden_platform_administration.sql"),
  "utf8"
);
const actions = readFileSync(join(process.cwd(), "features/admin/actions.ts"), "utf8");
const actionState = readFileSync(join(process.cwd(), "features/admin/state.ts"), "utf8");
const data = readFileSync(join(process.cwd(), "features/admin/data.ts"), "utf8");
const page = readFileSync(join(process.cwd(), "app/admin/page.tsx"), "utf8");

function getFunctionBlock(functionName: string): string {
  const match = migration.match(
    new RegExp(`create or replace function public\\.${functionName}\\([\\s\\S]+?\\n\\$\\$;`, "i")
  );

  if (!match) {
    throw new Error(`Missing function ${functionName}`);
  }

  return match[0];
}

describe("platform administration contract", () => {
  it("adds the operational review fields and append-only audit protection", () => {
    expect(migration).toContain("reviewed_by_profile_id");
    expect(migration).toContain("assigned_to_profile_id");
    expect(migration).toContain("resolved_by_profile_id");
    expect(migration).toContain("audit_logs_prevent_mutation");
    expect(migration).toContain("raise exception 'audit_logs is append-only'");
  });

  it("locks every privileged target and writes audit data in the same function", () => {
    for (const functionName of [
      "admin_review_business",
      "admin_update_profile_role",
      "admin_update_support_ticket",
      "admin_review_fraud_event"
    ]) {
      const block = getFunctionBlock(functionName);
      expect(block).toContain("for update");
      expect(block).toContain("insert into public.audit_logs");
      expect(block).toContain("p_actor_profile_id");
      expect(block).toContain("p_ip_address");
      expect(block).toContain("p_user_agent");
    }
  });

  it("prevents platform privilege escalation and protects the final super admin", () => {
    const block = getFunctionBlock("admin_update_profile_role");

    expect(block).toContain("Administrators cannot change their own role");
    expect(block).toContain("Only a super admin can manage privileged platform roles");
    expect(block).toContain("The final super admin cannot be demoted");
    expect(block).toContain("'permission_change'");
  });

  it("keeps all admin RPCs server-only", () => {
    expect(migration).toContain("from public, anon, authenticated");
    expect(migration).not.toMatch(
      /grant execute on function public\.admin_[^(]+\([^;]+authenticated/i
    );
    expect(migration.match(/to service_role;/g)?.length).toBeGreaterThanOrEqual(5);
    expect(data).toContain("createSupabaseServiceRoleClient");
    expect(data).toContain("assertAdminCapability");
  });

  it("uses the real point ledger amount column in platform metrics", () => {
    const metricsBlock = getFunctionBlock("admin_get_platform_metrics");

    expect(metricsBlock).toContain("sum(amount)");
    expect(metricsBlock).toContain("where amount > 0");
    expect(metricsBlock).not.toContain("points_delta");
    expect(hardeningMigration).toContain("sum(amount)");
    expect(hardeningMigration).toContain("to service_role");
  });

  it("uses protected server actions for every privileged mutation", () => {
    expect(actions).toContain('"use server"');
    expect(actions).toContain('getActionPrincipal("businesses_review")');
    expect(actions).toContain('getActionPrincipal("users_manage")');
    expect(actions).toContain('getActionPrincipal("support_manage")');
    expect(actions).toContain('getActionPrincipal("fraud_review")');
    expect(actions).toContain("p_ip_address");
    expect(page).toContain('getProtectedRouteState("/admin", "/admin")');
    expect(page).toContain("getAdminDashboardState");
    expect(actions).not.toContain("export const initialAdminActionState");
    expect(actionState).toContain("export const initialAdminActionState");
  });
});
