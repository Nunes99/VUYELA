# FASE 09 — POS

## Status

Implemented.

## Scope

- `/pos` now renders a responsive POS workflow.
- Cashiers identify a customer by QR code, card number, or optional telephone number.
- QR identification supports the device camera and retains a manual fallback.
- Transaction quote calculates points earned, points redeemed, redeemed MZN value, and final MZN amount.
- Customer authorization is required before confirmation.
- Transaction confirmation calls the server-side loyalty RPCs from FASE 06.
- Duplicate submission protection uses pending button disabling and an idempotency key stored as `external_reference`.
- M-Pesa C2B creates a pending sale, sends the payment request server-side, and reconciles the sale only after provider authorization.
- M-Pesa callbacks are authenticated, sanitized, and idempotent; duplicate events cannot duplicate payments or YELAS.

## Decisions

- POS context is loaded server-side from active memberships and active branches.
- Branch-scoped operators must select/pass a branch because `can_access_transaction` requires it.
- Card lookup is a read-only RPC, separate from wallet-changing transaction RPCs.
- The browser receives only the POS view state; wallet and ledger writes stay behind server actions and PostgreSQL RPCs.

## Next Integration Points

- Complete provider-side status-query and reversal operations after the production API package is available in the authenticated M-Pesa portal.
- Surface POS transaction history in the future business dashboard.
