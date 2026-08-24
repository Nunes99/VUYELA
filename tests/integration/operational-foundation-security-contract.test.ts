import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const migration = readFileSync(
  join(process.cwd(), "supabase/migrations/secure_operational_flow_foundation.sql"),
  "utf8"
);
const posSettings = readFileSync(join(process.cwd(), "features/pos/pos-settings.tsx"), "utf8");
const posActions = readFileSync(join(process.cwd(), "features/pos/actions.ts"), "utf8");

const privateTables = [
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

describe("operational flow security boundary", () => {
  it("enables RLS on every new operational table", () => {
    for (const table of privateTables) {
      expect(migration).toContain(`alter table public.${table} enable row level security`);
    }
  });

  it("checks tenant and branch access before returning POS configuration", () => {
    expect(migration).toContain("create or replace function public.can_access_pos_terminal");
    expect(migration).toContain("public.can_access_transaction(pt.business_id, pt.branch_id)");
    expect(migration).toContain("create or replace function public.get_pos_terminal_configuration");
    expect(migration).toContain("security definer\nset search_path = ''");
    expect(migration).toContain("if not public.can_access_pos_terminal(p_terminal_id)");
    expect(migration).toContain("'credentialsConfigured'");
    expect(migration).toContain("bpc.public_settings");
    expect(migration).not.toContain("token_hash',");
  });

  it("keeps sensitive operational writes outside browser grants", () => {
    const statements = migration.split(";").map((statement) => statement.trim());
    const browserWriteTables = [
      "pos_terminals",
      "pos_terminal_settings",
      "pos_terminal_devices",
      "business_payment_channels",
      "payment_attempts",
      "business_member_invitations",
      "offer_claims",
      "platform_settings"
    ];

    for (const table of browserWriteTables) {
      expect(
        statements.some(
          (statement) =>
            /^grant\s+(insert|update|delete)/i.test(statement) &&
            statement.includes(`on public.${table}`)
        )
      ).toBe(false);
    }
  });

  it("keeps catalogue audit columns outside browser writes", () => {
    expect(migration).toContain(
      "create or replace function public.enforce_business_catalog_item_actor"
    );
    const catalogueInsertGrant = migration.match(
      /grant insert \(([\s\S]*?)\)\s*on public\.business_catalog_items/i
    )?.[1];
    const catalogueUpdateGrant = migration.match(
      /grant update \(([\s\S]*?)\)\s*on public\.business_catalog_items/i
    )?.[1];

    expect(catalogueInsertGrant).toBeDefined();
    expect(catalogueInsertGrant).not.toContain("created_by");
    expect(catalogueInsertGrant).not.toContain("created_at");
    expect(catalogueUpdateGrant).toBeDefined();
    expect(catalogueUpdateGrant).not.toContain("business_id");
    expect(catalogueUpdateGrant).not.toContain("created_by");
  });

  it("does not expose invitation token hashes or platform settings", () => {
    const invitationGrant = migration.match(
      /grant select \(([\s\S]*?)\)\s*on public\.business_member_invitations/i
    )?.[1];

    expect(invitationGrant).toBeDefined();
    expect(invitationGrant).not.toContain("token_hash");
    expect(migration).not.toMatch(/create policy platform_settings/i);
  });

  it("presents unconfigured providers honestly and rejects forged selection", () => {
    expect(posSettings).not.toMatch(/•••• (2048|8170|4632|9021)/);
    expect(posSettings).not.toContain("Online e operacional");
    expect(posSettings.match(/statusLabel: "Por configurar"/g)).toHaveLength(3);
    expect(posActions).toContain("isAvailablePosPaymentMethod(paymentMethodValue)");
    expect(posActions).toContain(
      "Este método de pagamento ainda não está configurado para utilização."
    );
  });
});
