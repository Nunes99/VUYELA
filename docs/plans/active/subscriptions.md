# Fase 17 - Sistema de subscricoes

## Scope

- Configurable reference plans: Teste, Essencial, Crescimento, Profissional, and Empresarial.
- Database-owned prices, trials, capacity limits, analytics levels, and feature flags.
- Automatic default trial for every new business.
- Business subscription and usage view under `/negocio/subscricao`.
- Campaign-capacity feedback in `/negocio/campanhas`.
- Audited platform plan assignment and entitlement management.
- Public pricing catalogue rendered from active public plans.

Payment gateway collection is deliberately excluded until a provider is configured.

## Security Decisions

- PostgreSQL triggers are authoritative for active branch, active staff, and open campaign limits.
- Counted writes and plan changes serialize on a per-business advisory transaction lock.
- Plan assignment rejects a target plan below current business usage.
- Business overview access requires `can_manage_business`.
- Administrative mutation RPCs are granted only to `service_role` and validate the recorded actor.
- Automatic trials and every administrative change append an immutable audit record.

## Verification

- Unit tests cover parsing, labels, unlimited limits, and usage ratios.
- Integration tests cover schema configuration, locks, triggers, privileges, and audit boundaries.
- Playwright covers the protected subscription route on desktop and mobile projects.
- Supabase migration verification checks plans, entitlements, functions, triggers, and grants.
