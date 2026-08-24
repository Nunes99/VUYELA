# Database

## Direction

Supabase PostgreSQL is the system of record. Schema changes must be implemented through migrations under `supabase/migrations`.

The initial schema and RLS migrations live in:

```text
supabase/migrations/create_vuyela_core_schema.sql
supabase/migrations/enable_tenant_row_level_security.sql
supabase/migrations/create_loyalty_engine_rpcs.sql
supabase/migrations/create_pos_card_lookup_rpc.sql
supabase/migrations/create_business_dashboard_rpc.sql
supabase/migrations/add_branch_opening_hours.sql
supabase/migrations/create_campaign_management.sql
supabase/migrations/ensure_auth_profiles_and_atomic_business_onboarding.sql
supabase/migrations/create_notification_delivery.sql
supabase/migrations/secure_notification_read_updates.sql
supabase/migrations/restrict_notification_read_column.sql
supabase/migrations/implement_referral_programs.sql
supabase/migrations/harden_referral_programs.sql
supabase/migrations/implement_platform_administration.sql
supabase/migrations/harden_platform_administration.sql
supabase/migrations/implement_subscription_entitlements.sql
supabase/migrations/create_operational_flow_foundation.sql
supabase/migrations/secure_operational_flow_foundation.sql
```

FASE 03 defines tables, constraints, indexes, and append-only ledger protection. FASE 04 implements Row Level Security policies and static tenant-isolation tests. FASE 06 implements transactional loyalty RPCs. FASE 09 adds the POS card lookup RPC used before transactional writes. FASE 10 adds the read-only business dashboard RPC.

FASE 11 uses the existing marketplace-safe public policies over active businesses, branches, categories, loyalty programs, and public offers. FASE 12 adds optional public branch opening hours for search. FASE 13 adds campaign rule/audience constraints plus server-side campaign eligibility, creation, audience materialization, and analytics RPCs.

FASE 14 extends `notifications` with campaign ownership, idempotency keys, delivery attempts, retry scheduling, worker leases, provider result fields, and read state.

FASE 15 completes referrals with tenant configuration, one-use invitation codes, purchase qualification, fraud controls, atomic rewards, ledger entries, and refund reversals.

FASE 16 extends business review, support, and fraud records with operational ownership and resolution fields. Platform administration uses service-role-only transactional RPCs for business review, user role changes, support updates, and fraud review. Each privileged mutation locks its target and appends an immutable audit entry in the same transaction. A read-only platform metrics RPC supplies aggregate operational indicators.

FASE 17 adds `plan_entitlements`, configurable trial duration, default trial provisioning, and
database-enforced limits for active branches, active business members, and open campaigns. Limit
checks and plan changes share a per-business advisory transaction lock, preventing concurrent
writes from exceeding configured capacity. `null` limits mean unlimited capacity.

The post-connection auth hardening migration synchronizes `auth.users` with `public.profiles` and
adds the atomic `submit_business_onboarding` RPC so onboarding cannot leave partial business data.

FASE 26 establishes the durable NEW PHAS operational model. It adds the business catalogue, POS
terminals/settings/devices, non-secret payment-channel configuration, payment attempts, team
invitations, customer preferences, offer claims, support messages, non-secret platform settings,
profile account state, and optional date of birth. Composite foreign keys preserve tenant scope.
The accompanying security migration enables RLS, keeps sensitive writes server-side, and exposes
only a sanitized, tenant-checked POS configuration RPC.

## Core Tables

Identity and access preparation:

- `profiles`
- `business_members`

Business and marketplace foundation:

- `business_categories`
- `businesses`
- `branches`
- `offers`

Loyalty configuration:

- `loyalty_programs`
- `loyalty_tiers`

Customer loyalty state:

- `customer_cards`
- `point_wallets`
- `point_ledger`

Transactions:

- `transactions`
- `transaction_payments`
- `payment_attempts`

Operational management:

- `business_catalog_items`
- `pos_terminals`
- `pos_terminal_settings`
- `pos_terminal_devices`
- `business_payment_channels`
- `business_member_invitations`
- `customer_business_preferences`
- `offer_claims`
- `support_ticket_messages`
- `platform_settings`

Growth and communication:

- `campaigns`
- `campaign_audiences`
- `referrals`
- `referral_programs`
- `notifications`

Monetization and operations:

- `plans`
- `plan_entitlements`
- `subscriptions`
- `support_tickets`
- `audit_logs`
- `fraud_events`

