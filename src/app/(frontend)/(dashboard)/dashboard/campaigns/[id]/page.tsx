import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { EditIcon, ExternalLinkIcon, PlusIcon } from "@/components/icons";
import { Breadcrumbs, Button, ProgressBar, StatusBadge } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";
import { type TableRow } from "@/lib/supabase/types";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CampaignDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/dashboard/campaigns");

  // Fetch current user's role
  const { data: dbUser } = await supabase.from("users").select("role").eq("id", user.id).single();
  const isAdmin = dbUser && (dbUser as TableRow<"users">).role === "admin";

  // Fetch campaign
  const { data: campaign } = await supabase.from("campaigns").select("*").eq("id", id).single();

  if (!campaign) notFound();

  const typedCampaign = campaign as TableRow<"campaigns">;

  // Verify ownership (unless admin)
  if (typedCampaign.organizer_id !== user.id && !isAdmin) {
    notFound();
  }

  // Fetch recent donations
  const { data: donationsData } = await supabase
    .from("donations")
    .select("id, donor_name, amount_php, is_anonymous, payment_status, created_at")
    .eq("campaign_id", id)
    .order("created_at", { ascending: false })
    .limit(5);

  const donations = (donationsData ?? []) as {
    id: string;
    donor_name: string;
    amount_php: number;
    is_anonymous: boolean;
    payment_status: string;
    created_at: string;
  }[];

  const progress =
    typedCampaign.goal_amount > 0
      ? Math.round((typedCampaign.amount_raised / typedCampaign.goal_amount) * 100)
      : 0;

  return (
    <div>
      <Breadcrumbs
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Campaigns", href: "/dashboard/campaigns" },
          { label: typedCampaign.title },
        ]}
        className="mb-4"
      />

      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-heading text-2xl font-bold text-gray-900 dark:text-gray-100">
              {typedCampaign.title}
            </h1>
            <StatusBadge status={typedCampaign.status} />
          </div>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{typedCampaign.location}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-6 rounded-xl border border-gray-200 p-6 dark:border-gray-700">
        <div className="mb-4 grid grid-cols-2 gap-6 sm:grid-cols-4">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Raised</p>
            <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
              ₱{typedCampaign.amount_raised.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Goal</p>
            <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
              ₱{typedCampaign.goal_amount.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Donors</p>
            <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
              {typedCampaign.donor_count}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Created</p>
            <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
              {new Date(typedCampaign.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
        <ProgressBar value={progress} showLabel />
      </div>

      {/* Quick Actions */}
      <div className="mb-8 flex flex-wrap gap-3">
        <Link href={`/dashboard/campaigns/${id}/edit`}>
          <Button size="sm" variant="outline">
            <EditIcon className="mr-2 h-4 w-4" />
            Edit
          </Button>
        </Link>
        <Link href={`/dashboard/campaigns/${id}/updates`}>
          <Button size="sm" variant="outline">
            <PlusIcon className="mr-2 h-4 w-4" />
            Post Update
          </Button>
        </Link>
        <Link href={`/dashboard/campaigns/${id}/donors`}>
          <Button size="sm" variant="outline">
            <ExternalLinkIcon className="mr-2 h-4 w-4" />
            View Donors
          </Button>
        </Link>
      </div>

      {/* Recent Donations */}
      <div>
        <h2 className="mb-4 font-heading text-lg font-semibold text-gray-900 dark:text-gray-100">
          Recent Donations
        </h2>
        {donations.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">No donations yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 font-medium text-gray-700 dark:text-gray-300">Donor</th>
                  <th className="px-4 py-3 font-medium text-gray-700 dark:text-gray-300">Amount</th>
                  <th className="px-4 py-3 font-medium text-gray-700 dark:text-gray-300">Date</th>
                  <th className="px-4 py-3 font-medium text-gray-700 dark:text-gray-300">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {donations.map((donation) => (
                  <tr key={donation.id}>
                    <td className="px-4 py-3 text-gray-900 dark:text-gray-100">
                      {donation.is_anonymous ? "Anonymous" : donation.donor_name}
                    </td>
                    <td className="px-4 py-3 text-gray-900 dark:text-gray-100">
                      ₱{donation.amount_php.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                      {new Date(donation.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge
                        status={donation.payment_status as TableRow<"donations">["payment_status"]}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
