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

## POS

The authenticated POS is built for low-friction cashier use:

- select the active business and branch context available to the cashier;
- identify a customer by card number or identification QR payload;
- enter the transaction value and optional discount/points to use;
- show the points and MZN equivalent before confirmation;
- require explicit customer authorization before writing a redemption;
- confirm the transaction through server-side loyalty RPCs.

The normal path keeps wallet writes out of browser code. Duplicate submissions are reduced by disabled pending buttons and an idempotency key sent as the transaction external reference.

## Business Dashboard

The authenticated business dashboard is an operational surface for branch managers, business admins, and business owners.

It includes:

- overview with revenue, transaction count, customer count, and average ticket;
- customers with card number, points, MZN liability, and last transaction;
- transactions confirmed by the POS and loyalty engine;
- points metrics including available points, promotional liability, earned points, redeemed points, redemption rate, and retention;
- campaigns and offers visibility for manager-scoped users;
- program configuration summary;
- branch performance;
- active employees and roles;
- report tiles for sales, liability, retention, and campaigns;
- settings/status summary.

Branch managers receive branch-scoped data. Business admins and owners can view whole-business metrics and branch-specific views.

## Public Marketplace

The public marketplace is server-rendered and SEO-first.

It includes:

- `/estabelecimentos`;
- `/estabelecimentos/[slug]`;
- `/categorias`;
- `/categorias/[slug]`;
- `/locais`;
- `/locais/[cidade]`;
- `/locais/[cidade]/[categoria]`;
- `/ofertas`;
- `/ofertas/[slug]`.

Only active public records are rendered. Business detail pages require a public active business with description, category, active loyalty program, and at least one active branch. Category and city pages are indexable only when they have establishments. City/category combinations require a higher threshold to avoid thin duplicate pages. Offer detail pages use `/ofertas/[slug]` only when the active public offer slug is unique across the public marketplace; otherwise offers link back to the establishment profile.

Public pages show benefits, points and MZN promotional equivalent where relevant, locations, contacts, active offers, join CTAs, FAQs, metadata, OpenGraph, breadcrumbs, and structured data.

## Public Search

The public search page `/pesquisar` helps visitors find establishments and offers without creating unlimited SEO pages.

Supported filters:

- text query;
- category;
- city;
- establishments with active offers;
- location when the visitor grants browser location permission;
- open-now status only when branches publish opening hours.

Search URLs are shareable, for example `/pesquisar?q=cafe&city=maputo&ofertas=1`, but they are not indexable. When a filter combination has SEO value, the UI points visitors to the canonical category, city, city/category, or offers pages instead.

Open status is never inferred when opening hours are absent. Branches can publish optional weekly `opening_hours`; an empty value means the open state is unknown.

## Content Language

Portuguese is the primary product language. Copy should be simple, direct, and clear about the promotional nature of points.
