import Image from "next/image";
import Link from "next/link";

import CampaignUpdates from "@/components/campaigns/CampaignUpdates";
import { type DonationWithDonor } from "@/components/campaigns/DonorList";
import DonorList from "@/components/campaigns/DonorList";
import ShareButton from "@/components/campaigns/ShareButton";
import TopDonors from "@/components/campaigns/TopDonors";
import { CheckBadgeIcon, HeartIcon, UsersIcon } from "@/components/icons";
import { Avatar, Badge, Button, ProgressBar } from "@/components/ui";
import { getCategoryMeta } from "@/lib/constants/categories";
import { type TableRow } from "@/lib/supabase/types";
import { getImageUrl } from "@/lib/utils/image-url";

interface CampaignDetailProps {
  campaign: TableRow<"campaigns"> & {
    users: { full_name: string | null; avatar_url: string | null; is_verified: boolean } | null;
  };
  updates: TableRow<"campaign_updates">[];
  recentDonations: DonationWithDonor[];
  topDonors: DonationWithDonor[];
  showDonatedBanner: boolean;
}

export default function CampaignDetail({
  campaign,
  updates,
  recentDonations,
  topDonors,
  showDonatedBanner,
}: CampaignDetailProps) {
  const categoryMeta = getCategoryMeta(campaign.category);
  const imageUrl = getImageUrl(campaign.featured_image_url);
  const progressPercent =
    campaign.goal_amount > 0 ? (campaign.amount_raised / campaign.goal_amount) * 100 : 0;
  const organizerName = campaign.users?.full_name ?? "Campaign Organizer";

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* Donated success banner */}
      {showDonatedBanner && (
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200">
          <HeartIcon className="h-5 w-5 shrink-0" variant="filled" />
          <p className="text-sm font-medium">
            Thank you for your donation! Your generosity makes a difference.
          </p>
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-3">
        {/* ── Main Content (left column) ──────────────────────────────────────── */}
        <div className="lg:col-span-2">
          {/* Featured image */}
          <div className="relative aspect-video w-full overflow-hidden rounded-xl">
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt={campaign.title}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 66vw"
                priority
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-teal-400 to-forest-500">
                <span className="text-6xl">{categoryMeta.icon}</span>
              </div>
            )}
          </div>

          {/* Category badge + title */}
          <div className="mt-6">
            <Badge variant="info" className="mb-3">
              {categoryMeta.icon} {categoryMeta.label}
            </Badge>
            <h1 className="font-heading text-3xl font-bold text-gray-900 dark:text-gray-100">
              {campaign.title}
            </h1>
          </div>

          {/* Progress info (mobile: shown here, desktop: shown in sidebar) */}
          <div className="mt-6 rounded-xl border border-gray-200 p-5 dark:border-gray-700 lg:hidden">
            <ProgressSection
              amountRaised={campaign.amount_raised}
              goalAmount={campaign.goal_amount}
              donorCount={campaign.donor_count}
              progressPercent={progressPercent}
            />
            <div className="mt-4 flex gap-3">
              <Link href={`/donate/${campaign.slug}`} className="flex-1">
                <Button size="lg" className="w-full">
                  <HeartIcon className="mr-2 h-5 w-5" variant="filled" />
                  Donate Now
                </Button>
              </Link>
              <ShareButton title={campaign.title} slug={campaign.slug} />
            </div>
          </div>

          {/* Description */}
          <div className="mt-8">
            <h2 className="mb-3 font-heading text-xl font-semibold text-gray-900 dark:text-gray-100">
              About this campaign
            </h2>
            <div className="whitespace-pre-line text-gray-700 leading-relaxed dark:text-gray-300">
              {campaign.description}
            </div>
          </div>

          {/* Campaign Updates */}
          <div className="mt-10">
            <h2 className="mb-4 font-heading text-xl font-semibold text-gray-900 dark:text-gray-100">
              Updates ({String(updates.length)})
            </h2>
            <CampaignUpdates updates={updates} />
          </div>

          {/* Recent Donations */}
          <div className="mt-10">
            <h2 className="mb-4 font-heading text-xl font-semibold text-gray-900 dark:text-gray-100">
              Recent Donations
            </h2>
            <DonorList donations={recentDonations} />
          </div>
        </div>

        {/* ── Sidebar (right column, desktop only) ────────────────────────────── */}
        <div className="hidden lg:block">
          <div className="sticky top-24 space-y-6">
            {/* Donate CTA card */}
            <div className="rounded-xl border border-gray-200 p-5 dark:border-gray-700">
              <ProgressSection
                amountRaised={campaign.amount_raised}
                goalAmount={campaign.goal_amount}
                donorCount={campaign.donor_count}
                progressPercent={progressPercent}
              />
              <div className="mt-5 space-y-3">
                <Link href={`/donate/${campaign.slug}`}>
                  <Button size="lg" className="w-full">
                    <HeartIcon className="mr-2 h-5 w-5" variant="filled" />
                    Donate Now
                  </Button>
                </Link>
                <div className="flex justify-center">
                  <ShareButton title={campaign.title} slug={campaign.slug} />
                </div>
              </div>
            </div>

            {/* Organizer card */}
            <div className="rounded-xl border border-gray-200 p-5 dark:border-gray-700">
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Organizer
              </h3>
              <div className="flex items-center gap-3">
                <Avatar src={campaign.users?.avatar_url} alt={organizerName} size="lg" />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="truncate font-medium text-gray-900 dark:text-gray-100">
                      {organizerName}
                    </p>
                    {campaign.users?.is_verified && (
                      <CheckBadgeIcon className="h-4 w-4 shrink-0 text-teal-500" variant="filled" />
                    )}
                  </div>
                  {campaign.users?.is_verified && (
                    <p className="text-xs text-teal-600 dark:text-teal-400">Verified organizer</p>
                  )}
                </div>
              </div>
            </div>

            {/* Top Donors */}
            <div className="rounded-xl border border-gray-200 p-5 dark:border-gray-700">
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Top Donors
              </h3>
              <TopDonors donors={topDonors} />
            </div>
          </div>
        </div>
      </div>

      {/* Organizer + Top Donors (mobile only) */}
      <div className="mt-10 space-y-6 lg:hidden">
        {/* Organizer card */}
        <div className="rounded-xl border border-gray-200 p-5 dark:border-gray-700">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Organizer
          </h3>
          <div className="flex items-center gap-3">
            <Avatar src={campaign.users?.avatar_url} alt={organizerName} size="lg" />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="truncate font-medium text-gray-900 dark:text-gray-100">
                  {organizerName}
                </p>
                {campaign.users?.is_verified && (
                  <CheckBadgeIcon className="h-4 w-4 shrink-0 text-teal-500" variant="filled" />
                )}
              </div>
              {campaign.users?.is_verified && (
                <p className="text-xs text-teal-600 dark:text-teal-400">Verified organizer</p>
              )}
            </div>
          </div>
        </div>

        {/* Top Donors */}
        <div className="rounded-xl border border-gray-200 p-5 dark:border-gray-700">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Top Donors
          </h3>
          <TopDonors donors={topDonors} />
        </div>
      </div>
    </div>
  );
}

// ── Progress Section (reused in mobile and desktop) ───────────────────────────

function ProgressSection({
  amountRaised,
  goalAmount,
  donorCount,
  progressPercent,
}: {
  amountRaised: number;
  goalAmount: number;
  donorCount: number;
  progressPercent: number;
}) {
  return (
    <div>
      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
        {"\u20B1"}
        {amountRaised.toLocaleString()}
      </p>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        raised of {"\u20B1"}
        {goalAmount.toLocaleString()} goal
      </p>
      <ProgressBar
        value={progressPercent}
        size="md"
        variant={progressPercent >= 100 ? "success" : "default"}
        className="mt-3"
      />
      <div className="mt-2 flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
        <span>{Math.round(progressPercent)}% funded</span>
        <span className="flex items-center gap-1">
          <UsersIcon className="h-4 w-4" />
          {donorCount.toLocaleString()} {donorCount === 1 ? "donor" : "donors"}
        </span>
      </div>
    </div>
  );
}
