# FundKita Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build FundKita — a GoFundMe-style crowdfunding platform for the Philippines with Dragonpay payments, badge gamification, and admin moderation.

**Architecture:** Supabase-first approach. All financial consistency logic (donation totals, badge computation) lives in DB triggers. Next.js API routes are thin wrappers. Custom admin panel under `/admin` route group. Demo mode with switchable users.

**Tech Stack:** Next.js 15 + React 19 + Supabase (auth, DB, storage) + Dragonpay + Resend + Tailwind CSS

**Design Doc:** `docs/plans/2026-03-04-fundkita-design.md`

**Base:** scaffold-nextjs (already set up with ESLint, Prettier, Husky, CI pipeline)

---

## Phase 0: Project Bootstrap

### Task 1: Copy Scaffold & Rebrand to FundKita

**Files:**

- Modify: `package.json`
- Modify: `src/app/(frontend)/layout.tsx`
- Modify: `tailwind.config.ts`
- Modify: `.env.local.example`
- Modify: `CLAUDE.md`
- Modify: `src/app/robots.ts`
- Modify: `src/app/sitemap.ts`
- Create: `.env.local` (from example, local only)

**Steps:**

1. Copy the scaffold to a new directory `FundKita/` at the same level as EventTara
2. Initialize git: `git init && git add -A && git commit -m "chore: init from scaffold-nextjs"`
3. Update `package.json`:
   - `name`: `"fundkita"`
   - `description`: `"GoFundMe-style crowdfunding platform for the Philippines"`
4. Update `src/app/(frontend)/layout.tsx`:
   - Title template: `"%s — FundKita"`
   - Default title: `"FundKita — Fund for Us"`
   - Description: `"Crowdfunding platform for the Philippines. Create campaigns, donate via GCash, Maya, and more."`
5. Update `tailwind.config.ts` color names from `primary/secondary/accent` to `teal/forest/golden` (keep same hex values) to match EventTara conventions
6. Update `.env.local.example` — add all FundKita-specific vars:
   ```
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_ANON_KEY=
   SUPABASE_SERVICE_ROLE_KEY=
   RESEND_API_KEY=
   DRAGONPAY_MERCHANT_ID=
   DRAGONPAY_PASSWORD=
   DRAGONPAY_API_URL=https://test.dragonpay.ph/api/collect/v1
   NEXT_PUBLIC_DEMO_MODE=true
   EXCHANGE_RATE_API_URL=https://open.er-api.com/v6/latest/USD
   NEXT_PUBLIC_SITE_URL=http://localhost:3001
   ```
7. Update `CLAUDE.md` — replace scaffold description with FundKita architecture overview referencing the design doc
8. Update `robots.ts` and `sitemap.ts` with FundKita site URL
9. Commit: `git add -A && git commit -m "chore: rebrand scaffold to FundKita"`

---

### Task 2: Database Types

**Files:**

- Modify: `src/lib/supabase/types.ts`

**Steps:**

1. Replace the placeholder Database interface with the full FundKita schema types. Define all tables from the design doc:
   - `users` — id, email, full_name, username, avatar_url, role, is_verified, created_at
   - `kyc_submissions` — id, user_id, id_type, id_front_url, id_back_url, selfie_url, status, rejection_reason, reviewed_by, reviewed_at, created_at
   - `campaigns` — id, organizer_id, title, slug, description, category, location, goal_amount, amount_raised, donor_count, status, is_verified, featured_image_url, end_date, created_at, updated_at
   - `campaign_images` — id, campaign_id, image_url, sort_order
   - `campaign_updates` — id, campaign_id, title, content, created_at
   - `donations` — id, campaign_id, donor_id, donor_name, donor_email, amount_php, original_amount, original_currency, exchange_rate, platform_tip, processing_fee, fee_covered_by_donor, payment_method, payment_status, is_anonymous, dragonpay_txn_id, created_at
   - `donor_stats` — user_id, lifetime_donations_php, donation_count, current_tier
   - `donor_badges` — id, user_id, badge_tier, badge_name, awarded_at
   - `fraud_flags` — id, campaign_id, reason, flagged_by, status, created_at
   - `withdrawal_requests` — id, campaign_id, organizer_id, amount, status, payout_method, payout_details, reviewed_by, reviewed_at, created_at
   - `exchange_rates` — id, from_currency, to_currency, rate, fetched_at

2. Define strict union types for all enums:
   - `UserRole = 'donor' | 'organizer' | 'admin'`
   - `KycStatus = 'pending' | 'approved' | 'rejected'`
   - `CampaignStatus = 'draft' | 'pending_review' | 'active' | 'paused' | 'completed' | 'closed'`
   - `CampaignCategory = 'medical' | 'disaster_relief' | 'education' | 'community' | 'emergency' | 'personal' | 'other'`
   - `PaymentStatus = 'pending' | 'confirmed' | 'failed' | 'refunded'`
   - `PaymentMethod = 'gcash' | 'maya' | 'card' | 'bank_transfer' | 'gotyme'`
   - `Currency = 'PHP' | 'USD'`
   - `DonationVisibility = boolean (is_anonymous)`
   - `FraudFlagStatus = 'open' | 'resolved' | 'dismissed'`
   - `WithdrawalStatus = 'pending' | 'approved' | 'rejected' | 'processed'`
   - `PayoutMethod = 'gcash' | 'maya' | 'bank_transfer'`

3. Include Row, Insert, Update types for each table
4. Run `pnpm typecheck` to verify
5. Commit: `git commit -m "feat: add FundKita database types"`

---

### Task 3: Supabase Project Setup & SQL Migration

**Files:**

- Create: `supabase/migrations/001_initial_schema.sql`

**Steps:**

