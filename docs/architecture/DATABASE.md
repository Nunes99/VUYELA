# Database

## Direction

Supabase PostgreSQL is the system of record. Schema changes must be implemented through migrations under `supabase/migrations`.

## Planned Core Tables

- profiles
- businesses
- branches
- business_members
- business_categories
- loyalty_programs
- loyalty_tiers
- customer_cards
- point_wallets
- point_ledger
- transactions
- transaction_payments
- campaigns
- campaign_audiences
- offers
- referrals
- notifications
- subscriptions
- plans
- support_tickets
- audit_logs
- fraud_events

## Wallets and Ledger

Each customer card has a points wallet with operational balance fields:

- available_balance
- pending_balance
- lifetime_earned
- lifetime_redeemed
- lifetime_expired

`point_ledger` is authoritative history. Balance changes must be transactional and accompanied by ledger entries.

## Money

Do not use floating point for money. Store money as integer minor units or PostgreSQL `numeric` with explicit rounding.
