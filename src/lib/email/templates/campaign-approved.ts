interface CampaignApprovedParams {
  organizerName: string;
  campaignTitle: string;
  campaignUrl: string;
}

export function campaignApprovedEmail(params: CampaignApprovedParams) {
  const { organizerName, campaignTitle, campaignUrl } = params;

  const subject = "Your campaign has been approved!";

  const html = `
<div style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif">
  <div style="background:#14b8a6;padding:24px;text-align:center">
    <h1 style="color:white;margin:0;font-size:24px">FundKita</h1>
  </div>
  <div style="padding:32px;background:#fff">
    <h2 style="color:#111827;margin:0 0 16px">Congratulations, ${organizerName}!</h2>
    <p style="color:#374151;line-height:1.6;margin:0 0 24px">
      Great news! Your campaign <strong>${campaignTitle}</strong> has been reviewed and approved.
      It is now live and ready to receive donations.
    </p>
    <div style="text-align:center;margin:0 0 24px">
      <a href="${campaignUrl}" style="display:inline-block;background:#14b8a6;color:white;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600">
        View Your Campaign
      </a>
    </div>
    <p style="color:#374151;line-height:1.6;margin:0">
      Share your campaign with friends and family to start receiving support.
      Good luck!
    </p>
  </div>
  <div style="padding:16px;text-align:center;color:#6b7280;font-size:12px">
    FundKita &mdash; The Philippines' trusted crowdfunding platform
  </div>
</div>`.trim();

  return { subject, html };
}
