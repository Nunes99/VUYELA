import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const migration = readFileSync(
  join(process.cwd(), "supabase/migrations/create_operational_flow_foundation.sql"),
  "utf8"
);

const operationalTables = [
  "business_catalog_items",
  "pos_terminals",
  "pos_terminal_settings",
  "pos_terminal_devices",
  "business_payment_channels",
  "payment_attempts",
  "business_member_invitations",
  "customer_business_preferences",
  "offer_claims",
  "support_ticket_messages",
  "platform_settings"
];

describe("operational flow data foundation", () => {
  it("creates the durable records required by the NEW PHAS flows", () => {
    for (const table of operationalTables) {
      expect(migration).toContain(`create table public.${table}`);
    }
  });

  it("adds explicit account and profile state without exposing a balance shortcut", () => {
    expect(migration).toContain("create type public.profile_account_status as enum");
    expect(migration).toContain("add column date_of_birth date");
    expect(migration).toContain(
      "add column account_status public.profile_account_status not null default 'active'"
    );
    expect(migration).not.toMatch(/update\s+public\.point_wallets/i);
    expect(migration).not.toMatch(/insert\s+into\s+public\.point_ledger/i);
  });

  it("keeps operational relationships inside the same tenant", () => {
    expect(migration).toContain("pos_terminals_branch_business_fk");
    expect(migration).toContain("payment_attempts_terminal_business_fk");
    expect(migration).toContain("payment_attempts_channel_business_fk");
    expect(migration).toContain("payment_attempts_channel_business_method_fk");
    expect(migration).toContain("payment_attempts_transaction_business_fk");
    expect(migration).toContain("offer_claims_card_business_profile_fk");
    expect(migration).toContain("offer_claims_transaction_business_card_fk");
    expect(migration).toContain("transaction_payments_transaction_business_fk");
    expect(migration).toContain("transaction_payments_attempt_business_method_fk");
  });

  it("models payment authorization separately from loyalty transactions", () => {
    expect(migration).toContain("create type public.payment_attempt_status as enum");
    expect(migration).toContain("amount_mzn_minor integer not null");
    expect(migration).toContain("idempotency_key text not null");
    expect(migration).toContain("payment_attempts_business_idempotency_unique_idx");
    expect(migration).toContain("add column payment_attempt_id uuid");
    expect(migration).toContain("transaction_payments_payment_attempt_unique_idx");
  });

  it("prohibits common secret keys in browser-readable configuration", () => {
    expect(migration).toContain("public_settings jsonb not null default '{}'::jsonb");
    expect(migration).toContain("business_payment_channels_public_settings_no_secrets");
    expect(migration).toContain("platform_settings_value_no_secrets");
    expect(migration).toContain("'client_secret'");
    expect(migration).toContain("'private_key'");
  });
});
