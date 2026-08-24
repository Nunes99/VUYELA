import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const sitemap = readFileSync(join(process.cwd(), "app/sitemap.ts"), "utf8");
const categoryPage = readFileSync(
  join(process.cwd(), "app/(public)/categorias/[slug]/page.tsx"),
  "utf8"
);
const cityPage = readFileSync(join(process.cwd(), "app/(public)/locais/[cidade]/page.tsx"), "utf8");
const cityCategoryPage = readFileSync(
  join(process.cwd(), "app/(public)/locais/[cidade]/[categoria]/page.tsx"),
  "utf8"
);
const offerPage = readFileSync(join(process.cwd(), "app/(public)/ofertas/[slug]/page.tsx"), "utf8");
const seo = readFileSync(join(process.cwd(), "features/public-marketplace/seo.ts"), "utf8");
const data = readFileSync(join(process.cwd(), "features/public-marketplace/data.ts"), "utf8");

describe("public marketplace SEO contract", () => {
  it("uses public anon reads instead of authenticated dashboard session reads", () => {
    expect(data).toContain("createSupabasePublicClient");
    expect(data).toContain('from("businesses")');
    expect(data).toContain('.eq("status", "active")');
    expect(data).toContain('from("offers")');
    expect(data).toContain('.eq("is_public", true)');
    expect(data).toContain('.eq("is_active", true)');
  });

  it("keeps low-value programmatic pages out of the sitemap", () => {
    expect(sitemap).toContain("isIndexableCategory");
    expect(sitemap).toContain("isIndexableCity");
    expect(sitemap).toContain("isIndexableCityCategory");
    expect(sitemap).toContain("isIndexableOffer");
    expect(sitemap).not.toContain('path: "/cliente"');
    expect(sitemap).not.toContain('path: "/negocio"');
    expect(sitemap).not.toContain('path: "/pos"');
  });

  it("returns 404 for non-indexable category, city, city-category, and offer detail pages", () => {
    for (const route of [categoryPage, cityPage, cityCategoryPage, offerPage]) {
      expect(route).toContain("notFound()");
      expect(route).toContain("!viewModel.indexable");
    }
  });

  it("creates canonical metadata, robots directives, OpenGraph, and structured data helpers", () => {
    expect(seo).toContain("alternates");
    expect(seo).toContain("canonical");
    expect(seo).toContain("robots");
    expect(seo).toContain("openGraph");
    expect(seo).toContain("BreadcrumbList");
    expect(seo).toContain("ItemList");
    expect(seo).toContain("LocalBusiness");
    expect(seo).toContain('"@type": "Offer"');
    expect(seo).toContain("FAQPage");
  });
});
