# FASE 07 — Customer Card

## Status

Implemented.

## Scope

- `/cliente` now renders the customer digital-card experience instead of a placeholder.
- `features/customer-cards/model.ts` builds a safe view model for digital cards.
- `features/customer-cards/data.ts` loads authenticated customer card state through Supabase and RLS.
- `features/customer-cards/card-list.tsx` presents cards with QR, balance, MZN equivalent, tier, and expiry details.
- `app/cliente/loading.tsx` provides the loading state.

## Decisions

- The route remains a Server Component path so private card data is not fetched in the browser.
- Identification QR contains card/business identity only, never wallet balances or MZN values.
- Missing related wallet/program/business rows result in empty/error states rather than demo data.
- Mobile layout collapses to one column and constrains QR/card content for 320-375px screens.

## Next Integration Points

- FASE 08 can add customer dashboard navigation around this card list.
- POS flows can use the identification QR to resolve the card server-side.
- Ledger history can be added as a separate customer activity section without changing the card model.
