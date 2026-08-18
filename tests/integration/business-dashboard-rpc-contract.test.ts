import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  join(process.cwd(), "supabase/migrations/create_business_dashboard_rpc.sql"),
  "utf8"
);

describe("business dashboard RPC contract", () => {
  it("uses a security-definer read boundary with explicit tenant and branch checks", () => {
    expect(migration).toContain("create or replace function public.get_business_dashboard");
    expect(migration).toContain("security definer");
    expect(migration).toContain("set search_path = public");
    expect(migration).toContain("public.can_manage_business(p_business_id)");
    expect(migration).toContain("public.can_access_branch(p_business_id, p_branch_id)");
    expect(migration).toContain("Branch scope is required for branch dashboard access");
  });

  it("returns liability and retention source fields without mutating balances", () => {
    expect(migration).toContain("pw.available_balance * lp.point_value_mzn_minor");
    expect(migration).toContain("pw.lifetime_earned");
    expect(migration).toContain("pw.lifetime_redeemed");
    expect(migration).toContain("last_transaction_at");
    expect(migration).toContain("'customerCardId', st.customer_card_id::text");
    expect(migration).toContain("'occurredAt', st.occurred_at::text");
    expect(migration).not.toMatch(/update public\.point_wallets/i);
    expect(migration).not.toMatch(/insert into public\.point_ledger/i);
    expect(migration).not.toMatch(/insert into public\.transactions/i);
  });

  it("keeps campaign and subscription settings manager-scoped", () => {
    expect(migration).toContain("when v_has_manager_scope then");
    expect(migration).toContain("from public.campaigns c");
    expect(migration).toContain("from public.subscriptions s");
    expect(migration).toContain(
      "grant execute on function public.get_business_dashboard(uuid, uuid, integer) to authenticated"
    );
  });
});
