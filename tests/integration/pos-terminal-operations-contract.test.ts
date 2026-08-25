import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const migration = readFileSync(
  join(process.cwd(), "supabase/migrations/implement_pos_terminal_operations.sql"),
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

  it("reconciles one payment attempt with one financial record and loyalty transaction", () => {
    expect(migration).toContain("function public.confirm_pos_transaction");
    expect(migration).toContain("insert into public.payment_attempts");
    expect(migration).toContain("insert into public.transaction_payments");
    expect(migration).toContain("status = 'reconciled'");
    expect(migration).toContain("p_idempotency_key");
    expect(actions).toContain('rpc("confirm_pos_transaction"');
    expect(actions).not.toMatch(/rpc\(rpcName/);
  });

  it("keeps provider methods unavailable without server credentials", () => {
    expect(migration).toContain("v_channel.credentials_configured_at is null");
    expect(migration).toContain("p_payment_method not in ('cash', 'card')");
    expect(actions).toContain(
      "Este método de pagamento ainda não está configurado para utilização."
    );
  });

  it("checks authenticated tenant access and removes anonymous execution", () => {
    expect(migration).toContain("not public.can_manage_business(p_business_id)");
    expect(migration).toContain("not public.can_access_transaction(p_business_id, p_branch_id)");
    expect(migration).toContain("security definer");
    expect(migration).toContain("set search_path = ''");
    expect(migration).toMatch(
      /revoke all on function public\.confirm_pos_transaction[\s\S]+from public, anon/
    );
  });

  it("routes configuration writes through protected server actions", () => {
    expect(settingsActions).toContain('requireRouteAccess("/pos"');
    expect(settingsActions).toContain('rpc("manage_pos_terminal"');
    expect(settingsActions).toContain('rpc("update_pos_terminal_settings"');
    expect(settingsActions).toContain('rpc("manage_pos_terminal_device"');
    expect(settingsActions).toContain('rpc("manage_business_payment_channel"');
  });
});
