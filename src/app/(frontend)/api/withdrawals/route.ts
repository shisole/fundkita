import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import {
  type PayoutMethod,
  type TableInsert,
  type TableRow,
  type WithdrawalStatus,
} from "@/lib/supabase/types";

// ── POST /api/withdrawals ───────────────────────────────────────────────────

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const body = (await request.json()) as Partial<{
    campaign_id: string;
    amount: number;
    payout_method: PayoutMethod;
    payout_details: Record<string, string>;
  }>;

  const { campaign_id, amount, payout_method, payout_details } = body;

  // Validate required fields
  if (!campaign_id || !amount || !payout_method || !payout_details) {
    return NextResponse.json(
      { error: "Missing required fields: campaign_id, amount, payout_method, payout_details" },
      { status: 400 },
    );
  }

  // Validate payout method
  const validMethods: PayoutMethod[] = ["gcash", "maya", "bank_transfer"];
  if (!validMethods.includes(payout_method)) {
    return NextResponse.json({ error: "Invalid payout method" }, { status: 400 });
  }

  if (amount <= 0) {
    return NextResponse.json({ error: "Amount must be greater than zero" }, { status: 400 });
  }

  // Verify user is the campaign organizer
  const { data: campaign } = await supabase
    .from("campaigns")
    .select("organizer_id, amount_raised")
    .eq("id", campaign_id)
    .single();

  if (!campaign) {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  }

  const typedCampaign = campaign as Pick<TableRow<"campaigns">, "organizer_id" | "amount_raised">;

  if (typedCampaign.organizer_id !== user.id) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  // Verify KYC is approved
  const { data: kycSubmission } = await supabase
    .from("kyc_submissions")
    .select("status")
    .eq("user_id", user.id)
    .eq("status", "approved")
    .limit(1)
    .single();

  if (!kycSubmission) {
    return NextResponse.json(
      { error: "KYC verification must be approved before withdrawing" },
      { status: 403 },
    );
  }

  // Calculate available balance (total raised - sum of non-rejected withdrawals)
  const { data: existingWithdrawals } = await supabase
    .from("withdrawal_requests")
    .select("amount, status")
    .eq("campaign_id", campaign_id);

  const nonRejectedStatuses = new Set<WithdrawalStatus>(["pending", "approved", "processed"]);
  const totalWithdrawn = (existingWithdrawals ?? [])
    .filter((w) => {
      const typed = w as TableRow<"withdrawal_requests">;
      return nonRejectedStatuses.has(typed.status);
    })
    .reduce((sum, w) => sum + (w as TableRow<"withdrawal_requests">).amount, 0);

  const availableBalance = typedCampaign.amount_raised - totalWithdrawn;

  if (amount > availableBalance) {
    return NextResponse.json(
      { error: "Amount exceeds available balance of " + String(availableBalance) },
      { status: 400 },
    );
  }

  // Verify no pending withdrawal exists for this campaign
  const { data: pendingWithdrawal } = await supabase
    .from("withdrawal_requests")
    .select("id")
    .eq("campaign_id", campaign_id)
    .eq("status", "pending")
    .limit(1)
    .single();

  if (pendingWithdrawal) {
    return NextResponse.json(
      { error: "A pending withdrawal already exists for this campaign" },
      { status: 409 },
    );
  }

  // Insert withdrawal request
  const insert: TableInsert<"withdrawal_requests"> = {
    campaign_id,
    organizer_id: user.id,
    amount,
    payout_method,
    payout_details,
    status: "pending",
  };

  const { data, error } = await supabase
    .from("withdrawal_requests")
    .insert(insert)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}

// ── GET /api/withdrawals ────────────────────────────────────────────────────

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const { data: dbUser } = await supabase.from("users").select("role").eq("id", user.id).single();

  if (!dbUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const typedUser = dbUser as TableRow<"users">;

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") ?? "20")));
  const offset = (page - 1) * limit;

  if (typedUser.role === "admin") {
    // Admin: all withdrawals with campaign + user info
    const { data, error, count } = await supabase
      .from("withdrawal_requests")
      .select(
        "*, campaigns(title), users!withdrawal_requests_organizer_id_fkey(full_name, email)",
        { count: "exact" },
      )
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      withdrawals: data,
      total: count ?? 0,
      page,
      limit,
    });
  }

  // Organizer: own withdrawals (filter by campaigns they own)
  const { data: ownCampaigns } = await supabase
    .from("campaigns")
    .select("id")
    .eq("organizer_id", user.id);

  const campaignIds = (ownCampaigns ?? []).map((c) => (c as TableRow<"campaigns">).id);

  if (campaignIds.length === 0) {
    return NextResponse.json({
      withdrawals: [],
      total: 0,
      page,
      limit,
    });
  }

  const { data, error, count } = await supabase
    .from("withdrawal_requests")
    .select("*, campaigns(title)", { count: "exact" })
    .in("campaign_id", campaignIds)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    withdrawals: data,
    total: count ?? 0,
    page,
    limit,
  });
}
