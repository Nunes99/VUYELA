# VUYELA by LEMOTE

VUYELA is a loyalty SaaS/PWA for Mozambique. Businesses create their own loyalty programs, customers earn points on purchases, and those points can only be used later at the same issuing business.

The default product rule is:

```text
1 point = 1 MZN of promotional value
```

Points are promotional benefits issued by each business. They are not cash, cannot be withdrawn, cannot be transferred, and are not a VUYELA financial liability.

## Current Phase

This repository is in **FASE 00 — Repository bootstrap**.

The goal of this phase is to establish the engineering foundation only:

- Next.js + React + TypeScript
- Tailwind CSS and VUYELA design tokens
- linting, formatting, unit testing, and Playwright configuration
- Supabase folder structure and environment template
- product, design, architecture, and QA documentation

Product features such as POS, dashboards, authentication, RLS migrations, and the loyalty engine are intentionally not implemented yet.

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
