import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { type KycStatus, type TableRow } from "@/lib/supabase/types";

interface RouteContext {
  params: Promise<{ id: string }>;
}

// ── PATCH /api/kyc/[id] ──────────────────────────────────────────────────────

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
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

  const body = (await request.json()) as Partial<{
    status: KycStatus;
    rejection_reason: string;
  }>;

  const { status, rejection_reason } = body;

  if (!status || (status !== "approved" && status !== "rejected")) {
    return NextResponse.json({ error: "Status must be 'approved' or 'rejected'" }, { status: 400 });
  }

  if (status === "rejected" && !rejection_reason) {
    return NextResponse.json(
      { error: "Rejection reason is required when rejecting" },
      { status: 400 },
    );
  }

  // Fetch the submission to get user_id
  const { data: submission } = await supabase
    .from("kyc_submissions")
    .select("user_id")
    .eq("id", id)
    .single();

  if (!submission) {
    return NextResponse.json({ error: "KYC submission not found" }, { status: 404 });
  }

  // Update the KYC submission
  const { data: updated, error: updateError } = await supabase
    .from("kyc_submissions")
    .update({
      status,
      rejection_reason: status === "rejected" ? rejection_reason : null,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // If approved, mark the user as verified
  if (status === "approved") {
    const submissionData = submission as TableRow<"kyc_submissions">;
    await supabase.from("users").update({ is_verified: true }).eq("id", submissionData.user_id);
  }

  return NextResponse.json(updated);
}
