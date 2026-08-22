# FASE 08 — Customer Dashboard

## Status

Implemented.

## Scope

- `/cliente` now renders the customer dashboard.
- Dashboard navigation includes Inicio, Cartoes, Explorar, Actividade, and Perfil.
- `features/customer-dashboard/model.ts` summarizes cards and maps transaction activity.
- `features/customer-dashboard/data.ts` loads profile, cards, public offers, and recent transactions through Supabase/RLS.
- `features/customer-dashboard/dashboard.tsx` renders loading, empty, error, and populated dashboard surfaces.
- Customers can maintain their display name, optional telephone number, and marketing preference from Perfil.

## Decisions

- The dashboard remains server-rendered for private customer data.
- Existing customer-card components are reused inside the Cartoes section.
- Public offers are read from the database policy surface; no hard-coded offers are rendered.
- The optional telephone supports customer identification at POS without replacing QR or card validation.
- E2E workers remain serial because `next dev` cold compiles were flaky with parallel navigation.

## Next Integration Points

- FASE 09 POS can resolve identification QR codes produced by the card section.
- Activity can later move from transaction rows to richer ledger history if product needs finer movement detail.
- Explore can later receive filters once marketplace/city/category pages exist.
