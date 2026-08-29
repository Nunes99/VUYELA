# Testing

## Tooling

- Vitest for unit tests.
- React Testing Library for component behavior.
- Playwright for end-to-end flows and responsive visual checks.
- Supabase/PostgreSQL tests for migrations, RLS, and transactional loyalty behavior.
- Static migration tests for schema, RLS, and RPC invariants until a runnable local Supabase/PostgreSQL test harness is available.

## Fase 31 Reliability Gate

The default Playwright suite remains deterministic and intentionally runs without Supabase
credentials. It validates public routes, protected fallbacks, responsive layout and interaction
contracts.

`pnpm test:e2e:live` is the authenticated reliability suite. It keeps the configured Supabase
environment, uses dedicated accounts for customer, business, POS and admin, verifies that each
identity reaches only its own portal, and checks `/api/health`. Configure it with the variables in
`.env.e2e.example`; never use personal or production administrator credentials.

The GitHub Actions quality gate runs lint, typecheck, unit/integration tests, production build and
the deterministic Playwright suite. The authenticated suite is available through manual workflow
dispatch after the repository secrets have been configured.

## Production Health Monitoring

`.github/workflows/health-monitor.yml` checks the public `/api/health` endpoint every five minutes.
The endpoint verifies both the Next.js runtime configuration and a read against Supabase, returns
`503` whenever the service is not ready, and emits structured Vercel runtime logs with state,
request identifier and duration.

The monitor retries transient network failures, validates the response contract and creates a
single GitHub issue while an incident is active. Repeated failures do not create duplicate issues;
the issue is closed automatically after recovery. Set the optional repository variable
`HEALTHCHECK_URL` when the canonical production domain changes. Manual workflow runs can also
override the URL for validation without changing repository configuration.

## Priority Unit Tests

- point calculation;
- redemption limit;
- expiry;
- rounding;
- discount interaction;
- tier calculation;
- campaign eligibility;
- referral eligibility.

## Priority Integration Tests

- purchase to points;
- purchase to redemption;
- refund to reversal;
- expired points;
- tenant isolation;
- employee permissions;
- concurrent redemption.

## Current RLS Coverage

Phase 04 includes static tests that verify:

- RLS is enabled on private tables;
- customers cannot access another customer's wallet path;
- business tenant policies depend on active membership in the same `business_id`;
- cashier access depends on assigned branch;
- platform admin roles do not get direct client-side bypass policies;
- sensitive loyalty writes remain reserved for future server-side transactional functions.

## Current Loyalty Engine Coverage

Phase 06 includes unit and static integration tests that verify:

- default point value is `100` MZN minor units;
- earn calculations subtract discounts and redeemed promotional value;
- fractional points are rounded down;
- redemption limits respect purchase amount, configured percentage, point value, and wallet balance;
- redemption requests above the maximum are rejected;
- loyalty RPCs use `SECURITY DEFINER`, tenant/branch guards, wallet `FOR UPDATE` locks, transactions, ledger entries, audit logs, and explicit execute grants.

## Current Customer Card Coverage

Phase 07 includes tests that verify:

- MZN equivalent uses the configured point value;
- current tier and next-tier progress are derived from lifetime points;
- expiry labels handle configured and non-configured expiration;
- identification QR codes omit balance and MZN values;
- `/cliente` keeps a stable protected-route fallback when Supabase is not configured.

## Current Customer Dashboard Coverage

Phase 08 includes tests that verify:

- dashboard totals summarize points, MZN equivalent, and active card count;
- activity rows produce clear earn/redeem/neutral copy and signed point movement;
- `/cliente` remains stable in protected-route fallback mode;
- E2E runs serially to avoid `next dev` cold-compile navigation flakes.

## Current POS Coverage

Phase 09 includes tests that verify:

- POS money parsing, MZN formatting, quote capping, earned points, and duplicate-submission keys;
- POS server actions keep identified customer state on validation errors, preserve client idempotency keys, require customer authorization, and route reset intent;
- POS lookup RPC uses `SECURITY DEFINER`, tenant/branch guards, active-card and active-program filters, explicit execute grants, and does not mutate wallets or ledger;
- `/pos` remains stable in protected-route fallback mode.

## Current Business Dashboard Coverage

Phase 10 includes tests that verify:

- dashboard money, percentage, liability, redemption, overview, and retention calculations;
- business dashboard RPC uses `SECURITY DEFINER`, tenant/branch guards, branch-scope requirements, and explicit execute grants;
- the RPC returns liability and retention source fields without mutating wallets, ledger, or transactions;
- manager-scoped campaign and subscription settings remain restricted;
- `/negocio` remains stable in protected-route fallback mode.

## Current Public Marketplace Coverage

Phase 11 includes tests that verify:

- city slugs, point-value labels, and marketplace list/detail canonical paths;
- categories and cities aggregate only indexable public businesses;
- low-value city/category combinations are not generated;
- active offer detail pages require globally unique public slugs;
- marketplace data reads use the public Supabase anon client and public active filters;
- sitemap generation uses the same indexability helpers and excludes protected routes;
- SEO helpers produce canonical metadata, robots directives, OpenGraph, breadcrumbs, item lists, local business, offer, and FAQ structured data;
- `/estabelecimentos` renders a public empty-state fallback when Supabase is not configured.

## Current Public Search Coverage

Phase 12 includes tests that verify:

