# FASE 06 — Loyalty Engine

## Status

Implemented.

## Scope

- Pure TypeScript calculation helpers live in `lib/loyalty/engine.ts`.
- Transactional PostgreSQL RPCs live in `supabase/migrations/create_loyalty_engine_rpcs.sql`.
- Unit tests cover point value, earning, rounding, redemption caps, and invalid inputs.
- Static integration tests cover the RPC contract until a runnable Supabase test harness is available.

## Decisions

- Money remains in integer MZN minor units.
- Fractional earned points are rounded down.
- Default promotional value remains `1 point = 1 MZN`, represented as `100` MZN minor units.
- Wallet rows are locked with `FOR UPDATE` before redemption/refund balance changes.
- Ledger history remains append-only; refunds use `refund_reversal` entries.
- Browser-authenticated roles still do not receive direct table-write privileges for `point_wallets`, `point_ledger`, or `transactions`.

## Next Integration Points

- POS purchase flow should call `record_purchase_points` and `redeem_purchase_points`.
- Customer card/dashboard flows should read wallet and ledger state only.
- Refund/cancellation UI should call `refund_loyalty_transaction` through a server-side action or route handler.
