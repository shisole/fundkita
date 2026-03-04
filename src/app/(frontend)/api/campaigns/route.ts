import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import {
  type CampaignCategory,
  type CampaignStatus,
  type TableInsert,
  type TableRow,
} from "@/lib/supabase/types";

// ── GET /api/campaigns ───────────────────────────────────────────────────────

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search");
  const category = searchParams.get("category") as CampaignCategory | null;
  const status = (searchParams.get("status") ?? "active") as CampaignStatus;
  const sort = searchParams.get("sort") ?? "most_recent";
  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") ?? "12")));
  const offset = (page - 1) * limit;

  const supabase = await createClient();

  let query = supabase
    .from("campaigns")
    .select("*, users!campaigns_organizer_id_fkey(full_name, avatar_url, is_verified)", {
      count: "exact",
    })
    .eq("status", status);

  if (category) {
    query = query.eq("category", category);
  }

  if (search) {
    query = query.textSearch("title", search, { type: "websearch" });
  }

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
      query = query.order("created_at", { ascending: false });
      break;
    }
  }

  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    campaigns: data,
    total: count ?? 0,
    page,
    limit,
  });
}

// ── POST /api/campaigns ──────────────────────────────────────────────────────

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const body = (await request.json()) as Partial<TableInsert<"campaigns">> & { draft?: boolean };
  const {
    title,
    description,
    category,
    goal_amount,
    location,
    end_date,
    featured_image_url,
    draft,
  } = body;

  if (!title || !description || !category || !goal_amount || !location) {
    return NextResponse.json(
      { error: "Missing required fields: title, description, category, goal_amount, location" },
      { status: 400 },
    );
  }

  if (goal_amount <= 0) {
    return NextResponse.json({ error: "Goal amount must be positive" }, { status: 400 });
  }

  // Auto-upgrade donor to organizer
  const { data: dbUser } = await supabase.from("users").select("role").eq("id", user.id).single();

  if (dbUser && (dbUser as TableRow<"users">).role === "donor") {
    await supabase.from("users").update({ role: "organizer" }).eq("id", user.id);
  }

  const insert: TableInsert<"campaigns"> = {
    organizer_id: user.id,
    title,
    description,
    category: category,
    goal_amount,
    location,
    status: draft ? "draft" : "pending_review",
    featured_image_url: featured_image_url ?? null,
    end_date: end_date ?? null,
  };

  const { data, error } = await supabase.from("campaigns").insert(insert).select().single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
