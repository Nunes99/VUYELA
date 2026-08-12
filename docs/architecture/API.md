# API

## Direction

Use server components, route handlers, and server-side libraries for data access. Public read-only pages can fetch data server-side for SEO. Sensitive mutations should use server-side functions and PostgreSQL transactions.

## Rules

- Do not call privileged Supabase operations from browser code.
- Keep loyalty business logic outside presentation components.
- Prefer typed request/response boundaries.
- Mutations that change balances must be idempotent or protected against duplicate submission.
- Return safe error messages to clients and log structured internal context server-side.

## Future RPC

PostgreSQL RPC should be considered for atomic operations such as earning points, redeeming points, reversals, and expiry processing.
