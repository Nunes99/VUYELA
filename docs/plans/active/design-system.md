# Goal

Implement FASE 01: the reusable VUYELA design system foundation and a non-production `/dev/design-system` preview route.

# Context

Phase 00 created the Next.js app foundation and preserved the existing `vuyela-design-system` package. That package already contains tokens, styles, Button, Badge, Card, Field, StatCard, LoyaltyCard, and Modal.

# Scope

- Expand the design-system package with missing foundational components.
- Keep components generic and reusable.
- Preserve VUYELA brand tokens and Portuguese product language.
- Add light and dark theme examples.
- Add `/dev/design-system`, hidden from production Vercel environments.
- Add unit and E2E smoke coverage.

# Out Of Scope

- Public homepage implementation.
- Authentication.
- Database-backed states.
- POS, dashboards, campaigns, or loyalty engine logic.
- Production content claims.

# Architecture

The root Next.js app imports the design-system CSS source files directly from the workspace package so Next emits the full stylesheet in development and production builds. The preview route is a client showcase nested inside a server page that can be blocked in production.

# Tasks

- [x] Add missing reusable components.
- [x] Add component CSS using VUYELA tokens.
- [x] Export new package components.
- [x] Build `/dev/design-system`.
- [x] Add tests.
- [x] Run lint, typecheck, tests, E2E, build, and design-system build.
- [x] Verify responsive behavior.

# Risks

- Components should not introduce backend assumptions.
- Interactive examples must remain client-only.
- The preview route must not become an indexable public product page.

# Testing

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm build
pnpm ds:build
pnpm format
```

# Decisions

- Keep Phase 01 examples as development documentation, not product UI.
- Use VUYELA tokens directly in CSS instead of page-specific Tailwind styling for component internals.
- Import design-system CSS source files directly in the app layout because the package `styles.css` alias emitted an empty stylesheet during browser verification.

# Progress

Completed Phase 01 implementation.

- Added foundational controls, navigation, overlays, feedback, data display, and loyalty primitives to the design-system package.
- Added the non-production `/dev/design-system` showcase route.
- Added unit coverage for component behavior and E2E smoke coverage for the showcase route.
- Verified responsive behavior at 375px, 768px, and 1280px. The document has no horizontal body overflow, controls are not clipped, the hero outline button has white text on the dark hero, and the removed floating action no longer exists.
- Final checks passed: `pnpm format`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm ds:build`, `pnpm build`, and `pnpm test:e2e`.
