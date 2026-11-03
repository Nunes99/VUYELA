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

## Protected onboarding session refresh — 3 November 2026

- Added `/onboarding/cliente` to the middleware matcher so refreshed Auth cookies reach
  both the browser and Server Components before onboarding authorization runs.
- Added seven executable middleware tests covering onboarding, public portal login
  routes, stale chunked-cookie expiration, private caching and unauthenticated redirects.
- Verified project `ytumxecywfxpwlisgvee` matches `.env.local`. PowerShell requests
  returned HTTP 200 for Auth settings and a zero-row profiles query: email Auth and
  email confirmation are enabled, while phone Auth is disabled.
- Node requests failed DNS resolution and the CLI login code exchange failed with a
  transport error, although PowerShell could reach both project and management APIs.
  CLI login and linking remain pending; no hosted Auth settings were changed.
- Validation passed: lint, typecheck, 330 existing unit/integration tests, seven new
  middleware tests, production build, and 21 desktop/mobile Auth Playwright tests
  (one desktop case intentionally skipped because it only applies to mobile).

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

## Auth configuration compatibility — November 2026

Existing Auth and RBAC remain the implementation baseline. Accept the modern
`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` throughout browser/server clients and middleware,
with the legacy anon key as fallback. Keep deterministic Playwright configuration
isolated from both public keys. Verify configuration precedence and absence of a
privileged-key fallback, then run lint, typecheck, unit/integration tests, relevant
Playwright tests and production build. Hosted settings and live sign-in require a
connected Supabase project and dedicated test credentials. The supplied project URL and
publishable key are configured in ignored `.env.local`. A live read-only Auth settings
request confirmed email Auth and email confirmation are enabled, with phone Auth disabled.
A zero-row profiles REST query returned HTTP 200. Dedicated test account credentials
remain unavailable, so live authenticated portal isolation is not yet verified.

Validation: lint and typecheck passed; 72 unit/integration files passed (330 tests);
production build passed outside the sandbox after sandbox EPERM directory failures;
all 16 relevant desktop/mobile Auth Playwright checks passed outside the sandbox.
The deterministic browser suite intentionally runs without Supabase credentials.
