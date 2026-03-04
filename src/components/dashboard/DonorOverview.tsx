import Link from "next/link";

import { CampaignIcon, DonateIcon, HeartIcon } from "@/components/icons";
import { type PaymentStatus } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

import BadgeProgress from "./BadgeProgress";

// ── Types ────────────────────────────────────────────────────────────────────

interface RecentDonation {
  id: string;
  amount_php: number;
  payment_status: PaymentStatus;
  created_at: string;
  campaigns: { title: string; slug: string } | null;
}

interface DonorOverviewProps {
  stats: {
    totalDonated: number;
    donationCount: number;
    campaignsSupported: number;
  };
  totalDonated: number;
  recentDonations: RecentDonation[];
  campaignCount?: number;
}

// ── Stat card data ───────────────────────────────────────────────────────────

interface StatCardConfig {
  label: string;
  value: string;
  icon: React.ReactNode;
  colorClass: string;
}

// ── Component ────────────────────────────────────────────────────────────────

export default function DonorOverview({
  stats,
  totalDonated,
  recentDonations,
  campaignCount,
}: DonorOverviewProps) {
  const statCards: StatCardConfig[] = [
    {
      label: "Total Donated",
      value: `PHP ${stats.totalDonated.toLocaleString()}`,
      icon: <DonateIcon className="h-6 w-6" />,
      colorClass: "text-teal-500",
    },
    {
      label: "Donations Made",
      value: String(stats.donationCount),
      icon: <HeartIcon className="h-6 w-6" />,
      colorClass: "text-forest-500",
    },
    {
      label: "Campaigns Supported",
      value: String(stats.campaignsSupported),
      icon: <CampaignIcon className="h-6 w-6" />,
      colorClass: "text-golden-500",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900"
          >
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800",
                  card.colorClass,
                )}
              >
                {card.icon}
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{card.label}</p>
                <p className="font-heading text-xl font-bold text-gray-900 dark:text-gray-100">
                  {card.value}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Badge Progress */}
      <div>
        <h2 className="mb-3 font-heading text-lg font-semibold text-gray-900 dark:text-gray-100">
          Badge Progress
        </h2>
        <BadgeProgress totalDonated={totalDonated} />
      </div>

      {/* Recent Donations */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-heading text-lg font-semibold text-gray-900 dark:text-gray-100">
            Recent Donations
          </h2>
          <Link
            href="/dashboard/donations"
            className="text-sm font-medium text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300"
          >
            View all
          </Link>
        </div>
        {recentDonations.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No donations yet. Support a campaign to get started!
          </p>
        ) : (
          <div className="divide-y divide-gray-200 rounded-xl border border-gray-200 bg-white dark:divide-gray-700 dark:border-gray-700 dark:bg-gray-900">
            {recentDonations.map((donation) => (
              <div key={donation.id} className="flex items-center justify-between px-4 py-3">
                <div className="min-w-0 flex-1">
                  {donation.campaigns ? (
                    <Link
                      href={`/campaigns/${donation.campaigns.slug}`}
                      className="truncate text-sm font-medium text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300"
                    >
                      {donation.campaigns.title}
                    </Link>
                  ) : (
                    <span className="text-sm text-gray-400">Unknown campaign</span>
                  )}
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(donation.created_at).toLocaleDateString("en-PH", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <p className="ml-4 text-sm font-semibold text-gray-900 dark:text-gray-100">
                  PHP {donation.amount_php.toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Organizer campaign card */}
      {campaignCount != null && (
        <div className="rounded-xl border border-teal-200 bg-teal-50 p-5 dark:border-teal-800 dark:bg-teal-950">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-100 text-teal-600 dark:bg-teal-900 dark:text-teal-400">
                <CampaignIcon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-teal-600 dark:text-teal-400">My Campaigns</p>
                <p className="font-heading text-xl font-bold text-teal-700 dark:text-teal-300">
                  {campaignCount}
                </p>
              </div>
            </div>
            <Link
              href="/dashboard/campaigns"
              className="text-sm font-medium text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300"
            >
              View all
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
