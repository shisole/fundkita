import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import {
  type CampaignStatus,
  type FraudFlagStatus,
  type TableInsert,
  type TableRow,
} from "@/lib/supabase/types";

// ── Helper: check admin role ────────────────────────────────────────────────

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: NextResponse.json({ error: "Authentication required" }, { status: 401 }) };
  }

  const { data: dbUser } = await supabase.from("users").select("role").eq("id", user.id).single();

  if (!dbUser || (dbUser as TableRow<"users">).role !== "admin") {
    return { error: NextResponse.json({ error: "Admin access required" }, { status: 403 }) };
  }

  return { supabase, user };
}

// ── GET /api/admin/fraud ────────────────────────────────────────────────────

export async function GET(request: Request) {
  const result = await requireAdmin();

  if ("error" in result && !("supabase" in result)) {
    return result.error;
  }

  const { supabase } = result;
  const { searchParams } = new URL(request.url);
  const statusParam = searchParams.get("status");
  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") ?? "20")));
  const offset = (page - 1) * limit;

  let query = supabase
    .from("fraud_flags")
    .select("*, campaigns(title, status, organizer_id)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (statusParam) {
    query = query.eq("status", statusParam as FraudFlagStatus);
  }

  const { data, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    flags: data,
    total: count ?? 0,
    page,
    limit,
  });
}

// ── POST /api/admin/fraud ───────────────────────────────────────────────────

export async function POST(request: Request) {
  const result = await requireAdmin();

  if ("error" in result && !("supabase" in result)) {
    return result.error;
  }

  const { supabase, user } = result;

  const body = (await request.json()) as Partial<{
    campaign_id: string;
    reason: string;
  }>;

  const { campaign_id, reason } = body;

  if (!campaign_id || !reason?.trim()) {
    return NextResponse.json(
      { error: "Missing required fields: campaign_id, reason" },
      { status: 400 },
    );
  }

  // Verify campaign exists
  const { data: campaign } = await supabase
    .from("campaigns")
    .select("id")
    .eq("id", campaign_id)
    .single();

  if (!campaign) {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  }

  const insert: TableInsert<"fraud_flags"> = {
    campaign_id,
    reason: reason.trim(),
    flagged_by: user.id,
    status: "open",
  };

  const { data, error } = await supabase.from("fraud_flags").insert(insert).select().single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}

// ── PATCH /api/admin/fraud ──────────────────────────────────────────────────

export async function PATCH(request: Request) {
  const result = await requireAdmin();

  if ("error" in result && !("supabase" in result)) {
    return result.error;
  }

  const { supabase } = result;

  const body = (await request.json()) as Partial<{
    flag_id: string;
    action: "resolve" | "dismiss" | "pause_campaign";
    notes: string;
  }>;

  const { flag_id, action, notes } = body;

  if (!flag_id || !action) {
    return NextResponse.json(
      { error: "Missing required fields: flag_id, action" },
      { status: 400 },
    );
  }

  const validActions = ["resolve", "dismiss", "pause_campaign"];
  if (!validActions.includes(action)) {
    return NextResponse.json(
      { error: "Action must be 'resolve', 'dismiss', or 'pause_campaign'" },
      { status: 400 },
    );
  }

  // Fetch flag to get campaign_id
  const { data: flag } = await supabase
    .from("fraud_flags")
    .select("id, campaign_id")
    .eq("id", flag_id)
    .single();

  if (!flag) {
    return NextResponse.json({ error: "Fraud flag not found" }, { status: 404 });
  }

  const flagData = flag as TableRow<"fraud_flags">;

  // Determine status update
  const newStatus: FraudFlagStatus = action === "dismiss" ? "dismissed" : "resolved";

  const updatePayload: Record<string, string> = { status: newStatus };
  if (notes?.trim()) {
    updatePayload.reason = notes.trim();
  }

  const { data: updatedFlag, error: updateError } = await supabase
    .from("fraud_flags")
    .update(updatePayload)
    .eq("id", flag_id)
    .select()
    .single();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // If pause_campaign, also update campaign status
  if (action === "pause_campaign") {
    const campaignUpdate: { status: CampaignStatus } = { status: "paused" };
    const { error: campaignError } = await supabase
      .from("campaigns")
      .update(campaignUpdate)
      .eq("id", flagData.campaign_id);

    if (campaignError) {
      return NextResponse.json(
        { error: `Flag updated but campaign pause failed: ${campaignError.message}` },
        { status: 500 },
      );
    }
  }

  return NextResponse.json(updatedFlag);
}
