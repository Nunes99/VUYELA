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

## QR

There are two QR concepts:

- Identification QR: identifies a card and may be relatively persistent.
- Usage QR: authorizes point use, must be temporary, signed, short-lived, and ideally single-use.

Never place confidential information or balances directly in a QR code.