1. Write the full SQL migration file with:
   - All tables from the design doc with proper constraints, defaults, and foreign keys
   - Indexes on: `campaigns.slug` (unique), `campaigns.status`, `campaigns.category`, `campaigns.organizer_id`, `donations.campaign_id`, `donations.donor_id`, `donations.payment_status`, `donor_stats.lifetime_donations_php` (for leaderboard sorting)
   - Full-text search index on `campaigns` (title + description): `CREATE INDEX idx_campaigns_fts ON campaigns USING gin(to_tsvector('english', title || ' ' || description));`
   - RLS policies:
     - `users`: Users can read all, update own row. Admins can update any.
     - `campaigns`: Anyone can read active campaigns. Organizers can insert/update own. Admins can update any.
     - `campaign_images`: Same as campaigns (tied to organizer ownership).
     - `campaign_updates`: Same as campaigns.
     - `donations`: Anyone can insert (guest donations). Users can read own donations. Campaign organizers can read donations to their campaigns. Admins can read all.
     - `kyc_submissions`: Users can insert/read own. Admins can read/update all.
     - `withdrawal_requests`: Organizers can insert/read own. Admins can read/update all.
     - `fraud_flags`: Admins only.
     - `donor_stats`: Public read (for leaderboard). System-only write (via trigger/service role).
     - `donor_badges`: Public read. System-only write.
     - `exchange_rates`: Public read. Service-role write.
   - DB functions and triggers:
     - `handle_donation_confirmed()` — triggered on donations UPDATE when `payment_status` changes to `'confirmed'`. Increments `campaigns.amount_raised` and `donor_count`. Upserts `donor_stats`. Calls `check_badge_tier()`.
     - `handle_donation_refunded()` — triggered on donations UPDATE when `payment_status` changes to `'refunded'`. Decrements campaign totals and donor_stats (but does NOT revoke badges).
     - `check_badge_tier(p_user_id uuid)` — compares `donor_stats.lifetime_donations_php` against tier thresholds. Inserts new `donor_badges` row if higher tier reached.
     - `generate_campaign_slug()` — triggered on campaigns INSERT. Generates URL-friendly slug from title (lowercase, hyphens, append random suffix if duplicate).
   - Supabase Storage buckets (via SQL or manual setup):
     - `campaign-images` (public)
     - `kyc-documents` (private)
     - `avatars` (public)
   - `handle_new_user()` trigger — on auth.users INSERT, creates a `public.users` row with default role `'donor'`

2. This SQL is applied manually via the Supabase dashboard SQL editor (or `supabase db push` if using CLI)
3. Commit: `git commit -m "feat: add initial database migration"`

---

### Task 4: Constants & Shared Config

**Files:**

- Create: `src/lib/constants/badge-tiers.ts`
- Create: `src/lib/constants/categories.ts`
- Create: `src/lib/constants/tip-suggestions.ts`
- Create: `src/lib/constants/demo-users.ts`

**Steps:**

1. `badge-tiers.ts` — badge tier thresholds and metadata:

   ```typescript
   export const BADGE_TIERS = [
     { tier: 1, name: "First Step", emoji: "🌱", threshold: 100 },
     { tier: 2, name: "Supporter", emoji: "🤝", threshold: 500 },
     { tier: 3, name: "Helper", emoji: "💖", threshold: 1_000 },
     { tier: 4, name: "Advocate", emoji: "⭐", threshold: 5_000 },
     { tier: 5, name: "Champion", emoji: "🏅", threshold: 10_000 },
     { tier: 6, name: "Patron", emoji: "👑", threshold: 25_000 },
     { tier: 7, name: "Legacy Builder", emoji: "👑", threshold: 50_000 },
     { tier: 8, name: "Humanitarian", emoji: "🌍", threshold: 100_000 },
     { tier: 9, name: "Benefactor", emoji: "🏛️", threshold: 250_000 },
     { tier: 10, name: "Philanthropist", emoji: "🕊️", threshold: 500_000 },
   ] as const;

   export function getTierForAmount(amountPhp: number) { ... }
   export function getNextTier(currentTier: number) { ... }
   export function getProgressToNextTier(amountPhp: number) { ... }
   ```

2. `categories.ts` — campaign categories with labels and icons:

   ```typescript
   export const CAMPAIGN_CATEGORIES = [
     { value: "medical", label: "Medical", icon: "🏥" },
     { value: "disaster_relief", label: "Disaster Relief", icon: "🌊" },
     { value: "education", label: "Education", icon: "📚" },
     { value: "community", label: "Community", icon: "🏘️" },
     { value: "emergency", label: "Emergency", icon: "🚨" },
     { value: "personal", label: "Personal", icon: "🙋" },
     { value: "other", label: "Other", icon: "💡" },
   ] as const;
   ```

3. `tip-suggestions.ts` — platform tip tiers:

   ```typescript
   export const TIP_SUGGESTIONS = [
     { min: 100, max: 499, suggested: 5 },
     { min: 500, max: 999, suggested: 20 },
     { min: 1000, max: 4999, suggested: 50 },
     { min: 5000, max: Infinity, suggested: 100 },
   ] as const;

   export function getSuggestedTip(amountPhp: number): number { ... }
   ```

4. `demo-users.ts` — demo user metadata:

   ```typescript
   export const DEMO_USERS = [
     { id: "demo-maria", name: "Maria Santos", role: "organizer", email: "maria@demo.fundkita.ph" },
     { id: "demo-juan", name: "Juan Cruz", role: "donor", email: "juan@demo.fundkita.ph" },
     { id: "demo-ana", name: "Ana Reyes", role: "donor", email: "ana@demo.fundkita.ph" },
     { id: "demo-admin", name: "Admin User", role: "admin", email: "admin@demo.fundkita.ph" },
   ] as const;
   ```

5. Run `pnpm typecheck && pnpm lint`
6. Commit: `git commit -m "feat: add constants for badges, categories, tips, demo users"`

---

## Phase 1: Core Layout & Auth

### Task 5: Route Group Restructure

**Files:**

- Rename: `src/app/(frontend)/(participant)/` → `src/app/(frontend)/(public)/`
- Rename: `src/app/(frontend)/(organizer)/` → `src/app/(frontend)/(dashboard)/`
- Create: `src/app/(frontend)/(admin)/admin/layout.tsx`
- Create: `src/app/(frontend)/(admin)/admin/page.tsx`

**Steps:**

1. Rename `(participant)` directory to `(public)` — update the layout.tsx inside to be the public layout (Navbar + Footer)
2. Rename `(organizer)` directory to `(dashboard)` — keep the dashboard layout as auth-guarded sidebar layout
3. Create `(admin)` route group with layout.tsx (admin role guard + admin sidebar) and a placeholder page.tsx
4. Verify the app still builds: `pnpm build`
5. Commit: `git commit -m "refactor: rename route groups to public/dashboard/admin"`

---

### Task 6: Icon Components

**Files:**

- Create: `src/components/icons/HomeIcon.tsx`
- Create: `src/components/icons/SearchIcon.tsx`
- Create: `src/components/icons/HeartIcon.tsx`
- Create: `src/components/icons/UserIcon.tsx`
- Create: `src/components/icons/PlusIcon.tsx`
- Create: `src/components/icons/MenuIcon.tsx`
- Create: `src/components/icons/CloseIcon.tsx`
- Create: `src/components/icons/ChevronLeftIcon.tsx`
- Create: `src/components/icons/ChevronRightIcon.tsx`
- Create: `src/components/icons/ChevronDownIcon.tsx`
- Create: `src/components/icons/DashboardIcon.tsx`
- Create: `src/components/icons/CampaignIcon.tsx`
- Create: `src/components/icons/DonateIcon.tsx`
- Create: `src/components/icons/TrophyIcon.tsx`
- Create: `src/components/icons/SettingsIcon.tsx`
- Create: `src/components/icons/ShieldIcon.tsx`
- Create: `src/components/icons/LogoutIcon.tsx`
- Create: `src/components/icons/SpinnerIcon.tsx`
- Create: `src/components/icons/CheckCircleIcon.tsx`
- Create: `src/components/icons/AlertIcon.tsx`
- Create: `src/components/icons/ImageIcon.tsx`
- Create: `src/components/icons/TrashIcon.tsx`
- Create: `src/components/icons/EditIcon.tsx`
- Create: `src/components/icons/ExternalLinkIcon.tsx`
- Create: `src/components/icons/FilterIcon.tsx`
- Create: `src/components/icons/SortIcon.tsx`
- Create: `src/components/icons/ShareIcon.tsx`
- Create: `src/components/icons/FlagIcon.tsx`
- Modify: `src/components/icons/index.ts`

