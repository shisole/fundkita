import { type Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { type CampaignWithOrganizer } from "@/components/campaigns/CampaignCard";
import CampaignFilters from "@/components/campaigns/CampaignFilters";
import CampaignGrid from "@/components/campaigns/CampaignGrid";
import CampaignSearch from "@/components/campaigns/CampaignSearch";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/icons";
import { createClient } from "@/lib/supabase/server";
import { type CampaignCategory } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Browse Campaigns | FundKita",
  description:
    "Discover and support campaigns across the Philippines. Browse by category, search, and find causes that matter to you.",
};

const ITEMS_PER_PAGE = 12;

const CAMPAIGN_SELECT =
  "id, title, description, category, goal_amount, amount_raised, donor_count, featured_image_url, slug, users!campaigns_organizer_id_fkey(full_name, avatar_url, is_verified)" as const;

interface CampaignsBrowsePageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function CampaignsBrowsePage({ searchParams }: CampaignsBrowsePageProps) {
  const params = await searchParams;

  const search = typeof params.search === "string" ? params.search : undefined;
  const category = typeof params.category === "string" ? params.category : undefined;
  const sort = typeof params.sort === "string" ? params.sort : "most_recent";
  const pageParam = typeof params.page === "string" ? params.page : "1";
  const currentPage = Math.max(1, Number.parseInt(pageParam, 10) || 1);

  const offset = (currentPage - 1) * ITEMS_PER_PAGE;

  const supabase = await createClient();

  let query = supabase
    .from("campaigns")
    .select(CAMPAIGN_SELECT, { count: "exact" })
    .eq("status", "active");

  if (category) {
    query = query.eq("category", category as CampaignCategory);
  }

  if (search) {
    query = query.textSearch("title", search, { type: "websearch" });
  }

  // Apply sort
  switch (sort) {
    case "most_funded": {
      query = query.order("amount_raised", { ascending: false });
      break;
    }
    case "ending_soon": {
      query = query.not("end_date", "is", null).order("end_date", { ascending: true });
      break;
    }
    case "near_goal": {
      query = query.order("amount_raised", { ascending: false });
      break;
    }
    default: {
      // most_recent
      query = query.order("created_at", { ascending: false });
      break;
    }
  }

  query = query.range(offset, offset + ITEMS_PER_PAGE - 1);

  const { data, count } = await query;

  const campaigns = (data ?? []) as CampaignWithOrganizer[];
  const totalCount = count ?? 0;
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
  const hasPrev = currentPage > 1;
  const hasNext = currentPage < totalPages;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
      {/* Page header */}
      <h1 className="font-heading text-3xl font-bold text-gray-900 dark:text-gray-100 sm:text-4xl">
        Browse Campaigns
      </h1>
      <p className="mt-2 text-gray-600 dark:text-gray-400">
        Discover campaigns and support causes that matter to you.
      </p>

      {/* Search */}
      <div className="mt-6">
        <Suspense fallback={null}>
          <CampaignSearch />
        </Suspense>
      </div>

      {/* Filters */}
      <div className="mt-4">
        <Suspense fallback={null}>
          <CampaignFilters />
        </Suspense>
      </div>

      {/* Results count */}
      <p className="mt-6 text-sm text-gray-500 dark:text-gray-400">
        {totalCount === 0
          ? "No campaigns found"
          : `Showing ${String(offset + 1)}\u2013${String(Math.min(offset + ITEMS_PER_PAGE, totalCount))} of ${String(totalCount)} campaigns`}
      </p>

      {/* Campaign grid */}
      <div className="mt-4">
        <CampaignGrid
          campaigns={campaigns}
          emptyMessage={
            search
              ? `No campaigns found for "${search}".`
              : "No campaigns found. Try adjusting your filters."
          }
        />
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <nav className="mt-8 flex items-center justify-center gap-4" aria-label="Pagination">
          {hasPrev ? (
            <Link
              href={buildPageUrl(params, currentPage - 1)}
              className={cn(
                "inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors",
                "hover:border-teal-300 hover:bg-teal-50 hover:text-teal-700",
                "dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300",
                "dark:hover:border-teal-500 dark:hover:bg-teal-950 dark:hover:text-teal-400",
              )}
            >
              <ChevronLeftIcon className="h-4 w-4" />
              Previous
            </Link>
          ) : (
            <span
              className={cn(
                "inline-flex cursor-not-allowed items-center gap-1 rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-400",
                "dark:border-gray-700 dark:bg-gray-900 dark:text-gray-600",
              )}
            >
              <ChevronLeftIcon className="h-4 w-4" />
              Previous
            </span>
          )}

          <span className="text-sm text-gray-600 dark:text-gray-400">
            Page {String(currentPage)} of {String(totalPages)}
          </span>

          {hasNext ? (
            <Link
              href={buildPageUrl(params, currentPage + 1)}
              className={cn(
                "inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors",
                "hover:border-teal-300 hover:bg-teal-50 hover:text-teal-700",
                "dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300",
                "dark:hover:border-teal-500 dark:hover:bg-teal-950 dark:hover:text-teal-400",
              )}
            >
              Next
              <ChevronRightIcon className="h-4 w-4" />
            </Link>
          ) : (
            <span
              className={cn(
                "inline-flex cursor-not-allowed items-center gap-1 rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-400",
                "dark:border-gray-700 dark:bg-gray-900 dark:text-gray-600",
              )}
            >
              Next
              <ChevronRightIcon className="h-4 w-4" />
            </span>
          )}
        </nav>
      )}
    </div>
  );
}

function buildPageUrl(params: Record<string, string | string[] | undefined>, page: number): string {
  const urlParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (key !== "page" && typeof value === "string") {
      urlParams.set(key, value);
    }
  }

  if (page > 1) {
    urlParams.set("page", String(page));
  }

  const query = urlParams.toString();
  return query ? `/campaigns?${query}` : "/campaigns";
}
