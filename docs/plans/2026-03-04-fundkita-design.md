# FundKita — Design Document

**Date:** 2026-03-04
**Stack:** Next.js 15 + React 19 + Supabase + Tailwind CSS
**Payment:** Dragonpay (GCash, Maya, cards, bank transfers)
**Base:** scaffold-nextjs template

---

## Overview

FundKita is a GoFundMe-style crowdfunding platform for the Philippines. The name means "Fund for us" — emphasizing communal Filipino giving culture. The platform operates on a 0% platform fee model with optional donor tips.

---

## Architecture: Supabase-First

All business logic for financial consistency lives in Supabase (DB triggers, RLS policies). Next.js API routes are thin wrappers that authenticate, validate, and call Supabase. This ensures atomic updates on donation totals and badge computation even under concurrent donations.

---

## Database Schema

### Users & Auth

**users**

- id (uuid, PK, references auth.users)
- email (text)
- full_name (text)
- username (text, unique)
- avatar_url (text, nullable)
- role (text: 'donor' | 'organizer' | 'admin')
- is_verified (boolean, default false)
- created_at (timestamptz)

**kyc_submissions**

- id (uuid, PK)
- user_id (uuid, FK → users)
- id_type (text: 'national_id' | 'passport' | 'drivers_license' | 'philsys')
- id_front_url (text)
- id_back_url (text)
- selfie_url (text)
- status (text: 'pending' | 'approved' | 'rejected')
- rejection_reason (text, nullable)
- reviewed_by (uuid, FK → users, nullable)
- reviewed_at (timestamptz, nullable)
- created_at (timestamptz)

### Campaigns

**campaigns**

- id (uuid, PK)
- organizer_id (uuid, FK → users)
- title (text)
- slug (text, unique)
- description (text)
- category (text: 'medical' | 'disaster_relief' | 'education' | 'community' | 'emergency' | 'personal' | 'other')
- location (text)
- goal_amount (numeric, PHP)
- amount_raised (numeric, PHP, default 0)
- donor_count (integer, default 0)
- status (text: 'draft' | 'pending_review' | 'active' | 'paused' | 'completed' | 'closed')
- is_verified (boolean, default false — set true when organizer passes KYC)
- featured_image_url (text, nullable)
- end_date (timestamptz, nullable)
- created_at (timestamptz)
- updated_at (timestamptz)

**campaign_images**

- id (uuid, PK)
- campaign_id (uuid, FK → campaigns)
- image_url (text)
- sort_order (integer)

**campaign_updates**

- id (uuid, PK)
- campaign_id (uuid, FK → campaigns)
- title (text)
- content (text)
- created_at (timestamptz)

### Donations

**donations**

- id (uuid, PK)
- campaign_id (uuid, FK → campaigns)
- donor_id (uuid, FK → users, nullable — null for guest donors)
- donor_name (text)
- donor_email (text)
- amount_php (numeric — actual amount campaign receives)
- original_amount (numeric — what donor entered)
- original_currency (text: 'PHP' | 'USD')
- exchange_rate (numeric — rate used at donation time)
- platform_tip (numeric, default 0)
- processing_fee (numeric)
- fee_covered_by_donor (boolean, default false)
- payment_method (text: 'gcash' | 'maya' | 'card' | 'bank_transfer' | 'gotyme')
- payment_status (text: 'pending' | 'confirmed' | 'failed' | 'refunded')
- is_anonymous (boolean, default false)
- dragonpay_txn_id (text, nullable)
- created_at (timestamptz)

### Gamification

**donor_stats**

- user_id (uuid, PK, FK → users)
- lifetime_donations_php (numeric, default 0)
- donation_count (integer, default 0)
- current_tier (integer, default 0)

**donor_badges**

- id (uuid, PK)
- user_id (uuid, FK → users)
- badge_tier (integer, 1-10)
- badge_name (text)
- awarded_at (timestamptz)

### Admin

**fraud_flags**

- id (uuid, PK)
- campaign_id (uuid, FK → campaigns)
- reason (text)
- flagged_by (uuid, FK → users)
- status (text: 'open' | 'resolved' | 'dismissed')
- created_at (timestamptz)

**withdrawal_requests**

- id (uuid, PK)
- campaign_id (uuid, FK → campaigns)
- organizer_id (uuid, FK → users)
- amount (numeric)
- status (text: 'pending' | 'approved' | 'rejected' | 'processed')
- payout_method (text: 'gcash' | 'maya' | 'bank_transfer')
- payout_details (jsonb)
- reviewed_by (uuid, FK → users, nullable)
- reviewed_at (timestamptz, nullable)
- created_at (timestamptz)

