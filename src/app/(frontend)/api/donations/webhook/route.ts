import { NextResponse } from "next/server";

import { verifyWebhookDigest } from "@/lib/dragonpay/client";
import { type DragonpayWebhookPayload } from "@/lib/dragonpay/types";
import { createServiceClient } from "@/lib/supabase/server";
import { type PaymentStatus } from "@/lib/supabase/types";

// ── Map Dragonpay status codes to our PaymentStatus ──────────────────────────

function mapDragonpayStatus(status: string): PaymentStatus | null {
  switch (status) {
    case "S": {
      return "confirmed";
    }
    case "F":
    case "V": {
      return "failed";
    }
    default: {
      // Other statuses (P = pending, U = unknown, R = refund, etc.) — keep current
      return null;
    }
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Extract a string value from form data, defaulting to empty string. */
function getFormString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

// ── POST /api/donations/webhook ──────────────────────────────────────────────

export async function POST(request: Request) {
  // Dragonpay sends form-encoded data
  const formData = await request.formData();

  const payload: DragonpayWebhookPayload = {
    txnid: getFormString(formData, "txnid"),
    refno: getFormString(formData, "refno"),
    status: getFormString(formData, "status"),
    message: getFormString(formData, "message"),
    digest: getFormString(formData, "digest"),
  };

  // ── Verify digest signature ────────────────────────────────────────────────
  if (!verifyWebhookDigest(payload)) {
    console.error("[webhook] Invalid digest for txnid:", payload.txnid);
    // Return 200 to prevent Dragonpay from retrying
    return NextResponse.json({ result: "OK" }, { status: 200 });
  }

  // ── Find donation by Dragonpay transaction ID ──────────────────────────────
  const supabase = createServiceClient();

  const { data: donation, error: findError } = await supabase
    .from("donations")
    .select("id, payment_status")
    .eq("dragonpay_txn_id", payload.txnid)
    .single();

  if (findError ?? !donation) {
    console.error("[webhook] Donation not found for txnid:", payload.txnid);
    return NextResponse.json({ result: "OK" }, { status: 200 });
  }

  // ── Map and update status ──────────────────────────────────────────────────
  const newStatus = mapDragonpayStatus(payload.status);

  if (newStatus && newStatus !== donation.payment_status) {
    const { error: updateError } = await supabase
      .from("donations")
      .update({ payment_status: newStatus })
      .eq("id", donation.id);

    if (updateError) {
      console.error("[webhook] Failed to update donation status:", updateError.message);
    }
  }

  // DB triggers handle campaign total updates and badge computations

  // Always return 200 to acknowledge receipt
  return NextResponse.json({ result: "OK" }, { status: 200 });
}
