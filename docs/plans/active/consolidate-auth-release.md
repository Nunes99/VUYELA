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
- [ ] Review the final staged diff and create the release commit.
- [ ] Push the branch, open a PR and verify its exact commit passes CI.
- [ ] Merge the approved change and verify the matching production deployment.

## Release constraints

No database migrations, SMTP setup, provider activation or credential changes.
Authenticated tests remain dependent on dedicated non-production account secrets.
Never report a skipped authenticated suite as an authenticated validation pass.
Use the Git integration for deployment after CI; record the resulting PR, commit and
production deployment identifiers once they exist.

The local production build passed on 3 November 2026. The complete Playwright run
is required before merging; authenticated live tests still need dedicated accounts.
