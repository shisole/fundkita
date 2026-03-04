import { EmptyState } from "@/components/ui";

import CampaignCard, { type CampaignWithOrganizer } from "./CampaignCard";

interface CampaignGridProps {
  campaigns: CampaignWithOrganizer[];
  emptyMessage?: string;
}

export default function CampaignGrid({
  campaigns,
  emptyMessage = "No campaigns found.",
}: CampaignGridProps) {
  if (campaigns.length === 0) {
    return <EmptyState title={emptyMessage} />;
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {campaigns.map((campaign) => (
        <CampaignCard key={campaign.id} campaign={campaign} />
      ))}
    </div>
  );
}
