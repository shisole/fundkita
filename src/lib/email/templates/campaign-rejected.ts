interface CampaignRejectedParams {
  organizerName: string;
  campaignTitle: string;
  reason: string;
}

export function campaignRejectedEmail(params: CampaignRejectedParams) {
  const { organizerName, campaignTitle, reason } = params;

  const subject = "Campaign review update";

  const html = `
<div style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif">
  <div style="background:#14b8a6;padding:24px;text-align:center">
    <h1 style="color:white;margin:0;font-size:24px">FundKita</h1>
  </div>
  <div style="padding:32px;background:#fff">
    <h2 style="color:#111827;margin:0 0 16px">Campaign Review Update</h2>
    <p style="color:#374151;line-height:1.6;margin:0 0 24px">
      Hi ${organizerName}, after reviewing your campaign <strong>${campaignTitle}</strong>,
      we were unable to approve it at this time.
    </p>
    <div style="background:#fef2f2;border-left:4px solid #ef4444;padding:16px;border-radius:0 8px 8px 0;margin:0 0 24px">
      <p style="color:#991b1b;margin:0;font-size:14px;font-weight:600">Reason</p>
      <p style="color:#374151;margin:8px 0 0;font-size:14px;line-height:1.5">${reason}</p>
    </div>
    <p style="color:#374151;line-height:1.6;margin:0 0 24px">
      You can edit your campaign and resubmit it for review from your dashboard.
    </p>
    <div style="text-align:center;margin:0 0 24px">
      <a href="${process.env.NEXT_PUBLIC_SITE_URL ?? "https://fundkita.com"}/dashboard/campaigns" style="display:inline-block;background:#14b8a6;color:white;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600">
        Edit Campaign
      </a>
    </div>
  </div>
  <div style="padding:16px;text-align:center;color:#6b7280;font-size:12px">
    FundKita &mdash; The Philippines' trusted crowdfunding platform
  </div>
</div>`.trim();

  return { subject, html };
}