**Steps:**

1. Create all icon components as SVG React components following EventTara's pattern:
   - Each icon is a functional component accepting `className` and optional `variant?: "outline" | "filled"`
   - Default size via `w-5 h-5` class
   - `currentColor` for stroke/fill so they inherit text color
2. Update barrel export `index.ts` to export all icons
3. Run `pnpm lint`
4. Commit: `git commit -m "feat: add icon components"`

---

### Task 7: Additional UI Components

**Files:**

- Create: `src/components/ui/Badge.tsx`
- Create: `src/components/ui/Breadcrumbs.tsx`
- Create: `src/components/ui/Select.tsx`
- Create: `src/components/ui/Textarea.tsx`
- Create: `src/components/ui/Modal.tsx`
- Create: `src/components/ui/ProgressBar.tsx`
- Create: `src/components/ui/Avatar.tsx`
- Create: `src/components/ui/Tabs.tsx`
- Create: `src/components/ui/EmptyState.tsx`
- Create: `src/components/ui/StatusBadge.tsx`
- Modify: `src/components/ui/index.ts`

**Steps:**

1. `Badge.tsx` — small colored label with variants (`default` | `success` | `warning` | `error` | `info`). Used for campaign status, payment status, badge display.
2. `Breadcrumbs.tsx` — accepts array of `{ label, href }` items, renders as linked path.
3. `Select.tsx` — styled select dropdown with label and error support (same pattern as Input.tsx).
4. `Textarea.tsx` — styled textarea with label, error, and character count.
5. `Modal.tsx` — dialog overlay with backdrop, close button, title, and children. Uses portal.
6. `ProgressBar.tsx` — accepts `value` (0-100) and `variant`. Used for campaign funding progress and badge tier progress.
7. `Avatar.tsx` — circular image with fallback to initials. Accepts `size` (`sm` | `md` | `lg`).
8. `Tabs.tsx` — horizontal tab switcher. Accepts `tabs` array of `{ id, label }` and `activeTab` + `onChange`.
9. `EmptyState.tsx` — centered message with icon and optional CTA button. Used when lists are empty.
10. `StatusBadge.tsx` — specialized Badge for payment/campaign statuses with color mapping.
11. Update barrel export.
12. All components use `forwardRef`, extend HTML attributes, use `cn()`.
13. Run `pnpm typecheck && pnpm lint`
14. Commit: `git commit -m "feat: add Badge, Breadcrumbs, Select, Textarea, Modal, ProgressBar, Avatar, Tabs, EmptyState, StatusBadge components"`

---

### Task 8: Navbar & Footer

**Files:**

- Create: `src/components/layout/Navbar.tsx`
- Create: `src/components/layout/Footer.tsx`
- Create: `src/components/layout/MobileNav.tsx`
- Create: `src/components/layout/ThemeToggle.tsx`
- Create: `src/components/layout/DemoBanner.tsx`
- Modify: `src/app/(frontend)/(public)/layout.tsx`

**Steps:**

1. `Navbar.tsx` — responsive top navigation:
   - Logo ("FundKita") linked to `/`
   - Nav links: Campaigns, Leaderboard
   - Search input (desktop only)
   - Auth buttons: Login / Sign Up (when logged out), Avatar dropdown (when logged in)
   - Mobile: hamburger menu triggers MobileNav
   - Fetches user session server-side via `createClient()` from `@/lib/supabase/server`

2. `Footer.tsx` — simple footer:
   - FundKita branding, copyright
   - Links: About, How It Works, Contact, Privacy Policy, Terms

3. `MobileNav.tsx` — slide-out mobile menu:
   - `"use client"` component
   - Same links as Navbar
   - Close button
   - Backdrop overlay

4. `ThemeToggle.tsx` — dark/light mode switch using `next-themes` `useTheme()`.

5. `DemoBanner.tsx` — `"use client"` component:
   - Only renders when `process.env.NEXT_PUBLIC_DEMO_MODE === "true"`
   - Fixed top banner with: "Demo Mode — Logged in as: [name]" + quick-switch buttons for each demo user
   - Calls `/api/auth/demo-login` with user ID on click
   - Shows current user name and role badge

6. Update `(public)/layout.tsx` to include Navbar, Footer, and DemoBanner.

7. Run `pnpm build` to verify
8. Commit: `git commit -m "feat: add Navbar, Footer, MobileNav, ThemeToggle, DemoBanner"`

---

### Task 9: Auth — Login & Signup Pages

**Files:**

- Modify: `src/app/(frontend)/(auth)/login/page.tsx`
- Modify: `src/app/(frontend)/(auth)/signup/page.tsx`
- Modify: `src/app/(frontend)/(auth)/layout.tsx`
- Create: `src/app/(frontend)/api/auth/demo-login/route.ts`

**Steps:**

1. Update auth layout — centered card with FundKita branding at top.

2. `login/page.tsx`:
   - Email + password form using Input component
   - "Log in" Button
   - Google OAuth button (calls `supabase.auth.signInWithOAuth({ provider: 'google' })`)
   - Link to `/signup`
   - `"use client"` — handles form submission via `createClient()` from browser client
   - On success: `router.push("/dashboard")` or redirect to `searchParams.next`
   - Error display on failed login

3. `signup/page.tsx`:
   - Full name, email, password, confirm password
   - "Create Account" Button
   - Google OAuth button
   - Link to `/login`
   - On success: redirect to `/dashboard`
   - Supabase creates auth user → `handle_new_user` trigger creates `public.users` row

4. `api/auth/demo-login/route.ts`:
   - POST accepts `{ userId: string }`
   - Only works when `NEXT_PUBLIC_DEMO_MODE === "true"`
   - Uses `createServiceClient()` to call `supabase.auth.admin.generateLink()` for the target demo user
   - Sets session cookie and returns success
   - Returns 403 if demo mode is off

5. Run `pnpm typecheck && pnpm lint`
6. Commit: `git commit -m "feat: add login, signup pages and demo login API"`

---

### Task 10: Dashboard & Admin Layouts

**Files:**

