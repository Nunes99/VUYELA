import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const migration = readFileSync(
  join(process.cwd(), "supabase/migrations/implement_customer_engagement.sql"),
  "utf8"
);
const actions = readFileSync(join(process.cwd(), "features/customer-dashboard/actions.ts"), "utf8");

describe("customer engagement contract", () => {
  it("implements favorites, preferences and offer activation", () => {
    expect(migration).toContain("function public.get_customer_engagement");
    expect(migration).toContain("function public.update_customer_business_preference");
    expect(migration).toContain("function public.activate_customer_offer");
    expect(migration).toContain("function public.cancel_customer_offer_claim");
  });

  it("requires an owned active card and a currently available offer", () => {
    expect(migration).toContain("cc.customer_profile_id = v_profile_id");
    expect(migration).toContain("cc.status = 'active'");
    expect(migration).toContain("o.is_public");
    expect(migration).toContain("o.is_active");
    expect(migration).toContain("o.ends_at is null or o.ends_at > now()");
  });

  it("generates server-side claim codes and audits mutations", () => {
    expect(migration).toContain("extensions.gen_random_uuid()");
    expect(migration).toContain("insert into public.offer_claims");
    expect(migration).toContain("insert into public.audit_logs");
  });

  it("exposes only authenticated RPC execution", () => {
    expect(migration).toContain("set search_path = ''");
    expect(migration).toMatch(
      /revoke all on function public\.activate_customer_offer[\s\S]+from public, anon/
    );
    expect(migration).toMatch(
      /grant execute on function public\.activate_customer_offer[\s\S]+to authenticated/
    );
  });

  it("connects customer mutations through server actions", () => {
    expect(actions).toContain('rpc("update_customer_business_preference"');
    expect(actions).toContain('rpc("activate_customer_offer"');
    expect(actions).toContain('rpc("cancel_customer_offer_claim"');
  });
});
