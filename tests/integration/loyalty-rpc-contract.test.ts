import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const migration = readFileSync(
  join(process.cwd(), "supabase/migrations/202608130003_loyalty_engine_rpc.sql"),
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

describe("loyalty engine RPC contract", () => {
  it("defines deterministic calculation helpers for money and points", () => {
    expect(migration).toContain("create or replace function public.calculate_loyalty_points");
    expect(migration).toContain(
      "create or replace function public.calculate_points_value_mzn_minor"
    );
    expect(migration).toContain(
      "create or replace function public.calculate_max_redeemable_points"
    );
    expect(migration).toContain("floor((greatest(eligible_amount_mzn_minor, 0)::numeric / 100)");
    expect(migration).toContain("greatest(point_value_mzn_minor, 1)");
  });

  it("records earning transactions through tenant-scoped security-definer RPC", () => {
    const block = getFunctionBlock("record_purchase_points");

    expect(block).toContain("security definer");
    expect(block).toContain("set search_path = public");
    expect(block).toContain("public.can_access_transaction(p_business_id, p_branch_id)");
    expect(block).toContain("bm.id = p_cashier_member_id");
    expect(block).toContain("bm.profile_id = auth.uid()");
    expect(block).toContain("cc.business_id = p_business_id");
    expect(block).toContain("pw.business_id = p_business_id");
    expect(block).toContain("for update");
    expect(block).toContain("insert into public.transactions");
    expect(block).toContain("insert into public.point_ledger");
    expect(block).toContain("'earn'");
    expect(block).toContain("lifetime_earned = pw.lifetime_earned + v_points_earned");
  });

  it("redeems points atomically and prevents concurrent double spending", () => {
    const block = getFunctionBlock("redeem_purchase_points");

    expect(block).toContain("security definer");
    expect(block).toContain("for update");
    expect(block).toContain("bm.id = p_cashier_member_id");
    expect(block).toContain("bm.profile_id = auth.uid()");
    expect(block).toContain("public.calculate_max_redeemable_points");
    expect(block).toContain("if p_points_to_redeem > v_max_redeemable_points then");
    expect(block).toContain(
      "available_balance = pw.available_balance - p_points_to_redeem + v_points_earned"
    );
    expect(block).toContain("lifetime_redeemed = pw.lifetime_redeemed + p_points_to_redeem");
    expect(block).toContain("'redeem'");
    expect(block).toContain("-p_points_to_redeem");
    expect(block).toContain("'points_redemption'");
  });

  it("refunds by compensating ledger movements instead of mutating history", () => {
    const block = getFunctionBlock("refund_loyalty_transaction");

    expect(block).toContain("for update");
    expect(block).toContain("v_transaction.status <> 'completed'");
    expect(block).toContain("v_wallet.available_balance + v_points_returned < v_points_removed");
    expect(block).toContain("'refund_reversal'");
    expect(block).toContain("status = 'refunded'");
    expect(block).not.toMatch(/update public\.point_ledger/i);
    expect(block).not.toMatch(/delete from public\.point_ledger/i);
  });

  it("exposes only explicit RPC execution to authenticated users", () => {
    expect(migration).toContain("grant execute on function public.record_purchase_points");
    expect(migration).toContain("grant execute on function public.redeem_purchase_points");
    expect(migration).toContain("grant execute on function public.refund_loyalty_transaction");
    expect(migration).not.toMatch(/grant\s+insert[^;]+public\.point_wallets/i);
    expect(migration).not.toMatch(/grant\s+update[^;]+public\.point_wallets/i);
    expect(migration).not.toMatch(/grant\s+insert[^;]+public\.point_ledger/i);
  });
});
