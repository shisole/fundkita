import { type Metadata } from "next";
import Link from "next/link";

import { TrophyIcon } from "@/components/icons";
import LeaderboardTable, { type LeaderboardEntry } from "@/components/leaderboard/LeaderboardTable";
import { Avatar } from "@/components/ui";
import { getTierForAmount } from "@/lib/constants/badge-tiers";
import { getCurrentUser } from "@/lib/supabase/queries";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Leaderboard | FundKita",
  description:
    "See the top donors making a difference across the Philippines. Join the leaderboard by supporting campaigns on FundKita.",
};

// ── Types ────────────────────────────────────────────────────────────────────

type Period = "all_time" | "this_month" | "this_week";

const PERIODS: { id: Period; label: string }[] = [
  { id: "all_time", label: "All Time" },
  { id: "this_month", label: "This Month" },
  { id: "this_week", label: "This Week" },
];

const LEADERBOARD_LIMIT = 50;

// ── Helpers ──────────────────────────────────────────────────────────────────

function getDateRangeStart(period: Period): string | null {
  if (period === "all_time") return null;

  const now = new Date();

  if (period === "this_month") {
    return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  }

  // this_week (start of Monday)
  const day = now.getDay();
  const diff = day === 0 ? 6 : day - 1;
  const monday = new Date(now);
  monday.setDate(now.getDate() - diff);
  monday.setHours(0, 0, 0, 0);
  return monday.toISOString();
}

async function fetchAllTimeLeaderboard(
  supabase: Awaited<ReturnType<typeof createClient>>,
): Promise<LeaderboardEntry[]> {
  const { data } = await supabase
    .from("donor_stats")
    .select(
      "user_id, lifetime_donations_php, donation_count, current_tier, users(full_name, avatar_url)",
    )
    .gt("lifetime_donations_php", 0)
    .order("lifetime_donations_php", { ascending: false })
    .limit(LEADERBOARD_LIMIT);

  return (data ?? []).map((row, index) => {
    const user = row.users as { full_name: string | null; avatar_url: string | null } | null;

    return {
      rank: index + 1,
      user_id: row.user_id,
      full_name: user?.full_name ?? "Anonymous Donor",
      avatar_url: user?.avatar_url ?? null,
      total_donated: row.lifetime_donations_php,
      badge_tier: row.current_tier,
      donation_count: row.donation_count,
      is_anonymous: !user?.full_name,
    };
  });
}

async function fetchTimeBoundedLeaderboard(
  supabase: Awaited<ReturnType<typeof createClient>>,
  period: Period,
): Promise<LeaderboardEntry[]> {
  const rangeStart = getDateRangeStart(period);
  if (!rangeStart) return [];

  const { data } = await supabase
    .from("donations")
    .select("donor_id, amount_php, is_anonymous, users:donor_id(full_name, avatar_url)")
    .eq("payment_status", "confirmed")
    .not("donor_id", "is", null)
    .gte("created_at", rangeStart);

  // Aggregate by donor_id
  const aggregated = new Map<
    string,
    {
      total: number;
      count: number;
      full_name: string;
      avatar_url: string | null;
      is_anonymous: boolean;
    }
  >();

  for (const row of data ?? []) {
    if (!row.donor_id) continue;

    const existing = aggregated.get(row.donor_id);
    const user = row.users as { full_name: string | null; avatar_url: string | null } | null;

    if (existing) {
      existing.total += row.amount_php;
      existing.count += 1;
    } else {
      aggregated.set(row.donor_id, {
        total: row.amount_php,
        count: 1,
        full_name: row.is_anonymous ? "Anonymous Donor" : (user?.full_name ?? "Anonymous Donor"),
        avatar_url: row.is_anonymous ? null : (user?.avatar_url ?? null),
        is_anonymous: row.is_anonymous,
      });
    }
  }

  // Sort by total descending
  const sorted = [...aggregated.entries()]
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, LEADERBOARD_LIMIT);

  // Look up badge tiers
  const userIds = sorted.map(([id]) => id);

  const { data: statsData } = await supabase
    .from("donor_stats")
    .select("user_id, current_tier")
    .in("user_id", userIds.length > 0 ? userIds : ["__none__"]);

  const tierMap = new Map<string, number>();
  for (const stat of statsData ?? []) {
    tierMap.set(stat.user_id, stat.current_tier);
  }

  return sorted.map(([userId, agg], index) => ({
    rank: index + 1,
    user_id: userId,
    full_name: agg.full_name,
    avatar_url: agg.avatar_url,
    total_donated: agg.total,
    badge_tier: tierMap.get(userId) ?? 0,
    donation_count: agg.count,
    is_anonymous: agg.is_anonymous,
  }));
}

