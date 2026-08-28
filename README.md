# VUYELA by LEMOTE

VUYELA is a loyalty SaaS/PWA for Mozambique. Businesses create their own loyalty programs, customers earn points on purchases, and those points can only be used later at the same issuing business.

The default product rule is:

```text
1 point = 1 MZN of promotional value
```

Points are promotional benefits issued by each business. They are not cash, cannot be withdrawn, cannot be transferred, and are not a VUYELA financial liability.

## Current Phase

This repository is implementing **FASE 31 — Convergência, confiabilidade e produção**.

Completed foundation work includes:

- Next.js + React + TypeScript
- Tailwind CSS and VUYELA design tokens
- linting, formatting, unit testing, and Playwright configuration
- Supabase folder structure and environment template
- product, design, architecture, and QA documentation
- reusable VUYELA design-system foundations
- responsive public homepage with SEO metadata
- initial Supabase schema migration with tenant fields, constraints, indexes, and append-only point ledger protection
- Row Level Security migration for customer, business, branch, and public marketplace access
- Supabase auth helpers, centralized RBAC, protected route states, and customer/business onboarding routes
- pure loyalty calculation helpers and transactional PostgreSQL RPCs for earning, redeeming, and refunding points
- database-backed customer digital cards with identification QR, balance, MZN equivalent, tier, and expiry information
- mobile-first customer dashboard with Inicio, Cartoes, Explorar, Actividade, and Perfil sections backed by Supabase/RLS reads
- low-friction POS flow for identifying customers, calculating earn/redeem results, confirming customer authorization, and writing transactions through loyalty RPCs with duplicate-submission protection
- business dashboard with overview, customers, transactions, points, campaigns, program, branches, employees, reports, settings, liability, and retention metrics
- public marketplace discovery pages for establishments, business profiles, categories, cities, city/category combinations, active offers, SEO metadata, structured data, and sitemap inclusion only for meaningful indexable pages
- public establishment and offer search with text, category, city, active-offer, location, and open-now filters where branch data supports them, using shareable noindex URLs
- business campaign creation with rule-based segmentation, scheduled start/end dates, consent-aware eligibility calculation, materialized audiences, and campaign analytics
- idempotent in-app and email notification delivery with customer read state, campaign delivery metrics, server-only providers, leased retries, and a protected Vercel Cron worker

Referrals, subscriptions, platform administration, business operations and the independent POS
application are implemented. The current phase concentrates on authenticated end-to-end proof,
operational monitoring, UX reliability and production hardening.

## Scripts

```bash
pnpm install
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Optional checks:

```bash
pnpm format
pnpm test:e2e
pnpm ds:build
```

## Repository Structure

```text
app/                  Next.js App Router routes
components/           Shared UI and layout components
features/             Feature modules
lib/                  Shared runtime helpers
docs/                 Product, design, architecture, and QA docs
supabase/             Supabase config, migrations, functions, seed
tests/                Unit, integration, and E2E tests
vuyela-design-system/ Existing VUYELA design-system package
```

## Development Notes

Read `AGENTS.md`, `ARCHITECTURE.md`, and the relevant docs before implementing a feature. Multi-tenant data access and loyalty balance changes must be designed from the database and security model first.
