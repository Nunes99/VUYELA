# VUYELA Architecture

## Summary

VUYELA is a hybrid-rendered SaaS/PWA built with Next.js, React, TypeScript, Supabase, PostgreSQL, Tailwind CSS, and a dedicated VUYELA design system.

The public surface is SEO-first and should use static generation or server rendering. Authenticated areas such as the customer dashboard, business dashboard, POS, cards, campaigns, and analytics can use client-side interactivity where it improves the workflow.

Public marketplace pages use server rendering with anon Supabase reads. Sitemap and metadata generation share the same indexability rules so empty, duplicate, or low-value generated pages are not published. Public search URLs are shareable but noindex to prevent arbitrary query combinations from becoming crawlable pages.

## Repository Foundation Decisions

- The existing `vuyela-design-system` package is preserved as a workspace package.
- The root app consumes the design-system tokens and styles rather than duplicating them.
- `pnpm` is the workspace package manager because the repository already contains a package and will grow into multiple packages over time.
- TypeScript strict mode is required in the app and the design-system package.
- Supabase migrations and server-side primitives will be added before any UI that depends on loyalty balances.
- The Phase 00 app page is a technical placeholder only. It is not the final public homepage.

## Rendering Model

Use server-rendered or statically generated routes for:

- homepage;
- establishment pages;
- category and city pages;
- offer pages;
- blog and institutional content;
- pricing and commercial pages.

Use client components only where browser interaction is necessary:

- dashboard widgets;
- POS workflow;
- QR scan/display interactions;
- forms with rich client validation;
- charts and filters.

## Data Model Direction

The core schema will include:

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

No wallet balance may be changed without a ledger entry. Normal ledger operations are append-only, and corrections must be compensating movements.

## Security Model

Every business is a tenant. Database access must enforce tenant isolation using `business_id`, Row Level Security, server-side functions for sensitive operations, and automated isolation tests.

The Supabase service-role key must never be exposed to browser code. Balance-changing operations must execute server-side and use database transactions to prevent negative balances, double spending, and race conditions.

## Open Questions

- Confirm whether Portuguese copy should use Mozambique-specific spelling consistently across all product surfaces.
- Confirm initial deployment target and Vercel project settings.
- Confirm whether phone + OTP or email + password is the first authentication flow to ship.
- Confirm future commercial limits around configurable point value; the database and engine already default to `1 point = 1 MZN` while allowing per-business configuration.
- Confirm the future canonical URL shape for offer slugs if offers need to remain unique per business rather than globally.
- Confirm future ranking strategy for search once live marketplace activity and paid placement rules exist.
