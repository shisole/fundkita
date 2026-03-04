import { notFound, redirect } from "next/navigation";

import { Breadcrumbs, StatusBadge } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";
import { type TableRow } from "@/lib/supabase/types";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CampaignDonorsPage({ params }: PageProps) {
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
  const { data: campaign } = await supabase
    .from("campaigns")
    .select("id, title, organizer_id")
    .eq("id", id)
    .single();

  if (!campaign) notFound();

  const typedCampaign = campaign as Pick<TableRow<"campaigns">, "id" | "title" | "organizer_id">;

  // Verify ownership (unless admin)
  if (typedCampaign.organizer_id !== user.id && !isAdmin) {
    notFound();
  }

  // Fetch all donations
  const { data: donationsData } = await supabase
    .from("donations")
    .select("id, donor_name, amount_php, is_anonymous, payment_status, payment_method, created_at")
    .eq("campaign_id", id)
    .order("created_at", { ascending: false });

  const donations = (donationsData ?? []) as {
    id: string;
    donor_name: string;
    amount_php: number;
    is_anonymous: boolean;
    payment_status: TableRow<"donations">["payment_status"];
    payment_method: TableRow<"donations">["payment_method"];
    created_at: string;
  }[];

  const paymentMethodLabels: Record<TableRow<"donations">["payment_method"], string> = {
    gcash: "GCash",
    maya: "Maya",
    card: "Card",
    bank_transfer: "Bank Transfer",
    gotyme: "GoTyme",
  };

  return (
    <div>
      <Breadcrumbs
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Campaigns", href: "/dashboard/campaigns" },
          { label: typedCampaign.title, href: `/dashboard/campaigns/${id}` },
          { label: "Donors" },
        ]}
        className="mb-4"
      />

      <h1 className="font-heading mb-6 text-2xl font-bold text-gray-900 dark:text-gray-100">
        Donors
      </h1>

      {donations.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">No donations yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 font-medium text-gray-700 dark:text-gray-300">Donor</th>
                <th className="px-4 py-3 font-medium text-gray-700 dark:text-gray-300">
                  Amount (₱)
                </th>
                <th className="px-4 py-3 font-medium text-gray-700 dark:text-gray-300">Date</th>
                <th className="px-4 py-3 font-medium text-gray-700 dark:text-gray-300">Status</th>
                <th className="px-4 py-3 font-medium text-gray-700 dark:text-gray-300">
                  Payment Method
                </th>
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
                    <StatusBadge status={donation.payment_status} />
                  </td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                    {paymentMethodLabels[donation.payment_method]}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
