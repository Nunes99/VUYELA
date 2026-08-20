# Testing

## Tooling

- Vitest for unit tests.
- React Testing Library for component behavior.
- Playwright for end-to-end flows and responsive visual checks.
- Supabase/PostgreSQL tests for migrations, RLS, and transactional loyalty behavior.
- Static migration tests for schema, RLS, and RPC invariants until a runnable local Supabase/PostgreSQL test harness is available.

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
