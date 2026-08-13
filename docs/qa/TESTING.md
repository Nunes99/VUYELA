# Testing

## Tooling

- Vitest for unit tests.
- React Testing Library for component behavior.
- Playwright for end-to-end flows and responsive visual checks.
- Supabase/PostgreSQL tests for migrations, RLS, and transactional loyalty behavior in later phases.
- Static migration tests for early schema and RLS invariants until a runnable local Supabase/PostgreSQL test harness is available.

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
