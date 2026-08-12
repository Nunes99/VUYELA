# Security

## Core Requirements

- Respect Row Level Security.
- Never expose Supabase service-role credentials to the browser.
- Validate tenant ownership for every multi-tenant query.
- Use server-side operations for sensitive loyalty writes.
- Use database transactions for balance-changing operations.
- Record audit logs for privileged or sensitive operations.

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
