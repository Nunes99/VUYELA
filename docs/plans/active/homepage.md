# Goal

Implement FASE 02: the responsive public VUYELA homepage.

# Context

Phase 00 created a technical placeholder homepage. Phase 01 added the reusable design-system foundation and verified design-system CSS in the app. The next numbered phase in the master development flow is FASE 02 — Homepage.

# Scope

- Replace the technical placeholder with a public, server-rendered homepage.
- Use the approved VUYELA brand hierarchy: dark Indigo hero, gold reward accents, Portuguese copy, phone/card/QR visual, and mobile-first layout.
- Add page-level metadata and semantic structure.
- Avoid unavailable partner claims, fake business counts, and lorem ipsum.
- Keep page interactions non-blocking placeholders until auth, marketplace, and business onboarding phases exist.
- Add/update E2E smoke coverage.
- Verify screenshots at 375px, 768px, 1280px, and 1440px.

# Out Of Scope

- Marketplace data and establishment detail pages.
- Authentication and onboarding forms.
- Pricing database entities.
- Loyalty engine, POS, dashboards, and Supabase schema.
- Real partner/customer claims.

# Architecture

The homepage remains a Server Component. Product visuals are built as semantic HTML/CSS mockups using the VUYELA design-system tokens, avoiding client-side JavaScript and avoiding invented external assets.

# Tasks

- [ ] Replace homepage placeholder with brand/product sections.
- [ ] Add page metadata, canonical, OpenGraph, and Organization JSON-LD.
- [ ] Add responsive homepage CSS using VUYELA tokens.
- [ ] Update homepage E2E smoke test.
- [ ] Run format, lint, typecheck, unit tests, build, E2E, and design-system build.
- [ ] Verify responsive screenshots at 375px, 768px, 1280px, and 1440px.

# Risks

- Homepage copy must not imply launched partners or production availability.
- CTA links should not pretend onboarding/auth flows are ready.
- Decorative visuals must not harm accessibility or create horizontal scrolling.

# Testing

```bash
pnpm format
pnpm lint
pnpm typecheck
pnpm test
pnpm ds:build
pnpm build
pnpm test:e2e
```

# Decisions

- Use product mock visuals in HTML/CSS because there are no approved public image assets yet.
- Keep CTA anchors pointed at existing page sections until auth/onboarding routes are implemented.

# Progress

Started.
