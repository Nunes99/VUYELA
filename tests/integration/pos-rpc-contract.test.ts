import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const migration = readFileSync(
  join(process.cwd(), "supabase/migrations/202608130004_pos_card_lookup.sql"),
  "utf8"
);

describe("POS card lookup RPC contract", () => {
  it("uses a tenant-scoped security-definer lookup instead of browser wallet writes", () => {
    expect(migration).toContain("create or replace function public.lookup_pos_customer_card");
    expect(migration).toContain("security definer");
    expect(migration).toContain("set search_path = public");
    expect(migration).toContain("public.can_access_transaction(p_business_id, p_branch_id)");
    expect(migration).toContain("cc.business_id = p_business_id");
    expect(migration).toContain("cc.status = 'active'");
    expect(migration).toContain("lp.status = 'active'");
    expect(migration).toContain("pw.available_balance");
  });

  it("accepts identification QR payloads but never mutates balances", () => {
    expect(migration).toContain("VUYELA:CARD:%");
    expect(migration).toContain("v_qr_business_id := lower(split_part(v_card_code, ':', 3))");
    expect(migration).toContain("v_qr_business_id <> p_business_id::text");
    expect(migration).toContain("split_part(v_card_code, ':', 4)");
    expect(migration).not.toMatch(/update public\.point_wallets/i);
    expect(migration).not.toMatch(/insert into public\.point_ledger/i);
  });

  it("exposes only explicit execute to authenticated users", () => {
    expect(migration).toContain(
      "grant execute on function public.lookup_pos_customer_card(uuid, uuid, text) to authenticated"
    );
    expect(migration).not.toMatch(/grant\s+insert[^;]+public\.transactions/i);
    expect(migration).not.toMatch(/grant\s+update[^;]+public\.point_wallets/i);
  });
});
