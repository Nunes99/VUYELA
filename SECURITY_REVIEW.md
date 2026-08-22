# VUYELA Security Review

Date: 2026-08-22

Scope: Next.js application, Supabase/PostgreSQL schema and RLS, authentication, platform administration, loyalty RPCs, POS, referrals, notifications, public SEO pages and deployment-facing configuration.

## Executive summary

No critical finding remains open. Two high-severity findings were identified and fixed during this review. The production database has RLS enabled on every table in the exposed `public` schema, wallet mutations remain transactional and append ledger entries, tenant relationships use composite constraints, and privileged platform operations remain behind server-only service-role clients plus audited RPCs.

Residual work consists of defence-in-depth improvements: cryptographic customer confirmation for redemptions, application-level abuse controls, enabling leaked-password protection, and reducing the number of intentionally exposed `SECURITY DEFINER` helpers.

## Method

- Reviewed authentication, RBAC, MFA and server-action boundaries.
- Inspected every public table, RLS status, policy family and client grant.
- Inspected `SECURITY DEFINER` functions, execution roles and fixed search paths.
- Traced purchase, redemption, refund, referral and notification flows.
- Checked IDOR, tenant crossing, role escalation, replay, XSS, CSRF, secrets and logs.
- Ran the Supabase Security Advisor and a production privilege query.
- Scanned tracked source files for embedded credentials.
- Audited production dependencies against the npm advisory database.

## Findings

### VUY-SEC-001 - Legal business data readable through the Data API

- Severity: High
- Status: Fixed and verified in production
- Area: Multi-tenant privacy / least privilege
- Evidence: `businesses_public_select` intentionally exposes active businesses, but table-level `SELECT` grants also made `owner_profile_id`, `legal_name` and `nuit` queryable by `anon` and `authenticated` clients.
- Remediation: `restrict_business_sensitive_columns.sql` replaces table-wide access with an explicit public column allow-list. Audited service-role administration retains access.
- Verification: `has_column_privilege` is true for `name` and false for all three sensitive columns for both client roles.

### VUY-SEC-002 - Stored XSS through unescaped JSON-LD

- Severity: High
- Status: Fixed
- Area: XSS / public marketplace
- Evidence: Public pages inserted structured data with `dangerouslySetInnerHTML` and plain `JSON.stringify`. A managed business value containing `</script>` could escape the JSON-LD element.
- Remediation: All JSON-LD now uses `serializeJsonLd`, which escapes HTML-significant characters and JavaScript line separators while preserving valid JSON.
- Verification: Unit coverage includes a closing-script attack payload and a repository scan confirms both raw JSON-LD insertion points use the safe serializer.

### VUY-SEC-003 - No cryptographic customer approval for point redemption

- Severity: Medium
- Status: Open
- Area: QR replay / redemption authorization
- Evidence: The customer QR is a static card identifier and the POS records customer authorization as a cashier checkbox. A copied QR can identify the same card again.
- Existing controls: QR lookup and balance-changing RPCs are tenant and branch scoped; callers must be active staff; wallets are row locked; redemption limits are recalculated in PostgreSQL; transaction references are unique per business.
- Remediation: Add a short-lived, single-use customer approval token bound to business, card, amount, points, nonce and expiry. Consume it atomically in the redemption transaction. The static QR should remain identification-only.

### VUY-SEC-004 - Sensitive application RPCs lack an explicit abuse budget

- Severity: Medium
- Status: Open
- Area: API abuse / rate limiting
- Evidence: Auth endpoints inherit Supabase limits, but POS lookup, referral acceptance and other application RPCs do not have a VUYELA-specific request budget.
- Existing controls: Authentication is mandatory, tenant checks execute inside each RPC, and unique constraints prevent duplicate balance movements.
- Remediation: Add per-user and per-business limits at the Vercel Firewall or a durable database/Redis limiter. Prioritise POS lookup, referral acceptance and notification worker invocation, and alert on repeated denials.

### VUY-SEC-005 - Leaked-password protection is disabled

- Severity: Medium
- Status: Open
- Area: Authentication
- Evidence: The production Supabase Security Advisor reports `auth_leaked_password_protection`.
- Remediation: Enable leaked-password protection in Supabase Auth and rerun the Security Advisor.

### VUY-SEC-006 - Broad set of authenticated `SECURITY DEFINER` RPCs

- Severity: Low
- Status: Accepted with follow-up
- Area: Privilege surface
- Evidence: The Supabase Security Advisor reports 27 authenticated `SECURITY DEFINER` functions. The reviewed application RPCs validate `auth.uid()` and tenant ownership internally; RLS helper functions require authenticated execution because policies call them. Internal trigger and administration functions are restricted to `service_role`.
- Remediation: Move non-API helpers to a non-exposed private schema, prefer `SECURITY INVOKER` where RLS recursion does not require a definer, use an empty search path with fully qualified names, and keep explicit `REVOKE`/`GRANT` statements beside every function.

### VUY-SEC-007 - Missing browser hardening headers

- Severity: Medium
- Status: Fixed
- Area: Browser security / clickjacking
- Evidence: The application previously disabled the framework identification header but set no CSP, HSTS, framing, MIME-sniffing, referrer or permissions policy.
- Remediation: Global response headers now include CSP, HSTS, `frame-ancestors 'none'`, `X-Frame-Options: DENY`, `nosniff`, a strict referrer policy, COOP and a constrained permissions policy.
- Follow-up: Replace CSP `unsafe-inline` with nonce-based scripts when the Next.js deployment path supports it consistently.

## Areas reviewed without an open high finding

- RLS: enabled on all 24 public tables inspected; private rows require owner or business scope.
- IDOR: admin targets are validated by capability-gated server actions and audited service-role RPCs; tenant RPCs re-check ownership in PostgreSQL.
- Wallet manipulation: client roles have no direct wallet, ledger or transaction write grants.
- Double redemption: wallet rows are locked, balances cannot become negative, and business transaction references are unique.
- Role escalation: profile role is excluded from client update grants; platform role changes require AAL2, capability checks, service role and audit entries.
- Service-role leakage: the privileged client is `server-only`; no tracked credential value was found.
- CSRF: mutations use Next.js Server Actions with same-origin protections; the cron route requires a bearer secret.
- Sensitive logs: reviewed logs contain operation names and bounded error codes, not tokens, passwords or personal records.
- Notification HTML: campaign-controlled values are escaped before email HTML rendering.
- Dependencies: no known production dependency vulnerability was reported by `pnpm audit --prod` on 2026-08-22.

## Release decision

Approved for the next development phase with the two high findings fixed. VUY-SEC-003 through VUY-SEC-006 remain tracked defence-in-depth work and should be completed before broad public or high-volume rollout.
