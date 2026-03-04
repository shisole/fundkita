interface KycRejectedParams {
  userName: string;
  reason: string;
}

export function kycRejectedEmail(params: KycRejectedParams) {
  const { userName, reason } = params;

  const subject = "Identity verification update";

  const html = `
<div style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif">
  <div style="background:#14b8a6;padding:24px;text-align:center">
    <h1 style="color:white;margin:0;font-size:24px">FundKita</h1>
  </div>
  <div style="padding:32px;background:#fff">
    <h2 style="color:#111827;margin:0 0 16px">Verification Update</h2>
    <p style="color:#374151;line-height:1.6;margin:0 0 24px">
      Hi ${userName}, we were unable to verify your identity at this time.
    </p>
    <div style="background:#fef2f2;border-left:4px solid #ef4444;padding:16px;border-radius:0 8px 8px 0;margin:0 0 24px">
      <p style="color:#991b1b;margin:0;font-size:14px;font-weight:600">Reason</p>
      <p style="color:#374151;margin:8px 0 0;font-size:14px;line-height:1.5">${reason}</p>
    </div>
    <p style="color:#374151;line-height:1.6;margin:0 0 24px">
      Please review the reason above and resubmit your verification documents.
    </p>
    <div style="text-align:center;margin:0 0 24px">
      <a href="${process.env.NEXT_PUBLIC_SITE_URL ?? "https://fundkita.com"}/dashboard/settings" style="display:inline-block;background:#14b8a6;color:white;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600">
        Resubmit Verification
      </a>
    </div>
  </div>
  <div style="padding:16px;text-align:center;color:#6b7280;font-size:12px">
    FundKita &mdash; The Philippines' trusted crowdfunding platform
  </div>
</div>`.trim();

  return { subject, html };
}
