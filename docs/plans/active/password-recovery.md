# Password recovery correction

- Confirmed: the reported Supabase recovery email uses the production origin as `redirect_to`, losing the password update path.
- Forward root PKCE callbacks to `/auth/callback` and then `/definir-senha`.
- Support recovery token hashes and provide a Portuguese email template for cross-browser recovery.
- Preserve portal destinations and reject external callback redirects.
- Align local allowed redirects and document required hosted Supabase settings.
- Validate lint, types, unit/integration tests, recovery Playwright flows and production build; record any environment blockers.

## Validation

The results below describe the initial callback fix; see the follow-up audit for current checks.

- Lint passed with two existing unused-variable warnings in `tests/unit/mpesa-provider.test.ts`.
- Typecheck and production build passed. The homepage remains statically generated.
- Unit/integration suite: 303 passed, 5 failed. All 9 new callback tests passed, as did the auth database contract.
- The 5 failures are existing LF/CRLF-sensitive source comparisons in operational foundation security, platform operations, auth navigation performance and business settings contracts; the source files involved were not modified.
- Recovery Playwright suite: all 12 tests passed across desktop Chromium and mobile Chrome after installing the required browser. This covers root callback forwarding, the recovery forms, portal destinations and invalid callback errors.
- Hosted Supabase settings and email delivery have not been changed or verified. Deployment remains required for the online site.

## Follow-up audit: recovery email sending

- The send action hid all provider failures behind one message and did not log error codes.
- Add safe code/status logs, Portuguese corrective errors, server-side address validation and transport exception handling.
- Test the request action with provider success, quotas, SMTP restrictions and network errors.
- Document that application notification credentials do not configure hosted Auth SMTP.
- Normalize LF/CRLF in the four failing source-contract tests without weakening their assertions; fix the unused mock argument warnings.
- Repeat lint, typecheck, unit/integration suite, relevant Playwright flows and production build.
- Also reject backslashes and whitespace in shared post-login destinations, which browsers may normalize into external URLs; cover the login action with regression tests.
- Production log inspection was denied by the Supabase connector. The exact hosted send failure remains unconfirmed; no production configuration or emails have been changed.

## Follow-up validation results

- Lint passed without warnings; application and design-system typechecks passed.
- All 327 unit/integration tests passed across 72 files, including 14 recovery request cases and 5 post-login redirect regressions.
- Production build passed. Build and standalone typecheck were run sequentially for the final check because Next.js regenerates `.next/types` during builds.
- All 14 recovery Playwright tests passed on desktop and mobile, including form submission and honest failure messaging when Auth is unconfigured.
- Reviewed the final diff and passed `git diff --check`. Changes remain local; the real production email send is still unverified because hosted logs/settings are unavailable to this session.
