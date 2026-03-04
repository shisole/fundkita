import Link from "next/link";
import { redirect } from "next/navigation";

import { PlusIcon } from "@/components/icons";
import { Button, EmptyState, ProgressBar, StatusBadge } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";
import { type TableRow } from "@/lib/supabase/types";

export default async function CampaignsListPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/dashboard/campaigns");

  const { data } = await supabase
    .from("campaigns")
    .select("*")
    .eq("organizer_id", user.id)
    .order("created_at", { ascending: false });

  const campaigns = (data ?? []) as TableRow<"campaigns">[];

  if (campaigns.length === 0) {
    return (
      <div>
        <div className="mb-6 flex items-center justify-between">
          <h1 className="font-heading text-2xl font-bold text-gray-900 dark:text-gray-100">
            My Campaigns
          </h1>
        </div>
        <EmptyState
          title="No campaigns yet"
          description="Create your first campaign and start raising funds."
          action={
            <Link href="/dashboard/campaigns/new">
              <Button>
                <PlusIcon className="mr-2 h-4 w-4" />
                Create Campaign
              </Button>
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold text-gray-900 dark:text-gray-100">
          My Campaigns
        </h1>
        <Link href="/dashboard/campaigns/new">
          <Button size="sm">
            <PlusIcon className="mr-2 h-4 w-4" />
            New Campaign
          </Button>
        </Link>
      </div>

      <div className="space-y-4">
        {campaigns.map((campaign) => {
          const progress =
            campaign.goal_amount > 0
              ? Math.round((campaign.amount_raised / campaign.goal_amount) * 100)
              : 0;

          return (
            <Link
              key={campaign.id}
              href={`/dashboard/campaigns/${campaign.id}`}
              className="block rounded-xl border border-gray-200 p-4 transition-colors hover:border-teal-300 dark:border-gray-700 dark:hover:border-teal-600"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="truncate font-medium text-gray-900 dark:text-gray-100">
                      {campaign.title}
                    </h3>
                    <StatusBadge status={campaign.status} />
                  </div>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {campaign.location}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900 dark:text-gray-100">
                    ₱{campaign.amount_raised.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500">
                    of ₱{campaign.goal_amount.toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="mt-3">
                <ProgressBar value={progress} size="sm" />
              </div>
              <div className="mt-2 flex items-center gap-4 text-xs text-gray-400">
                <span>{campaign.donor_count} donors</span>
                <span>{String(progress)}% funded</span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
