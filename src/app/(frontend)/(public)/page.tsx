import Link from "next/link";

import { type CampaignWithOrganizer } from "@/components/campaigns/CampaignCard";
import DiscoverFundraisers from "@/components/campaigns/DiscoverFundraisers";
import { SearchIcon } from "@/components/icons";
import { Button } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";

const CAMPAIGN_SELECT =
  "id, title, description, category, goal_amount, amount_raised, donor_count, featured_image_url, slug, users!campaigns_organizer_id_fkey(full_name, avatar_url, is_verified)" as const;

export default async function HomePage() {
  const supabase = await createClient();

  const { data: campaigns } = await supabase
    .from("campaigns")
    .select(CAMPAIGN_SELECT)
    .eq("status", "active")
    .order("amount_raised", { ascending: false })
    .limit(30);

  const allCampaigns = (campaigns ?? []) as CampaignWithOrganizer[];

  return (
    <>
      {/* ── Hero Section ──────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-teal-50 via-white to-forest-50 px-4 py-20 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900 sm:py-28">
        {/* Decorative background shapes */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-teal-200/40 blur-3xl dark:bg-teal-500/10" />
          <div className="absolute -bottom-20 -right-20 h-96 w-96 rounded-full bg-forest-200/40 blur-3xl dark:bg-forest-500/10" />
        </div>

        <div className="relative mx-auto max-w-4xl text-center">
          <h1 className="font-heading text-4xl font-bold leading-tight text-gray-900 dark:text-white sm:text-5xl lg:text-6xl">
            Every Peso Sparks Change
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600 dark:text-gray-400 sm:text-xl">
            Small acts, big impact. Join thousands of Filipinos turning generosity into real change,
            one campaign at a time.
          </p>

          {/* Search bar */}
          <form action="/campaigns" method="GET" className="mx-auto mt-8 max-w-xl">
            <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white p-2 shadow-sm dark:border-gray-700 dark:bg-gray-900">
              <div className="relative flex-1">
                <SearchIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  name="search"
                  placeholder="Search campaigns..."
                  className="w-full rounded-lg bg-transparent py-3 pl-10 pr-4 text-gray-900 placeholder:text-gray-400 focus:outline-none dark:text-gray-100"
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
              <Button size="lg" variant="outline">
                Start a Campaign
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Discover Fundraisers ─────────────────────────────────────────────── */}
      <DiscoverFundraisers campaigns={allCampaigns} />
    </>
  );
}
