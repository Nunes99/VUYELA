# Goal

Implement FASE 04: Row Level Security for private VUYELA tables.

# Context

Phase 03 created the initial Supabase schema and prepared tenant fields. The master flow requires RLS for private tables and explicit tenant-isolation proof before moving to authentication.

# Scope

- Add a dedicated RLS migration after the initial schema migration.
- Enable RLS on private and tenant-sensitive tables.
- Add helper functions for business membership, business management, branch access, customer card ownership, transaction access, loyalty program access, and campaign management.
- Add policies for customer-owned private records.
- Add tenant policies for business-owned records.
- Limit cashier access to assigned branch transactions.
- Keep platform admin access out of direct client policies; privileged platform operations must use server-side service-role paths.
- Add automated static tests for the required isolation guarantees.

# Out Of Scope

- Auth UI and onboarding.
- RPC functions for balance-changing loyalty operations.
- Real database execution through Supabase CLI.
- Platform admin service-role implementation.
- Seed data for integration-style RLS tests.

# Architecture

RLS policies are implemented in `supabase/migrations/202608130002_row_level_security.sql`. Helpers are `SECURITY DEFINER` SQL functions with a fixed `search_path` and are granted only to authenticated users. Sensitive loyalty writes remain unavailable to client roles; future server-side functions must own those transactional writes.

# Tasks

- [x] Create RLS migration.
- [x] Add helper functions for tenant, branch, customer card, transaction, loyalty program, and campaign access.
- [x] Enable RLS across private tables.
- [x] Add public read policies for marketplace-safe data.
- [x] Add customer, business, cashier, and support policies.
- [x] Add static RLS isolation tests.
- [x] Update security, database, QA, and README documentation.
- [x] Run format, lint, typecheck, unit tests, design-system build, build, and E2E.

# Risks

- RLS helper functions must not create platform-admin client-side bypasses.
- Cashier access must remain branch-scoped.
- Business members from one tenant must never see another tenant's private records.
- Wallet, ledger, and transaction writes must stay server-side until transactional RPCs exist.

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

- Do not grant direct RLS bypass to `support_agent`, `platform_admin`, or `super_admin`.
- Allow public reads only for marketplace-safe active records.
- Restrict customer private access through customer card ownership.
- Restrict branch managers and cashiers by assigned branch where branch-level access is relevant.
- Keep inserts/updates for point wallets, point ledger, and transactions unavailable to browser-authenticated roles.

# Progress

Completed Phase 04 implementation.

- Added `supabase/migrations/202608130002_row_level_security.sql`.
- Added helper functions for active membership, business ownership, business management, customer card ownership, branch-scoped access, transaction access, loyalty program access, and campaign management.
- Enabled RLS across private and tenant-sensitive tables.
- Added public read policies for marketplace-safe active records.
- Added authenticated policies for customer-owned, business-owned, branch-scoped, support, audit, and fraud records.
- Kept platform admin access out of direct client policies; privileged platform operations must use future audited service-role paths.
- Kept point wallet, point ledger, and transaction writes unavailable to browser-authenticated roles.
- Added `tests/unit/rls-schema.test.ts` to prove the required RLS invariants statically.
- Final checks passed: `pnpm format`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm ds:build`, `pnpm build`, and `pnpm test:e2e`.
