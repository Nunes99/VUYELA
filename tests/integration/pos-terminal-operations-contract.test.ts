import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const migration = readFileSync(
  join(process.cwd(), "supabase/migrations/implement_pos_terminal_operations.sql"),
  "utf8"
);
const configurationMigration = readFileSync(
  join(process.cwd(), "supabase/migrations/configure_pos_terminal_and_payment_channels.sql"),
  "utf8"
);
const checkoutMigration = readFileSync(
  join(process.cwd(), "supabase/migrations/implement_cart_first_pos_checkout.sql"),
  "utf8"
);
const mpesaMigration = readFileSync(
  join(process.cwd(), "supabase/migrations/integrate_mpesa_pos_payments.sql"),
  "utf8"
);
const actions = readFileSync(join(process.cwd(), "features/pos/actions.ts"), "utf8");
const settingsActions = readFileSync(
  join(process.cwd(), "features/pos/settings-actions.ts"),
  "utf8"
);

describe("POS terminal operations contract", () => {
  it("provides persistent terminal, device and payment-channel operations", () => {
    expect(migration).toContain("function public.get_pos_operations");
    expect(migration).toContain("function public.manage_pos_terminal");
    expect(migration).toContain("function public.update_pos_terminal_settings");
    expect(migration).toContain("function public.manage_pos_terminal_device");
    expect(migration).toContain("function public.manage_business_payment_channel");
  });

  it("prices and reconciles one complete cart with immutable line snapshots", () => {
    expect(checkoutMigration).toContain("create table public.transaction_items");
    expect(checkoutMigration).toContain("function public.quote_pos_cart");
    expect(checkoutMigration).toContain("function public.confirm_pos_cart");
    expect(checkoutMigration).toContain("insert into public.payment_attempts");
    expect(checkoutMigration).toContain("insert into public.transaction_payments");
    expect(checkoutMigration).toContain("insert into public.transaction_items");
    expect(checkoutMigration).toContain("status = 'reconciled'");
    expect(checkoutMigration).toContain("p_idempotency_key");
    expect(actions).toContain('rpc("quote_pos_cart"');
    expect(actions).toContain('rpc("confirm_pos_cart"');
    expect(actions).not.toMatch(/rpc\(rpcName/);
  });

  it("supports a no-card sale and applies product benefits only after card identification", () => {
    expect(checkoutMigration).toContain("p_customer_card_id is null");
    expect(checkoutMigration).toContain("'loyalty_applied', false");
    expect(checkoutMigration).toContain("loyalty_discount_percent");
    expect(checkoutMigration).toContain("public.calculate_max_redeemable_points");
    expect(checkoutMigration).toContain("public.redeem_purchase_points");
    expect(checkoutMigration).toContain("public.record_purchase_points");
  });

  it("keeps unconfigured provider methods unavailable and implements M-Pesa reconciliation", () => {
    expect(migration).toContain("v_channel.credentials_configured_at is null");
    expect(checkoutMigration).toContain("p_payment_method not in ('cash', 'card')");
    expect(mpesaMigration).toContain("function public.prepare_pos_mpesa_payment");
    expect(mpesaMigration).toContain("function public.reconcile_mpesa_payment_attempt");
    expect(mpesaMigration).toContain("mpesa_payment_reservation");
    expect(mpesaMigration).toContain("mpesa_payment_reservation_released");
    expect(mpesaMigration).toContain("to service_role");
    expect(actions).toContain('paymentMethodValue === "mpesa"');
  });

  it("checks authenticated tenant access and removes anonymous execution", () => {
    expect(migration).toContain("not public.can_manage_business(p_business_id)");
    expect(checkoutMigration).toContain(
      "not public.can_access_transaction(p_business_id, p_branch_id)"
    );
    expect(checkoutMigration).toContain("security definer");
    expect(checkoutMigration).toContain("set search_path = ''");
    expect(checkoutMigration).toMatch(
      /revoke all on function public\.confirm_pos_cart[\s\S]+from public, anon/
    );
    expect(checkoutMigration).toContain("alter table public.transaction_items enable row level security");
  });

  it("routes configuration writes through protected server actions", () => {
    expect(settingsActions).toContain('requireRouteAccess("/pos"');
    expect(settingsActions).toContain('rpc("configure_pos_terminal_section"');
    expect(settingsActions).toContain('"configure_business_payment_channel"');
    expect(settingsActions).toContain('"configure_mpesa_payment_channel"');
    expect(settingsActions).toContain('rpc("manage_pos_terminal"');
    expect(settingsActions).toContain('rpc("update_pos_terminal_settings"');
    expect(settingsActions).toContain('rpc("manage_pos_terminal_device"');
    expect(settingsActions).toContain('rpc("manage_business_payment_channel"');
  });

  it("stores provider secrets in Vault without exposing them as public settings", () => {
    expect(configurationMigration).toContain("create extension if not exists supabase_vault");
    expect(configurationMigration).toContain("vault.create_secret");
    expect(configurationMigration).toContain("vault.update_secret");
    expect(configurationMigration).toContain("Secrets cannot be stored in public settings");
    expect(configurationMigration).not.toContain("vault.decrypted_secrets");
    expect(mpesaMigration).toContain("vault.decrypted_secrets");
    expect(mpesaMigration).toMatch(
      /get_mpesa_payment_attempt_context[\s\S]+from public, anon, authenticated/
    );
  });

  it("validates tenant ownership and keeps the configuration RPCs authenticated", () => {
    expect(configurationMigration).toContain("not public.can_manage_business(p_business_id)");
    expect(configurationMigration).toContain("security definer");
    expect(configurationMigration).toContain("set search_path = ''");
    expect(configurationMigration).toMatch(
      /revoke all on function public\.configure_business_payment_channel[\s\S]+from public, anon/
    );
  });
});
