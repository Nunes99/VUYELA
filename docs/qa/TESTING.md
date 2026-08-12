# Testing

## Tooling

- Vitest for unit tests.
- React Testing Library for component behavior.
- Playwright for end-to-end flows and responsive visual checks.
- Supabase/PostgreSQL tests for migrations, RLS, and transactional loyalty behavior in later phases.

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
