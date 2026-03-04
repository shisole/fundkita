import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { type KycIdType, type TableInsert, type TableRow } from "@/lib/supabase/types";

// ── POST /api/kyc ────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  // Check user role
  const { data: dbUser } = await supabase.from("users").select("role").eq("id", user.id).single();

  if (!dbUser || (dbUser as TableRow<"users">).role === "donor") {
    return NextResponse.json(
      { error: "Only organizers can submit KYC verification" },
      { status: 403 },
    );
  }

  const body = (await request.json()) as Partial<{
    id_type: KycIdType;
    id_front_url: string;
    id_back_url: string;
    selfie_url: string;
  }>;

  const { id_type, id_front_url, id_back_url, selfie_url } = body;

  if (!id_type || !id_front_url || !id_back_url || !selfie_url) {
    return NextResponse.json(
      { error: "Missing required fields: id_type, id_front_url, id_back_url, selfie_url" },
      { status: 400 },
    );
  }

  const validIdTypes: KycIdType[] = ["national_id", "passport", "drivers_license", "philsys"];
  if (!validIdTypes.includes(id_type)) {
    return NextResponse.json({ error: "Invalid ID type" }, { status: 400 });
  }

  const insert: TableInsert<"kyc_submissions"> = {
    user_id: user.id,
    id_type,
    id_front_url,
    id_back_url,
    selfie_url,
    status: "pending",
  };

  const { data, error } = await supabase.from("kyc_submissions").insert(insert).select().single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}

// ── GET /api/kyc (admin-only) ────────────────────────────────────────────────

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  // Check admin role
  const { data: dbUser } = await supabase.from("users").select("role").eq("id", user.id).single();

  if (!dbUser || (dbUser as TableRow<"users">).role !== "admin") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") ?? "20")));
  const offset = (page - 1) * limit;

  const { data, error, count } = await supabase
    .from("kyc_submissions")
    .select("*, users(full_name, email, avatar_url)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    submissions: data,
    total: count ?? 0,
    page,
    limit,
  });
}