### Utility

**exchange_rates**

- id (uuid, PK)
- from_currency (text)
- to_currency (text)
- rate (numeric)
- fetched_at (timestamptz)

### DB Triggers

1. **On donation confirmed** → increment `campaigns.amount_raised` by `amount_php`, increment `campaigns.donor_count`
2. **On donation confirmed** → upsert `donor_stats` (add to lifetime total, increment count), check badge tier thresholds, insert new badge if tier reached
3. **On donation refunded** → decrement `campaigns.amount_raised` and `donor_count`, decrement `donor_stats.lifetime_donations_php` (badges are NOT revoked on refund — grace policy)

---

## Route Structure

```
src/app/
├── (frontend)/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   └── layout.tsx
│   │
│   ├── (public)/
│   │   ├── page.tsx                      # Homepage
│   │   ├── campaigns/page.tsx            # Browse/search/filter
│   │   ├── campaigns/[slug]/page.tsx     # Campaign detail
│   │   ├── donate/[slug]/page.tsx        # Standalone donation checkout
│   │   ├── leaderboard/page.tsx          # Platform-wide top donors
│   │   └── layout.tsx                    # Navbar + footer
│   │
│   ├── (dashboard)/
│   │   ├── dashboard/page.tsx            # Donor overview
│   │   ├── dashboard/donations/page.tsx
│   │   ├── dashboard/campaigns/page.tsx
│   │   ├── dashboard/campaigns/new/page.tsx
│   │   ├── dashboard/campaigns/[id]/page.tsx
│   │   ├── dashboard/campaigns/[id]/edit/page.tsx
│   │   ├── dashboard/campaigns/[id]/updates/page.tsx
│   │   ├── dashboard/campaigns/[id]/donors/page.tsx
│   │   ├── dashboard/campaigns/[id]/withdraw/page.tsx
│   │   ├── dashboard/settings/page.tsx
│   │   └── layout.tsx                    # Sidebar + auth guard
│   │
│   ├── (admin)/
│   │   ├── admin/page.tsx                # Overview stats
│   │   ├── admin/campaigns/page.tsx
│   │   ├── admin/campaigns/[id]/page.tsx
│   │   ├── admin/kyc/page.tsx
│   │   ├── admin/withdrawals/page.tsx
│   │   ├── admin/fraud/page.tsx
│   │   ├── admin/reports/page.tsx
│   │   └── layout.tsx                    # Admin layout + role guard
│   │
│   ├── api/
│   │   ├── campaigns/route.ts            # GET/POST
│   │   ├── campaigns/[id]/route.ts       # GET/PATCH/DELETE
│   │   ├── campaigns/[id]/updates/route.ts
│   │   ├── donations/route.ts            # POST (create donation)
│   │   ├── donations/webhook/route.ts    # Dragonpay webhook
│   │   ├── donations/history/route.ts    # GET (user's donations)
│   │   ├── kyc/route.ts                  # POST submit, GET list
│   │   ├── kyc/[id]/route.ts             # PATCH review
│   │   ├── withdrawals/route.ts          # POST request, GET list
│   │   ├── withdrawals/[id]/route.ts     # PATCH approve/reject
│   │   ├── leaderboard/route.ts          # GET top donors
│   │   ├── exchange-rate/route.ts        # GET live rate
│   │   ├── upload/route.ts               # POST image upload
│   │   ├── admin/campaigns/[id]/route.ts # PATCH approve/reject/pause
│   │   ├── admin/fraud/route.ts          # GET/POST flags
│   │   ├── admin/reports/route.ts        # GET stats
│   │   └── auth/demo-login/route.ts      # POST demo user switch
│   │
│   ├── auth/callback/route.ts
│   └── layout.tsx
```

---

## Donation & Payment Flow

1. **Donor fills donation form** — amount, currency, visibility, optional fee coverage + tip
2. **If USD** — live exchange rate fetched from `/api/exchange-rate`, PHP equivalent shown
3. **Checkout summary displayed** — donation, fee, tip, total clearly broken down
4. **API creates `donations` row** with `payment_status: 'pending'`
5. **Dragonpay API called** — creates payment transaction, returns payment URL
6. **Donor redirected to Dragonpay** — selects GCash/Maya/card/bank, completes payment
7. **Dragonpay webhook hits** `/api/donations/webhook` — validates signature, updates status
8. **DB triggers fire** — update campaign totals, donor stats, badge checks
9. **Receipt email sent** via Resend

