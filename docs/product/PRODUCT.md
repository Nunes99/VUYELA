# Product

## Mission

VUYELA by LEMOTE is a digital loyalty SaaS/PWA built first for Mozambique.

Businesses create their own loyalty programs. Customers earn points on purchases and return to the same issuing business to use those points as a discount or promotional payment method.

## Core Rule

The default value is:

```text
1 point = 1 MZN promotional value
```

Points:

- belong to the business that issued them;
- can only be used at the issuing business;
- cannot be transferred between customers;
- cannot be withdrawn;
- cannot be converted to M-Pesa, e-Mola, mKesh, bank account, or cash;
- are not bank balance;
- can have expiration and redemption limits.

VUYELA calculates points, stores the ledger, validates rules, presents balances, creates QR flows, communicates with customers, and produces reports. VUYELA does not assume the financial liability of points issued by each business.

## Initial Product Surfaces

- Public SEO pages and marketplace.
- Customer account and digital cards.
- Business dashboard.
- POS for earning and using points.
- Platform administration.

## Customer Cards

Digital customer cards show:

- issuing business identity;
- customer display name;
- card number;
- identification QR fallback code;
- available points;
- MZN promotional equivalent;
- current tier and next-tier progress where configured;
- point expiry rule for the issuing business.

Card balances remain business-specific and read through authenticated server-side paths protected by RLS.

## Customer Dashboard

The authenticated customer dashboard is mobile-first and includes:

- Inicio: total points, MZN equivalent, and active-card count;
- Cartoes: digital cards from the issuing businesses;
- Explorar: public active offers;
- Actividade: recent customer transactions;
- Perfil: customer account summary.

All populated states use database-backed reads. Empty states explain what appears after the customer joins businesses or starts transacting.

## Content Language

Portuguese is the primary product language. Copy should be simple, direct, and clear about the promotional nature of points.
