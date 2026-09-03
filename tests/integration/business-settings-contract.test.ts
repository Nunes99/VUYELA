import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const migration = readFileSync(
  join(process.cwd(), "supabase/migrations/manage_business_configuration.sql"),
  "utf8"
);
const action = readFileSync(join(process.cwd(), "features/business-settings/actions.ts"), "utf8");
const publicRevalidation = readFileSync(
  join(process.cwd(), "features/public-marketplace/revalidation.ts"),
  "utf8"
);

describe("business settings contract", () => {
  it("updates profile, loyalty and branch data in one tenant-scoped function", () => {
    expect(migration).toContain("create or replace function public.update_business_configuration");
    expect(migration).toContain("public.can_manage_business(p_business_id)");
    expect(migration).toContain("update public.businesses");
    expect(migration).toContain("insert into public.loyalty_programs");
    expect(migration).toContain("update public.branches");
    expect(migration).toContain("insert into public.audit_logs");
  });

  it("does not expose configuration writes to anonymous users", () => {
    expect(migration).toContain(
      ") from public, anon;\ngrant execute on function public.update_business_configuration"
    );
    expect(migration).toContain(") to authenticated;");
  });

  it("revalidates private and public pages after configuration", () => {
    expect(action).toContain('revalidatePath("/negocio")');
    expect(action).toContain("revalidatePublicMarketplacePaths()");
    expect(publicRevalidation).toContain('"/clientes"');
    expect(publicRevalidation).toContain('"/estabelecimentos"');
    expect(publicRevalidation).toContain('"/categorias"');
    expect(publicRevalidation).toContain('"/locais"');
    expect(publicRevalidation).toContain('"/ofertas"');
    expect(publicRevalidation).toContain('revalidatePath(path, "page")');
    expect(action).toContain('supabase.rpc("update_business_configuration"');
  });
});
