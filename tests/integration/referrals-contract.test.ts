import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const migration = readFileSync(
  join(process.cwd(), "supabase/migrations/implement_referral_programs.sql"),
  "utf8"
);
const hardeningMigration = readFileSync(
  join(process.cwd(), "supabase/migrations/harden_referral_programs.sql"),
  "utf8"
);
const customerPage = readFileSync(join(process.cwd(), "app/cliente/indicacoes/page.tsx"), "utf8");
const businessPage = readFileSync(join(process.cwd(), "app/negocio/indicacoes/page.tsx"), "utf8");
const actions = readFileSync(join(process.cwd(), "features/referrals/actions.ts"), "utf8");

function getFunctionBlock(functionName: string): string {
  const match = migration.match(
    new RegExp(`create or replace function public\\.${functionName}\\([\\s\\S]+?\\n\\$\\$;`, "i")
  );

  if (!match) {
    throw new Error(`Missing function ${functionName}`);
  }

  return match[0];
}

describe("referral program contract", () => {
  it("adds tenant-scoped configurable rules and indexed referral lifecycle fields", () => {
    expect(migration).toContain("create table public.referral_programs");
    expect(migration).toContain("qualifying_purchase_minimum_mzn_minor");
    expect(migration).toContain("max_open_invites_per_referrer");
    expect(migration).toContain("reward_limit_count");
    expect(migration).toContain("reward_limit_period_days");
    expect(migration).toContain("referrals_code_unique_idx");
    expect(migration).toContain("referrals_active_referred_card_unique_idx");
    expect(migration).toContain("referrals_qualifying_transaction_unique_idx");
  });

  it("does not award points when a referral is created or accepted", () => {
    const createBlock = getFunctionBlock("create_customer_referral");
    const acceptBlock = getFunctionBlock("accept_customer_referral");

    expect(createBlock).toContain("max_open_invites_per_referrer");
    expect(acceptBlock).toContain("status = 'accepted'");
    expect(acceptBlock).toContain("referral_existing_customer_attempt");
    expect(acceptBlock).toContain("referral_reciprocal_attempt");
    expect(createBlock).not.toMatch(/update public\.point_wallets/i);
    expect(createBlock).not.toMatch(/insert into public\.point_ledger/i);
    expect(acceptBlock).not.toMatch(/update public\.point_wallets/i);
    expect(acceptBlock).not.toMatch(/insert into public\.point_ledger/i);
  });

  it("awards both wallets only for an accepted qualifying purchase", () => {
    const rewardBlock = getFunctionBlock("apply_qualifying_referral_reward");

    expect(rewardBlock).toContain("tx.status = 'completed'");
    expect(rewardBlock).toContain("r.status = 'accepted'");
    expect(rewardBlock).toContain(
      "v_transaction.net_amount_mzn_minor < v_program.qualifying_purchase_minimum_mzn_minor"
    );
    expect(rewardBlock).toContain("for update");
    expect(rewardBlock).toContain("reward_limit_period_days");
    expect(rewardBlock).toContain("'referral_referrer_reward'");
    expect(rewardBlock).toContain("'referral_referred_reward'");
    expect(rewardBlock.match(/update public\.point_wallets/g)?.length).toBeGreaterThanOrEqual(2);
    expect(rewardBlock.match(/insert into public\.point_ledger/g)?.length).toBeGreaterThanOrEqual(
      2
    );
  });

  it("wraps purchase RPCs and reverses both rewards with compensating ledger entries", () => {
    const reversalBlock = getFunctionBlock("reverse_qualifying_referral_reward");

    expect(migration).toContain("rename to record_purchase_points_without_referrals");
    expect(migration).toContain("rename to redeem_purchase_points_without_referrals");
    expect(migration).toContain("perform public.apply_qualifying_referral_reward");
    expect(migration).toContain("perform public.reverse_qualifying_referral_reward");
    expect(reversalBlock).toContain("'refund_reversal'");
    expect(reversalBlock).toContain("status = 'reversed'");
    expect(reversalBlock).not.toMatch(/update public\.point_ledger/i);
    expect(reversalBlock).not.toMatch(/delete from public\.point_ledger/i);
  });

  it("enables RLS and exposes only authenticated, validated mutation RPCs", () => {
    expect(migration).toContain("alter table public.referral_programs enable row level security");
    expect(migration).toContain("referral_programs_select_customer_or_manager");
    expect(migration).toContain("public.can_manage_business(p_business_id)");
    expect(migration).toContain(
      "revoke all on function public.apply_qualifying_referral_reward(uuid)"
    );
    expect(migration).toContain("from public, anon, authenticated");
    expect(migration).toContain(
      "grant execute on function public.create_customer_referral(uuid) to authenticated"
    );
    expect(hardeningMigration).toContain("cc.customer_profile_id = (select auth.uid())");
    expect(hardeningMigration).toContain("referred_profile_id = (select auth.uid())");
    expect(hardeningMigration).toContain("referral_programs_created_by_idx");
    expect(hardeningMigration).toContain("referral_programs_updated_by_idx");
    expect(hardeningMigration).toContain("referrals_qualifying_transaction_business_fk_idx");
  });

  it("keeps both pages protected and all mutations in server actions", () => {
    expect(customerPage).toContain('getProtectedRouteState("/cliente", "/cliente/indicacoes")');
    expect(businessPage).toContain('getProtectedRouteState("/negocio", "/negocio/indicacoes")');
    expect(actions).toContain('"use server"');
    expect(actions).toContain("create_customer_referral");
    expect(actions).toContain("accept_customer_referral");
    expect(actions).toContain("configure_referral_program");
  });
});
