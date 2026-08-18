# Notifications Plan

Implemented in FASE 14.

## Scope

- Persistent notification queue based on `public.notifications`.
- Campaign audience trigger with one idempotent delivery per recipient and channel.
- In-app delivery and customer unread/read state.
- Email provider through Resend when server credentials are configured.
- Protected Vercel Cron worker for scheduled delivery and retries.
- Leased, `SKIP LOCKED` claims for concurrent workers.
- Campaign delivery analytics.
- Provider contracts prepared for SMS, WhatsApp, and push.

## Boundaries

- Only in-app and email are selectable delivery channels in this phase.
- Existing campaigns are not backfilled or sent automatically.
- Email delivery requires `RESEND_API_KEY` and `NOTIFICATION_EMAIL_FROM`.
- The worker requires `CRON_SECRET` and a server-only Supabase service-role key.
- Notification delivery never mutates wallets, ledger entries, or transactions.

## Verification

- Unit tests cover channel validation, unread counts, retry delays, and provider idempotency keys.
- Static integration tests cover queue deduplication, leases, consent, RPC privileges, and cron authentication.
- Customer dashboard tests cover unread notification summaries.
- Full lint, typecheck, test, Playwright, design-system, and production-build gates apply.
