// ── Dragonpay API types ──────────────────────────────────────────────────────

export interface DragonpayCreateRequest {
  merchantId: string;
  txnId: string;
  amount: number;
  currency: string;
  description: string;
  email: string;
  procId?: string;
}

export interface DragonpayCreateResponse {
  Url: string;
  TxnId: string;
  Status: string;
  Message: string;
}

export interface DragonpayWebhookPayload {
  txnid: string;
  refno: string;
  status: string;
  message: string;
  digest: string;
}
