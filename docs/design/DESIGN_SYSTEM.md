# Design System

## Fluid 2.0 foundations

`GlassSurface` supports semantic `as`, refs, and `solid` (default), `frosted`, `liquid` materials.
Existing `Card`, `Button`, `Navbar`, `BottomNavigation` and `Modal` accept an optional `material`.
`Tabs` also accepts `material` and supports arrows, Home/End and roving keyboard focus while
preserving lazy panel rendering.
Omitting it preserves the existing presentation. No consumer migration is required.
Reward and danger buttons keep their original tone and ignore `material`; use an enclosing
surface for these actions. This preserves the meaning of reward and destructive states.

Import the package styles including `fluid.css` after legacy overrides. The app imports it in
the root layout; the standalone package styles entry includes it too. New material tokens are
synchronised in CSS, TS and JSON. Existing radius/breakpoint discrepancies remain a separate issue.

Use solid for tables, forms, QR regions and POS confirmations. Frosted is for secondary surfaces;
liquid is reserved for a few interactive highlights. Never nest blur, animate balances before
server confirmation, or use glass as a substitute for readable contrast. Gold stays reward-only.

The `/dev/design-system` route contains clearly labelled demonstrations in light and dark themes.
`MotionPreferences` offers OS defaults or explicit reductions, storing only a versioned visual
preference locally; unavailable storage is tolerated. CSS supports OS reduced motion/transparency,
forced colours, solid fallback without backdrop support, and visible focus.

## Principles

- Technology with proximity.
- Explicit value: when showing points, also show MZN equivalent and issuing business.
- Culture as system, not decoration.
- One dominant action per transactional screen.
- Mobile-first.

## Color Tokens

```css
--vy-color-indigo: #073b4c;
--vy-color-teal: #00a6a6;
--vy-color-gold: #f2b544;
--vy-color-coral: #d95d4f;
--vy-color-sand: #f7f2e8;
--vy-color-graphite: #172126;
--vy-color-white: #ffffff;
```

Gold is reserved for rewards, points, and commercial reward accents. Do not use gold as generic success or error color.

## Typography

- Display/headings: Sora.
- UI/body: Inter.
- Financial numbers: bold weight with local separators.
- Normal text should not go below 14px.

Sora and Inter are self-hosted under `public/fonts` so production rendering does not depend on a
third-party font request.

## Brand Assets

- Use the official VUYELA mark from `/brand/logo-mark.svg` through the shared `VuyelaLogo` component.
- Use `/brand/pattern.svg` only as a secondary texture at 3-8% effective opacity.
- Do not replace the mark with a text-only approximation in product navigation.

## Required Components

The design system should grow toward:

- Button, IconButton, fields, selection controls, switches;
- Badge, Chip, Avatar, Tooltip, Popover, DropdownMenu;
- Modal, Drawer, Tabs, Accordion, Toast, Alert;
- Card, StatCard, EmptyState, Skeleton, Pagination, Table, DataTable;
- SearchInput, FilterBar, Breadcrumb, Navbar, Sidebar, BottomNavigation;
- LoyaltyCard, PointsBalance, RewardBadge, TransactionItem, BusinessCard, OfferCard;
- QRScanner and QRDisplay.

Each component should cover relevant default, hover, active, focus, disabled, loading, and error states.

`VisualPreferencesProvider` initializes the versioned visual preferences at the root without
turning its Server Component children into Client Components. `MotionPreferences` shares that
state when inside the provider and remains usable on its own. `useReducedVisualMotion` combines
OS and local reductions and pauses optional JavaScript motion until preferences are ready.
The public header blurs a decorative sibling layer, preserving the mobile menu's fixed viewport.
Discovery uses frosted material; editorial content, photographs and offer data retain their
existing surfaces. The public footer exposes visual comfort controls in normal document flow.

## Product Surfaces

- Public and authentication surfaces may use the institutional indigo and cultural texture.
- Customer, business, POS, and administration screens use light work surfaces with restrained
  borders and elevation.
- Gold remains reserved for points, rewards, and the commercial reward action.
- Operational navigation must never overlap content on small screens.

## Authentication Surfaces

- Login, registration and invitation pages use the shared `AuthShell` and `VuyelaLogo` components.
- Customer-facing authentication copy describes the user task, never database, RBAC, environment
  variables or server implementation details.
- Customer, business, POS and administration credentials remain distinct; the interface must not
  offer an automatic transition from one protected application to another.
- Password recovery stays next to the password field and preserves the originating application.
- On mobile, the brand panel precedes the form in normal document flow without fixed positioning,
  duplicated navigation or overlapping headings.

## Navigation and Multi-step Flows

- Every protected subpage shows its location and a deterministic route back to the parent surface.
- Business portal links preserve the selected `businessId`; changing sections must not silently
  change tenant context.
- Multi-step flows show the current step and total number of steps.
- Users can return to every uncommitted prior step to correct data without losing valid input.
- Cancellation is explicit and visually secondary to the dominant action.
- Financial and loyalty operations remain drafts while moving between POS steps. Only the final
  server confirmation can persist payment and points movements.
- Route transitions provide an accessible loading state without blocking browser history.
- On mobile, back, continue, cancel, and submit controls use touch targets of at least 44px and do
  not sit underneath fixed navigation.