- Modify: `src/app/(frontend)/(dashboard)/dashboard/layout.tsx`
- Create: `src/components/layout/DashboardSidebar.tsx`
- Modify: `src/app/(frontend)/(admin)/admin/layout.tsx`
- Create: `src/components/layout/AdminSidebar.tsx`

**Steps:**

1. `DashboardSidebar.tsx` — `"use client"` sidebar:
   - Links: Overview, My Donations, My Campaigns, Settings
   - Active link highlighting based on pathname
   - User avatar and name at top
   - Collapsible on mobile (hamburger toggle)

2. `dashboard/layout.tsx`:
   - Server component — fetches session via `createClient()`
   - If no user → redirect to `/login?next=/dashboard`
   - Two-column layout: sidebar + main content area
   - Passes user data to sidebar

3. `AdminSidebar.tsx` — similar to DashboardSidebar:
   - Links: Overview, Campaigns, KYC Review, Withdrawals, Fraud, Reports
   - Red/warning accent for admin styling

4. `admin/layout.tsx`:
   - Server component — fetches session + user role
   - If no user → redirect to `/login`
   - If role !== `'admin'` → redirect to `/dashboard`
   - Two-column layout: admin sidebar + main content

5. Run `pnpm build`
6. Commit: `git commit -m "feat: add dashboard and admin layouts with sidebars"`

---

## Phase 2: Campaign CRUD

### Task 11: Campaign API Routes

**Files:**

- Create: `src/app/(frontend)/api/campaigns/route.ts`
- Create: `src/app/(frontend)/api/campaigns/[id]/route.ts`
- Create: `src/app/(frontend)/api/upload/route.ts`

**Steps:**

1. `GET /api/campaigns` — list campaigns:
   - Query params: `search`, `category`, `status` (default `active`), `sort` (`most_funded` | `most_recent` | `ending_soon` | `near_goal`), `location`, `page`, `limit`
   - Full-text search via `to_tsvector`
   - Pagination with offset/limit
   - Returns campaigns with organizer name, image, progress percentage

2. `POST /api/campaigns` — create campaign:
   - Auth required — get user from session
   - Validates: title, description, category, goal_amount, location
   - Sets status to `pending_review` (or `draft` if saved as draft)
   - If user role is `donor`, auto-update to `organizer`
   - Slug auto-generated by DB trigger

3. `GET /api/campaigns/[id]` — single campaign:
   - Public read for active campaigns
   - Includes: organizer info, images, updates, top 5 donors, donation count, amount raised

4. `PATCH /api/campaigns/[id]` — update campaign:
   - Auth required — must be campaign organizer or admin
   - Can update: title, description, category, goal_amount, location, end_date, featured_image_url, status (organizer can close own campaign)

5. `DELETE /api/campaigns/[id]` — soft delete (set status to `closed`):
   - Auth required — organizer or admin

6. `POST /api/upload` — image upload to Supabase Storage:
   - Auth required
   - Accepts multipart form data
   - Bucket determined by `type` param: `campaign-images`, `kyc-documents`, `avatars`
   - Returns public URL

7. Run `pnpm typecheck`
8. Commit: `git commit -m "feat: add campaign CRUD and upload API routes"`

---

### Task 12: Campaign Creation Page

**Files:**

- Create: `src/app/(frontend)/(dashboard)/dashboard/campaigns/page.tsx`
- Create: `src/app/(frontend)/(dashboard)/dashboard/campaigns/new/page.tsx`
- Create: `src/components/campaigns/CampaignForm.tsx`
- Create: `src/components/campaigns/ImageUploader.tsx`

**Steps:**

1. `campaigns/page.tsx` — organizer's campaign list:
   - Server component fetches user's campaigns
   - Table/card view with status badges, amount raised, edit links
   - "Create Campaign" CTA button
   - EmptyState when no campaigns

2. `campaigns/new/page.tsx` — campaign creation:
   - Uses CampaignForm component
   - On submit → POST `/api/campaigns`
   - On success → redirect to `/dashboard/campaigns/[id]`

3. `CampaignForm.tsx` — `"use client"` form:
   - Fields: title, description (Textarea), category (Select from constants), location, goal_amount (number input with ₱ prefix), end_date (date input), featured image (ImageUploader), additional images (ImageUploader multi)
   - Client-side validation before submit
   - Loading state on submit button
   - Reusable for both create and edit

4. `ImageUploader.tsx` — `"use client"` component:
   - Drag-and-drop or click to upload
   - Preview thumbnails
   - Calls `/api/upload` on file select
   - Returns image URL to parent form
   - Supports single and multiple mode
   - Remove button per image

5. Run `pnpm typecheck && pnpm lint`
6. Commit: `git commit -m "feat: add campaign creation page and form"`

---

### Task 13: Campaign Edit & Management Pages

**Files:**

- Create: `src/app/(frontend)/(dashboard)/dashboard/campaigns/[id]/page.tsx`
- Create: `src/app/(frontend)/(dashboard)/dashboard/campaigns/[id]/edit/page.tsx`
- Create: `src/app/(frontend)/(dashboard)/dashboard/campaigns/[id]/updates/page.tsx`
- Create: `src/app/(frontend)/(dashboard)/dashboard/campaigns/[id]/donors/page.tsx`
- Create: `src/app/(frontend)/api/campaigns/[id]/updates/route.ts`

**Steps:**

1. `campaigns/[id]/page.tsx` — campaign detail for organizer:
   - Server component fetches campaign with stats
   - Displays: title, status badge, amount raised / goal (ProgressBar), donor count, dates
   - Quick actions: Edit, Post Update, View Donors, Request Withdrawal
   - Shows recent donations list

2. `campaigns/[id]/edit/page.tsx`:
   - Pre-fills CampaignForm with existing data
   - On submit → PATCH `/api/campaigns/[id]`

3. `campaigns/[id]/updates/page.tsx`:
   - Form to post campaign updates (title + content)
   - List of previous updates
   - POST `/api/campaigns/[id]/updates`

4. `campaigns/[id]/donors/page.tsx`:
   - Table of all donations to this campaign
   - Columns: donor name (or "Anonymous"), amount, date, payment status, method
   - Sortable by amount/date
   - Export to CSV button (nice-to-have)

5. `api/campaigns/[id]/updates/route.ts`:
   - GET: list updates for campaign (public)
   - POST: create update (organizer only)

6. Run `pnpm build`
7. Commit: `git commit -m "feat: add campaign management pages (detail, edit, updates, donors)"`

---

## Phase 3: Public Campaign Pages

### Task 14: Homepage

**Files:**

- Modify: `src/app/(frontend)/(public)/page.tsx`
- Create: `src/components/campaigns/CampaignCard.tsx`
- Create: `src/components/campaigns/CampaignGrid.tsx`

**Steps:**

