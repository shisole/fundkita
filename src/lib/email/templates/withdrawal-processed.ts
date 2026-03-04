interface WithdrawalProcessedParams {
  organizerName: string;
  amount: number;
  payoutMethod: string;
  campaignTitle: string;
}

export function withdrawalProcessedEmail(params: WithdrawalProcessedParams) {
  const { organizerName, amount, payoutMethod, campaignTitle } = params;

  const subject = "Withdrawal processed";

  const html = `
<div style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif">
  <div style="background:#14b8a6;padding:24px;text-align:center">
    <h1 style="color:white;margin:0;font-size:24px">FundKita</h1>
  </div>
  <div style="padding:32px;background:#fff">
    <h2 style="color:#111827;margin:0 0 16px">Withdrawal Processed</h2>
    <p style="color:#374151;line-height:1.6;margin:0 0 24px">
      Hi ${organizerName}, your withdrawal request has been processed successfully.
    </p>
    <div style="background:#f9fafb;border-radius:8px;padding:20px;margin:0 0 24px">
      <table style="width:100%;border-collapse:collapse">
        <tr>
          <td style="padding:8px 0;color:#6b7280;font-size:14px">Amount</td>
          <td style="padding:8px 0;color:#111827;font-size:14px;text-align:right;font-weight:600">
            PHP ${amount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
          </td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#6b7280;font-size:14px">Payout Method</td>
          <td style="padding:8px 0;color:#111827;font-size:14px;text-align:right">${payoutMethod}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#6b7280;font-size:14px">Campaign</td>
          <td style="padding:8px 0;color:#111827;font-size:14px;text-align:right">${campaignTitle}</td>
        </tr>
      </table>
    </div>
    <p style="color:#374151;line-height:1.6;margin:0">
      The funds should arrive in your account within 1&ndash;3 business days depending on
      your payout method. If you have any questions, please contact our support team.
    </p>
  </div>
  <div style="padding:16px;text-align:center;color:#6b7280;font-size:12px">
    FundKita &mdash; The Philippines' trusted crowdfunding platform
  </div>
</div>`.trim();

  return { subject, html };
}
