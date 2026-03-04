import Link from "next/link";

import { ChevronLeftIcon, ChevronRightIcon } from "@/components/icons";
import { EmptyState, StatusBadge } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";
import { type CampaignStatus, type TableRow } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

const ITEMS_PER_PAGE = 20;

const TABS: { id: CampaignStatus | "all"; label: string }[] = [
  { id: "pending_review", label: "Pending Review" },
  { id: "active", label: "Active" },
  { id: "paused", label: "Paused" },
  { id: "all", label: "All" },
];

interface AdminCampaignsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

type CampaignWithOrganizer = TableRow<"campaigns"> & {
  users: { full_name: string | null } | null;
};

export default async function AdminCampaignsPage({ searchParams }: AdminCampaignsPageProps) {
  const params = await searchParams;

  const statusParam = typeof params.status === "string" ? params.status : "pending_review";
  const activeTab = TABS.some((t) => t.id === statusParam) ? statusParam : "pending_review";
  const pageParam = typeof params.page === "string" ? params.page : "1";
  const currentPage = Math.max(1, Number.parseInt(pageParam, 10) || 1);
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;

  const supabase = await createClient();

  let query = supabase
    .from("campaigns")
    .select("*, users!campaigns_organizer_id_fkey(full_name)", { count: "exact" });

  if (activeTab !== "all") {
    query = query.eq("status", activeTab as CampaignStatus);
  }

  query = query
    .order("created_at", { ascending: false })
    .range(offset, offset + ITEMS_PER_PAGE - 1);

  const { data, count } = await query;

  const campaigns = (data ?? []) as CampaignWithOrganizer[];
  const totalCount = count ?? 0;
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
  const hasPrev = currentPage > 1;
  const hasNext = currentPage < totalPages;

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-heading text-3xl font-bold text-gray-900 dark:text-gray-100">
          Campaign Moderation
        </h1>
        <p className="mt-1 text-gray-500 dark:text-gray-400">
          Review, approve, or reject campaign submissions.
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex border-b border-gray-200 dark:border-gray-700">
        {TABS.map((tab) => {
          const isActive = tab.id === activeTab;

          return (
            <Link
              key={tab.id}
              href={`/admin/campaigns?status=${tab.id}`}
              className={cn(
                "relative px-4 py-2 text-sm transition-colors",
                isActive
                  ? "font-semibold text-red-600 dark:text-red-400"
                  : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300",
              )}
            >
              {tab.label}
              {isActive && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-500 dark:bg-red-400" />
              )}
            </Link>
          );
        })}
      </div>

      {/* Results count */}
      <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
        {totalCount === 0
          ? "No campaigns found"
          : `Showing ${String(offset + 1)}\u2013${String(Math.min(offset + ITEMS_PER_PAGE, totalCount))} of ${String(totalCount)} campaigns`}
      </p>

      {/* Table */}
      {campaigns.length === 0 ? (
        <EmptyState title="No campaigns" description="No campaigns match the current filter." />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 font-medium text-gray-700 dark:text-gray-300">Title</th>
                <th className="px-4 py-3 font-medium text-gray-700 dark:text-gray-300">
                  Organizer
                </th>
                <th className="px-4 py-3 font-medium text-gray-700 dark:text-gray-300">Goal</th>
                <th className="px-4 py-3 font-medium text-gray-700 dark:text-gray-300">Raised</th>
                <th className="px-4 py-3 font-medium text-gray-700 dark:text-gray-300">Status</th>
                <th className="px-4 py-3 font-medium text-gray-700 dark:text-gray-300">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {campaigns.map((campaign) => (
                <tr
                  key={campaign.id}
                  className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/campaigns/${campaign.id}`}
                      className="font-medium text-gray-900 hover:text-red-600 dark:text-gray-100 dark:hover:text-red-400"
                    >
                      {campaign.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                    {campaign.users?.full_name ?? "Unknown"}
                  </td>
                  <td className="px-4 py-3 text-gray-900 dark:text-gray-100">
                    ₱{campaign.goal_amount.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-gray-900 dark:text-gray-100">
                    ₱{campaign.amount_raised.toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={campaign.status} />
                  </td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                    {new Date(campaign.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <nav className="mt-6 flex items-center justify-center gap-4" aria-label="Pagination">
          {hasPrev ? (
            <Link
              href={buildPageUrl(activeTab, currentPage - 1)}
              className={cn(
                "inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors",
                "hover:border-red-300 hover:bg-red-50 hover:text-red-700",
                "dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300",
                "dark:hover:border-red-500 dark:hover:bg-red-950 dark:hover:text-red-400",
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
              href={buildPageUrl(activeTab, currentPage + 1)}
              className={cn(
                "inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors",
                "hover:border-red-300 hover:bg-red-50 hover:text-red-700",
                "dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300",
                "dark:hover:border-red-500 dark:hover:bg-red-950 dark:hover:text-red-400",
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

function buildPageUrl(status: string, page: number): string {
  const urlParams = new URLSearchParams();
  urlParams.set("status", status);

  if (page > 1) {
    urlParams.set("page", String(page));
  }

  return `/admin/campaigns?${urlParams.toString()}`;
}
