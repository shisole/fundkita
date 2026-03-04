import CampaignForm from "@/components/campaigns/CampaignForm";
import { Breadcrumbs } from "@/components/ui";

export default function NewCampaignPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <Breadcrumbs
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Campaigns", href: "/dashboard/campaigns" },
          { label: "New Campaign" },
        ]}
        className="mb-4"
      />
      <h1 className="font-heading mb-6 text-2xl font-bold text-gray-900 dark:text-gray-100">
        Create a Campaign
      </h1>
      <CampaignForm mode="create" />
    </div>
  );
}
