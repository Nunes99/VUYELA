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
public `/offline` shell, its build assets, the four web manifests, the legacy customer manifest,
and PWA icons. Navigations remain network-first and authenticated HTML responses are never written
to Cache Storage.

The platform exposes four independent installable identities:

- VUYELA Cliente: `id`, start URL, and scope `/cliente`;
- VUYELA Negócio: `id`, start URL, and scope `/negocio`;
- VUYELA POS: `id`, start URL, and scope `/pos`;
- VUYELA Administração: `id`, start URL, and scope `/admin`.

The legacy `/negocio/pos` path redirects to `/pos`; it is not an application scope. Business
owners, business administrators, branch managers, and cashiers reach the POS with their own active
membership. Cashiers never receive business-dashboard navigation, while authorized managers may
open the POS from the business portal.

Each protected layout advertises only its own manifest and Apple web-app title. Login, MFA, logo,
logout, and account-mismatch flows remain inside the current application scope. The old
`/manifest.webmanifest` endpoint keeps the same customer identity solely for compatibility with
existing installations.

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
