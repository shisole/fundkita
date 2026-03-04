import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { type TableRow, type WithdrawalStatus } from "@/lib/supabase/types";

interface RouteContext {
  params: Promise<{ id: string }>;
}

// ── PATCH /api/withdrawals/[id] ─────────────────────────────────────────────

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
    status: WithdrawalStatus;
    rejection_reason: string;
  }>;

  const { status, rejection_reason } = body;

  const validStatuses: WithdrawalStatus[] = ["approved", "rejected", "processed"];
  if (!status || !validStatuses.includes(status)) {
    return NextResponse.json(
      { error: "Status must be 'approved', 'rejected', or 'processed'" },
      { status: 400 },
    );
  }

  if (status === "rejected" && !rejection_reason) {
    return NextResponse.json(
      { error: "Rejection reason is required when rejecting" },
      { status: 400 },
    );
  }

  // Verify the withdrawal exists
  const { data: withdrawal } = await supabase
    .from("withdrawal_requests")
    .select("id")
    .eq("id", id)
    .single();

  if (!withdrawal) {
    return NextResponse.json({ error: "Withdrawal request not found" }, { status: 404 });
  }

  // Update withdrawal status
  const { data: updated, error: updateError } = await supabase
    .from("withdrawal_requests")
    .update({
      status,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json(updated);
}
