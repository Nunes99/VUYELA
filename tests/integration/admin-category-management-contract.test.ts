import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const migration = readFileSync(
  join(process.cwd(), "supabase/migrations/manage_business_categories.sql"),
  "utf8"
);
const actions = readFileSync(join(process.cwd(), "features/admin/actions.ts"), "utf8");

describe("admin category management contract", () => {
  it("restricts and audits taxonomy changes", () => {
    expect(migration).toContain("security definer");
    expect(migration).toContain("public.assert_platform_actor");
    expect(migration).toContain("public.audit_logs");
    expect(migration).toContain("Business category is assigned to businesses");
    expect(migration).toContain("revoke all on function public.admin_save_business_category");
  });

  it("routes category writes through the protected RPC", () => {
    expect(actions).toContain('getActionPrincipal("categories_manage")');
    expect(actions).toContain('.rpc("admin_save_business_category"');
  });
});
