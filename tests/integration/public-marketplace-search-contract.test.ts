import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const migration = readFileSync(
  join(process.cwd(), "supabase/migrations/202608130006_branch_opening_hours.sql"),
  "utf8"
);
const searchPage = readFileSync(join(process.cwd(), "app/(public)/pesquisar/page.tsx"), "utf8");
const sitemap = readFileSync(join(process.cwd(), "app/sitemap.ts"), "utf8");
const searchModel = readFileSync(
  join(process.cwd(), "features/public-marketplace/search.ts"),
  "utf8"
);

describe("public marketplace search contract", () => {
  it("adds optional branch opening hours without making open status mandatory", () => {
    expect(migration).toContain("alter table public.branches");
    expect(migration).toContain("opening_hours jsonb not null default '{}'::jsonb");
    expect(migration).toContain("timezone text not null default 'Africa/Maputo'");
    expect(migration).toContain("Empty object means unknown");
  });

  it("keeps search query combinations shareable but out of the index", () => {
    expect(searchPage).toContain('canonical: "/pesquisar"');
    expect(searchPage).toContain("index: false");
    expect(searchPage).toContain("follow: true");
    expect(searchPage).toContain("searchParams");
  });

  it("does not add crawlable query parameter combinations to the sitemap", () => {
    expect(sitemap).not.toContain("q=");
    expect(sitemap).not.toContain("category=");
    expect(sitemap).not.toContain("city=");
    expect(sitemap).not.toContain("ofertas=");
    expect(sitemap).not.toContain("aberto=");
  });

  it("supports text, category, city, offers, location, and open-now filters in the model", () => {
    expect(searchModel).toContain("parseMarketplaceSearchParams");
    expect(searchModel).toContain("offersOnly");
    expect(searchModel).toContain("openNow");
    expect(searchModel).toContain("latitude");
    expect(searchModel).toContain("longitude");
    expect(searchModel).toContain("getDistanceKm");
    expect(searchModel).toContain("isOpenAt");
  });
});
