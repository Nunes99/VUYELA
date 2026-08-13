# Database

## Direction

Supabase PostgreSQL is the system of record. Schema changes must be implemented through migrations under `supabase/migrations`.

The initial schema and RLS migrations live in:

```text
supabase/migrations/202608130001_initial_schema.sql
supabase/migrations/202608130002_row_level_security.sql
supabase/migrations/202608130003_loyalty_engine_rpc.sql
supabase/migrations/202608130004_pos_card_lookup.sql
supabase/migrations/202608130005_business_dashboard_rpc.sql
```

FASE 03 defines tables, constraints, indexes, and append-only ledger protection. FASE 04 implements Row Level Security policies and static tenant-isolation tests. FASE 06 implements transactional loyalty RPCs. FASE 09 adds the POS card lookup RPC used before transactional writes. FASE 10 adds the read-only business dashboard RPC.

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

Growth and communication:

- `campaigns`
- `campaign_audiences`
- `referrals`
- `notifications`

Monetization and operations:

- `plans`
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

RLS is implemented in `202608130002_row_level_security.sql`.

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

## POS Lookup RPC

`lookup_pos_customer_card` resolves an active card for an authenticated business/branch operator. It accepts a plain card number or the identification QR payload produced by customer cards, validates access with `can_access_transaction`, and returns only the fields needed for the POS quote:

- customer card id;
- customer display name;
- card number;
- available points;
- point value in MZN minor units;
- redemption percentage limit;
- earn rate.

The lookup does not mutate wallets, ledger, or transactions. Balance-changing POS completion continues through `record_purchase_points` and `redeem_purchase_points`.

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