1. `CampaignCard.tsx` — campaign preview card:
   - Featured image with category badge overlay
   - Title, truncated description
   - ProgressBar showing amount_raised / goal_amount with percentage
   - Organizer name + verified badge (if applicable)
   - Donor count
   - "Donate" CTA button
   - Links to `/campaigns/[slug]`

2. `CampaignGrid.tsx` — responsive grid of CampaignCards:
   - CSS grid: 1 col mobile, 2 cols tablet, 3 cols desktop
   - Loading state with Skeleton cards
   - EmptyState when no campaigns

3. Homepage (`page.tsx`):
   - Hero section: tagline "Fund for Us" + search bar + "Start a Campaign" CTA
   - Trending campaigns section (top by recent donations)
   - Near Goal section (campaigns >75% funded)
   - Recent campaigns section
   - Categories quick-filter row
   - Each section fetches server-side from Supabase

4. Run `pnpm build`
5. Commit: `git commit -m "feat: add homepage with campaign cards and sections"`

---

### Task 15: Campaign Browse & Search Page

**Files:**

- Create: `src/app/(frontend)/(public)/campaigns/page.tsx`
- Create: `src/components/campaigns/CampaignFilters.tsx`
- Create: `src/components/campaigns/CampaignSearch.tsx`

**Steps:**

1. `CampaignSearch.tsx` — `"use client"` search input:
   - Debounced search (300ms)
   - Updates URL search params via `useRouter` / `useSearchParams`

2. `CampaignFilters.tsx` — `"use client"` filter sidebar/bar:
   - Category filter (checkboxes from constants)
   - Sort select: Most Funded, Most Recent, Ending Soon, Near Goal
   - Location filter (text input or select for PH regions)
   - Updates URL search params

3. `campaigns/page.tsx`:
   - Server component reads searchParams
   - Fetches campaigns via Supabase with filters applied
   - Renders CampaignSearch + CampaignFilters + CampaignGrid
   - Pagination at bottom (load more or numbered pages)

4. Run `pnpm build`
5. Commit: `git commit -m "feat: add campaign browse page with search and filters"`

---

### Task 16: Campaign Detail Page

**Files:**

- Create: `src/app/(frontend)/(public)/campaigns/[slug]/page.tsx`
- Create: `src/components/campaigns/CampaignDetail.tsx`
- Create: `src/components/campaigns/DonorList.tsx`
- Create: `src/components/campaigns/CampaignUpdates.tsx`
- Create: `src/components/campaigns/TopDonors.tsx`
- Create: `src/components/campaigns/ShareButton.tsx`

**Steps:**

1. `campaigns/[slug]/page.tsx` — server component:
   - Fetches campaign by slug with organizer info, images, updates, top donors
   - Generates dynamic metadata (title, description, OG image)
   - Renders CampaignDetail

2. `CampaignDetail.tsx`:
   - Image gallery (featured + additional images)
   - Title, category badge, verified badge
   - ProgressBar with amount raised / goal + percentage + donor count
   - Description (full text)
   - Organizer info card (name, avatar, verified status)
   - "Donate Now" CTA button (links to `/donate/[slug]`)
   - Share button

3. `DonorList.tsx` — recent donations:
   - Shows last 10 donations
   - Each: avatar/initials, name (or "Anonymous"), amount, relative time, badge icon
   - "See all donors" link

4. `TopDonors.tsx` — top 5 donors for this campaign:
   - Ranked list with position number
   - Name, amount, badge tier icon
   - Anonymous donors shown as "Anonymous Donor" with badge

5. `CampaignUpdates.tsx` — timeline of organizer updates:
   - Title, content, date for each update
   - Most recent first

6. `ShareButton.tsx` — `"use client"`:
   - Web Share API (mobile) or copy-to-clipboard (desktop)
   - Share campaign URL with title

7. Handle `?donated=true` search param — show thank you toast/banner + confetti (dynamic import `canvas-confetti`)

8. Run `pnpm build`
9. Commit: `git commit -m "feat: add campaign detail page with donors, updates, sharing"`

---

## Phase 4: Donation Flow

### Task 17: Exchange Rate API

**Files:**

- Create: `src/app/(frontend)/api/exchange-rate/route.ts`
- Create: `src/lib/utils/exchange-rate.ts`

**Steps:**

1. `exchange-rate.ts` — helper function:
   - Fetches from Supabase `exchange_rates` table first
   - If stale (>1 hour), fetches from `open.er-api.com/v6/latest/USD`, extracts PHP rate, upserts into table
   - Returns `{ rate: number, fetchedAt: string }`

2. `GET /api/exchange-rate`:
   - Calls the helper
   - Returns `{ usd_to_php: number, fetched_at: string }`
   - Cacheable — set `Cache-Control: public, max-age=300` (5 min)

3. Run `pnpm typecheck`
4. Commit: `git commit -m "feat: add exchange rate API with caching"`

---

### Task 18: Donation API & Dragonpay Integration

**Files:**

- Create: `src/lib/dragonpay/client.ts`
- Create: `src/lib/dragonpay/types.ts`
- Create: `src/app/(frontend)/api/donations/route.ts`
- Create: `src/app/(frontend)/api/donations/webhook/route.ts`
- Create: `src/app/(frontend)/api/donations/history/route.ts`

**Steps:**

1. `dragonpay/types.ts` — Dragonpay API types:
   - `DragonpayCreateRequest` — merchantId, txnId, amount, currency, description, email, procId
   - `DragonpayCreateResponse` — url, txnId, status
   - `DragonpayWebhookPayload` — txnId, refNo, status, message, digest

2. `dragonpay/client.ts` — Dragonpay API wrapper:
   - `createPayment(params)` — calls Dragonpay REST API to create payment, returns payment URL
   - `verifyWebhookDigest(payload)` — validates webhook signature using HMAC with merchant password
   - Uses `DRAGONPAY_MERCHANT_ID`, `DRAGONPAY_PASSWORD`, `DRAGONPAY_API_URL` env vars

3. `POST /api/donations` — create donation:
   - Accepts: campaign_id, amount, currency, donor_name, donor_email, is_anonymous, platform_tip, cover_fee, payment_method
   - If logged in, sets donor_id from session
   - If USD, converts to PHP using exchange rate helper (stores both original and converted)
   - Calculates processing fee based on payment method
   - Inserts `donations` row with `payment_status: 'pending'`
   - Calls Dragonpay `createPayment()` with the total amount
   - Returns `{ paymentUrl: string, donationId: string }`

