import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const migration = readFileSync(
  join(process.cwd(), "supabase/migrations/enable_tenant_row_level_security.sql"),
  "utf8"
);

const policyBlocks = migration.match(/create policy[\s\S]+?;/gi) ?? [];

const privateTables = [
  "profiles",
  "business_categories",
  "businesses",
  "branches",
  "business_members",
  "loyalty_programs",
  "loyalty_tiers",
  "customer_cards",
  "point_wallets",
  "transactions",
  "transaction_payments",
  "point_ledger",
  "campaigns",
  "campaign_audiences",
  "offers",
  "notifications",
  "plans",
  "subscriptions",
  "referrals",
  "support_tickets",
  "audit_logs",
  "fraud_events"
];

describe("row level security migration", () => {
  it("enables RLS for every private table", () => {
    for (const table of privateTables) {
      expect(migration).toContain(`alter table public.${table} enable row level security`);
    }
  });

  it("protects customers from other customer wallets and point history", () => {
    expect(migration).toContain("create or replace function public.owns_customer_card");
    expect(migration).toContain("cc.customer_profile_id = auth.uid()");
    expect(migration).toContain("create policy customer_cards_select_own");
    expect(migration).toContain("create policy point_wallets_select_customer_or_manager");
    expect(migration).toContain("create policy point_ledger_select_customer_or_manager");
    expect(migration).toContain("public.can_access_customer_card(business_id, customer_card_id)");
  });

  it("prevents business A from reading business B private records", () => {
    expect(migration).toContain("create or replace function public.is_business_member");
    expect(migration).toContain("bm.business_id = target_business_id");
    expect(migration).toContain("bm.profile_id = auth.uid()");
    expect(migration).toContain("bm.status = 'active'");
    expect(migration).toContain("create policy business_members_manager_select");
    expect(migration).toContain("create or replace function public.can_own_business");
    expect(migration).toContain("role <> 'business_owner'");
    expect(migration).toContain("create policy subscriptions_manager_select");
    expect(migration).toContain("create policy audit_logs_manager_select");
    expect(migration).toContain("public.can_manage_business(business_id)");
  });

  it("limits cashier access to assigned branch data", () => {
    expect(migration).toContain("create or replace function public.can_access_branch");
    expect(migration).toContain("bm.branch_id = target_branch_id");
    expect(migration).toContain("bm.role = any(array['branch_manager', 'cashier']");
    expect(migration).toContain("create policy transactions_select_branch_member");
    expect(migration).toContain("using (public.can_access_transaction(business_id, branch_id))");
  });

  it("does not grant direct platform-admin policy bypasses", () => {
    expect(migration).toContain("service-role paths");
    expect(migration).not.toMatch(
      /role\s+in\s+\('support_agent',\s*'platform_admin',\s*'super_admin'\)/i
    );
    expect(migration).not.toMatch(/role\s*=\s*'platform_admin'/i);
    expect(migration).not.toMatch(/role\s*=\s*'super_admin'/i);
  });

  it("keeps sensitive loyalty writes unavailable to client roles", () => {
    expect(migration).not.toMatch(/grant\s+insert[^;]+public\.point_wallets/i);
    expect(migration).not.toMatch(/grant\s+update[^;]+public\.point_wallets/i);
    expect(migration).not.toMatch(/grant\s+insert[^;]+public\.point_ledger/i);
    expect(migration).not.toMatch(/grant\s+update[^;]+public\.transactions/i);

    const sensitiveWritePolicies = policyBlocks.filter(
      (policy) =>
        /on public\.(point_wallets|point_ledger|transactions)\b/i.test(policy) &&
        /for (insert|update|delete|all)\b/i.test(policy)
    );

    expect(sensitiveWritePolicies).toEqual([]);
  });
});
