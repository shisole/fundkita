import Link from "next/link";

import { CampaignIcon, DonateIcon, FlagIcon, ShieldIcon, UserIcon } from "@/components/icons";
import { createClient } from "@/lib/supabase/server";
import { type CampaignStatus, type TableRow } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

interface StatCard {
  label: string;
  value: string;
  icon: React.ReactNode;
  href: string;
}

export default async function AdminPage() {
  const supabase = await createClient();

  // ── Fetch stats in parallel ────────────────────────────────────────────────
  const [donationsResult, campaignsResult, pendingReviewResult, pendingKycResult, openFlagsResult] =
    await Promise.all([
      // Total donations (confirmed)
      supabase.from("donations").select("amount_php").eq("payment_status", "confirmed"),

      // Active campaigns count
      supabase
        .from("campaigns")
        .select("id", { count: "exact", head: true })
        .eq("status", "active" as CampaignStatus),

      // Pending review campaigns count
      supabase
        .from("campaigns")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending_review" as CampaignStatus),

      // Pending KYC submissions count
      supabase
        .from("kyc_submissions")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending"),

      // Open fraud flags count
      supabase
        .from("fraud_flags")
        .select("id", { count: "exact", head: true })
        .eq("status", "open"),
    ]);

  const totalDonations = (donationsResult.data ?? []).reduce(
    (sum, d) => sum + (d as TableRow<"donations">).amount_php,
    0,
  );
  const activeCampaigns = campaignsResult.count ?? 0;
  const pendingReviews = pendingReviewResult.count ?? 0;
  const pendingKyc = pendingKycResult.count ?? 0;
  const openFlags = openFlagsResult.count ?? 0;

  const stats: StatCard[] = [
    {
      label: "Total Donations",
      value: `₱${totalDonations.toLocaleString()}`,
      icon: <DonateIcon className="h-6 w-6" />,
      href: "/admin",
    },
    {
      label: "Active Campaigns",
      value: String(activeCampaigns),
      icon: <CampaignIcon className="h-6 w-6" />,
      href: "/admin/campaigns?status=active",
    },
    {
      label: "Pending Reviews",
      value: String(pendingReviews),
      icon: <ShieldIcon className="h-6 w-6" />,
      href: "/admin/campaigns?status=pending_review",
    },
    {
      label: "Pending KYC",
      value: String(pendingKyc),
      icon: <UserIcon className="h-6 w-6" />,
      href: "/admin/kyc",
    },
    {
      label: "Open Fraud Flags",
      value: String(openFlags),
      icon: <FlagIcon className="h-6 w-6" />,
      href: "/admin/fraud",
    },
  ];

  const quickLinks = [
    {
      label: "Campaign Moderation",
      href: "/admin/campaigns",
      description: "Review and moderate campaigns",
    },
    { label: "KYC Review", href: "/admin/kyc", description: "Verify organizer identities" },
    { label: "Withdrawals", href: "/admin/withdrawals", description: "Manage withdrawal requests" },
    { label: "Fraud Flags", href: "/admin/fraud", description: "Investigate flagged campaigns" },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold text-gray-900 dark:text-gray-100">
          Admin Overview
        </h1>
        <p className="mt-1 text-gray-500 dark:text-gray-400">
          Platform statistics and quick actions.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className={cn(
              "rounded-xl border border-gray-200 bg-white p-5 transition-shadow hover:shadow-md",
              "dark:border-gray-700 dark:bg-gray-900",
            )}
          >
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400">
                {stat.icon}
              </div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{stat.label}</p>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stat.value}</p>
          </Link>
        ))}
      </div>

      {/* Quick Links */}
      <div>
        <h2 className="mb-4 font-heading text-xl font-semibold text-gray-900 dark:text-gray-100">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {quickLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "rounded-xl border border-gray-200 bg-white p-5 transition-all hover:border-red-300 hover:shadow-md",
                "dark:border-gray-700 dark:bg-gray-900 dark:hover:border-red-700",
              )}
            >
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">{link.label}</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{link.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
