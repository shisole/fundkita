import { randomUUID } from "node:crypto";

import { NextResponse } from "next/server";

import { createPayment, getDragonpayMerchantId } from "@/lib/dragonpay/client";
import { createClient } from "@/lib/supabase/server";
import { type Currency, type PaymentMethod, type TableInsert } from "@/lib/supabase/types";
import { getExchangeRate } from "@/lib/utils/exchange-rate";

// ── Processing fee rates by payment method ───────────────────────────────────

const FEE_RATES: Record<PaymentMethod, number> = {
  gcash: 0.02,
  maya: 0.02,
  gotyme: 0.02,
  card: 0.035,
  bank_transfer: 0.01,
};

// ── POST /api/donations ──────────────────────────────────────────────────────

export async function POST(request: Request) {
  const supabase = await createClient();

  // Parse and validate body
  const raw = (await request.json()) as Record<string, unknown>;

  const campaign_id = raw.campaign_id as string | undefined;
  const amount = raw.amount as number | undefined;
  const currency = raw.currency as Currency | undefined;
  const donor_name = raw.donor_name as string | undefined;
  const donor_email = raw.donor_email as string | undefined;
  const is_anonymous = (raw.is_anonymous as boolean | undefined) ?? false;
  const platform_tip = (raw.platform_tip as number | undefined) ?? 0;
  const cover_fee = (raw.cover_fee as boolean | undefined) ?? false;
  const payment_method = raw.payment_method as PaymentMethod | undefined;

  // ── Validate required fields ─────────────────────────────────────────────
  if (!campaign_id || !currency || !donor_name || !donor_email || !payment_method) {
    return NextResponse.json(
      {
        error:
          "Missing required fields: campaign_id, amount, currency, donor_name, donor_email, payment_method",
      },
      { status: 400 },
    );
  }

  if (typeof amount !== "number" || amount <= 0) {
    return NextResponse.json({ error: "Amount must be a positive number" }, { status: 400 });
  }

  if (!(payment_method in FEE_RATES)) {
    return NextResponse.json({ error: "Invalid payment method" }, { status: 400 });
  }

  // ── Verify campaign exists and is active ─────────────────────────────────
  const { data: campaign, error: campaignError } = await supabase
    .from("campaigns")
    .select("id, title, status")
    .eq("id", campaign_id)
    .single();

  if (campaignError ?? !campaign) {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  }

  if (campaign.status !== "active") {
    return NextResponse.json({ error: "Campaign is not accepting donations" }, { status: 400 });
  }

  // ── Resolve authenticated donor (optional) ──────────────────────────────
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // ── Currency conversion ──────────────────────────────────────────────────
  let amountPhp: number;
  let exchangeRate = 1;

  if (currency === "USD") {
    const { rate } = await getExchangeRate();
    exchangeRate = rate;
    amountPhp = amount * rate;
  } else {
    amountPhp = amount;
  }

  // ── Calculate processing fee ─────────────────────────────────────────────
  const feeRate = FEE_RATES[payment_method];
  const processingFee = Math.round(amountPhp * feeRate * 100) / 100;

  // If donor covers the fee, add it to the total charged
  const totalCharged = cover_fee
    ? amountPhp + processingFee + platform_tip
    : amountPhp + platform_tip;

  // ── Generate transaction ID ──────────────────────────────────────────────
  const txnId = `FK-${String(Date.now())}-${randomUUID().slice(0, 8)}`;

  // ── Insert donation record ───────────────────────────────────────────────
  const insert: TableInsert<"donations"> = {
    campaign_id,
    donor_id: user?.id ?? null,
    donor_name,
    donor_email,
    amount_php: amountPhp,
    original_amount: amount,
    original_currency: currency,
    exchange_rate: exchangeRate,
    platform_tip: platform_tip,
    processing_fee: processingFee,
    fee_covered_by_donor: cover_fee,
    payment_method,
    payment_status: "pending",
    is_anonymous,
    dragonpay_txn_id: txnId,
  };

  const { data: donation, error: insertError } = await supabase
    .from("donations")
    .insert(insert)
    .select("id")
    .single();

  if (insertError ?? !donation) {
    return NextResponse.json({ error: "Failed to create donation record" }, { status: 500 });
  }

  // ── Create Dragonpay payment ─────────────────────────────────────────────
  try {
    const merchantId = getDragonpayMerchantId();
    const paymentResponse = await createPayment({
      merchantId,
      txnId,
      amount: totalCharged,
      currency: "PHP",
      description: `Donation to ${campaign.title}`,
      email: donor_email,
    });

    return NextResponse.json(
      {
        paymentUrl: paymentResponse.Url,
        donationId: donation.id,
      },
      { status: 201 },
    );
  } catch (error) {
    // Mark donation as failed if Dragonpay request fails
    await supabase.from("donations").update({ payment_status: "failed" }).eq("id", donation.id);

    console.error(
      "[donations] Dragonpay payment creation failed:",
      error instanceof Error ? error.message : error,
    );

    return NextResponse.json(
      { error: "Payment gateway error. Please try again." },
      { status: 502 },
    );
  }
}