**Return URLs:**

- Success: `/campaigns/[slug]?donated=true` — thank you + confetti
- Failure: `/donate/[slug]?error=payment` — retry option

**Edge cases:**

- Webhook delayed → donation stays `pending`, cron checks Dragonpay API
- Donor abandons → stays `pending`, auto-expires after 24h
- Refund → admin triggers, DB trigger decrements totals

---

## Business Model

**0% platform fee** — campaigns receive full donation amount minus payment processing fees.

**Revenue from optional tips:**

| Donation Amount | Suggested Tip |
| --------------- | ------------- |
| ₱100–₱499       | ₱5            |
| ₱500–₱999       | ₱20           |
| ₱1,000–₱4,999   | ₱50           |
| ₱5,000+         | ₱100          |

Tips are optional, editable, and clearly labeled. Donors can set to ₱0.

---

## Badge Tier System

10-tier system based on lifetime PHP donations (computed after currency conversion):

| Tier | Badge Name     | Threshold |
| ---- | -------------- | --------- |
| 1    | First Step     | ₱100      |
| 2    | Supporter      | ₱500      |
| 3    | Helper         | ₱1,000    |
| 4    | Advocate       | ₱5,000    |
| 5    | Champion       | ₱10,000   |
| 6    | Patron         | ₱25,000   |
| 7    | Legacy Builder | ₱50,000   |
| 8    | Humanitarian   | ₱100,000  |
| 9    | Benefactor     | ₱250,000  |
| 10   | Philanthropist | ₱500,000+ |

- Badges auto-awarded via DB trigger
- Displayed on campaign donor lists, user profiles, leaderboards
- Once earned, badges are kept even if donations are refunded (grace policy)
- Only admin can revoke badges (chargeback/fraud cases)

---

## Leaderboards

**Per-campaign:** Top 5 donors shown on campaign page. Anonymous donors ranked but displayed as "Anonymous Donor" with badge icon.

**Platform-wide:** `/leaderboard` page. Filterable by all-time, this month, this week. Pulls from `donor_stats` table.

---

## Admin Panel

**Campaign moderation:** Approve/reject/pause campaigns. New campaigns start as `pending_review`.

**KYC review:** Queue of ID submissions. Admin approves/rejects with reason. Approval sets `users.is_verified = true`.

**Withdrawals:** Queue of requests. Requires KYC approval. Admin approves and processes payout manually (bank transfer/GCash outside the app), marks as `processed`.

**Fraud:** Flag campaigns, pause suspicious ones, freeze withdrawals. Unverified organizers capped at ₱10,000 withdrawal.

**Reports:** Total donations by period, top campaigns, top donors, payment method breakdown.

---

## Demo Mode

Enabled via `NEXT_PUBLIC_DEMO_MODE=true` environment variable.

**Demo banner** fixed at top of page with quick-switch buttons for:

| User         | Role      | Purpose                           |
| ------------ | --------- | --------------------------------- |
| Maria Santos | organizer | 2 active campaigns with donations |
| Juan Cruz    | donor     | Donation history, Champion badge  |
| Ana Reyes    | donor     | New donor, First Step badge       |
| Guest        | (none)    | Tests anonymous donation flow     |
| Admin User   | admin     | Full admin access                 |

Switching calls `/api/auth/demo-login` which uses `createServiceClient()` to sign in as the target user. Seed script (`pnpm seed`) populates demo users, campaigns, donations, and badges.

---

## Technical Decisions

**Image uploads:** Supabase Storage. Buckets: `campaign-images` (public), `kyc-documents` (private), `avatars` (public).

**Email:** Resend. Templates for donation receipts, campaign approval/rejection, KYC results, withdrawal processed. Gracefully skipped if API key not set.

**Exchange rates:** Cached in `exchange_rates` table, refreshed hourly via stale-while-revalidate pattern on `/api/exchange-rate`. Donation records store the rate used for audit.

**Search:** Supabase full-text search on campaign title + description. Filters: category, location, sort (most funded, most recent, ending soon, near goal). Offset/limit pagination.

**Auth:** Supabase Auth — email/password + Google OAuth. Guest donors don't need accounts. Role stored in `users.role`, checked in layout auth guards.

**SEO:** Dynamic OG images per campaign, `robots.ts` + `sitemap.ts`, dynamic metadata from DB.
