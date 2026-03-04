import { NextResponse } from "next/server";

import { createClient, createServiceClient } from "@/lib/supabase/server";
import { type CampaignStatus, type PaymentMethod, type TableRow } from "@/lib/supabase/types";

type Period = "day" | "week" | "month" | "all";

const VALID_PERIODS = new Set<Period>(["day", "week", "month", "all"]);

function getPeriodStart(period: Period): string | null {
  if (period === "all") return null;

  const now = new Date();

  switch (period) {
    case "day": {
      now.setDate(now.getDate() - 1);
      break;
    }
    case "week": {
      now.setDate(now.getDate() - 7);
      break;
    }
    case "month": {
      now.setMonth(now.getMonth() - 1);
      break;
    }
  }

  return now.toISOString();
}

// ── GET /api/admin/reports ───────────────────────────────────────────────────

export async function GET(request: Request) {
  // Authenticate via session
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  // Verify admin role
  const { data: dbUser } = await supabase.from("users").select("role").eq("id", user.id).single();

  if (!dbUser || (dbUser as TableRow<"users">).role !== "admin") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const periodParam = searchParams.get("period") ?? "month";
  const period: Period = VALID_PERIODS.has(periodParam as Period)
    ? (periodParam as Period)
    : "month";

  const periodStart = getPeriodStart(period);
  const serviceClient = createServiceClient();

  // ── Build donation query with period filter ────────────────────────────────
  let donationQuery = serviceClient
    .from("donations")
    .select("amount_php, payment_method", { count: "exact" })
    .eq("payment_status", "confirmed");

  if (periodStart) {
    donationQuery = donationQuery.gte("created_at", periodStart);
  }

  // ── Fetch data in parallel ─────────────────────────────────────────────────
  const [donationsResult, activeCampaignsResult, topCampaignsResult] = await Promise.all([
    donationQuery,

    // Active campaign count (current, not period-filtered)
    serviceClient
      .from("campaigns")
      .select("id", { count: "exact", head: true })
      .eq("status", "active" as CampaignStatus),

    // Top 10 campaigns by amount_raised
    serviceClient
      .from("campaigns")
      .select("id, title, slug, amount_raised, goal_amount, donor_count, status")
      .order("amount_raised", { ascending: false })
      .limit(10),
  ]);

  // ── Calculate totals ───────────────────────────────────────────────────────
  const donations = (donationsResult.data ?? []) as Pick<
    TableRow<"donations">,
    "amount_php" | "payment_method"
  >[];

  const totalDonationsAmount = donations.reduce((sum, d) => sum + d.amount_php, 0);
  const totalDonationsCount = donationsResult.count ?? 0;
  const activeCampaignCount = activeCampaignsResult.count ?? 0;

  // ── Payment method breakdown ───────────────────────────────────────────────
  const methodMap = new Map<PaymentMethod, { count: number; amount: number }>();

  for (const donation of donations) {
    const existing = methodMap.get(donation.payment_method) ?? { count: 0, amount: 0 };
    existing.count += 1;
    existing.amount += donation.amount_php;
    methodMap.set(donation.payment_method, existing);
  }

  const paymentMethodBreakdown = [...methodMap.entries()].map(([method, data]) => ({
    method,
    count: data.count,
    amount: data.amount,
  }));

  // ── Top campaigns ──────────────────────────────────────────────────────────
  const topCampaigns = (topCampaignsResult.data ?? []) as Pick<
    TableRow<"campaigns">,
    "id" | "title" | "slug" | "amount_raised" | "goal_amount" | "donor_count" | "status"
  >[];

  return NextResponse.json({
    period,
    total_donations_amount: totalDonationsAmount,
    total_donations_count: totalDonationsCount,
    active_campaign_count: activeCampaignCount,
    payment_method_breakdown: paymentMethodBreakdown,
    top_campaigns: topCampaigns,
  });
}
