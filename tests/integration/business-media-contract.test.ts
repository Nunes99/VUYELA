import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const migration = readFileSync(
  join(process.cwd(), "supabase/migrations/manage_business_media.sql"),
  "utf8"
);
const mediaService = readFileSync(join(process.cwd(), "lib/business-media.ts"), "utf8");

describe("business media contract", () => {
  it("adds media references without storing binary data in operational tables", () => {
    expect(migration).toContain("alter table public.business_catalog_items");
    expect(migration).toContain("alter table public.offers");
    expect(migration).toContain("add column image_url text");
    expect(migration).not.toMatch(/bytea/i);
  });

  it("limits the public media bucket while protecting all writes by tenant", () => {
    expect(migration).toContain("'business-media'");
    expect(migration).toContain("5242880");
    expect(migration).toContain("array['image/jpeg', 'image/png', 'image/webp']");
    expect(migration).toContain("business_media_manager_insert");
    expect(migration).toContain("business_media_manager_update");
    expect(migration).toContain("business_media_manager_delete");
    expect(migration).toContain("public.can_manage_business");
  });

  it("uses unique paths and an audited RPC for media replacement", () => {
    expect(mediaService).toContain("randomUUID()");
    expect(mediaService).toContain("upsert: false");
    expect(mediaService).toContain('supabase.rpc("set_business_media_url"');
    expect(migration).toContain("insert into public.audit_logs");
    expect(migration).toContain("from public, anon");
    expect(migration).toContain("to authenticated");
  });
});
