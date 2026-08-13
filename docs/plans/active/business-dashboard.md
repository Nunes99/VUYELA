# FASE 10 — Business Dashboard

## Status

Implemented.

## Scope

- `/negocio` now renders a business dashboard instead of a placeholder.
- Sections include overview, customers, transactions, points, campaigns, program, branches, employees, reports, and settings.
- Metrics include revenue, transaction count, customer count, average ticket, available points, promotional liability, redemption rate, and retention.
- Branch managers receive branch-scoped reporting. Business admins and owners can view whole-business or branch-scoped metrics.

## Decisions

- Reporting data is served by `get_business_dashboard`, a read-only PostgreSQL RPC with server-side permission checks.
- The UI is server-rendered from normalized view models; browser code does not query or mutate private business tables.
- Campaigns, offers, subscriptions, and whole-business employee visibility remain manager-scoped.
- This phase is read-only. Mutation workflows for campaigns, employees, settings, and reports belong to later phases.

## Next Integration Points

- Add campaign creation and lifecycle actions in the campaigns phase.
- Add richer charts once analytics/event instrumentation exists.
- Add CSV/PDF report exports after export/audit requirements are defined.
