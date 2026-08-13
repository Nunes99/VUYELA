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

## Customer Card Privacy

Digital card reads use the authenticated Supabase session and RLS policies. Customers can read only their own cards, wallets, and ledger-derived balances.

Identification QR display must not encode balances, MZN equivalent, tier benefits, or other confidential account state. It may identify the card and issuing business so POS flows can look up the protected record server-side.

The customer dashboard follows the same boundary: private customer cards, wallets, transactions, and profile data are read server-side through the authenticated session and RLS. Public offers remain limited by their public/active policy.

## POS Security

The POS route uses centralized protected-route helpers and is limited to active cashier, branch manager, business admin, and business owner memberships.

FASE 09 adds `lookup_pos_customer_card` for identifying active cards through a server-side RPC guarded by `can_access_transaction`. Transaction completion still uses the FASE 06 loyalty RPCs, so wallet balances and ledger rows are never written directly from browser code.

The POS confirm action requires customer authorization before calling the transaction RPC. Duplicate submission protection uses disabled pending buttons plus a stable idempotency key sent as `transactions.external_reference`, which is unique per business.

## Business Dashboard Security

The business dashboard route uses centralized protected-route helpers and is limited to active branch manager, business admin, and business owner memberships.

FASE 10 adds `get_business_dashboard`, a read-only `SECURITY DEFINER` RPC that validates `can_manage_business` and `can_access_branch` before returning reporting data. Branch managers must pass a branch scope; whole-business reporting is reserved for business admins and owners.

Dashboard metrics are rendered server-side. The browser does not query private tables directly and cannot mutate wallet, ledger, transaction, campaign, employee, or settings data through this phase.

## Public Marketplace Security

FASE 11 public discovery uses Supabase anon reads plus RLS public policies. The server-side public client has no service-role key and does not attach an authenticated session.

Marketplace pages render only active public records from marketplace-safe tables:

- active businesses;
- active branches for active businesses;
- active categories;
- active loyalty programs for active businesses;
- public active offers inside their valid date window.

Private customer, wallet, ledger, transaction, membership, campaign audience, subscription, audit, support, and fraud data is not queried by the marketplace feature. Low-value dynamic pages return 404 or `noindex` instead of exposing thin duplicate pages.

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
