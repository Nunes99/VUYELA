# Public Search Plan

## Status

Implemented in FASE 12.

## Scope

- `/pesquisar` public route for establishment and offer search.
- Query filters for text, category, city, active offers, open-now, and optional browser location coordinates.
- Client-side location button that requests permission explicitly and stores nothing.
- Optional branch `opening_hours` and `timezone` fields for open-now evaluation.
- Shareable search URLs with `noindex, follow` and canonical `/pesquisar`.
- SEO handoff links from search results to canonical category, city, city/category, and offers pages.

## Decisions

- Search query parameter combinations are not sitemap entries.
- Search is not an SEO programmatic page factory; durable filters link to existing canonical marketplace pages.
- Open-now filtering is enabled only when at least one public branch has valid opening hours.
- Missing opening hours mean unknown, not closed.
- Location is used only for ordering results during the request and is not persisted by the search feature.

## Integration

FASE 13 campaign targeting now keeps its segmentation server-side and consent-aware. Public search remains a read-only marketplace feature.
