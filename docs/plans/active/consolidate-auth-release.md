# Consolidate authentication release — 3 November 2026

## Scope

Consolidate the reviewed local changes into one identifiable release: publishable-key
support with legacy fallback, onboarding session refresh, executable regression tests,
isolated deterministic browser tests, live CI configuration and production recovery
documentation. Include the project audit as a dated snapshot. Keep SMTP disabled and
preserve same-browser recovery, as agreed with the owner.

## Execution

- [x] Inspect the working tree, architecture and current deployment baseline.
- [x] Create `codex/consolidate-auth-release` from the existing checkout.
- [x] Review changes and complete public-key configuration in the live CI job.
- [x] Pass lint, typecheck, 337 unit/integration tests and production build.
- [ ] Pass the complete desktop/mobile Playwright suite.
- [x] Review the final staged diff and create the release commit.
- [x] Push the branch and open PR #2.
- [ ] Verify the final PR commit passes CI.
- [ ] Merge the approved change and verify the matching production deployment.

## Release constraints

No database migrations, SMTP setup, provider activation or credential changes.
Authenticated tests remain dependent on dedicated non-production account secrets.
Never report a skipped authenticated suite as an authenticated validation pass.
Use the Git integration for deployment after CI; record the resulting PR, commit and
production deployment identifiers once they exist.

The local production build passed on 3 November 2026. The complete Playwright run
is required before merging; authenticated live tests still need dedicated accounts.

## Validation follow-up

PR: https://github.com/Nunes99/VUYELA/pull/2

The first CI run passed lint, typecheck, all 337 unit/integration tests and the
production build. Browser tests reported 107 passes, four intentional skips and a
tablet-layout failure caused by measuring the sidebar before it became visible.
The test now waits for visibility before measuring, retaining the layout assertions.

The first Windows browser run reported 102 passes, four skips and six timeouts:
four service-worker installation checks and two subsequent referral navigations.
These failures are being checked on a fresh local server; they must not be reported
as passing. The PWA checks passed in the first Linux CI run. No PWA implementation
has been changed to mask the local timeouts.
