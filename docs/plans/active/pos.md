# FASE 09 — POS

## Status

Implemented.

## Scope

- `/pos` now renders a responsive POS workflow.
- Cashiers identify a customer card by card number or identification QR payload.
- Transaction quote calculates points earned, points redeemed, redeemed MZN value, and final MZN amount.
- Customer authorization is required before confirmation.
- Transaction confirmation calls the server-side loyalty RPCs from FASE 06.
- Duplicate submission protection uses pending button disabling and an idempotency key stored as `external_reference`.

## Decisions

- POS context is loaded server-side from active memberships and active branches.
- Branch-scoped operators must select/pass a branch because `can_access_transaction` requires it.
- Card lookup is a read-only RPC, separate from wallet-changing transaction RPCs.
- The browser receives only the POS view state; wallet and ledger writes stay behind server actions and PostgreSQL RPCs.

## Next Integration Points

- Replace manual card input with camera scanning once PWA device APIs are added.
- Add receipt/payment metadata after the payments model is wired into POS.
- Surface POS transaction history in the future business dashboard.
