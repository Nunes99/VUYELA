# API

## Direction

Use server components, route handlers, and server-side libraries for data access. Public read-only pages can fetch data server-side for SEO. Sensitive mutations should use server-side functions and PostgreSQL transactions.

## Rules

- Do not call privileged Supabase operations from browser code.
- Keep loyalty business logic outside presentation components.
- Prefer typed request/response boundaries.
- Mutations that change balances must be idempotent or protected against duplicate submission.
- Return safe error messages to clients and log structured internal context server-side.

## Loyalty RPC

FASE 06 adds PostgreSQL RPCs for atomic loyalty writes:

- `record_purchase_points`
- `redeem_purchase_points`
- `refund_loyalty_transaction`

These functions validate tenant/branch access with the RLS helper functions, lock wallet rows with `FOR UPDATE`, update wallet operational balances, append `point_ledger` entries, and write audit logs in one transaction.

Future application routes for POS, customer cards, and dashboards must call these server-side boundaries instead of directly mutating `point_wallets`, `point_ledger`, or `transactions`.

## POS Flow

FASE 09 adds the POS application boundary:

- `lookup_pos_customer_card`: resolves a card number or identification QR payload for a business/branch context after `can_access_transaction` validation.
- `features/pos/actions.ts`: server actions for identify, quote, and confirm.
- `/pos`: protected UI for cashier, branch manager, business admin, and business owner roles.

The quote step uses pure loyalty helpers and never writes wallet state. The confirm step requires customer authorization, sends an idempotency key as `external_reference`, and calls either `record_purchase_points` or `redeem_purchase_points` server-side.

## Customer Card Reads

FASE 07 reads customer cards server-side from the authenticated Supabase session. The `/cliente` route loads customer-owned `customer_cards`, then resolves business identity, loyalty program configuration, wallet balances, and tiers through RLS-protected queries.

The UI receives a normalized view model rather than raw Supabase rows, keeping card presentation separate from data access.

## Customer Dashboard Reads

FASE 08 extends `/cliente` into a mobile-first dashboard. It combines customer cards, profile summary, recent transactions, and public active offers through server-side Supabase queries.

Dashboard data is normalized in `features/customer-dashboard` before presentation. The browser receives rendered HTML instead of direct private-table fetches.

## Business Dashboard Reads

FASE 10 adds the `/negocio` dashboard and a read-only PostgreSQL RPC:

- `get_business_dashboard`: returns scoped business, program, customer, transaction, campaign, branch, employee, settings, liability, and retention source data.
- `features/business-dashboard/data.ts`: loads selectable business/branch context through the authenticated Supabase session and calls the RPC.
- `features/business-dashboard/model.ts`: derives overview, liability, redemption, retention, and report metrics outside presentation components.

The RPC validates `can_manage_business` and `can_access_branch`. Branch managers must pass a branch scope; business admins and owners may view whole-business or branch-scoped metrics.

## Business Campaign Management

FASE 13 adds `/negocio/campanhas` for business admins and owners.

The feature uses server-side actions and PostgreSQL RPCs:

- `get_business_campaigns`: returns private campaign rows and aggregate analytics for one manageable business;
- `calculate_campaign_eligibility`: evaluates rule-based segments from customer cards, wallets, completed transactions, tiers, recent branch city, and marketing consent;
- `create_campaign_with_audience`: validates rules, derives draft/scheduled/active status, inserts a campaign, and materializes eligible audience rows.

Campaign actions do not send notifications. Planned marketing channels require consent-aware eligibility so FASE 14 notification delivery has a safe audience boundary.

## Public Marketplace Reads

FASE 11 adds server-rendered public discovery pages backed by read-only Supabase anon queries through `lib/supabase/public.ts`.

The marketplace data boundary in `features/public-marketplace/data.ts` reads only marketplace-safe public tables:

- active `businesses`;
- active `business_categories`;
- active `branches`;
- active `loyalty_programs`;
- active public `offers`.

The model layer builds indexable snapshots for establishments, business detail pages, categories, cities, city/category combinations, active offers, canonical paths, and sitemap entries. No public marketplace route mutates loyalty state or reads private customer, wallet, transaction, membership, campaign audience, subscription, audit, or employee-only data.

## Public Search Reads

FASE 12 adds `/pesquisar` on top of the same public marketplace snapshot.

Search supports:

- text over business, branch, category, and offer content;
- category and city filters;
- active-offer filtering;
- location ordering when the browser supplies coordinates;
- open-now filtering only for branches with public `opening_hours`.

Search query URLs are shareable but use `noindex, follow` and canonical `/pesquisar` so arbitrary filter combinations do not become crawlable pages. Filters with SEO value link back to canonical marketplace pages.
