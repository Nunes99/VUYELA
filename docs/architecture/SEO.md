# SEO

## Server-Renderable Pages

Use static generation or server rendering for:

- homepage;
- establishments;
- categories;
- cities;
- offers;
- blog;
- institutional pages;
- pricing pages.

## Required Metadata

Every indexable page needs:

- title;
- description;
- canonical URL;
- OpenGraph metadata where relevant;
- structured internal links.

Use structured data only when semantically correct:

- Organization
- LocalBusiness
- BreadcrumbList
- FAQPage
- Article
- Offer

Do not generate false structured data.

## Programmatic SEO

Only generate pages when there is real user value and enough data. Do not index empty, duplicate, or low-value combinations.

## Marketplace SEO

FASE 11 implements public discovery with server-rendered routes:

- `/estabelecimentos`;
- `/estabelecimentos/[slug]`;
- `/categorias`;
- `/categorias/[slug]`;
- `/locais`;
- `/locais/[cidade]`;
- `/locais/[cidade]/[categoria]`;
- `/ofertas`;
- `/ofertas/[slug]`.

Indexing rules:

- establishment detail pages require active public business data, description, category, active loyalty program, and at least one active branch;
- category pages require at least one indexable establishment;
- city pages require at least one indexable establishment;
- city/category pages require at least two establishments to avoid thin duplicate combinations;
- offer detail pages require an active public offer whose slug is unique across the public marketplace;
- empty list pages render with `noindex`;
- missing or non-indexable dynamic pages return 404.

Every indexable marketplace page has canonical metadata, OpenGraph metadata, breadcrumbs, internal links, and structured data where semantically correct:

- `ItemList` for discovery lists;
- `BreadcrumbList` for navigational context;
- `LocalBusiness` and `FAQPage` for establishment detail pages;
- `Offer` for unique active offer pages.

The sitemap includes only meaningful public marketplace URLs and excludes dashboards, POS, admin, auth internals, and low-value generated combinations.
