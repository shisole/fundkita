# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Code Rules

- **No `as` type assertions in components.** Use explicit type annotations (e.g., `const data: MyType = ...`) instead of `as` casts. Enforced by ESLint in `src/components/`. Page/API files may still use `as` for Supabase joined-query types until the type system is improved.
- **Dynamic imports — use `dynamic()` only when justified.** Apply `next/dynamic` for: (1) components with heavy third-party deps like maps (leaflet), date pickers (react-day-picker), confetti (canvas-confetti); (2) components behind user interaction (modals, drawers, dropdowns that may never open); (3) components requiring `ssr: false` (browser-only APIs like leaflet, canvas). Do NOT dynamically import: critical above-fold layout components (navbar, footer), lightweight components (<100 lines, no heavy deps), or components that always render on page load.
- **Import ordering.** ESLint enforces strict alphabetical imports with group separation (builtin > external > internal > parent > sibling > index), with newlines between groups. Use inline type imports: `import { type X }` (not `import type { X }`).
- **Prettier.** Print width is 100 (not default 80). Double quotes, semicolons, trailing commas everywhere.

## Branch Workflow

Before making any code changes, check the current branch. If on `main`, create a new descriptive branch based on the task:

```bash
git checkout -b <type>/<short-description>
```

Use these prefixes: `feat/`, `fix/`, `refactor/`, `chore/`, `docs/`. Keep the description short and kebab-cased (e.g., `feat/campaign-crud`, `fix/donation-flow`). Do NOT commit directly to `main`.

Pre-commit hook (`husky` + `lint-staged`) automatically runs Prettier and ESLint on staged `.ts`/`.tsx` files.

## Commands

```bash
pnpm dev             # Start dev server (Next.js, port 3001)
pnpm build           # Production build
pnpm lint            # ESLint
pnpm typecheck       # TypeScript type checking (tsc --noEmit)
pnpm format          # Prettier — format all files
pnpm format:check    # Prettier — check formatting (CI enforces this)
pnpm seed            # Seed DB with demo data (requires SUPABASE_SERVICE_ROLE_KEY)
pnpm unseed          # Remove seeded data
pnpm test:e2e        # Run Playwright E2E tests (e2e/ dir, chromium only)
```

**Package manager is strictly pnpm.** Every script runs a pre-check that exits with an error if invoked via `npm` or `yarn`.

CI pipeline order: `format:check` → `lint` → `typecheck` → `build`.

## Environment Setup

Copy `.env.local.example` to `.env.local` and fill in:

- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` — required for all functionality
- `SUPABASE_SERVICE_ROLE_KEY` — for seed/unseed scripts and background jobs
- `DRAGONPAY_MERCHANT_ID`, `DRAGONPAY_PASSWORD`, `DRAGONPAY_API_URL` — payment processing
- `RESEND_API_KEY` — for email sending (optional; emails are skipped with a warning if absent)
- `EXCHANGE_RATE_API_URL` — for live USD/PHP conversion
- `NEXT_PUBLIC_DEMO_MODE` — set to `true` to enable demo user switching banner

## Architecture

**FundKita** is a GoFundMe-style crowdfunding platform for the Philippines built on **Next.js 15 (App Router)** + **React 19** + **Supabase** as the full backend. See `docs/plans/2026-03-04-fundkita-design.md` for full design.

### Route Groups

The app uses Next.js route groups with a nested structure:

- `(frontend)` — parent route group containing all user-facing pages:
  - `(auth)` — `/login`, `/signup` with a shared centered layout
  - `(public)` — homepage, campaign browse/detail, donation checkout, leaderboard
  - `(dashboard)` — authenticated user dashboard, campaign management, settings
  - `(admin)` — admin panel for moderation, KYC review, fraud, reports
- API routes live under `(frontend)/api/`

SEO files (`robots.ts`, `sitemap.ts`) remain at the `src/app/` root level.

Auth callback at `/auth/callback/route.ts` handles the OAuth code exchange with Supabase.

### User Roles

Three roles: `organizer`, `donor`, `admin`. Guest donors don't need accounts. When a donor creates their first campaign, their role auto-upgrades to `organizer`.

### Data Layer

All database access goes through Supabase. Two clients exist:

- **`@/lib/supabase/client`** — browser client (used in `"use client"` components)
- **`@/lib/supabase/server`** — server client (used in Server Components, API routes, layouts)

The `src/middleware.ts` runs `updateSession` on every request (excluding static assets and `sw.js`) to keep the Supabase session cookie refreshed.

A service-role client (`createServiceClient()` from `@/lib/supabase/server`) is available for server-only background jobs (cron, webhooks) that need to bypass RLS.

Database types are hand-maintained in `src/lib/supabase/types.ts` (not auto-generated). Enum-like columns use strict union types (e.g., `'pending' | 'confirmed' | 'cancelled'`), not `string`.

### Payments

Dragonpay handles all payments (GCash, Maya, GoTyme, cards, bank transfers). Webhook at `/api/donations/webhook` confirms payments. DB triggers update campaign totals and badge computations atomically.

### Path Aliases

- `@/*` → `./src/*`

### Icons

All SVG icons live in `src/components/icons/` with a barrel export from `index.ts`. Never inline SVGs — import from this folder. Create new icon components when needed. Navigation icons support `variant?: "outline" | "filled"`.

### Styling

Tailwind CSS with a custom theme (`tailwind.config.ts`):

- Custom color palettes: `teal`, `forest`, `golden` (each with 50–900 scale)
- Custom fonts: `font-sans` (Inter), `font-heading` (Plus Jakarta Sans), and `font-cursive` via CSS variables
- Custom animations: `fadeUp`, `shimmer`, `borderPulse`
- Dark mode supported via `class` strategy

Use the `cn()` helper from `@/lib/utils` (combines `clsx` + `tailwind-merge`) for conditional class merging.

### UI Components

Reusable UI components live in `src/components/ui/` with a barrel export from `index.ts`:

- Components use `forwardRef` for ref forwarding
- Props extend HTML element attributes
- Use `cn()` for conditional styling
- No `as` type assertions (ESLint enforced)
