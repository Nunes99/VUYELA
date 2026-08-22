import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const migration = readFileSync(
  join(process.cwd(), "supabase/migrations/restrict_business_sensitive_columns.sql"),
  "utf8"
);
const nextConfig = readFileSync(join(process.cwd(), "next.config.mjs"), "utf8");

describe("security hardening contract", () => {
  it("keeps legal business identity fields outside client-readable grants", () => {
    expect(migration).toContain("revoke select on public.businesses from anon, authenticated");

    const grantedColumns = migration.match(
      /grant select \(([\s\S]*?)\)\s*on public\.businesses/i
    )?.[1];

    expect(grantedColumns).toBeDefined();
    expect(grantedColumns).toContain("name");
    expect(grantedColumns).toContain("status");
    expect(grantedColumns).not.toContain("owner_profile_id");
    expect(grantedColumns).not.toContain("legal_name");
    expect(grantedColumns).not.toContain("nuit");
  });

  it("applies browser hardening headers to every route", () => {
    expect(nextConfig).toContain('source: "/:path*"');
    expect(nextConfig).toContain("Content-Security-Policy");
    expect(nextConfig).toContain("frame-ancestors 'none'");
    expect(nextConfig).toContain("Strict-Transport-Security");
    expect(nextConfig).toContain("X-Content-Type-Options");
    expect(nextConfig).toContain("Referrer-Policy");
    expect(nextConfig).toContain("Permissions-Policy");
    expect(nextConfig).toContain('isDevelopment ? " \'unsafe-eval\'" : ""');
    expect(nextConfig).toContain('isDevelopment ? [] : ["upgrade-insecure-requests"]');
  });
});
