# Business Rules

## Multi-Tenancy

Each business is a tenant.

A business must never read or mutate private data from another business, including:

- private customer records;
- transactions;
- campaigns;
- employees;
- reports;
- wallet and ledger records.

Tenant isolation must use `business_id`, RLS, server-side functions for sensitive writes, and automated tests.

## Business Onboarding

Initial flow:

```text
create account
business details
NUIT
responsible person
contacts
category
address
logo
documentation
submit
admin validates
configure loyalty
activate
```

## Branches

A business can have multiple branches. Sensitive operations should record `employee_id`, `branch_id`, and timestamp.

Loyalty transaction RPCs validate that branch-scoped staff operate only inside their assigned branch. Business admins and owners can operate across the business.

## Campaigns

Campaign types can include welcome, first purchase, second purchase, birthday, inactive customer, double points, product-specific, time-specific, weekend, referral, expiring points, VIP, and location campaigns.

Campaign communication must respect customer consent where required.

Business admins and owners can create campaigns. Branch managers can view business dashboard context but do not create whole-business campaigns.

Rule-based campaigns can segment customers by:

- city or location-derived branch activity;
- purchase count;
- total spent;
- last purchase age;
- tier;
- points balance;
- marketing consent.

Campaign eligibility must be calculated server-side from tenant-scoped customer cards, wallets, transactions, tiers, and profiles. Campaign creation may materialize eligible audience rows, but it must not send notifications, mutate point wallets, append point ledger records, or create loyalty transactions.