## Tenant Model

Every business is a tenant. Private business-owned records carry `business_id` so FASE 04 can enforce RLS policies consistently.

Tables with direct tenant ownership include:

- `branches`
- `business_members`
- `loyalty_programs`
- `customer_cards`
- `point_wallets`
- `transactions`
- `point_ledger`
- `campaigns`
- `offers`
- `subscriptions`
- `audit_logs`

Some operational tables can be nullable for platform-wide records or support contexts, such as `notifications`, `support_tickets`, `audit_logs`, and `fraud_events`.

Tables such as `transaction_payments`, `loyalty_tiers`, and `campaign_audiences` inherit tenant scope through required parent records and foreign keys instead of duplicating every ownership column.

## Wallets and Ledger

Each customer card has one points wallet with operational balance fields:

- `available_balance`
- `pending_balance`
- `lifetime_earned`
- `lifetime_redeemed`
- `lifetime_expired`

`point_ledger` is the authoritative history. Wallet balance fields are operational state for fast reads and must not be treated as the only history.

Normal point history is append-only. The migration adds triggers that reject `UPDATE` and `DELETE` on `point_ledger`; corrections must use compensating entries.

Allowed movement types:

- `earn`
- `bonus`
- `referral`
- `birthday`
- `redeem`
- `expire`
- `reversal`
- `manual_adjustment`
- `refund_reversal`

Earn-like entries must be positive. Redeem and expire entries must be negative. Correction entries can be positive or negative.

## Money

Money is stored as integer minor units using fields ending in `_mzn_minor`.

Examples:

- `gross_amount_mzn_minor`
- `discount_amount_mzn_minor`
- `points_redeemed_value_mzn_minor`
- `net_amount_mzn_minor`
- `monthly_price_mzn_minor`

The first migration constrains transaction math:

```text
net = gross - discounts - points_redeemed_value
```

The default loyalty point value is represented by `loyalty_programs.point_value_mzn_minor = 100`, meaning:

```text
1 point = 1 MZN promotional value
```

## Constraints and Indexes

The initial migration includes:

- slug format checks for public URL entities;
- unique business slugs;
- one primary branch per business;
- one loyalty program per business for the initial product model;
- one customer card per customer per business;
- one wallet per card;
- non-negative wallet and money fields;
- transaction amount math checks;
- unique external transaction references per business when present;
- one active-like subscription per business;
- lookup indexes on tenant, status, date, and FK fields.

## RLS Model

RLS is implemented in `enable_tenant_row_level_security.sql`.

Policy helpers use `SECURITY DEFINER`, fixed `search_path`, and `auth.uid()` to evaluate:

- active business membership;
- business admin/owner management access;
- branch-scoped access for branch managers and cashiers;
- customer card ownership;
- transaction access through card ownership or assigned branch/business access.

The current policy model proves:

- customers cannot access another customer's private wallet;
- business A cannot access business B;
- cashier access is limited to assigned business/branch;
- platform admin access uses privileged server-side paths only.

There is no direct client-side RLS bypass for `support_agent`, `platform_admin`, or `super_admin`. Platform support/admin flows must use audited server-side service-role paths.

Sensitive loyalty writes remain unavailable to browser-authenticated roles:

- `point_wallets` writes;
- `point_ledger` writes;
- `transactions` writes.

FASE 06 transactional RPC functions own those mutations and maintain wallet/ledger consistency.

## Loyalty Engine RPC

The loyalty engine migration adds deterministic calculation helpers and three transactional RPC functions:

- `calculate_loyalty_points`
- `calculate_points_value_mzn_minor`
- `calculate_max_redeemable_points`
- `record_purchase_points`
- `redeem_purchase_points`
- `refund_loyalty_transaction`

`record_purchase_points` and `redeem_purchase_points` require an active loyalty program, an active customer card in the same business, and a matching wallet. They validate access with `can_access_transaction`, optionally validate the supplied `cashier_member_id`, lock the wallet row with `FOR UPDATE`, write the transaction, update the wallet, append ledger entries, and write audit logs.

`refund_loyalty_transaction` locks the transaction and wallet, changes the transaction status to `refunded`, and uses `refund_reversal` ledger entries instead of mutating historical ledger rows.

## Referral RPCs

Referral rules live in `referral_programs`, one configuration per business. The rules control the minimum qualifying purchase, both point rewards, invite validity, open-invite limit, and reward count per configurable period.

