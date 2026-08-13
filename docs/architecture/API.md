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

## Customer Card Reads

FASE 07 reads customer cards server-side from the authenticated Supabase session. The `/cliente` route loads customer-owned `customer_cards`, then resolves business identity, loyalty program configuration, wallet balances, and tiers through RLS-protected queries.

The UI receives a normalized view model rather than raw Supabase rows, keeping card presentation separate from data access.
