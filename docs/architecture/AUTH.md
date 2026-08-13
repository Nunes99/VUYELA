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
- MFA-ready privileged roles.

## RBAC

Roles are described in `docs/product/USER_ROLES.md`.

Authorization must be enforced server-side and in PostgreSQL policies. Client checks can improve UX but are never the security boundary.

## Phase 05 Implementation

Authentication is wired through server-only Supabase helpers:

- `lib/supabase/server.ts` creates the cookie-aware authenticated Supabase client;
- `lib/supabase/admin.ts` creates the service-role client for privileged server actions only;
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

## MFA-Ready Direction

Privileged platform roles require MFA-ready checks before `/admin` access:

- `support_agent`
- `platform_admin`
- `super_admin`

The provider-specific MFA challenge UI is deferred, but the route guard already treats missing MFA as a blocking state.

## Environment

Local auth UI degrades to an explicit configuration state when Supabase is not configured. Real auth requires:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
```

Business onboarding uses server-side privileged writes and additionally requires:

```text
SUPABASE_SERVICE_ROLE_KEY
```
