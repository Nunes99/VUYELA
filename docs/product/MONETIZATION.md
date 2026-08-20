# Monetization

Subscription plans are configurable database entities, not hard-coded product constants.

Initial reference plan names:

- Teste
- Essencial
- Crescimento
- Profissional
- Empresarial

Reference pricing:

```text
Essencial       1.500 MZN/month
Crescimento     3.500 MZN/month
Profissional    7.500 MZN/month
Enterprise      custom
```

Future revenue streams may include:

- implementation;
- sponsored campaigns;
- corporate programs;
- white-label;
- integrations;
- advanced analytics.

Do not present unavailable functionality as included in pricing pages.

## Phase 17 Implementation

`plans` and `plan_entitlements` are the authoritative plan configuration. The application reads
prices, trial duration, branch/staff/campaign limits, analytics level, and feature flags from the
database. Product code must not duplicate those limits as constants.

New businesses receive the active `Teste` plan automatically. Platform admins can assign an
active plan or update its configuration through audited server-only operations. A lower plan
cannot be assigned when the business already exceeds one of its limits.

Payment collection and gateway callbacks remain out of scope until a payment provider is
configured. Subscription state is currently managed by authorized platform operations.
