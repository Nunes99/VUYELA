import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const migration = readFileSync(
  join(process.cwd(), "supabase/migrations/implement_business_operations.sql"),
  "utf8"
);
const actions = readFileSync(
  join(process.cwd(), "features/business-operations/actions.ts"),
  "utf8"
);
const campaignEditMigration = readFileSync(
  join(process.cwd(), "supabase/migrations/extend_business_campaign_management.sql"),
  "utf8"
);
const notificationIndexMigration = readFileSync(
  join(process.cwd(), "supabase/migrations/index_notification_campaign_tenant_fk.sql"),
  "utf8"
);

describe("business operations contract", () => {
  it("provides every Phase 27 read and write boundary", () => {
    expect(migration).toContain("function public.get_business_operations");
    expect(migration).toContain("function public.manage_business_branch");
    expect(migration).toContain("function public.create_business_member_invitation");
    expect(migration).toContain("function public.accept_business_member_invitation");
    expect(migration).toContain("function public.manage_business_member");
    expect(migration).toContain("function public.manage_business_catalog_item");
    expect(migration).toContain("function public.manage_customer_card_status");
    expect(migration).toContain("function public.manage_campaign_state");
    expect(migration).toContain("function public.manage_business_offer");
    expect(campaignEditMigration).toContain("function public.update_business_campaign");
  });

  it("validates tenancy and locks down privileged functions", () => {
    expect(migration).toContain("not public.can_manage_business(p_business_id)");
    expect(migration).toContain("security definer");
    expect(migration).toContain("set search_path = ''");
    expect(migration).toMatch(
      /revoke all on function public\.manage_business_branch[\s\S]+from public, anon/
    );
    expect(migration).toMatch(
      /grant execute on function public\.manage_business_branch[\s\S]+to authenticated/
    );
  });

  it("hashes invitation tokens and never returns their hashes in the operations reader", () => {
    expect(migration).toContain("extensions.gen_random_bytes(24)");
    expect(migration).toContain("extensions.digest(convert_to(v_token, 'utf8'), 'sha256')");
    const reader = migration.slice(
      migration.indexOf("function public.get_business_operations"),
      migration.indexOf("function public.manage_business_branch")
    );
    expect(reader).not.toContain("token_hash");
  });

  it("audits privileged changes without mutating loyalty balances", () => {
    expect(migration).toContain("insert into public.audit_logs");
    expect(migration).not.toMatch(/update public\.point_wallets/i);
    expect(migration).not.toMatch(/insert into public\.point_ledger/i);
  });

  it("covers the composite notification campaign foreign key", () => {
    expect(notificationIndexMigration).toContain(
      "on public.notifications(campaign_id, business_id)"
    );
  });

  it("connects all mutations through protected server actions", () => {
    expect(actions).toContain('"use server"');
    expect(actions).toContain('requireRouteAccess("/negocio"');
    expect(actions).toContain('rpc("manage_business_branch"');
    expect(actions).toContain('rpc("manage_business_catalog_item"');
    expect(actions).toContain('rpc("manage_customer_card_status"');
    expect(actions).toContain('rpc("manage_campaign_state"');
    expect(actions).toContain('rpc("update_business_campaign"');
    expect(actions).toContain('rpc("manage_business_offer"');
  });
});
