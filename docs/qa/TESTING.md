# Testing

## Tooling

- Vitest for unit tests.
- React Testing Library for component behavior.
- Playwright for end-to-end flows and responsive visual checks.
- Supabase/PostgreSQL tests for migrations, RLS, and transactional loyalty behavior.
- Static migration tests for schema, RLS, and RPC invariants until a runnable local Supabase/PostgreSQL test harness is available.

## Priority Unit Tests

- point calculation;
- redemption limit;
- expiry;
- rounding;
- discount interaction;
- tier calculation;
- campaign eligibility;
- referral eligibility.

## Priority Integration Tests

- purchase to points;
- purchase to redemption;
- refund to reversal;
- expired points;
- tenant isolation;
- employee permissions;
- concurrent redemption.

## Current RLS Coverage

Phase 04 includes static tests that verify:

- RLS is enabled on private tables;
- customers cannot access another customer's wallet path;
- business tenant policies depend on active membership in the same `business_id`;
- cashier access depends on assigned branch;
- platform admin roles do not get direct client-side bypass policies;
- sensitive loyalty writes remain reserved for future server-side transactional functions.

## Current Loyalty Engine Coverage

Phase 06 includes unit and static integration tests that verify:

- default point value is `100` MZN minor units;
- earn calculations subtract discounts and redeemed promotional value;
- fractional points are rounded down;
- redemption limits respect purchase amount, configured percentage, point value, and wallet balance;
- redemption requests above the maximum are rejected;
- loyalty RPCs use `SECURITY DEFINER`, tenant/branch guards, wallet `FOR UPDATE` locks, transactions, ledger entries, audit logs, and explicit execute grants.

## Current Customer Card Coverage

Phase 07 includes tests that verify:

- MZN equivalent uses the configured point value;
- current tier and next-tier progress are derived from lifetime points;
- expiry labels handle configured and non-configured expiration;
- identification QR codes omit balance and MZN values;
- `/cliente` keeps a stable protected-route fallback when Supabase is not configured.

## Current Auth/RBAC Coverage

Phase 05 includes unit tests that verify:

- anonymous users cannot access protected routes;
- customers cannot access business, POS, or admin routes without roles;
- cashier POS access is limited to the assigned business/branch;
- business admins cannot manage business owner privileges;
- support/platform/super admin roles require MFA-ready checks;
- authenticated landing routes resolve from the strongest available role.

## Priority E2E

Customer:

- signup;
- login;
- join business;
- view card;
- view balance;
- view history.

Cashier:

- login;
- scan customer;
- register purchase;
- redeem points.

Business:

- login;
- create campaign;
- see customer;
- see report.

Admin:

- approve business;
- suspend business;
- review audit.
