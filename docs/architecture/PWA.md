# PWA

## Goal

VUYELA should become installable and useful on mobile devices with limited connectivity.

## Implemented Capabilities

- manifest;
- icons;
- installability;
- theme colors;
- offline fallback;
- appropriate cache control.

FASE 18 uses a root-scoped service worker served from `/sw.js`. The worker precaches only the
public `/offline` shell, its build assets, the web manifest, and PWA icons. Navigations remain
network-first and authenticated HTML responses are never written to Cache Storage.

The customer dashboard stores active card identification in IndexedDB after a successful online
read. The payload is versioned and limited to card id, business id/name, card number, QR identity,
and update timestamp. It deliberately excludes customer profile data, points, MZN values, tiers,
transactions, and authorizations.

## Offline Boundaries

Initially allow offline access to previously loaded card identification and essential information.

Do not allow offline points redemption in the MVP.

The offline shell has no mutation controls, background sync, or write queue. QR codes shown there
are identification-only values; current card status, balance reads, earning, and redemption still
require an online server round trip. Users can remove the saved identification payload from the
device.
