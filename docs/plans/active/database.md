# Goal

Implement FASE 03: the initial Supabase database schema for VUYELA.

# Context

Phase 02 delivered the public homepage. The next numbered phase in the master development flow is FASE 03 — Database. FASE 04 will implement Row Level Security, so this phase focuses on schema, constraints, indexes, and documentation.

# Scope

- Add an initial Supabase migration under `supabase/migrations`.
- Cover profiles, businesses, branches, business memberships, loyalty programs, customer cards, point wallets, immutable point ledger, transactions, campaigns, notifications, subscriptions, and audit logs.
- Add indexes, foreign keys, uniqueness, and check constraints.
- Preserve tenant ownership fields for later RLS policies.
- Document the schema and decisions.
- Add automated static checks for migration structure.

# Out Of Scope

- RLS policies and tenant-isolation tests.
- Supabase RPC loyalty operations.
- Real seed/demo data.
- Auth UI and onboarding.
- Business dashboard, POS, and customer dashboard.

# Architecture

The schema uses Supabase PostgreSQL as the source of truth. Sensitive loyalty movements are represented by append-only `point_ledger` records connected to operational `point_wallets`. Wallet balances are operational state and cannot exist without ledger history. Later phases will implement transactional RPC functions and RLS policies.

# Tasks

- [x] Create initial schema migration.
- [x] Add tenant, money, ledger, and lifecycle constraints.
- [x] Add indexes for lookup and tenant access paths.
- [x] Document the schema in `docs/architecture/DATABASE.md`.
- [x] Add migration structure tests.
- [x] Run format, lint, typecheck, unit tests, design-system build, build, and E2E.

# Risks

- Balance fields must not be treated as the historical source of truth.
- Public marketplace tables and private tenant tables must stay distinguishable for later RLS.
- Subscription plans must be configurable data, not hard-coded application constants.

# Testing

```bash
pnpm format
pnpm lint
pnpm typecheck
pnpm test
pnpm ds:build
pnpm build
pnpm test:e2e
```

# Decisions

- Put RLS policy implementation in FASE 04 to match the master flow.
- Use integer minor units for money fields.
- Use immutable ledger trigger protection in the initial schema so normal ledger corrections must be compensating entries.
- Use composite foreign keys for business-owned relationships so later policies are backed by tenant-aware relational constraints.
- Keep transaction payment tenant ownership derived through `transactions` because payments cannot exist without a transaction.

# Progress

Completed Phase 03 implementation.

- Added `supabase/migrations/create_vuyela_core_schema.sql`.
- Created the core schema for identity, businesses, branches, memberships, loyalty programs, cards, wallets, ledger, transactions, campaigns, offers, referrals, notifications, plans, subscriptions, support tickets, audit logs, and fraud events.
- Added constraints for tenant ownership, money minor units, transaction totals, ledger amount direction, unique active-like subscriptions, public slugs, lifecycle dates, and append-only ledger protection.
- Added static migration tests in `tests/unit/database-schema.test.ts`.
- Updated database architecture and QA acceptance documentation.
- Final checks passed: `pnpm format`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm ds:build`, `pnpm build`, and `pnpm test:e2e`.
