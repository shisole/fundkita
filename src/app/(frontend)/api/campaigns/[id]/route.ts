import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { type TableRow, type TableUpdate } from "@/lib/supabase/types";

interface RouteContext {
  params: Promise<{ id: string }>;
}

// ── GET /api/campaigns/[id] ──────────────────────────────────────────────────

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const supabase = await createClient();

  const { data: campaign, error } = await supabase
    .from("campaigns")
    .select("*, users!campaigns_organizer_id_fkey(id, full_name, avatar_url, is_verified)")
    .eq("id", id)
    .single();

  if (!campaign) {
    return NextResponse.json({ error: error?.message ?? "Campaign not found" }, { status: 404 });
  }

  // Fetch related data in parallel
  const [imagesResult, updatesResult, donorsResult] = await Promise.all([
    supabase
      .from("campaign_images")
      .select("*")
      .eq("campaign_id", id)
      .order("sort_order", { ascending: true }),
    supabase
      .from("campaign_updates")
      .select("*")
      .eq("campaign_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("donations")
      .select("donor_name, amount_php, is_anonymous, created_at")
      .eq("campaign_id", id)
      .eq("payment_status", "confirmed")
      .order("amount_php", { ascending: false })
      .limit(5),
  ]);

  return NextResponse.json({
    ...campaign,
    images: imagesResult.data ?? [],
    updates: updatesResult.data ?? [],
    top_donors: donorsResult.data ?? [],
  });
}

// ── PATCH /api/campaigns/[id] ────────────────────────────────────────────────

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  // Check ownership or admin
  const { data: campaign } = await supabase
    .from("campaigns")
    .select("organizer_id")
    .eq("id", id)
    .single();

  if (!campaign) {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  }

  const { data: dbUser } = await supabase.from("users").select("role").eq("id", user.id).single();
  const isAdmin = dbUser && (dbUser as TableRow<"users">).role === "admin";
  const isOwner = (campaign as TableRow<"campaigns">).organizer_id === user.id;

  if (!isOwner && !isAdmin) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const body = (await request.json()) as TableUpdate<"campaigns">;
  const allowedFields: (keyof TableUpdate<"campaigns">)[] = [
    "title",
    "description",
    "category",
    "goal_amount",
    "location",
    "end_date",
    "featured_image_url",
    "status",
  ];

  const update: TableUpdate<"campaigns"> = {};
  for (const field of allowedFields) {
    if (field in body) {
      Object.assign(update, { [field]: body[field] });
    }
  }

  const { data, error } = await supabase
    .from("campaigns")
    .update(update)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// ── DELETE /api/campaigns/[id] (soft delete) ─────────────────────────────────

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const { data: campaign } = await supabase
    .from("campaigns")
    .select("organizer_id")
    .eq("id", id)
    .single();

  if (!campaign) {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  }

  const { data: dbUser } = await supabase.from("users").select("role").eq("id", user.id).single();
  const isAdmin = dbUser && (dbUser as TableRow<"users">).role === "admin";
  const isOwner = (campaign as TableRow<"campaigns">).organizer_id === user.id;

  if (!isOwner && !isAdmin) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const { error } = await supabase.from("campaigns").update({ status: "closed" }).eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
