# Catálogo de componentes

## Implementados no pacote React

- `Button`
- `IconButton`
- `Badge`
- `Chip`
- `Avatar`
- `Card`
- `Input`
- `Textarea`
- `Select`
- `Checkbox`
- `Radio`
- `Switch`
- `Tooltip`
- `Popover`
- `DropdownMenu`
- `StatCard`
- `LoyaltyCard`
- `Modal`
- `Drawer`
- `Tabs`
- `Accordion`
- `Toast`
- `Alert`
- `EmptyState`
- `Skeleton`
- `Pagination`
- `Table`
- `DataTable`
- `SearchInput`
- `FilterBar`
- `Breadcrumb`
- `Navbar`
- `Sidebar`
- `BottomNavigation`
- `PointsBalance`
- `RewardBadge`
- `TransactionItem`
- `BusinessCard`
- `OfferCard`
- `QRScanner`
- `QRDisplay`

## Prioridade seguinte

- `DateRangePicker`
- `ChartContainer`
- `RedemptionPanel`
- `TierProgress`
- `CampaignCard`
- `AppShell`
- `PermissionGate`
- `AuditTimeline`
- `SubscriptionCard`
- `SupportTicketCard`

## Regra para novos componentes

Um componente entra no design system quando:

1. aparece ou deverá aparecer em pelo menos três contextos;
2. possui estados e comportamento repetíveis;
3. precisa de consistência transversal;
4. pode ser documentado sem depender de uma página específica.
# Fluid 2.0 additions

- `GlassSurface`: `as` (`div`, `section`, `article`, `aside`), semantic HTML attributes, ref,
  `material` (`solid` by default, `frosted`, `liquid`).
- `MotionPreferences`: Portuguese controls for OS defaults or reduced motion/transparency;
  versioned non-sensitive local storage, optional when storage is blocked.
- `Card`, `Button`, `Navbar`, `BottomNavigation`, `Modal`: optional `material`; omitting it
  preserves the previous presentation. Reward/danger Button variants ignore material.
- `Card dark material="frosted"` scopes dark tokens to its own contents.
- `Tabs material="frosted"`: ArrowLeft/ArrowRight, Home/End and one tab stop;
  only the active panel is mounted, preserving the existing content lifecycle.

Use `/dev/design-system` for demonstrations. These APIs do not read or write loyalty data.

`VisualPreferencesProvider` shares the visual controls across a layout and initializes persisted
preferences even when no controls are visible. Server Component children remain server-rendered.
`useReducedVisualMotion()` returns true while loading preferences, on OS reduction, or on local
reduction; use it to cancel optional JavaScript autoplay and choose instant scrolling. Keep the
CSS reduced-motion rules as the fallback for styling and non-JavaScript content.

In Server Components, import these APIs from
`@lemote/vuyela-design-system/visual-preferences`. This focused client entry avoids importing
the legacy interactive barrel into the server module graph. The original exports remain available.
