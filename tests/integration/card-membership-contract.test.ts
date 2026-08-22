import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const migration = readFileSync(
  join(process.cwd(), "supabase/migrations/provision_loyalty_programs_and_card_membership.sql"),
  "utf8"
);
const action = readFileSync(join(process.cwd(), "features/public-marketplace/actions.ts"), "utf8");

describe("loyalty program membership contract", () => {
  it("provisions a default program when a business becomes active", () => {
    expect(migration).toContain("businesses_provision_default_loyalty_program");
    expect(migration).toContain("new.status = 'active'");
    expect(migration).toContain("on conflict (business_id) do nothing");
    expect(migration).toContain("where b.status = 'active'");
  });

  it("issues the customer card and zero-balance wallet atomically", () => {
    expect(migration).toContain("create or replace function public.join_business_loyalty_program");
    expect(migration).toContain("v_profile_id uuid := auth.uid()");
    expect(migration).toContain("and lp.status = 'active'");
    expect(migration).toContain("and b.status = 'active'");
    expect(migration).toContain("insert into public.customer_cards");
    expect(migration).toContain("insert into public.point_wallets");
    expect(migration).toContain("insert into public.audit_logs");
    expect(migration).not.toMatch(/insert into public\.point_ledger/i);
  });

  it("exposes only the authenticated RPC through the server action", () => {
    expect(migration).toContain(
      "revoke all on function public.join_business_loyalty_program(uuid) from public, anon"
    );
    expect(migration).toContain(
      "grant execute on function public.join_business_loyalty_program(uuid) to authenticated"
    );
    expect(action).toContain('supabase.rpc("join_business_loyalty_program"');
    expect(action).not.toContain("createSupabaseServiceRoleClient");
  });
});
