# VUYELA — Codex Project Instructions

## Mission

Build VUYELA by LEMOTE: an SEO-first, mobile-first loyalty platform for Mozambique.

## Source of truth

Do not put full project documentation here.

Read the relevant files under:

- docs/product/
- docs/design/
- docs/architecture/
- docs/qa/
- ARCHITECTURE.md

before implementing a feature.

## Core stack

- Next.js
- React
- TypeScript
- Supabase/PostgreSQL
- Tailwind CSS
- Vercel

## Engineering rules

- Use TypeScript strictly.
- Avoid `any`.
- Do not disable lint rules to hide problems.
- Prefer Server Components unless browser interaction is necessary.
- Keep business logic outside presentation components.
- Sensitive loyalty operations must execute server-side.
- Use PostgreSQL transactions for balance-changing operations.
- Never mutate wallet balances directly.
- Every points movement must create a ledger entry.
- Never expose Supabase service-role credentials to the browser.
- Respect Row Level Security.
- All multi-tenant queries must validate business ownership.
- Avoid hard-coded business rules when they belong in configuration.

## UX rules

- Mobile-first.
- Portuguese is the primary UI language.
- Use simple language.
- Always show both points and MZN equivalent where relevant.
- Preserve VUYELA design tokens.
- Maintain accessibility and visible focus states.
- Touch targets should be at least 44px where practical.
- Avoid horizontal scrolling.

## SEO

Public pages must be server-renderable or statically generated.

Every indexable page must have:

- title
- description
- canonical
- structured internal links
- OpenGraph metadata where relevant

Do not index empty or low-value programmatic pages.

## Quality gate

Before considering work finished:

1. lint
2. typecheck
3. unit tests
4. relevant integration tests
5. relevant Playwright tests
6. production build

Do not report success if one fails.

## Change discipline

For complex work:

1. inspect existing architecture;
2. create or update an execution plan;
3. implement;
4. test;
5. review the diff;
6. document important decisions.

Do not refactor unrelated code unless required.
