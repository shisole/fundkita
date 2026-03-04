import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

// ── GET /api/donations/history ───────────────────────────────────────────────

export async function GET(request: Request) {
  const supabase = await createClient();

  // ── Auth required ──────────────────────────────────────────────────────────
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  // ── Pagination params ──────────────────────────────────────────────────────
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") ?? "20")));
  const offset = (page - 1) * limit;

  // ── Fetch donations with campaign data ─────────────────────────────────────
  const { data, error, count } = await supabase
    .from("donations")
    .select("*, campaigns(title, slug)", { count: "exact" })
    .eq("donor_id", user.id)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    donations: data,
    total: count ?? 0,
    page,
    limit,
  });
}
