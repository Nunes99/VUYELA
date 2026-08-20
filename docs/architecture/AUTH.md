# Auth

## Initial Auth Methods

VUYELA should support:

- phone + OTP;
- email + password.

Prepare architecture for future Google and Apple sign-in without implementing those providers prematurely.

## Account Capabilities

- password reset;
- verification;
- session management;
- device logout;
- TOTP MFA for privileged roles.

## RBAC

Roles are described in `docs/product/USER_ROLES.md`.

Authorization must be enforced server-side and in PostgreSQL policies. Client checks can improve UX but are never the security boundary.

## Phase 05 Implementation

Authentication is wired through server-only Supabase helpers:

- `lib/supabase/server.ts` creates the cookie-aware authenticated Supabase client;
- `lib/supabase/admin.ts` reserves a service-role client for future audited platform operations;
- `features/auth/actions.ts` owns sign-in, sign-up, OTP, password reset, logout, and onboarding mutations.

RBAC is centralized in:

```text
lib/auth/rbac.ts
lib/auth/session.ts
```

Protected routes use server-side route state instead of duplicating permission checks in page components. The current protected surfaces are:

- `/cliente`
- `/negocio`
- `/pos`
- `/admin`
- `/onboarding/cliente`
- `/onboarding/negocio`

## Administrative MFA

Privileged platform roles require a Supabase Auth `aal2` session before `/admin` access:

- `support_agent`
- `platform_admin`
- `super_admin`

`/mfa` supports TOTP enrollment and challenge with an authenticator application. The server derives
the completed state from Supabase Auth's authenticator assurance level instead of mutable profile or
user metadata.

## Environment

Local auth UI degrades to an explicit configuration state when Supabase is not configured. Real auth requires:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
```

Phone OTP is exposed only when `SUPABASE_PHONE_AUTH_ENABLED=true` and an SMS provider is configured
in Supabase Auth. It remains hidden and blocked by the server actions while the provider is absent.

The auth profile trigger creates `public.profiles` rows for newly registered users and backfills
existing Auth users. Business onboarding calls the authenticated
`submit_business_onboarding` RPC, which creates the business, primary branch, owner membership, and
audit record atomically without exposing or requiring a service-role key in the application flow.

Password recovery returns through `/auth/callback` to `/definir-senha`, where the authenticated
recovery session can set the new password. Invalid or expired callback codes return to the login
screen with an explicit error state.
