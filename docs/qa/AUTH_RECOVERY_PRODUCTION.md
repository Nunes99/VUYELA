# Production password recovery URL correction

## Confirmed diagnosis

On 2026-10-20, unauthenticated checks returned:

| URL                                                  | Result                                                                                     |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `https://vuyela-vuyela-moz.vercel.app/definir-senha` | HTTP 302 to `https://vercel.com/sso-api`, with `Protected by Vercel Authentication`        |
| `https://vuyela-seven.vercel.app/definir-senha`      | HTTP 200, title `Definir nova palavra-passe \| VUYELA`, password confirmation form present |

The public domain is also the production health-monitor default in `.github/workflows/health-monitor.yml`.
The protected domain blocks visitors before Next.js middleware or the password page can run.
Local callback changes cannot remove this deployment-level authentication barrier.

## Apply with the project owner's account

1. In the VUYELA Vercel project, set the production environment variable:

   ```text
   NEXT_PUBLIC_SITE_URL=https://vuyela-seven.vercel.app
   ```

   Create a new production deployment so the environment variable takes effect.

2. Open [Supabase URL Configuration](https://supabase.com/dashboard/project/ytumxecywfxpwlisgvee/auth/url-configuration).
   Set **Site URL** to:

   ```text
   https://vuyela-seven.vercel.app
   ```

3. Add these **Redirect URLs**, preserving other intentional environments:

   ```text
   https://vuyela-seven.vercel.app/auth/callback
   https://vuyela-seven.vercel.app/auth/callback?**
   ```

4. In [Supabase Emails](https://supabase.com/dashboard/project/ytumxecywfxpwlisgvee/auth/templates),
   verify the Reset Password template uses the recovery callback rather than a fixed protected hostname.
   The versioned template is `supabase/templates/recovery.html`; it expects the application's
   `.RedirectTo` to contain `/auth/callback?type=recovery&next=...`.

5. Request a **new** recovery email from
   [the public recovery page](https://vuyela-seven.vercel.app/recuperar-acesso).
   Existing emails retain their old destination. Do not copy recovery tokens into issues or logs.

6. Verify the new email reaches the public `/auth/callback` and then `/definir-senha` without asking
   the customer to sign in to Vercel. The account owner completes the password change and verifies login.

Do not distribute a Vercel protection-bypass secret in recovery links or disable preview protection
to work around a wrong hostname. Customer recovery must use the public production domain.

## Historical access limitation

The connected Vercel account/team (`Nunes99`) returned no VUYELA project. The browser's Supabase
session explicitly reported that it did not have access to project `ytumxecywfxpwlisgvee`.
The production configuration above had therefore not been applied at that point.

## Applied configuration — 3 November 2026

Using the authenticated Supabase and Vercel dashboards, confirmed ownership of
project `ytumxecywfxpwlisgvee` and Vercel project `vuyela-moz/vuyela`.

- Changed Supabase Site URL from `https://vuyela-vuyela-moz.vercel.app/` to
  `https://vuyela-seven.vercel.app`; the dashboard confirmed the save.
- Added `https://vuyela-seven.vercel.app/auth/callback` and
  `https://vuyela-seven.vercel.app/auth/callback?**` to the redirect allow list.
  Preserved the four existing entries.
- Verified Vercel `NEXT_PUBLIC_SITE_URL` for Production and Preview is already
  `https://vuyela-seven.vercel.app`, so no variable change or redeployment was needed.
- Verified Vercel `NEXT_PUBLIC_SUPABASE_URL` for Production and Preview is
  `https://ytumxecywfxpwlisgvee.supabase.co`; public and server-side key variables
  are present. Secret values were not revealed or changed.
- Confirmed production is Ready and its assigned public domain is
  `vuyela-seven.vercel.app`. Unauthenticated requests returned HTTP 200 for
  `/recuperar-acesso`, `/definir-senha` and `/api/health`. A callback without a token
  correctly redirected to `/entrar?erro=link-invalido`.
- Hosted Reset Password uses the default `{{ .ConfirmationURL }}` template. Custom
  SMTP is disabled; the dashboard requires custom SMTP or Pro for template editing.
  The local custom template was not uploaded. The default confirmation link can use
  the newly authorized recovery callback supplied by the application.
- A real recovery email and password change still require a designated test account.
  Existing emails retain the previous destination; request a new email after this fix.

No application source, database schema, credentials, deployment protection or
production deployment was changed during this configuration correction.

## Live recovery test and browser requirement

The account owner authorized one recovery request from the agent-controlled Edge
session. Supabase Auth recorded `user_recovery_requested` and HTTP 200 for `/recover`,
with the correct public callback and `/definir-senha` destination. The owner confirmed
email receipt but reported arriving at login when opening the link.

The deployed SSR flow uses PKCE. Its verifier is stored in the browser that starts
the request, so an agent-initiated email cannot validate a recovery flow opened in a
different browser or device. Repeat the test with the owner initiating the request
and opening the newest email in that same browser/profile. The login symptom alone
does not establish the precise callback error; do not record this as a successful
end-to-end recovery test.

Cross-browser recovery requires the custom `token_hash` template already versioned
in this repository. Hosting it currently requires custom SMTP or an eligible Supabase
plan. SMTP credentials are not available locally; this remains a separate setup step.

The owner subsequently initiated a new request and confirmed recovery works in the
same browser/device. They explicitly chose to keep this flow and defer SMTP setup
and cross-browser recovery. The default service's small project-wide email quota
remains applicable; a quota error does not invalidate the callback correction.
