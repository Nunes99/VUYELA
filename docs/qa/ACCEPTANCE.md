# Acceptance

## Global Definition of Done

A feature is complete only when:

- expected behavior works;
- security has been considered;
- data is persisted correctly;
- responsive behavior has been tested;
- loading state exists where relevant;
- empty state exists where relevant;
- error state exists where relevant;
- accessibility has been considered;
- relevant tests exist;
- lint passes;
- typecheck passes;
- tests pass;
- production build passes;
- relevant documentation is updated.

## Phase 00 Acceptance

- project starts;
- lint passes;
- TypeScript passes;
- unit tests pass;
- production build passes;
- architecture decisions are documented;
- no product feature is implemented prematurely.

## Phase 02 Homepage Acceptance

- homepage is server-rendered or statically generated;
- approved VUYELA brand hierarchy is visible in the first viewport;
- Portuguese copy is real and does not use lorem ipsum;
- no unavailable partner/customer claims are presented;
- page metadata, canonical URL, OpenGraph, and valid Organization structured data exist;
- CTA targets point to existing sections until auth/onboarding routes exist;
- screenshots are checked at 375px, 768px, 1280px, and 1440px;
- no horizontal body overflow exists;
- lint, typecheck, unit tests, E2E, design-system build, and production build pass.

## Phase 03 Database Acceptance

- initial Supabase migration exists under `supabase/migrations`;
- core product tables exist for profiles, businesses, branches, memberships, loyalty programs, customer cards, wallets, ledger, transactions, campaigns, notifications, subscriptions, support, audit, and fraud events;
- tenant-owned records carry `business_id` for later RLS policies;
- cross-tenant relationships use composite foreign keys where business-owned records reference other business-owned records;
- money is stored as integer MZN minor units;
- wallet balances are operational state and point history is append-only through `point_ledger`;
- ledger entries require non-zero amounts and enforce positive earn-like movements plus negative redeem/expire movements;
- lookup, tenant, status, and date indexes exist for expected access paths;
- RLS policies are intentionally left for Phase 04;
- database architecture documentation is updated;
- format, lint, typecheck, unit tests, E2E, design-system build, and production build pass.

## Phase 04 RLS Acceptance

- dedicated RLS migration exists after the initial schema migration;
- RLS is enabled for all private and tenant-sensitive tables;
- customer policies restrict private card, wallet, ledger, transaction, notification, referral, and support-ticket access to the owning customer;
- tenant policies restrict business-owned private records to active members of the same business;
- cashier transaction access is scoped to the assigned business/branch;
- marketplace-safe public tables expose only active public records;
- platform support/admin roles do not receive direct client-side RLS bypasses;
- point wallet, point ledger, and transaction writes remain unavailable to browser-authenticated roles;
- automated tests prove the required customer, tenant, cashier, platform-admin, and sensitive-write policy invariants;
- security and database architecture documentation is updated;
- format, lint, typecheck, unit tests, E2E, design-system build, and production build pass.
