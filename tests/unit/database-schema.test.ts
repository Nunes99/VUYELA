import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const migration = readFileSync(
  join(process.cwd(), "supabase/migrations/202608130001_initial_schema.sql"),
  "utf8"
);
const searchMigration = readFileSync(
  join(process.cwd(), "supabase/migrations/202608130006_branch_opening_hours.sql"),
  "utf8"
);
const campaignsMigration = readFileSync(
  join(process.cwd(), "supabase/migrations/202608130007_campaigns.sql"),
  "utf8"
);

const requiredTables = [
  "profiles",
  "business_categories",
  "businesses",
  "branches",
  "business_members",
  "loyalty_programs",
  "loyalty_tiers",
  "customer_cards",
  "point_wallets",
  "point_ledger",
  "transactions",
  "transaction_payments",
  "campaigns",
  "campaign_audiences",
  "offers",
  "referrals",
  "notifications",
  "plans",
  "subscriptions",
  "support_tickets",
  "audit_logs",
  "fraud_events"
];

describe("initial database schema migration", () => {
  it("creates the required FASE 03 tables", () => {
    for (const table of requiredTables) {
      expect(migration).toContain(`create table public.${table}`);
    }
  });

  it("stores money as integer MZN minor units", () => {
    expect(migration).toContain("gross_amount_mzn_minor integer not null");
    expect(migration).toContain("net_amount_mzn_minor integer not null");
    expect(migration).toContain("monthly_price_mzn_minor integer");
    expect(migration).toContain("point_value_mzn_minor integer not null default 100");
    expect(migration).not.toMatch(/amount_mzn\s+(numeric|double precision|real|money)/i);
  });

  it("protects point history as append-only ledger data", () => {
    expect(migration).toContain("create table public.point_wallets");
    expect(migration).toContain("create table public.point_ledger");
    expect(migration).toContain(
      "create or replace function public.prevent_point_ledger_mutation()"
    );
    expect(migration).toContain("create trigger point_ledger_prevent_update");
    expect(migration).toContain("create trigger point_ledger_prevent_delete");
    expect(migration).toContain("constraint point_ledger_amount_not_zero check (amount <> 0)");
  });

  it("prepares tenant-owned data for later RLS policies", () => {
    const tenantTables = [
      "business_members",
      "branches",
      "loyalty_programs",
      "customer_cards",
      "point_wallets",
      "transactions",
      "point_ledger",
      "campaigns",
      "offers",
      "subscriptions"
    ];

    for (const table of tenantTables) {
      const tablePattern = new RegExp(
        `create table public\\.${table} \\([\\s\\S]*?business_id uuid (?:not null )?references public\\.businesses\\(id\\)`,
        "i"
      );

      expect(migration).toMatch(tablePattern);
      expect(migration).toContain(`create index ${table}_business_id_idx`);
    }
  });

  it("uses composite foreign keys to prevent cross-tenant relationships", () => {
    expect(migration).toContain(
      "constraint customer_cards_program_business_fk foreign key (loyalty_program_id, business_id)"
    );
    expect(migration).toContain(
      "constraint point_wallets_card_business_fk foreign key (customer_card_id, business_id)"
    );
    expect(migration).toContain(
      "constraint transactions_card_business_fk foreign key (customer_card_id, business_id)"
    );
    expect(migration).toContain(
      "constraint point_ledger_wallet_card_business_fk foreign key (wallet_id, customer_card_id, business_id)"
    );
    expect(migration).toContain(
      "constraint campaign_audiences_card_business_fk foreign key (customer_card_id, business_id)"
    );
    expect(migration).toContain("constraint notifications_card_requires_business check");
    expect(migration).toContain("constraint fraud_events_card_requires_business check");
    expect(migration).toContain("constraint fraud_events_transaction_requires_business check");
  });

  it("leaves RLS policy implementation to the next phase", () => {
    expect(migration).not.toMatch(/create policy/i);
    expect(migration).not.toMatch(/enable row level security/i);
  });

  it("adds optional public branch opening hours for search", () => {
    expect(searchMigration).toContain("alter table public.branches");
    expect(searchMigration).toContain("opening_hours jsonb not null default '{}'::jsonb");
    expect(searchMigration).toContain("timezone text not null default 'Africa/Maputo'");
    expect(searchMigration).toContain("branches_opening_hours_object");
  });

  it("adds campaign rules, audience constraints, and analytics RPCs", () => {
    expect(campaignsMigration).toContain("alter table public.campaigns");
    expect(campaignsMigration).toContain("campaigns_rules_object");
    expect(campaignsMigration).toContain("campaigns_audience_object");
    expect(campaignsMigration).toContain(
      "create or replace function public.get_business_campaigns"
    );
    expect(campaignsMigration).toContain(
      "create or replace function public.calculate_campaign_eligibility"
    );
  });
});
