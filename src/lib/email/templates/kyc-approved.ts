interface KycApprovedParams {
  userName: string;
}

export function kycApprovedEmail(params: KycApprovedParams) {
  const { userName } = params;

  const subject = "Identity verification approved";

  const html = `
<div style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif">
  <div style="background:#14b8a6;padding:24px;text-align:center">
    <h1 style="color:white;margin:0;font-size:24px">FundKita</h1>
  </div>
  <div style="padding:32px;background:#fff">
    <h2 style="color:#111827;margin:0 0 16px">Identity Verified!</h2>
    <p style="color:#374151;line-height:1.6;margin:0 0 24px">
      Hi ${userName}, your identity verification has been approved. You now have full access
      to all FundKita features, including creating campaigns and requesting withdrawals.
    </p>
    <div style="background:#f0fdf4;border-left:4px solid #22c55e;padding:16px;border-radius:0 8px 8px 0;margin:0 0 24px">
      <p style="color:#166534;margin:0;font-size:14px">
        Your account is now fully verified. You can start creating campaigns right away.
      </p>
    </div>
    <div style="text-align:center;margin:0 0 24px">
      <a href="${process.env.NEXT_PUBLIC_SITE_URL ?? "https://fundkita.com"}/dashboard" style="display:inline-block;background:#14b8a6;color:white;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600">
        Go to Dashboard
      </a>
    </div>
  </div>
  <div style="padding:16px;text-align:center;color:#6b7280;font-size:12px">
    FundKita &mdash; The Philippines' trusted crowdfunding platform
  </div>
</div>`.trim();

  return { subject, html };
}
