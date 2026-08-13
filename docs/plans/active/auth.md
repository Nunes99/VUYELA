# Goal

Implement FASE 05: authentication, authorization, onboarding routes, protected route helpers, and RBAC.

# Context

Phase 04 added RLS policies. The next master-flow phase adds Supabase auth architecture and app-level route authorization before the loyalty engine.

# Scope

- Add Supabase server client helpers for browser-authenticated and service-role server paths.
- Add centralized RBAC rules for customer, business, POS, and platform routes.
- Add protected route state helpers for unauthorized, MFA-required, forbidden, and authorized states.
- Add customer and business onboarding routes.
- Add sign-in, sign-up, password reset, phone OTP, auth callback, and MFA-ready routes.
- Add placeholder protected surfaces for customer, business, POS, and admin areas.
- Add unit tests for unauthorized and cross-role access.
- Document the architecture and quality gates.

# Out Of Scope

- Real Supabase project provisioning.
- Complete MFA challenge provider integration.
- Loyalty engine, POS writes, dashboard data, and card UI.
- Production email/SMS template configuration.
- OAuth providers.

# Architecture

Auth uses `@supabase/ssr` in server-only helpers. RBAC lives in `lib/auth/rbac.ts`, while session and protected-route state live in `lib/auth/session.ts`. UI routes consume central helpers instead of duplicating permission checks.

Privileged platform actions must use service-role server paths and audit logs. The browser never receives service-role credentials.

# Tasks

- [x] Add Supabase server/client helper architecture.
- [x] Add centralized RBAC rules.
- [x] Add protected route helpers.
- [x] Add auth pages and server actions.
- [x] Add customer and business onboarding routes.
- [x] Add protected customer, business, POS, and admin placeholders.
- [x] Add unauthorized and cross-role tests.
- [x] Update architecture, security, QA, and README documentation.
- [x] Run format, lint, typecheck, unit tests, design-system build, build, and E2E.

# Risks

- Client-side checks must not become the security boundary.
- Platform roles must remain MFA-ready and service-role-only for privileged operations.
- Business owner privilege changes must be guarded centrally.
- Local routes must degrade clearly when Supabase env vars are missing.

# Testing

```bash
pnpm format
pnpm lint
pnpm typecheck
pnpm test
pnpm ds:build
pnpm build
pnpm test:e2e
```

# Decisions

- Support email/password and phone OTP architecture now.
- Keep OAuth providers out of this phase.
- Keep MFA as an enforced architecture gate for privileged platform roles, with provider challenge UI deferred.
- Use static protected-route placeholders until dashboard data phases exist.
- Use service-role only inside server actions that create business onboarding records across RLS boundaries.
- Force protected pages to dynamic rendering so session and cookie state are evaluated per request.

# Progress

Completed Phase 05 implementation.

- Added Supabase server-only authenticated and service-role helpers.
- Added centralized RBAC and protected route state helpers.
- Added email/password, phone OTP, password reset, sign-up, auth callback, logout action, and MFA-ready routes.
- Added customer and business onboarding routes.
- Added protected placeholders for customer, business, POS, and admin surfaces.
- Updated homepage CTAs to point to auth/onboarding routes.
- Added `tests/unit/rbac.test.ts` for unauthorized, cross-role, branch-scoped cashier, business owner privilege, MFA, and default landing behavior.
- Forced protected routes to dynamic rendering; the production build now marks `/cliente`, `/negocio`, `/pos`, `/admin`, and onboarding routes as server-rendered on demand.
- Increased Playwright test timeout to match the slower first Next dev load now that the app has more routes.
- Final checks passed: `pnpm format`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm ds:build`, `pnpm build`, and `pnpm test:e2e`.
