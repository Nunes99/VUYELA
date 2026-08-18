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

## Phase 08 Customer Dashboard Acceptance

- `/cliente` is a mobile-first customer dashboard, not a placeholder;
- navigation includes Inicio, Cartoes, Explorar, Actividade, and Perfil;
- populated dashboard state uses real Supabase/RLS reads for cards, offers, transactions, and profile summary;
- loading, empty, error, and populated states exist;
- no demo customer dashboard data is used outside seed environments;
- points and MZN equivalent are shown together where relevant;
- private customer data is rendered from server-side queries, not browser direct mutations;
- unit tests cover dashboard summary and activity mapping;
- E2E covers the protected dashboard route fallback;
- format, lint, typecheck, unit tests, E2E, design-system build, and production build pass.

## Phase 09 POS Acceptance

- `/pos` renders a mobile-first cashier workflow, not a placeholder;
- authorized cashier, branch manager, business admin, and business owner roles use centralized RBAC before rendering POS data;
- POS context is loaded server-side from active business memberships and active branches;
- customer identification accepts card number or identification QR payload through a tenant/branch-scoped RPC;
- purchase quote shows points and MZN equivalent before confirmation;
- earning and redemption calculations use shared loyalty helpers outside presentation components;
- customer authorization is required before confirmation;
- transaction confirmation calls `record_purchase_points` or `redeem_purchase_points` server-side;
- the UI disables pending submissions and sends an idempotency key through `external_reference`;
- no browser code mutates `point_wallets`, `point_ledger`, or `transactions` directly;
- loading, empty, error, quote, confirmation, and success states exist;
- unit tests cover POS amount, quote, idempotency, and server-action validation;
- static integration tests cover the POS lookup RPC contract;
- E2E covers the protected POS route fallback;
- format, lint, typecheck, unit tests, E2E, design-system build, and production build pass.

## Phase 10 Business Dashboard Acceptance

- `/negocio` renders a mobile-first business dashboard, not a placeholder;
- dashboard sections include overview, customers, transactions, points, campaigns, program, branches, employees, reports, and settings;
- dashboard data is loaded through real server-side query abstractions;
- a read-only RPC validates business/branch permissions before returning reporting data;
- branch managers are branch-scoped, while business admins and owners can view whole-business metrics;
- liability metrics show available points and MZN promotional value;
- retention metrics identify customers with repeat purchases;
- points and MZN equivalent are shown together where relevant;
- empty, error, restricted, and populated states exist;
- no browser code mutates wallets, ledger, transactions, campaigns, employees, or settings;
- unit tests cover business dashboard calculations;
- static integration tests cover the dashboard RPC permission and mutation contract;
- E2E covers the protected business dashboard route fallback;
- format, lint, typecheck, unit tests, E2E, design-system build, and production build pass.

## Phase 11 SEO Marketplace Acceptance

- public discovery routes exist for establishments, business detail pages, categories, cities, city/category combinations, and active offers;
- pages are server-rendered and backed by public Supabase/RLS reads rather than hard-coded marketplace data;
- indexable pages include title, description, canonical URL, OpenGraph metadata, structured internal links, and relevant structured data;
- empty list pages use `noindex`;
- missing, duplicate, or low-value dynamic pages return 404;
- sitemap includes the homepage and meaningful public marketplace URLs only;
- dashboards, POS, admin, auth internals, and low-value generated combinations are excluded from the sitemap;
- offer detail pages are indexable only when the active public offer slug is unique across the marketplace;
- public pages do not read private customer, wallet, ledger, transaction, membership, subscription, audit, support, or fraud data;
- E2E covers the public marketplace empty-state fallback when Supabase is not configured;
- format, lint, typecheck, unit tests, E2E, design-system build, and production build pass.

## Phase 12 Search Acceptance

- `/pesquisar` exists for public establishment and offer search;
- search supports text query, category, city, active-offer filtering, location ordering when permission exists, and open-now filtering where branch opening-hour data supports it;
- search reads the same public marketplace data boundary and does not access private customer, wallet, ledger, transaction, membership, subscription, audit, support, or fraud data;
- browser location is requested only by explicit user action and is not persisted by the search feature;
- search URLs are shareable through query parameters;
- search query URLs are `noindex, follow` with canonical `/pesquisar`;
- sitemap does not include query parameter combinations;
- filters with SEO value link to canonical category, city, city/category, or offers pages;
- open-now status is unknown when opening hours are absent and must not be inferred;
- unit tests cover parsing, filtering, distance ordering, and open-now evaluation;
- static integration tests cover search SEO and opening-hour database contract;
- E2E covers public search fallback without Supabase;
- format, lint, typecheck, unit tests, E2E, design-system build, and production build pass.

## Phase 13 Campaigns Acceptance

- `/negocio/campanhas` exists as a protected business campaign area;
- campaign creation is available for business admins and owners through a server action;
- campaigns support rule-based types, reward rules, scheduled start/end dates, and draft/scheduled/active status derivation;
- campaign eligibility is calculated server-side from tenant-scoped customer cards, wallets, completed transactions, derived tiers, recent branch city, and marketing consent;
- eligible audiences are materialized in `campaign_audiences` for analytics and later notification delivery;
- marketing-channel campaigns require consent-aware eligibility;
- this phase does not send notifications and does not mutate point wallets, point ledger, or transactions;
- campaign analytics show total, active, scheduled, draft, completed, audience, and consent coverage metrics;
- unit tests cover eligibility, consent blocking, segmentation, status derivation, and analytics;
- static integration tests cover the campaign RPC/security contract;
- E2E covers the protected campaigns route fallback without Supabase;
- format, lint, typecheck, unit tests, E2E, design-system build, and production build pass.

## Phase 14 Notifications Acceptance

- campaign audience materialization creates at most one notification per recipient and channel;
- in-app notifications appear in the authenticated customer dashboard and support unread/read state;
- email delivery uses a server-only provider with no credential exposure to browser code;
- campaign email notifications require marketing consent and a valid recipient address;
- notification provider contracts support future SMS, WhatsApp, and push implementations;
- due work is claimed with bounded batches, row locks, leases, and `SKIP LOCKED` concurrency;
- retries use persisted attempt counts, bounded backoff, and stable provider idempotency keys;
- the cron route requires `CRON_SECRET` and privileged queue claims are service-role only;
- business campaign analytics show queued, delivered, and failed notification counts;
- notification delivery does not mutate point wallets, point ledger, or transactions;
- unit and static integration tests cover delivery, retries, consent, idempotency, RLS, and cron security;
- format, lint, typecheck, unit tests, E2E, design-system build, and production build pass.
