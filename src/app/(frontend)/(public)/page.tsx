import Link from "next/link";

import { type CampaignWithOrganizer } from "@/components/campaigns/CampaignCard";
import CampaignGrid from "@/components/campaigns/CampaignGrid";
import { ChevronRightIcon, SearchIcon } from "@/components/icons";
import { Button } from "@/components/ui";
import { CAMPAIGN_CATEGORIES } from "@/lib/constants/categories";
import { createClient } from "@/lib/supabase/server";

const CAMPAIGN_SELECT =
  "id, title, description, category, goal_amount, amount_raised, donor_count, featured_image_url, slug, users!campaigns_organizer_id_fkey(full_name, avatar_url, is_verified)" as const;

export default async function HomePage() {
  const supabase = await createClient();

  // ── Trending: highest amount raised ──────────────────────────────────────────
  const { data: trending } = await supabase
    .from("campaigns")
    .select(CAMPAIGN_SELECT)
    .eq("status", "active")
    .order("amount_raised", { ascending: false })
    .limit(6);

  // ── Almost There: raised > 75% of goal ───────────────────────────────────────
  const { data: almostThereRaw } = await supabase
    .from("campaigns")
    .select(CAMPAIGN_SELECT)
    .eq("status", "active")
    .order("amount_raised", { ascending: false })
    .limit(50);

  const almostThere = (almostThereRaw ?? [])
    .filter((c) => c.goal_amount > 0 && c.amount_raised > c.goal_amount * 0.75)
    .slice(0, 6);

  // ── Recently Added: newest first ─────────────────────────────────────────────
  const { data: recentlyAdded } = await supabase
    .from("campaigns")
    .select(CAMPAIGN_SELECT)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(6);

  const trendingCampaigns = (trending ?? []) as CampaignWithOrganizer[];
  const almostThereCampaigns = almostThere as CampaignWithOrganizer[];
  const recentCampaigns = (recentlyAdded ?? []) as CampaignWithOrganizer[];

  return (
    <>
      {/* ── Hero Section ──────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-teal-600 via-teal-500 to-forest-600 px-4 py-20 text-white sm:py-28">
        {/* Decorative background shapes */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-20 -right-20 h-96 w-96 rounded-full bg-teal-400/20 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-4xl text-center">
          <h1 className="font-heading text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
            Tulong Para Sa Lahat
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-teal-100 sm:text-xl">
            The Philippines&apos; trusted crowdfunding platform. Start a campaign or donate to help
            communities in need.
          </p>

          {/* Search bar */}
          <form action="/campaigns" method="GET" className="mx-auto mt-8 max-w-xl">
            <div className="flex items-center gap-2 rounded-xl bg-white/10 p-2 backdrop-blur-sm">
              <div className="relative flex-1">
                <SearchIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-teal-200" />
                <input
                  type="text"
                  name="search"
                  placeholder="Search campaigns..."
                  className="w-full rounded-lg bg-white/90 py-3 pl-10 pr-4 text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-white/50"
                />
              </div>
              <Button type="submit" size="md" className="shrink-0">
                Search
              </Button>
            </div>
          </form>

          {/* CTA button */}
          <div className="mt-6">
            <Link href="/dashboard/campaigns/new">
              <Button
                variant="outline"
                size="lg"
                className="border-white text-white hover:bg-white/10 dark:text-white dark:hover:bg-white/10"
              >
                Start a Campaign
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Category Quick Filters ────────────────────────────────────────────── */}
      <section className="border-b border-gray-200 bg-gray-50 px-4 py-6 dark:border-gray-800 dark:bg-gray-950">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-wrap items-center justify-center gap-3">
            {CAMPAIGN_CATEGORIES.map((cat) => (
              <Link
                key={cat.value}
                href={`/campaigns?category=${cat.value}`}
                className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:border-teal-300 hover:bg-teal-50 hover:text-teal-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:border-teal-600 dark:hover:bg-teal-950 dark:hover:text-teal-400"
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Campaign Sections ─────────────────────────────────────────────────── */}
      <div className="mx-auto max-w-6xl space-y-16 px-4 py-12">
        {/* Trending */}
        <section>
          <SectionHeader title="Trending Campaigns" emoji={"\uD83D\uDD25"} />
          <CampaignGrid campaigns={trendingCampaigns} emptyMessage="No trending campaigns yet." />
        </section>

        {/* Almost There */}
        <section>
          <SectionHeader title="Almost There" emoji={"\uD83C\uDFC1"} />
          <CampaignGrid
            campaigns={almostThereCampaigns}
            emptyMessage="No campaigns nearing their goal yet."
          />
        </section>

        {/* Recently Added */}
        <section>
          <SectionHeader title="Recently Added" emoji={"\u2728"} />
          <CampaignGrid campaigns={recentCampaigns} emptyMessage="No recent campaigns yet." />
        </section>
      </div>
    </>
  );
}

// ── Section Header ─────────────────────────────────────────────────────────────

function SectionHeader({ title, emoji }: { title: string; emoji: string }) {
  return (
    <div className="mb-6 flex items-center justify-between">
      <h2 className="font-heading text-2xl font-bold text-gray-900 dark:text-gray-100">
        {emoji} {title}
      </h2>
      <Link
        href="/campaigns"
        className="inline-flex items-center gap-1 text-sm font-medium text-teal-600 transition-colors hover:text-teal-500 dark:text-teal-400 dark:hover:text-teal-300"
      >
        See all
        <ChevronRightIcon className="h-4 w-4" />
      </Link>
    </div>
  );
}