// ── Page ─────────────────────────────────────────────────────────────────────

interface LeaderboardPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function LeaderboardPage({ searchParams }: LeaderboardPageProps) {
  const params = await searchParams;
  const periodParam = typeof params.period === "string" ? params.period : "all_time";
  const period: Period = (["all_time", "this_month", "this_week"] as const).includes(
    periodParam as Period,
  )
    ? (periodParam as Period)
    : "all_time";

  const supabase = await createClient();
  const currentUser = await getCurrentUser();

  // Fetch leaderboard data
  const entries =
    period === "all_time"
      ? await fetchAllTimeLeaderboard(supabase)
      : await fetchTimeBoundedLeaderboard(supabase, period);

  // Find current user's entry
  const currentUserEntry = currentUser
    ? entries.find((e) => e.user_id === currentUser.id)
    : undefined;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:py-12">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-golden-100 text-golden-600 dark:bg-golden-900 dark:text-golden-400">
          <TrophyIcon className="h-6 w-6" variant="filled" />
        </div>
        <div>
          <h1 className="font-heading text-3xl font-bold text-gray-900 dark:text-gray-100 sm:text-4xl">
            Leaderboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">Top donors making a difference</p>
        </div>
      </div>

      {/* Period tabs (link-based) */}
      <nav
        className="mt-8 flex border-b border-gray-200 dark:border-gray-700"
        aria-label="Leaderboard period"
      >
        {PERIODS.map((p) => {
          const isActive = p.id === period;

          return (
            <Link
              key={p.id}
              href={p.id === "all_time" ? "/leaderboard" : `/leaderboard?period=${p.id}`}
              className={cn(
                "relative px-4 py-2 text-sm transition-colors",
                isActive
                  ? "font-semibold text-teal-600 dark:text-teal-400"
                  : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300",
              )}
            >
              {p.label}
              {isActive && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-500 dark:bg-teal-400" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Your Rank card */}
      {currentUser && currentUserEntry && (
        <div className="mt-6 rounded-xl border border-teal-200 bg-teal-50 p-4 dark:border-teal-800 dark:bg-teal-950">
          <div className="flex items-center gap-4">
            <Avatar src={currentUser.avatar_url} alt={currentUser.full_name ?? "You"} size="lg" />
            <div className="min-w-0 flex-1">
              <p className="text-sm text-teal-600 dark:text-teal-400">Your Rank</p>
              <p className="font-heading text-2xl font-bold text-teal-700 dark:text-teal-300">
                #{String(currentUserEntry.rank)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-teal-600 dark:text-teal-400">Total Donated</p>
              <p className="font-heading text-lg font-bold text-teal-700 dark:text-teal-300">
                {"\u20B1"}
                {currentUserEntry.total_donated.toLocaleString("en-PH")}
              </p>
              {currentUserEntry.badge_tier > 0 && (
                <p className="mt-0.5 text-xs text-teal-500 dark:text-teal-400">
                  {getTierForAmount(currentUserEntry.total_donated)?.name ?? ""}{" "}
                  {getTierForAmount(currentUserEntry.total_donated)?.emoji ?? ""}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Leaderboard table */}
      <div className="mt-6">
        <LeaderboardTable entries={entries} currentUserId={currentUser?.id} />
      </div>
    </div>
  );
}
