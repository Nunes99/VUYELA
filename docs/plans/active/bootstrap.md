# Goal

Establish the Phase 00 engineering foundation for VUYELA by LEMOTE without implementing product features.

# Context

The repository already contained a partial `vuyela-design-system` React package with VUYELA tokens, CSS, logo assets, and initial components. The master development flow requires a Next.js + TypeScript foundation with documentation, quality tooling, Supabase structure, and CI-ready scripts.

# Scope

- Root workspace package and package-manager configuration.
- Next.js App Router skeleton.
- TypeScript strict mode.
- Tailwind/PostCSS foundation.
- ESLint and Prettier configuration.
- Vitest and Playwright configuration.
- Supabase folder structure and environment template.
- Product, design, architecture, and QA documentation.
- Preserve and integrate the existing design-system package.

# Out Of Scope

- Customer dashboard.
- Business dashboard.
- POS implementation.
- Authentication implementation.
- Database schema migrations.
- RLS policies.
- Loyalty engine.
- Production deployment.

# Architecture

The root app is the primary Next.js application. `vuyela-design-system` remains a workspace package consumed by the app through `@lemote/vuyela-design-system`.

Public routes should remain server-renderable by default. Future sensitive operations must be implemented server-side and backed by PostgreSQL transactions and RLS.

# Tasks

- [x] Inspect repository.
- [x] Read master development flow.
- [x] Create workspace and app foundation.
- [x] Add documentation skeleton.
- [x] Add Supabase folder structure.
- [x] Install dependencies.
- [x] Run lint.
- [x] Run typecheck.
- [x] Run unit tests.
- [x] Run production build.
- [x] Run Playwright smoke test.

# Risks

- The local shell did not expose global `node` or `npm`; bundled Codex runtime paths are required for package-manager commands.
- Dependency installation may require network access.
- Playwright had to be pinned to `1.51.1` because the latest resolved release does not support the current macOS 12 runtime, while `1.51.1` satisfies Next.js peer requirements.
- Later phases must not treat the Phase 00 placeholder page as the approved homepage.

# Testing

Planned Phase 00 gate:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

# Decisions

- Use `pnpm` workspaces.
- Preserve `vuyela-design-system` rather than merging it into the app.
- Keep the visible app route as a technical placeholder until Phase 02.

# Progress

Foundation files and docs have been created. Dependency installation and the Phase 00 quality gate passed.

# Commands Run

```bash
pwd
sed -n '1,240p' '/Users/nunesjosechurrana/Downloads/VUYELA — MASTER DEVELOPMENT FLOW FOR CODEX.md'
rg --files
git status --short
sed -n '240,520p' '/Users/nunesjosechurrana/Downloads/VUYELA — MASTER DEVELOPMENT FLOW FOR CODEX.md'
find . -maxdepth 3 -type f -name 'package.json' -o -name 'README.md' -o -name 'AGENTS.md' -o -name 'next.config.*' -o -name 'vite.config.*' -o -name 'tsconfig.json'
sed -n '520,980p' '/Users/nunesjosechurrana/Downloads/VUYELA — MASTER DEVELOPMENT FLOW FOR CODEX.md'
sed -n '1,220p' vuyela-design-system/package.json
sed -n '1,220p' vuyela-design-system/README.md
rg -n 'Fase|FASE|Phase|00|Primeiro passo|instrução' '/Users/nunesjosechurrana/Downloads/VUYELA — MASTER DEVELOPMENT FLOW FOR CODEX.md'
sed -n '980,1460p' '/Users/nunesjosechurrana/Downloads/VUYELA — MASTER DEVELOPMENT FLOW FOR CODEX.md'
sed -n '1,220p' vuyela-design-system/COMPONENTS.md
sed -n '1,220p' vuyela-design-system/DESIGN_SYSTEM.md
sed -n '1980,2078p' '/Users/nunesjosechurrana/Downloads/VUYELA — MASTER DEVELOPMENT FLOW FOR CODEX.md'
sed -n '2810,2975p' '/Users/nunesjosechurrana/Downloads/VUYELA — MASTER DEVELOPMENT FLOW FOR CODEX.md'
find . -maxdepth 3 -type d | sort
ls -la
node --version
npm --version
pnpm --version
find vuyela-design-system/src -maxdepth 3 -type f -print | sort
codex bundled dependency lookup
sed -n '1,220p' vuyela-design-system/src/index.ts
sed -n '1,240p' vuyela-design-system/src/components/Button.tsx
sed -n '1,240p' vuyela-design-system/src/components/LoyaltyCard.tsx
sed -n '1,240p' vuyela-design-system/src/styles/tokens.css
mkdir -p app/(public) app/(auth) app/cliente app/negocio app/pos app/admin app/api components/ui components/layout components/loyalty components/business components/customer components/marketing components/seo features/auth features/businesses features/customers features/cards features/loyalty features/transactions features/campaigns features/referrals features/subscriptions features/notifications features/analytics lib/supabase lib/auth lib/loyalty lib/seo lib/security lib/validations lib/utils docs/product docs/design docs/architecture docs/plans/active docs/plans/completed docs/qa public/brand public/icons public/images supabase/migrations supabase/functions tests/unit tests/integration tests/e2e
sed -n '1,220p' vuyela-design-system/tsconfig.json
sed -n '1,220p' vuyela-design-system/tsconfig.build.json
sed -n '1,260p' vuyela-design-system/src/styles/index.css
sed -n '1,260p' vuyela-design-system/src/styles/base.css
sed -n '1460,1985p' '/Users/nunesjosechurrana/Downloads/VUYELA — MASTER DEVELOPMENT FLOW FOR CODEX.md'
sed -n '2078,2815p' '/Users/nunesjosechurrana/Downloads/VUYELA — MASTER DEVELOPMENT FLOW FOR CODEX.md'
sed -n '1,260p' vuyela-design-system/src/styles/components.css
rg -n 'letter-spacing|tracking' app vuyela-design-system/src vuyela-design-system/*.css
rg -n 'border-radius|radius' app vuyela-design-system/src/styles
sed -n '1,220p' vuyela-design-system/src/tokens.ts
sed -n '1,220p' vuyela-design-system/tokens/design-tokens.json
pnpm install
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm format
pnpm ds:build
pnpm format:write
pnpm lint
pnpm typecheck
pnpm test
pnpm format
pnpm build
pnpm dev --hostname 127.0.0.1 --port 3000
curl -I http://127.0.0.1:3000
curl -s http://127.0.0.1:3000
pnpm test:e2e
pnpm exec playwright install chromium
pnpm install
pnpm peers check
pnpm test:e2e
pnpm lint
pnpm typecheck
pnpm test
pnpm format
pnpm exec prettier --write pnpm-lock.yaml
pnpm format
pnpm build
```