- shareable search params are parsed safely;
- text, category, city, and active-offer filters work together;
- offers are included in business text search;
- distance ordering uses browser-provided coordinates without persistence;
- open-now filtering only uses public opening-hour data;
- `/pesquisar` is `noindex, follow` with canonical `/pesquisar`;
- sitemap excludes query parameter combinations;
- the branch opening-hours migration keeps missing hours as unknown;
- `/pesquisar` renders a public fallback with filters when Supabase is not configured.

## Current Business Campaign Coverage

Phase 13 includes tests that verify:

- campaign status derivation for draft, scheduled, and active campaigns;
- eligibility presets for first purchase, second purchase, inactive, VIP, and location-compatible segments;
- marketing consent blocks audiences when required;
- rule-based segmentation by city, tier, spend, purchase count, and points balance;
- campaign analytics from materialized audience counts;
- campaign RPCs use `SECURITY DEFINER`, fixed `search_path`, and `can_manage_business`;
- campaign creation materializes audiences without sending notifications or mutating wallets, ledger, or transactions;
- `/negocio/campanhas` renders a protected fallback when Supabase is not configured.

## Current Auth/RBAC Coverage

Phase 05 includes unit tests that verify:

- anonymous users cannot access protected routes;
- customers cannot access business, POS, or admin routes without roles;
- cashier POS access is limited to the assigned business/branch;
- business admins cannot manage business owner privileges;
- support/platform/super admin roles require a verified Supabase Auth `aal2` session;
- authenticated landing routes resolve from the strongest available role.

## Current Notification Coverage

Phase 14 includes tests that verify:

- notification channel validation includes future SMS, WhatsApp, and push providers;
- retry delays are bounded and provider idempotency keys remain stable;
- campaign audience inserts are deduplicated by notification idempotency key;
- email queueing requires marketing consent and an email recipient;
- worker claims use leases and `FOR UPDATE SKIP LOCKED`;
- the claim RPC is service-role only and the cron route requires `CRON_SECRET`;
- customers can mark only their own delivered in-app notifications as read;
- customer dashboard summaries count unread notifications.

## Current Referral Coverage

Phase 15 includes tests that verify:

- pending invitations become effectively expired after their deadline;
- customer and business summaries calculate points and MZN equivalents correctly;
- configurable minimum purchase, validity, open-invite limits, and reward-period limits are persisted per tenant;
- invitation creation and acceptance do not update wallets or insert ledger entries;
- only accepted, unexpired, completed qualifying purchases reward both wallets;
- self-referral, existing-customer, reciprocal-referral, duplicate-card, and limit controls exist;
- purchase RPCs invoke internal reward qualification and refund RPCs reverse both rewards with compensating ledger entries;
- internal reward functions are not executable by anonymous or authenticated API roles;
- `/cliente/indicacoes` and `/negocio/indicacoes` remain stable in protected fallback mode.

## Current Platform Administration Coverage

Phase 16 includes tests that verify:

- platform capability separation between support, platform admin, and super admin;
- privileged role-assignment limits and final-super-admin protection;
- server-only service-role access for administrative reads and mutations;
- row locking and same-transaction audit insertion for every privileged mutation;
- append-only audit history;
- protected admin views across desktop and mobile Playwright projects.

## Current Subscription Coverage

Phase 17 includes tests that verify:

- subscription overview parsing, unlimited limits, labels, and bounded usage ratios;
- plan limits and feature access are persisted in `plan_entitlements`;
- branch, staff, and campaign checks use one per-business advisory transaction lock;
- new-business trials and privileged plan changes create audit records;
- administrative plan RPCs are service-role only and reject capacity below current usage;
- campaign creation reads the authoritative subscription overview;
- `/negocio/subscricao` remains stable in protected fallback mode.

## Current PWA Coverage

Phase 18 includes tests that verify:

- manifest identity, standalone display, theme, and maskable icons;
- root service-worker registration and update behavior;
- public-shell-only caching with network-first navigation;
- absence of private-page caching, background sync, and offline writes;
- versioned card-identification parsing and tenant-scoped QR validation;
- exclusion of balances, MZN values, customer profile fields, and authorizations;
- real browser access to a previously stored identification after network loss.

## Current Operational Foundation Coverage

Phase 26 includes tests that verify:

- every NEW PHAS operational table and state enum exists in a descriptive migration;
- cross-tenant terminal, channel, payment, transaction, offer and customer-card relationships use
  composite foreign keys;
- payment attempts use business-scoped idempotency and remain separate from loyalty operations;
- the foundation migration never updates wallets or inserts ledger entries;
- RLS is enabled on every new private table;
- POS configuration reads validate business and branch access and return sanitized fields;
- browser roles cannot write terminals, channels, payment attempts, invitations, claims or global
  settings;
- invitation token hashes and common provider secret keys are excluded from browser-readable data;
- unconfigured provider methods are disabled in the POS and rejected again by PostgreSQL;
- M-Pesa tests cover MSISDN normalization, RSA API-key encryption, C2B payload shape, ambiguous
  network state, callback authentication, service-role isolation and idempotent reconciliation;
- the protected POS and settings routes pass Playwright on an isolated local test port.

## Priority E2E

Customer:

- signup;
- login;
- join business;
- view card;
- view balance;
- view history.

Cashier:

- login;
- scan customer;
- register purchase;
- redeem points.

Business:

- login;
- create campaign;
- see customer;
- see report.

Admin:

- approve business;
- suspend business;
- review audit.
