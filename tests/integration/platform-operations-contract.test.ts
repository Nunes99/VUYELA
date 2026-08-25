import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const migration = readFileSync(
  join(process.cwd(), "supabase/migrations/implement_platform_operations.sql"),
  "utf8"
);
const actions = readFileSync(join(process.cwd(), "features/admin/actions.ts"), "utf8");
const session = readFileSync(join(process.cwd(), "lib/auth/session.ts"), "utf8");
const exportRoute = readFileSync(join(process.cwd(), "app/admin/export/route.ts"), "utf8");

describe("platform operations contract", () => {
  it("implements account suspension with immediate route enforcement", () => {
    expect(migration).toContain("function public.admin_set_profile_account_status");
    expect(migration).toContain("Administrators cannot change their own account status");
    expect(actions).toContain('rpc(\n    "admin_set_profile_account_status"');
    expect(session).toContain('profile.account_status !== "active"');
  });

  it("persists support replies and fraud triage", () => {
    expect(migration).toContain("function public.admin_add_support_ticket_message");
    expect(migration).toContain("insert into public.support_ticket_messages");
    expect(migration).toContain("function public.admin_triage_fraud_event");
    expect(migration).toContain("fraud_events_triage_resolution_consistent");
    expect(actions).toContain('rpc(\n    "admin_add_support_ticket_message"');
    expect(actions).toContain('rpc("admin_triage_fraud_event"');
  });

  it("stores only non-secret editable platform settings", () => {
    expect(migration).toContain("function public.admin_update_platform_settings");
    expect(migration).toContain("security.contact_email");
    expect(migration).not.toContain("service_role_key");
    expect(migration).not.toContain("client_secret");
  });

  it("keeps administrative RPCs server-only and audited", () => {
    expect(migration).toContain("security definer");
    expect(migration).toContain("set search_path = ''");
    expect(migration).toMatch(
      /revoke all privileges on function public\.admin_set_profile_account_status[\s\S]+from public, anon, authenticated/
    );
    expect(migration).toContain("insert into public.audit_logs");
  });

  it("provides authenticated, audited CSV exports", () => {
    expect(exportRoute).toContain('getProtectedRouteState("/admin"');
    expect(exportRoute).toContain('action: "export"');
    expect(exportRoute).toContain('"Content-Type": "text/csv; charset=utf-8"');
  });
});
