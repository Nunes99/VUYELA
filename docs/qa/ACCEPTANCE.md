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

## Phase 05 Auth Acceptance

- Supabase server auth helpers exist for authenticated cookie sessions;
- service-role Supabase helper is server-only and not exposed to browser code;
- email/password, phone OTP, password reset, sign-up, logout, auth callback, and MFA-ready routes exist;
- customer and business onboarding routes exist;
- protected customer, business, POS, and admin surfaces use centralized route helpers;
- RBAC is centralized and not duplicated across pages/components;
- privileged platform roles require MFA-ready route checks;
- unauthorized and cross-role access is covered by automated tests;
- customer-only accounts cannot access business/POS/admin routes;
- cashier access is scoped to assigned branch;
- business admin cannot grant or remove business owner privileges;
- auth, security, QA, and README documentation is updated;
- format, lint, typecheck, unit tests, E2E, design-system build, and production build pass.

## Phase 06 Loyalty Engine Acceptance

- pure loyalty calculation helpers exist outside presentation components;
- `1 point = 1 MZN` is represented as `100` MZN minor units;
- earning points uses gross amount minus discounts and redeemed promotional value;
- redemption limits respect wallet balance, point value, purchase value, and configured maximum redemption percentage;
- balance-changing writes use PostgreSQL RPC functions instead of direct browser table writes;
- earning, redemption, and refund RPCs validate tenant/branch access;
- redemption locks the wallet row with `FOR UPDATE` to prevent concurrent double spending;
- every non-zero points movement writes `point_ledger`;
- refunds use compensating `refund_reversal` entries instead of editing ledger history;
- sensitive operations write audit logs;
- unit tests cover calculation rules and static integration tests cover the RPC contract;
- format, lint, typecheck, unit tests, E2E, design-system build, and production build pass.

## Phase 07 Customer Card Acceptance

- `/cliente` renders digital loyalty cards for the authenticated customer;
- card data is loaded server-side through Supabase session queries and RLS;
- no demo card data is used outside development seed environments;
- each card shows business identity, customer name, card number, QR fallback code, available points, MZN equivalent, tier, and expiry information;
- identification QR does not include wallet balance or MZN equivalent;
- empty, error, loading, and populated states exist;
- layout remains readable on 320-375px screens without horizontal scrolling;
- unit tests cover card view-model calculations and QR privacy;
- E2E covers the protected customer-card route fallback;
- format, lint, typecheck, unit tests, E2E, design-system build, and production build pass.
