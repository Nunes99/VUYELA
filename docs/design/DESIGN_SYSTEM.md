# Design System

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

## Product Surfaces

- Public and authentication surfaces may use the institutional indigo and cultural texture.
- Customer, business, POS, and administration screens use light work surfaces with restrained
  borders and elevation.
- Gold remains reserved for points, rewards, and the commercial reward action.
- Operational navigation must never overlap content on small screens.

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
