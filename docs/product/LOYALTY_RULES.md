# Loyalty Rules

## Point Value

Default:

```text
1 point = 1 MZN promotional value
```

Businesses may later configure point value if the product explicitly supports it.

## Earning Points

Default eligible amount:

```text
eligible_amount = gross_amount - discounts - points_redeemed_value
points_earned = eligible_amount * earn_rate
```

Do not use floating point for money. Use integer minor units or PostgreSQL `numeric` with explicit rounding rules.

The current engine floors fractional points. For example, with the default `earn_rate = 0.0500`, a purchase with `eligible_amount = 100 MZN` earns `5` points.

## Redemption

Redemption flow:

```text
customer identified
purchase entered
balance verified
rules verified
maximum usable value calculated
customer confirms
transactional write
ledger updated
transaction completed
```

The operation must be atomic and prevent double spending, race conditions, and negative balances.

The current implementation calculates the maximum redeemable value from:

- purchase amount after discounts;
- customer wallet balance for the same business;
- configured point value;
- configured maximum redemption percentage.

The wallet row is locked during redemption so concurrent requests cannot spend the same points twice.

## Ledger

`point_ledger` is the historical source of truth. Wallet balance fields are derived operational state and must never be treated as the only history.

Normal ledger writes are append-only. Corrections require compensating entries.

Movement types:

- earn
- bonus
- referral
- birthday
- redeem
- expire
- reversal
- manual_adjustment
- refund_reversal

## Implemented Engine Boundary

FASE 06 implements loyalty calculations in `lib/loyalty/engine.ts` and balance-changing PostgreSQL RPCs in `supabase/migrations/create_loyalty_engine_rpcs.sql`.

Implemented RPCs:

- `record_purchase_points`: records a completed purchase and awards points.
- `redeem_purchase_points`: records a completed purchase, redeems points atomically, and awards any points due on the remaining eligible amount.
- `refund_loyalty_transaction`: marks a completed transaction as refunded and writes compensating ledger entries.

All wallet-changing writes must continue to go through server-side transactional paths. Application code must not update `point_wallets` or `point_ledger` directly.

## Referrals

Creating an account, generating an invitation, or accepting a referral code never awards points.

A referral becomes rewardable only when:

- the business and referral program are active;
- the invitation was accepted before it expired;
- the referred customer had no previous completed or refunded purchase in that business when accepting;
- a later completed purchase reaches the configured minimum eligible amount;
- the referrer remains within the configured reward-period limit;
- fraud controls do not detect self-referral or reciprocal referral.

The qualifying purchase awards the configured referrer and referred-customer amounts as separate positive `referral` ledger entries. A refund of that purchase removes both rewards with negative `refund_reversal` entries. The original ledger history remains unchanged.

## QR

There are two QR concepts:

- Identification QR: identifies a card and may be relatively persistent.
- Usage QR: authorizes point use, must be temporary, signed, short-lived, and ideally single-use.

Never place confidential information or balances directly in a QR code.

FASE 07 implements identification QR display for digital customer cards. The displayed code contains the card identity and issuing business scope; it does not include wallet balance or MZN equivalent.

FASE 09 implements the first POS consumer of this QR concept. The POS resolves the identification QR through a server-side lookup and still requires explicit customer authorization before any redemption is confirmed.
