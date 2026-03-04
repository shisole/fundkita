import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { type TableInsert, type TableRow } from "@/lib/supabase/types";

interface RouteContext {
  params: Promise<{ id: string }>;
}

// ── GET /api/campaigns/[id]/updates ──────────────────────────────────────────

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("campaign_updates")
    .select("*")
    .eq("campaign_id", id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}

// ── POST /api/campaigns/[id]/updates ─────────────────────────────────────────

export async function POST(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  // Verify campaign ownership
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

  const body = (await request.json()) as { title?: string; content?: string };

  if (!body.title?.trim()) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  if (!body.content?.trim()) {
    return NextResponse.json({ error: "Content is required" }, { status: 400 });
  }

  const insert: TableInsert<"campaign_updates"> = {
    campaign_id: id,
    title: body.title.trim(),
    content: body.content.trim(),
  };

  const { data, error } = await supabase.from("campaign_updates").insert(insert).select().single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
