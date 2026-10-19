# Password recovery correction

- Confirmed: the reported Supabase recovery email uses the production origin as `redirect_to`, losing the password update path.
- Forward root PKCE callbacks to `/auth/callback` and then `/definir-senha`.
- Support recovery token hashes and provide a Portuguese email template for cross-browser recovery.
- Preserve portal destinations and reject external callback redirects.
- Align local allowed redirects and document required hosted Supabase settings.
- Validate lint, types, unit/integration tests, recovery Playwright flows and production build; record any environment blockers.

## Validation

- Lint passed with two existing unused-variable warnings in `tests/unit/mpesa-provider.test.ts`.
- Typecheck and production build passed. The homepage remains statically generated.
- Unit/integration suite: 303 passed, 5 failed. All 9 new callback tests passed, as did the auth database contract.
- The 5 failures are existing LF/CRLF-sensitive source comparisons in operational foundation security, platform operations, auth navigation performance and business settings contracts; the source files involved were not modified.
- Recovery Playwright suite: all 12 tests passed across desktop Chromium and mobile Chrome after installing the required browser. This covers root callback forwarding, the recovery forms, portal destinations and invalid callback errors.
- Hosted Supabase settings and email delivery have not been changed or verified. Deployment remains required for the online site.
