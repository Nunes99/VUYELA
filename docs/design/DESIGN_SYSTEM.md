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
