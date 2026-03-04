interface DonationReceiptParams {
  donorName: string;
  campaignTitle: string;
  amount: number;
  currency: string;
  transactionId: string;
  date: string;
}

export function donationReceiptEmail(params: DonationReceiptParams) {
  const { donorName, campaignTitle, amount, currency, transactionId, date } = params;

  const subject = `Thank you for your donation to ${campaignTitle}`;

  const html = `
<div style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif">
  <div style="background:#14b8a6;padding:24px;text-align:center">
    <h1 style="color:white;margin:0;font-size:24px">FundKita</h1>
  </div>
  <div style="padding:32px;background:#fff">
    <h2 style="color:#111827;margin:0 0 16px">Thank you for your generosity!</h2>
    <p style="color:#374151;line-height:1.6;margin:0 0 24px">
      Hi ${donorName}, your donation to <strong>${campaignTitle}</strong> has been received.
      Your support makes a real difference.
    </p>
    <div style="background:#f9fafb;border-radius:8px;padding:20px;margin:0 0 24px">
      <table style="width:100%;border-collapse:collapse">
        <tr>
          <td style="padding:8px 0;color:#6b7280;font-size:14px">Amount</td>
          <td style="padding:8px 0;color:#111827;font-size:14px;text-align:right;font-weight:600">
            ${currency} ${amount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
          </td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#6b7280;font-size:14px">Campaign</td>
          <td style="padding:8px 0;color:#111827;font-size:14px;text-align:right">${campaignTitle}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#6b7280;font-size:14px">Transaction ID</td>
          <td style="padding:8px 0;color:#111827;font-size:14px;text-align:right;font-family:monospace">${transactionId}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#6b7280;font-size:14px">Date</td>
          <td style="padding:8px 0;color:#111827;font-size:14px;text-align:right">${date}</td>
        </tr>
      </table>
    </div>
    <p style="color:#374151;line-height:1.6;margin:0">
      Keep this email as your donation receipt. Thank you for being part of the FundKita community!
    </p>
  </div>
  <div style="padding:16px;text-align:center;color:#6b7280;font-size:12px">
    FundKita &mdash; The Philippines' trusted crowdfunding platform
  </div>
</div>`.trim();

  return { subject, html };
}
