import { createHash } from "node:crypto";

import {
  type DragonpayCreateRequest,
  type DragonpayCreateResponse,
  type DragonpayWebhookPayload,
} from "./types";

// ── Environment helpers ──────────────────────────────────────────────────────

function getMerchantId(): string {
  const value = process.env.DRAGONPAY_MERCHANT_ID;
  if (!value) {
    throw new Error("Missing DRAGONPAY_MERCHANT_ID environment variable");
  }
  return value;
}

function getPassword(): string {
  const value = process.env.DRAGONPAY_PASSWORD;
  if (!value) {
    throw new Error("Missing DRAGONPAY_PASSWORD environment variable");
  }
  return value;
}

function getApiUrl(): string {
  const value = process.env.DRAGONPAY_API_URL;
  if (!value) {
    throw new Error("Missing DRAGONPAY_API_URL environment variable");
  }
  return value;
}

// ── Create payment ───────────────────────────────────────────────────────────

/**
 * Create a Dragonpay payment request and return the payment URL.
 *
 * Sends a form-encoded POST to the Dragonpay collection API.
 */
export async function createPayment(
  params: DragonpayCreateRequest,
): Promise<DragonpayCreateResponse> {
  const apiUrl = getApiUrl();
  const url = `${apiUrl}/api/collect/v1/${params.txnId}/post`;

  const body = new URLSearchParams({
    merchantid: params.merchantId,
    txnid: params.txnId,
    amount: params.amount.toFixed(2),
    ccy: params.currency,
    description: params.description,
    email: params.email,
  });

  if (params.procId) {
    body.set("procid", params.procId);
  }

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Dragonpay API error (${String(response.status)}): ${text}`);
  }

  const data = (await response.json()) as DragonpayCreateResponse;
  return data;
}

// ── Verify webhook digest ────────────────────────────────────────────────────

/**
 * Validate the SHA-1 digest sent by Dragonpay in webhook callbacks.
 *
 * Digest formula: SHA1("txnid:refno:status:message:password")
 */
export function verifyWebhookDigest(payload: DragonpayWebhookPayload): boolean {
  const password = getPassword();
  const raw = `${payload.txnid}:${payload.refno}:${payload.status}:${payload.message}:${password}`;
  const computed = createHash("sha1").update(raw).digest("hex");
  return computed.toLowerCase() === payload.digest.toLowerCase();
}

/**
 * Returns the merchant ID for creating payment requests.
 */
export function getDragonpayMerchantId(): string {
  return getMerchantId();
}
