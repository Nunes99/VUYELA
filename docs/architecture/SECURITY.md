# Security

## Core Requirements

- Respect Row Level Security.
- Never expose Supabase service-role credentials to the browser.
- Validate tenant ownership for every multi-tenant query.
- Use server-side operations for sensitive loyalty writes.
- Use database transactions for balance-changing operations.
- Record audit logs for privileged or sensitive operations.

## Implemented RLS Direction

The Phase 04 RLS migration enables Row Level Security on private tables and adds policies for:

- customer access to the customer's own profile, cards, wallets, ledger, transactions, notifications, referrals, and support tickets;
- business admin/owner access to records in their own business tenant;
- branch manager and cashier read access scoped to assigned branch transaction paths;
- public anonymous access only to active marketplace-safe records such as active businesses, branches, loyalty programs, offers, categories, and plans.

Platform roles such as support agent, platform admin, and super admin do not receive direct client-side policy bypasses. They must use server-side service-role paths with audit logging.

Browser-authenticated roles cannot directly write point wallets, point ledger, or transactions. FASE 06 adds server-side transactional RPC functions for those writes.

## Auth and Authorization

Phase 05 centralizes RBAC in `lib/auth/rbac.ts` and protected route evaluation in `lib/auth/session.ts`.

The app tests and enforces:

- anonymous users cannot access protected routes;
- customers cannot access business, POS, or admin areas unless they also hold an active business/platform role;
- cashiers are scoped to assigned branch access;
- business admins cannot grant or remove business owner privileges;
- platform roles require MFA-ready checks before admin route access.

Service-role access is isolated to server-only helpers and must be paired with audit logs for privileged writes.

## Loyalty Write Boundary

The loyalty RPCs validate tenant and branch access before mutating balances. They use `SECURITY DEFINER` with a fixed `search_path`, reuse `can_access_transaction`, lock wallet rows with `FOR UPDATE`, and append ledger entries in the same transaction as wallet updates.

The current sensitive write RPCs are:

- `record_purchase_points`
- `redeem_purchase_points`
- `refund_loyalty_transaction`

## Test Areas

Security tests must cover:

- tenant isolation;
- admin access;
- service-role usage;
- wallet manipulation;
- duplicate redemption;
- QR expiration;
- QR replay;
- race conditions;
- transaction amount tampering;
- `business_id` tampering;
- privilege escalation.

## Audit Log

Audit sensitive operations such as manual points adjustment, refunds, cancellation, loyalty rule changes, permission changes, account suspension, subscription changes, and data exports.

Audit entries should include actor, action, entity, before/after where appropriate, timestamp, IP, and context.
