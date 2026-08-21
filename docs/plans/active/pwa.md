# Fase 18 - Progressive Web App

## Scope

- Installable standalone manifest with VUYELA regular and maskable icons.
- Root-scoped service worker with deployment-versioned public shell cache.
- Network-first navigation and offline fallback.
- IndexedDB persistence for previously loaded active-card identification.
- Offline business name, card number, and identification QR display.
- Explicit local-data removal.

## Security Decisions

- Authenticated HTML, API responses, Supabase traffic, balances, and transactions are not cached.
- IndexedDB excludes points, MZN values, profile fields, tiers, and point authorizations.
- The service worker handles only `GET` and has no Background Sync write queue.
- Offline QR codes identify a card but cannot authorize point earning or redemption.
- All wallet operations continue through online server actions and transactional database RPCs.

## Verification

- Unit tests cover payload minimization, versioning, and QR tenant scope.
- Integration tests cover manifest, registration, cache allowlist, and no-write boundaries.
- Playwright disables the network and opens a previously stored card through the cached shell.
- Desktop and mobile projects both run the PWA scenarios.
