import Link from "next/link";

import { Breadcrumbs } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";
import { type PaymentMethod, type TableRow } from "@/lib/supabase/types";

export const metadata = {
  title: "Reports | Admin | FundKita",
};

const PERIOD_TABS: { value: string; label: string }[] = [
  { value: "day", label: "Day" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
  { value: "all", label: "All Time" },
];

const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  gcash: "GCash",
  maya: "Maya",
  card: "Card",
  bank_transfer: "Bank Transfer",
  gotyme: "GoTyme",
};

function getPeriodStartDate(period: string): string | null {
  const now = new Date();

  switch (period) {
    case "day": {
      const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      return dayStart.toISOString();
    }
    case "week": {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - 7);
      return weekStart.toISOString();
    }
    case "month": {
      const monthStart = new Date(now);
      monthStart.setMonth(now.getMonth() - 1);
      return monthStart.toISOString();
    }
    default: {
      return null;
    }
  }
}

interface PageProps {
  searchParams: Promise<{ period?: string }>;
}

export default async function AdminReportsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const period = params.period ?? "all";
  const supabase = await createClient();

  const periodStart = getPeriodStartDate(period);

  // Fetch total donations for the period
  let donationsQuery = supabase
    .from("donations")
    .select("amount_php, payment_method")
    .eq("payment_status", "confirmed");

  if (periodStart) {
    donationsQuery = donationsQuery.gte("created_at", periodStart);
  }

  const { data: donations } = await donationsQuery;

  const donationRows =
    (donations as Pick<TableRow<"donations">, "amount_php" | "payment_method">[] | null) ?? [];

  const totalDonations = donationRows.reduce((sum, d) => sum + d.amount_php, 0);
  const totalDonationCount = donationRows.length;

  // Payment method breakdown
  const methodBreakdown: Record<PaymentMethod, number> = {
    gcash: 0,
    maya: 0,
    card: 0,
    bank_transfer: 0,
    gotyme: 0,
  };

  for (const d of donationRows) {
    methodBreakdown[d.payment_method] += d.amount_php;
  }

  const maxMethodAmount = Math.max(...Object.values(methodBreakdown), 1);

  // Top 10 campaigns
  const { data: topCampaigns } = await supabase
    .from("campaigns")
    .select("id, title, amount_raised, donor_count")
    .order("amount_raised", { ascending: false })
    .limit(10);

  const topCampaignRows =
    (topCampaigns as
      | Pick<TableRow<"campaigns">, "id" | "title" | "amount_raised" | "donor_count">[]
      | null) ?? [];

  // Active campaign count
  const { count: activeCampaignCount } = await supabase
    .from("campaigns")
    .select("id", { count: "exact", head: true })
    .eq("status", "active");

  // Total users count
  const { count: totalUsersCount } = await supabase
    .from("users")
    .select("id", { count: "exact", head: true });

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "Reports" }]} />

      <div>
        <h1 className="font-heading text-2xl font-bold text-gray-900 dark:text-gray-100">
          Reports
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Platform analytics and performance metrics.
        </p>
      </div>

      {/* Period Selector */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        {PERIOD_TABS.map((tab) => {
          const isActive = period === tab.value;

          return (
            <Link
              key={tab.value}
              href={`/admin/reports?period=${tab.value}`}
              className={`relative px-4 py-2 text-sm transition-colors ${
                isActive
                  ? "font-semibold text-red-600 dark:text-red-400"
                  : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              }`}
            >
              {tab.label}
              {isActive && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-500 dark:bg-red-400" />
              )}
            </Link>
          );
        })}
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
          <p className="text-sm text-gray-500 dark:text-gray-400">Total Donations</p>
          <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-gray-100">
            {new Intl.NumberFormat("en-PH", {
              style: "currency",
              currency: "PHP",
              maximumFractionDigits: 0,
            }).format(totalDonations)}
          </p>
          <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
            {String(totalDonationCount)} donation{totalDonationCount === 1 ? "" : "s"}
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
          <p className="text-sm text-gray-500 dark:text-gray-400">Active Campaigns</p>
          <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-gray-100">
            {String(activeCampaignCount ?? 0)}
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
          <p className="text-sm text-gray-500 dark:text-gray-400">Total Users</p>
          <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-gray-100">
            {String(totalUsersCount ?? 0)}
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
          <p className="text-sm text-gray-500 dark:text-gray-400">Avg. Donation</p>
          <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-gray-100">
            {totalDonationCount > 0
              ? new Intl.NumberFormat("en-PH", {
                  style: "currency",
                  currency: "PHP",
                  maximumFractionDigits: 0,
                }).format(totalDonations / totalDonationCount)
              : "---"}
          </p>
        </div>
      </div>

      {/* Payment Method Breakdown */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
        <h2 className="mb-4 font-heading text-lg font-semibold text-gray-900 dark:text-gray-100">
          Payment Method Breakdown
        </h2>
        <div className="space-y-3">
          {(Object.entries(methodBreakdown) as [PaymentMethod, number][]).map(
            ([method, amount]) => {
              const percentage = maxMethodAmount > 0 ? (amount / maxMethodAmount) * 100 : 0;

              return (
                <div key={method}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="text-gray-700 dark:text-gray-300">
                      {PAYMENT_METHOD_LABELS[method]}
                    </span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {new Intl.NumberFormat("en-PH", {
                        style: "currency",
                        currency: "PHP",
                        maximumFractionDigits: 0,
                      }).format(amount)}
                    </span>
                  </div>
                  <div className="h-3 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                    <div
                      className="h-full rounded-full bg-teal-500 transition-all dark:bg-teal-400"
                      style={{ width: `${String(Math.max(percentage, 0))}%` }}
                    />
                  </div>
                </div>
              );
            },
          )}
        </div>
      </div>

      {/* Top 10 Campaigns */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
        <h2 className="mb-4 font-heading text-lg font-semibold text-gray-900 dark:text-gray-100">
          Top 10 Campaigns
        </h2>

        {topCampaignRows.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">No campaigns yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="px-4 py-2 font-semibold text-gray-700 dark:text-gray-300">#</th>
                  <th className="px-4 py-2 font-semibold text-gray-700 dark:text-gray-300">
                    Campaign
                  </th>
                  <th className="px-4 py-2 font-semibold text-gray-700 dark:text-gray-300">
                    Amount Raised
                  </th>
                  <th className="px-4 py-2 font-semibold text-gray-700 dark:text-gray-300">
                    Donors
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {topCampaignRows.map((campaign, index) => (
                  <tr key={campaign.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-4 py-2 text-gray-500 dark:text-gray-400">
                      {String(index + 1)}
                    </td>
                    <td className="px-4 py-2 font-medium text-gray-900 dark:text-gray-100">
                      {campaign.title}
                    </td>
                    <td className="px-4 py-2 text-gray-600 dark:text-gray-400">
                      {new Intl.NumberFormat("en-PH", {
                        style: "currency",
                        currency: "PHP",
                        maximumFractionDigits: 0,
                      }).format(campaign.amount_raised)}
                    </td>
                    <td className="px-4 py-2 text-gray-600 dark:text-gray-400">
                      {String(campaign.donor_count)}
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
