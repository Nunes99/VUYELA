import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const migration = readFileSync(
  join(process.cwd(), "supabase/migrations/20260831193705_add_business_catalog_categories.sql"),
  "utf8"
);
const actions = readFileSync(
  join(process.cwd(), "features/business-operations/actions.ts"),
  "utf8"
);
const posData = readFileSync(join(process.cwd(), "features/pos/data.ts"), "utf8");
const workflow = readFileSync(join(process.cwd(), "features/pos/pos-workflow.tsx"), "utf8");

describe("business catalogue category contract", () => {
  it("keeps categories tenant-owned and protected by RLS and explicit grants", () => {
    expect(migration).toContain("create table public.business_catalog_categories");
    expect(migration).toContain("foreign key (category_id, business_id)");
    expect(migration).toContain("enable row level security");
    expect(migration).toContain(
      "revoke all on table public.business_catalog_categories from public, anon, authenticated"
    );
    expect(migration).toContain("using (public.is_business_member(business_id))");
  });

  it("audits category and item mutations behind business ownership checks", () => {
    expect(migration).toContain("function public.manage_business_catalog_category");
    expect(migration).toContain("function public.manage_business_catalog_item_with_category");
    expect(migration).toContain("not public.can_manage_business(p_business_id)");
    expect(migration).toContain("insert into public.audit_logs");
    expect(actions).toContain('rpc("manage_business_catalog_category"');
    expect(actions).toContain('rpc("manage_business_catalog_item_with_category"');
  });

  it("exposes ordered active categories and a horizontally scrollable POS filter", () => {
    expect(posData).toContain('.from("business_catalog_categories")');
    expect(posData).toContain('.eq("is_active", true)');
    expect(posData).toContain('.order("sort_order"');
    expect(workflow).toContain('aria-label="Categorias do catálogo"');
    expect(workflow).toContain("buildCatalogGroups");
    expect(workflow).toContain('name: "Outros"');
  });
});