4. `POST /api/donations/webhook` — Dragonpay callback:
   - Validates webhook digest signature
   - Finds donation by `dragonpay_txn_id`
   - Updates `payment_status` to `confirmed` or `failed` based on Dragonpay status code
   - DB triggers handle the rest (campaign totals, badge checks)
   - Returns 200 OK to Dragonpay
   - If donation not found, log error and return 200 (don't retry)

5. `GET /api/donations/history` — user's donation history:
   - Auth required
   - Returns paginated list of user's donations with campaign title/slug
   - Includes: amount, currency, date, status, campaign name, is_anonymous

6. Run `pnpm typecheck`
7. Commit: `git commit -m "feat: add donation API with Dragonpay integration and webhook"`

---

### Task 19: Donation Checkout Page

**Files:**

- Create: `src/app/(frontend)/(public)/donate/[slug]/page.tsx`
- Create: `src/components/donations/DonationForm.tsx`
- Create: `src/components/donations/DonationSummary.tsx`
- Create: `src/components/donations/CurrencyToggle.tsx`
- Create: `src/components/donations/PaymentMethodSelector.tsx`
- Create: `src/components/donations/TipSelector.tsx`

**Steps:**

1. `donate/[slug]/page.tsx` — server component:
   - Fetches campaign by slug (must be active)
   - Fetches current user session (nullable — guest donations allowed)
   - Renders DonationForm with campaign data

2. `CurrencyToggle.tsx` — PHP/USD switch:
   - Two-button toggle
   - When USD selected, fetches exchange rate and shows conversion preview

3. `PaymentMethodSelector.tsx` — payment method selection:
   - Cards showing: GCash, Maya, GoTyme, Debit/Credit Card, Bank Transfer
   - Each with icon and name
   - Selected state styling

4. `TipSelector.tsx` — optional platform tip:
   - Suggested amount from `tip-suggestions.ts` based on donation amount
   - Quick-select buttons: ₱0, suggested amount, custom
   - Custom input field
   - Clear messaging: "Support FundKita — optional"

5. `DonationSummary.tsx` — checkout breakdown:
   - Donation amount (in selected currency + PHP equivalent if USD)
   - Processing fee (with checkbox: "Cover the fee so campaign receives full amount")
   - Platform tip
   - Total
   - Campaign name and progress

6. `DonationForm.tsx` — `"use client"` orchestrator:
   - If guest: donor name + email fields
   - If logged in: auto-filled, editable
   - Anonymous toggle checkbox
   - Amount input with CurrencyToggle
   - PaymentMethodSelector
   - TipSelector
   - DonationSummary (updates reactively)
   - "Donate" button → calls `POST /api/donations` → redirects to Dragonpay URL
   - Handle `?error=payment` searchParam — show error message with retry

7. Run `pnpm build`
8. Commit: `git commit -m "feat: add donation checkout page with full form flow"`

---

## Phase 5: User Dashboard

### Task 20: Donor Dashboard

**Files:**

- Modify: `src/app/(frontend)/(dashboard)/dashboard/page.tsx`
- Create: `src/app/(frontend)/(dashboard)/dashboard/donations/page.tsx`
- Create: `src/components/dashboard/DonorOverview.tsx`
- Create: `src/components/dashboard/DonationHistoryTable.tsx`
- Create: `src/components/dashboard/BadgeGallery.tsx`
- Create: `src/components/dashboard/BadgeProgress.tsx`

**Steps:**

1. `dashboard/page.tsx` — main dashboard:
   - Server component — fetches user data, donor_stats, recent donations, badges
   - Shows different content based on role:
     - Donor: DonorOverview
     - Organizer: DonorOverview + "My Campaigns" quick summary
   - Cards: total donated, campaigns supported, current badge tier

2. `DonorOverview.tsx`:
   - Stats cards: total donated (₱), number of donations, campaigns supported
   - Current badge with progress to next tier (BadgeProgress)
   - Recent donations list (last 5)

3. `DonationHistoryTable.tsx` — `"use client"`:
   - Full table of donations with sorting
   - Columns: date, campaign, amount, currency, status, method, anonymous?
   - StatusBadge for payment status
   - Campaign name links to campaign page
   - Pagination

4. `BadgeGallery.tsx`:
   - Grid of all 10 badge tiers
   - Earned badges: full color
   - Unearned badges: greyed out with lock icon
   - Click for tooltip showing tier name + threshold

5. `BadgeProgress.tsx`:
   - Current tier name + emoji
   - ProgressBar to next tier
   - "₱X more to reach [next tier]" text

6. `dashboard/donations/page.tsx`:
   - Full donations page using DonationHistoryTable
   - Filter by date range, status

7. Run `pnpm build`
8. Commit: `git commit -m "feat: add donor dashboard with donation history and badge gallery"`

---

### Task 21: Settings & KYC Submission

**Files:**

- Create: `src/app/(frontend)/(dashboard)/dashboard/settings/page.tsx`
- Create: `src/components/dashboard/ProfileForm.tsx`
- Create: `src/components/dashboard/KycForm.tsx`
- Create: `src/app/(frontend)/api/kyc/route.ts`
- Create: `src/app/(frontend)/api/kyc/[id]/route.ts`

**Steps:**

1. `settings/page.tsx`:
   - Tabs: Profile, Verification (KYC)
   - Profile tab: ProfileForm
   - Verification tab: KycForm (if organizer) or "Become an organizer" CTA

2. `ProfileForm.tsx` — `"use client"`:
   - Fields: full name, username, avatar (ImageUploader)
   - Saves to `users` table via direct Supabase update
   - Success toast

3. `KycForm.tsx` — `"use client"`:
   - ID type select (national_id, passport, drivers_license, philsys)
   - ID front image upload
   - ID back image upload
   - Selfie upload
   - Submit button → POST `/api/kyc`
   - Shows current KYC status if already submitted
   - If approved: green checkmark
   - If rejected: red message with reason + resubmit option

4. `POST /api/kyc` — submit KYC:
   - Auth required, organizer role
   - Validates all images uploaded
   - Inserts into `kyc_submissions` with status `pending`

5. `GET /api/kyc` — list KYC submissions (admin):
   - Admin role required
   - Returns paginated list of pending/all submissions

6. `PATCH /api/kyc/[id]` — review KYC (admin):
   - Admin role required
   - Accepts `{ status: 'approved' | 'rejected', rejection_reason? }`
   - If approved: updates `users.is_verified = true`
   - Sends email notification via Resend

7. Run `pnpm typecheck`
8. Commit: `git commit -m "feat: add settings page with profile and KYC submission"`

---

### Task 22: Withdrawal Requests

**Files:**

- Create: `src/app/(frontend)/(dashboard)/dashboard/campaigns/[id]/withdraw/page.tsx`
- Create: `src/components/dashboard/WithdrawalForm.tsx`
- Create: `src/app/(frontend)/api/withdrawals/route.ts`
- Create: `src/app/(frontend)/api/withdrawals/[id]/route.ts`

**Steps:**

1. `withdraw/page.tsx`:
   - Server component — fetches campaign with balance info
   - Shows: total raised, previous withdrawals, available balance
   - Requires KYC approved — if not, show message + link to settings
   - WithdrawalForm

2. `WithdrawalForm.tsx` — `"use client"`:
   - Amount input (max = available balance)
   - Payout method select: GCash, Maya, Bank Transfer
   - Payout details: account number/name (stored as JSONB)
   - Submit → POST `/api/withdrawals`

3. `POST /api/withdrawals` — request withdrawal:
   - Auth required, must be campaign organizer
   - Validates: KYC approved, amount <= available balance, no pending withdrawal for same campaign
   - Inserts with status `pending`

4. `GET /api/withdrawals` — list withdrawals:
   - Organizer: own withdrawals
   - Admin: all withdrawals

5. `PATCH /api/withdrawals/[id]` — admin review:
   - Admin role required
   - Accepts `{ status: 'approved' | 'rejected' | 'processed' }`
   - Sends email notification

6. Run `pnpm typecheck`
7. Commit: `git commit -m "feat: add withdrawal request flow"`

---

## Phase 6: Admin Panel

### Task 23: Admin Overview & Campaign Moderation

**Files:**

- Modify: `src/app/(frontend)/(admin)/admin/page.tsx`
- Create: `src/app/(frontend)/(admin)/admin/campaigns/page.tsx`
- Create: `src/app/(frontend)/(admin)/admin/campaigns/[id]/page.tsx`
- Create: `src/app/(frontend)/api/admin/campaigns/[id]/route.ts`
- Create: `src/app/(frontend)/api/admin/reports/route.ts`

**Steps:**

1. `admin/page.tsx` — overview dashboard:
   - Stats cards: total donations (₱), active campaigns, pending reviews, pending KYC, open fraud flags
   - Fetches counts via service client or aggregated query
   - Quick links to each admin section

2. `admin/campaigns/page.tsx` — campaign moderation queue:
   - Tabs: Pending Review, Active, Paused, All
   - Table: title, organizer, goal, status, created date, actions
   - Click row → detail page

3. `admin/campaigns/[id]/page.tsx` — campaign review:
   - Full campaign details: images, description, organizer info, KYC status
   - Action buttons: Approve, Reject (with reason modal), Pause
   - Donation stats for this campaign

4. `PATCH /api/admin/campaigns/[id]`:
   - Admin role required (use service client)
   - Accepts `{ action: 'approve' | 'reject' | 'pause' | 'unpause', reason? }`
   - Updates campaign status accordingly
   - Sends email to organizer

5. `GET /api/admin/reports`:
   - Admin role required
   - Returns: total donations by period, top campaigns, payment method breakdown, active campaign count
   - Accepts `period` param: `day`, `week`, `month`, `all`

6. Run `pnpm build`
7. Commit: `git commit -m "feat: add admin overview and campaign moderation"`

---

### Task 24: Admin KYC, Withdrawals & Fraud

**Files:**

- Create: `src/app/(frontend)/(admin)/admin/kyc/page.tsx`
- Create: `src/app/(frontend)/(admin)/admin/withdrawals/page.tsx`
- Create: `src/app/(frontend)/(admin)/admin/fraud/page.tsx`
- Create: `src/app/(frontend)/(admin)/admin/reports/page.tsx`
- Create: `src/app/(frontend)/api/admin/fraud/route.ts`

**Steps:**

1. `admin/kyc/page.tsx`:
   - Table of KYC submissions: user name, ID type, status, submitted date
   - Click to expand: view ID images, selfie
   - Approve / Reject buttons with reason modal for rejection
   - Calls PATCH `/api/kyc/[id]`

2. `admin/withdrawals/page.tsx`:
   - Table: campaign, organizer, amount, method, status, requested date
   - Approve → `approved`, then Process → `processed` (two-step)
   - Reject with reason
   - Calls PATCH `/api/withdrawals/[id]`

3. `admin/fraud/page.tsx`:
   - Table of fraud flags: campaign, reason, status, flagged date
   - Actions: Dismiss, Resolve (with notes), Pause Campaign
   - Create new flag: select campaign, enter reason

4. `POST /api/admin/fraud` — create/update fraud flag:
   - Admin role required
   - POST: create flag (campaign_id, reason)
   - PATCH: update status (resolve, dismiss)

5. `admin/reports/page.tsx`:
   - Total donations chart (by day/week/month)
   - Top 10 campaigns table
   - Payment method pie/bar chart
   - Simple implementation using CSS-based charts or basic SVG (no charting library for MVP)

6. Run `pnpm build`
7. Commit: `git commit -m "feat: add admin KYC review, withdrawal processing, fraud management, reports"`

---

## Phase 7: Gamification & Leaderboard

### Task 25: Leaderboard Page & API

**Files:**

- Create: `src/app/(frontend)/(public)/leaderboard/page.tsx`
- Create: `src/app/(frontend)/api/leaderboard/route.ts`
- Create: `src/components/leaderboard/LeaderboardTable.tsx`
- Create: `src/components/leaderboard/DonorBadgeIcon.tsx`

**Steps:**

1. `DonorBadgeIcon.tsx` — small component:
   - Accepts `tier` number
   - Renders emoji + tooltip with tier name and threshold
   - Used everywhere donor badges appear

2. `GET /api/leaderboard`:
   - Query params: `period` (`all_time` | `this_month` | `this_week`), `limit` (default 50)
   - For `all_time`: query `donor_stats` ordered by `lifetime_donations_php` DESC
   - For time periods: aggregate `donations` table within date range
   - Returns: rank, user name, avatar, total donated, badge tier, donation count
   - Anonymous donors: included but shown as "Anonymous Donor"

3. `LeaderboardTable.tsx`:
   - Ranked list with position medals for top 3 (gold, silver, bronze styling)
   - Avatar, name, badge icon, total donated, donation count
   - Responsive: card layout on mobile, table on desktop

4. `leaderboard/page.tsx`:
   - Server component
   - Tabs for time period filter (All Time, This Month, This Week)
   - LeaderboardTable
   - "Your Rank" card if logged in (highlighted row)

5. Run `pnpm build`
6. Commit: `git commit -m "feat: add leaderboard page with time period filters"`

---

## Phase 8: Email Notifications

### Task 26: Email Templates & Integration

**Files:**

- Modify: `src/lib/email/send.ts`
- Create: `src/lib/email/templates/donation-receipt.ts`
- Create: `src/lib/email/templates/campaign-approved.ts`
- Create: `src/lib/email/templates/campaign-rejected.ts`
- Create: `src/lib/email/templates/kyc-approved.ts`
- Create: `src/lib/email/templates/kyc-rejected.ts`
- Create: `src/lib/email/templates/withdrawal-processed.ts`

**Steps:**

1. Uncomment and activate `send.ts` — the Resend `sendEmail()` function. Keep graceful skip if no API key.

2. Create HTML email templates following EventTara's pattern:
   - Each template is a function that accepts params and returns `{ subject, html }`
   - `donation-receipt.ts` — donor receives: campaign name, amount, date, transaction ID
   - `campaign-approved.ts` — organizer receives: campaign title, link to view
   - `campaign-rejected.ts` — organizer receives: campaign title, rejection reason
   - `kyc-approved.ts` — user receives: verification confirmed message
   - `kyc-rejected.ts` — user receives: rejection reason, link to resubmit
   - `withdrawal-processed.ts` — organizer receives: amount, payout method, campaign name

3. Wire emails into existing API routes:
   - Donation webhook (confirmed) → send donation receipt
   - Admin campaign approve/reject → send notification
   - Admin KYC approve/reject → send notification
   - Admin withdrawal process → send notification

4. Run `pnpm typecheck`
5. Commit: `git commit -m "feat: add email templates and wire into API routes"`

---

## Phase 9: SEO & Polish

### Task 27: Dynamic OG Images & SEO

**Files:**

- Create: `src/app/(frontend)/(public)/campaigns/[slug]/opengraph-image.tsx`
- Modify: `src/app/sitemap.ts`
- Modify: `src/app/robots.ts`

**Steps:**

1. `opengraph-image.tsx` — dynamic OG image for campaigns:
   - Uses Next.js `ImageResponse` API
   - Shows: campaign title, amount raised / goal, progress bar, FundKita branding
   - Size: 1200x630

2. Update `sitemap.ts`:
   - Fetch all active campaigns from Supabase
   - Generate entries for: homepage, `/campaigns`, `/leaderboard`, and each `/campaigns/[slug]`

3. Update `robots.ts`:
   - Allow all crawlers
   - Reference sitemap URL

4. Add `generateMetadata` to campaign detail page if not already done (title, description from campaign data)

5. Run `pnpm build`
6. Commit: `git commit -m "feat: add dynamic OG images and sitemap for campaigns"`

---

## Phase 10: Demo Mode & Seed Data

### Task 28: Seed Script

**Files:**

- Create: `scripts/seed.ts`
- Create: `scripts/unseed.ts`
- Modify: `package.json` (add seed/unseed scripts)

**Steps:**

1. Add scripts to `package.json`:

   ```json
   "seed": "tsx scripts/seed.ts",
   "unseed": "tsx scripts/unseed.ts"
   ```

2. `seed.ts`:
   - Uses `createServiceClient()` (requires `SUPABASE_SERVICE_ROLE_KEY`)
   - Creates 5 demo auth users via `supabase.auth.admin.createUser()`
   - Creates `users` rows (if trigger doesn't handle it) with roles
   - Creates 4 campaigns:
     - "Help Maria's Family" (medical, active, 60% funded)
     - "Typhoon Relief Fund" (disaster_relief, active, 90% funded — near goal)
     - "Scholars for Tomorrow" (education, active, 30% funded)
     - "Community Kitchen Project" (community, completed, 100%+ funded)
   - Creates 30 donations spread across campaigns (mix of anonymous and named)
   - Creates `donor_stats` and `donor_badges` for Juan Cruz (Champion tier) and Ana Reyes (First Step tier)
   - Creates a pending KYC submission for Maria
   - Creates a pending withdrawal request for the completed campaign
   - Logs progress to console

3. `unseed.ts`:
   - Deletes all seeded data in reverse order (donations, campaigns, users)
   - Uses demo user emails to identify seeded data
   - Deletes auth users via `supabase.auth.admin.deleteUser()`

4. Run `pnpm seed` to verify
5. Commit: `git commit -m "feat: add seed and unseed scripts for demo data"`

---

### Task 29: Demo Banner Polish & Final Integration

**Files:**

- Modify: `src/components/layout/DemoBanner.tsx`
- Modify: `src/app/(frontend)/api/auth/demo-login/route.ts`

**Steps:**

1. Polish DemoBanner:
   - Show current user's name and role badge
   - Quick-switch buttons styled as pills: Maria (Organizer), Juan (Donor), Ana (Donor), Admin, Guest (logout)
   - Active user button highlighted
   - "Guest" button signs out and redirects to homepage
   - Smooth transition on switch (loading spinner briefly)

2. Polish demo-login API:
   - Handle all 4 demo users + guest (sign out)
   - Use `supabase.auth.admin.generateLink({ type: 'magiclink', email })` to create login link
   - Exchange the link token for a session
   - Set cookies properly for seamless switch

3. Test full demo flow: switch between all users, verify each sees correct dashboard content

4. Run `pnpm build`
5. Commit: `git commit -m "feat: polish demo mode banner and user switching"`

---

## Phase 11: Final Verification

### Task 30: End-to-End Smoke Test & Cleanup

**Files:**

- Modify: `e2e/home.spec.ts`
- Create: `e2e/campaign.spec.ts`
- Create: `e2e/donate.spec.ts`

**Steps:**

1. Update `e2e/home.spec.ts`:
   - Test homepage loads with "FundKita" title
   - Test campaign cards are visible (requires seed data)

2. `e2e/campaign.spec.ts`:
   - Test campaign browse page loads
   - Test campaign detail page loads for a seeded campaign
   - Test search filters work

3. `e2e/donate.spec.ts`:
   - Test donation form loads for a campaign
   - Test form validation (empty fields show errors)
   - Test currency toggle switches

4. Run full CI pipeline: `pnpm format:check && pnpm lint && pnpm typecheck && pnpm build`

5. Fix any lint/type errors discovered

6. Final commit: `git commit -m "feat: add E2E smoke tests and final cleanup"`

---

## Summary

| Phase            | Tasks | What's Built                                              |
| ---------------- | ----- | --------------------------------------------------------- |
| 0: Bootstrap     | 1-4   | Project setup, DB types, SQL migration, constants         |
| 1: Layout & Auth | 5-10  | Route groups, icons, UI components, navbar, auth, layouts |
| 2: Campaign CRUD | 11-13 | Campaign API, creation, editing, management pages         |
| 3: Public Pages  | 14-16 | Homepage, browse/search, campaign detail                  |
| 4: Donations     | 17-19 | Exchange rate, Dragonpay integration, checkout page       |
| 5: Dashboard     | 20-22 | Donor dashboard, badges, settings, KYC, withdrawals       |
| 6: Admin         | 23-24 | Admin overview, moderation, KYC review, fraud, reports    |
| 7: Gamification  | 25    | Leaderboard page and API                                  |
| 8: Email         | 26    | All email templates wired in                              |
| 9: SEO           | 27    | OG images, sitemap, metadata                              |
| 10: Demo         | 28-29 | Seed script, demo banner polish                           |
| 11: Verification | 30    | E2E tests, CI pipeline, cleanup                           |

**Total: 30 tasks across 11 phases.**
