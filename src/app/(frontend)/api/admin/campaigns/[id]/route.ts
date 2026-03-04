import { NextResponse } from "next/server";

import { createClient, createServiceClient } from "@/lib/supabase/server";
import { type CampaignStatus, type TableRow } from "@/lib/supabase/types";

interface RouteContext {
  params: Promise<{ id: string }>;
}

const ACTION_STATUS_MAP: Record<string, CampaignStatus> = {
  approve: "active",
  reject: "closed",
  pause: "paused",
  unpause: "active",
};

const VALID_ACTIONS = new Set(["approve", "reject", "pause", "unpause"]);

// ── PATCH /api/admin/campaigns/[id] ──────────────────────────────────────────

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;

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

  const body = (await request.json()) as { action?: string; reason?: string };
  const { action, reason } = body;

  if (!action || !VALID_ACTIONS.has(action)) {
    return NextResponse.json(
      { error: "Invalid action. Must be one of: approve, reject, pause, unpause" },
      { status: 400 },
    );
  }

  if (action === "reject" && !reason?.trim()) {
    return NextResponse.json({ error: "Rejection reason is required" }, { status: 400 });
  }

  // Use service client for full access
  const serviceClient = createServiceClient();

  // Verify campaign exists
  const { data: campaign } = await serviceClient
    .from("campaigns")
    .select("id, status")
    .eq("id", id)
    .single();

  if (!campaign) {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  }

  const typedCampaign = campaign as TableRow<"campaigns">;

  // Validate action is appropriate for current status
  if (action === "approve" && typedCampaign.status !== "pending_review") {
    return NextResponse.json(
      { error: "Only pending_review campaigns can be approved" },
      { status: 400 },
    );
  }

  if (action === "reject" && typedCampaign.status !== "pending_review") {
    return NextResponse.json(
      { error: "Only pending_review campaigns can be rejected" },
      { status: 400 },
    );
  }

  if (action === "pause" && typedCampaign.status !== "active") {
    return NextResponse.json({ error: "Only active campaigns can be paused" }, { status: 400 });
  }

  if (action === "unpause" && typedCampaign.status !== "paused") {
    return NextResponse.json({ error: "Only paused campaigns can be unpaused" }, { status: 400 });
  }

  const newStatus = ACTION_STATUS_MAP[action];

  // Update campaign status
  const updateData: Record<string, string> = { status: newStatus };

  // If rejecting, store reason in the description field as a note
  // This could be a separate field in a more robust implementation
  const { data: updated, error } = await serviceClient
    .from("campaigns")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // If rejecting, store the rejection reason as a campaign update note
  if (action === "reject" && reason) {
    await serviceClient.from("campaign_updates").insert({
      campaign_id: id,
      title: "Campaign Rejected",
      content: reason.trim(),
    });
  }

  return NextResponse.json({
    campaign: updated,
    action,
    message: `Campaign ${action}d successfully`,
  });
}
