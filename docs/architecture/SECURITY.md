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

Browser-authenticated roles cannot directly write point wallets, point ledger, or transactions. Those writes belong in future server-side transactional RPC functions.

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
