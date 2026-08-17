# Business Campaigns Plan

Implemented in FASE 13.

## Scope

- `/negocio/campanhas` protected route.
- Business admin/owner campaign creation.
- Rule-based campaign types and reward configuration.
- Scheduled start/end dates with draft, scheduled, and active status derivation.
- Server-side eligibility calculation.
- Materialized `campaign_audiences`.
- Campaign analytics.
- Consent-aware marketing audience handling.

## Boundaries

- No notification sending in this phase.
- No wallet, ledger, or transaction mutation.
- Branch managers do not create whole-business campaigns.
- Campaign data remains private to the tenant.

## Verification

- Unit tests cover model eligibility, consent, segmentation, and analytics.
- Static integration tests cover SQL/RPC and server-action contracts.
- E2E covers the protected route fallback when Supabase is not configured.
