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
