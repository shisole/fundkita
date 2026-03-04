import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

// ── Types ────────────────────────────────────────────────────────────────────

type Period = "all_time" | "this_month" | "this_week";

interface LeaderboardRow {
  rank: number;
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  total_donated: number;
  badge_tier: number;
  donation_count: number;
  is_anonymous: boolean;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function getDateRangeStart(period: Period): string | null {
  if (period === "all_time") return null;

  const now = new Date();

  if (period === "this_month") {
    return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  }

  // this_week (start of Monday)
  const day = now.getDay();
  const diff = day === 0 ? 6 : day - 1; // Monday = 0 offset
  const monday = new Date(now);
  monday.setDate(now.getDate() - diff);
  monday.setHours(0, 0, 0, 0);
  return monday.toISOString();
}

// ── GET /api/leaderboard ─────────────────────────────────────────────────────

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const period = (searchParams.get("period") ?? "all_time") as Period;
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? "50")));

  if (!["all_time", "this_month", "this_week"].includes(period)) {
    return NextResponse.json(
      { error: "Invalid period. Must be all_time, this_month, or this_week" },
      { status: 400 },
    );
  }

  const supabase = await createClient();

  if (period === "all_time") {
    // Query donor_stats joined with users
    const { data, error } = await supabase
      .from("donor_stats")
      .select(
        "user_id, lifetime_donations_php, donation_count, current_tier, users(full_name, avatar_url)",
      )
      .gt("lifetime_donations_php", 0)
      .order("lifetime_donations_php", { ascending: false })
      .limit(limit);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const entries: LeaderboardRow[] = (data ?? []).map((row, index) => {
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

    return NextResponse.json(entries);
  }

  // Time-bounded period: aggregate confirmed donations
  const rangeStart = getDateRangeStart(period);

  if (!rangeStart) {
    return NextResponse.json({ error: "Could not determine date range" }, { status: 500 });
  }

  const { data, error } = await supabase
    .from("donations")
    .select("donor_id, amount_php, is_anonymous, users:donor_id(full_name, avatar_url)")
    .eq("payment_status", "confirmed")
    .not("donor_id", "is", null)
    .gte("created_at", rangeStart);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

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

  // Sort by total descending, then limit
  const sorted = [...aggregated.entries()].sort((a, b) => b[1].total - a[1].total).slice(0, limit);

  // Look up badge tiers for these users
  const userIds = sorted.map(([id]) => id);

  const { data: statsData } = await supabase
    .from("donor_stats")
    .select("user_id, current_tier")
    .in("user_id", userIds.length > 0 ? userIds : ["__none__"]);

  const tierMap = new Map<string, number>();
  for (const stat of statsData ?? []) {
    tierMap.set(stat.user_id, stat.current_tier);
  }

  const entries: LeaderboardRow[] = sorted.map(([userId, agg], index) => ({
    rank: index + 1,
    user_id: userId,
    full_name: agg.full_name,
    avatar_url: agg.avatar_url,
    total_donated: agg.total,
    badge_tier: tierMap.get(userId) ?? 0,
    donation_count: agg.count,
    is_anonymous: agg.is_anonymous,
  }));

  return NextResponse.json(entries);
}
