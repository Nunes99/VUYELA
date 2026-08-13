# Public Marketplace Plan

## Status

Implemented in FASE 11.

## Scope

- Server-rendered public discovery routes:
  - `/estabelecimentos`;
  - `/estabelecimentos/[slug]`;
  - `/categorias`;
  - `/categorias/[slug]`;
  - `/locais`;
  - `/locais/[cidade]`;
  - `/locais/[cidade]/[categoria]`;
  - `/ofertas`;
  - `/ofertas/[slug]`.
- Public Supabase anon read boundary in `features/public-marketplace/data.ts`.
- Pure indexability and aggregation rules in `features/public-marketplace/model.ts`.
- Metadata, canonical URLs, OpenGraph, sitemap entries, breadcrumbs, `ItemList`, `LocalBusiness`, `Offer`, and `FAQPage` structured data.
- Homepage internal links into the discovery surface.

## Decisions

- Empty list pages render useful fallback content with `noindex`.
- Dynamic low-value pages return 404 instead of creating thin SEO pages.
- City/category pages require at least two establishments.
- Offer detail pages are indexable only when the active public offer slug is unique across the marketplace because offer slugs are unique per business in the database.
- The marketplace uses anon Supabase reads only; no service-role key or authenticated private-table data is involved.

## Next Integration

FASE 12 should add search over establishments and offers. Search filters can reuse the marketplace snapshot and should only create shareable/indexable URLs for filters with real SEO value.