`create_customer_referral` and `accept_customer_referral` validate card ownership and eligibility but never change a wallet or insert ledger entries. `apply_qualifying_referral_reward` is internal to the purchase RPC wrappers and rewards only an accepted, unexpired referral after the first qualifying completed purchase. Both wallets are locked, updated, and represented by separate positive `referral` ledger entries.

Self-referrals, existing customers, reciprocal referrals, expired invitations, duplicate referred cards, and exceeded limits are blocked. Relevant attempts are recorded in `fraud_events`.

`refund_loyalty_transaction` now wraps the original loyalty refund and calls `reverse_qualifying_referral_reward`. Both referral rewards are removed through negative `refund_reversal` entries; historical referral ledger rows remain immutable.

## POS Lookup RPC

`lookup_pos_customer` resolves an active card for an authenticated business/branch operator. It accepts an explicit `qr`, `card`, or `phone` lookup method, validates access with `can_access_transaction`, and returns only the fields needed for the POS quote:

- customer card id;
- customer display name;
- card number;
- available points;
- point value in MZN minor units;
- redemption percentage limit;
- earn rate.

The lookup does not mutate wallets, ledger, or transactions. Balance-changing POS completion continues through `record_purchase_points` and `redeem_purchase_points`.

Digital cards encode the public card number as a compact QR payload so the modules remain
readable at mobile-card size. The POS normalizes that payload to a tenant-scoped card lookup and
continues to accept the legacy `VUYELA:CARD:<business-id>:<card-number>` payload.

## Business Dashboard RPC

`get_business_dashboard` is a read-only reporting boundary for `/negocio`.

It returns JSON sections for:

- business and selected scope;
- loyalty program settings;
- customers and current point liability;
- completed transactions in the reporting window;
- campaigns and active-offer count for manager-scoped users;
- branch performance;
- active employees;
- operational settings/status.

The RPC validates whole-business management access with `can_manage_business` and branch reporting access with `can_access_branch`. Branch managers must provide a branch id. It does not mutate `point_wallets`, `point_ledger`, or `transactions`.

## Public Marketplace Reads

Marketplace SEO pages read the public tables already prepared by the initial schema and RLS policies:

- `business_categories`;
- `businesses`;
- `branches`;
- `loyalty_programs`;
- `offers`.

The application only renders establishments that have meaningful public content: active business status, description, category, active loyalty program, and at least one active branch. Offer detail pages are only generated when an active public offer slug is unique across the marketplace, because the database enforces offer slug uniqueness per business rather than globally.

## Branch Opening Hours

FASE 12 adds optional public opening-hour fields to `branches`:

- `opening_hours jsonb not null default '{}'`;
- `timezone text not null default 'Africa/Maputo'`.

`opening_hours` is a weekly object keyed by weekday with periods such as:

```json
{
  "monday": [{ "open": "08:00", "close": "18:00" }]
}
```

An empty object means the open status is unknown. Public search filters by open-now only when at least one branch has valid opening-hour data.

## Campaign RPCs

FASE 13 adds private business campaign functions:

- `calculate_campaign_eligibility`
- `create_campaign_with_audience`
- `get_business_campaigns`

The functions are `SECURITY DEFINER`, use fixed `search_path`, and require `can_manage_business(p_business_id)`. Eligibility reads active customer cards, wallets, completed transactions, derived tiers, recent branch city, and profile marketing consent. Campaign creation inserts the campaign and materializes eligible `campaign_audiences` rows.

The campaign functions do not update `point_wallets`, insert `point_ledger`, insert `transactions`, or send `notifications`.

## Notification Delivery

FASE 14 uses `notifications` as a durable delivery queue and recipient inbox.

The campaign-audience insert trigger creates at most one row for each campaign, customer card, and channel. A partial unique index over `idempotency_key` prevents duplicate rows. Email recipients are checked again for both an address and marketing consent before queueing.

`claim_notification_deliveries` is executable only by `service_role`. It claims due rows with `FOR UPDATE SKIP LOCKED`, increments the attempt count, and stores a short lease token. Stale leases can be reclaimed after five minutes.

`mark_notification_read` is a `SECURITY INVOKER` function available to authenticated recipients. A column-level grant permits updates only to `read_at`, while a dedicated UPDATE policy limits rows to delivered in-app notifications owned by the current profile or customer card. Existing notification SELECT RLS continues to isolate recipients and business managers.
