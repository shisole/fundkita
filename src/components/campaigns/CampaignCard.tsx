import Image from "next/image";
import Link from "next/link";

import { CheckBadgeIcon, UsersIcon } from "@/components/icons";
import { Avatar, Badge, ProgressBar } from "@/components/ui";
import { getCategoryMeta } from "@/lib/constants/categories";
import { type CampaignCategory } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";
import { getImageUrl } from "@/lib/utils/image-url";

export interface CampaignWithOrganizer {
  id: string;
  title: string;
  description: string | null;
  category: CampaignCategory;
  goal_amount: number;
  amount_raised: number;
  donor_count: number;
  featured_image_url: string | null;
  slug: string;
  users: { full_name: string | null; avatar_url: string | null; is_verified: boolean } | null;
}

interface CampaignCardProps {
  campaign: CampaignWithOrganizer;
  className?: string;
}

export default function CampaignCard({ campaign, className }: CampaignCardProps) {
  const categoryMeta = getCategoryMeta(campaign.category);
  const progressPercent =
    campaign.goal_amount > 0 ? (campaign.amount_raised / campaign.goal_amount) * 100 : 0;
  const organizerName = campaign.users?.full_name ?? "Anonymous";
  const imageUrl = getImageUrl(campaign.featured_image_url);

  return (
    <Link
      href={`/campaigns/${campaign.slug}`}
      className={cn(
        "group flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white transition-all hover:border-teal-300 hover:shadow-lg dark:border-gray-800 dark:bg-gray-900 dark:hover:border-teal-700",
        className,
      )}
    >
      {/* Featured image */}
      <div className="relative aspect-[16/10] w-full overflow-hidden">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={campaign.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-teal-400 to-forest-500">
            <span className="text-4xl">{categoryMeta.icon}</span>
          </div>
        )}

        {/* Category badge overlay */}
        <div className="absolute left-3 top-3">
          <Badge variant="info" className="backdrop-blur-sm">
            {categoryMeta.icon} {categoryMeta.label}
          </Badge>
        </div>
      </div>

      {/* Card body */}
      <div className="flex flex-1 flex-col gap-3 p-4">
        {/* Title */}
        <h3 className="line-clamp-2 font-heading text-lg font-semibold text-gray-900 dark:text-gray-100">
          {campaign.title}
        </h3>

        {/* Progress bar */}
        <ProgressBar
          value={progressPercent}
          size="sm"
          variant={progressPercent >= 100 ? "success" : "default"}
        />

        {/* Amount raised */}
        <p className="text-sm text-gray-600 dark:text-gray-400">
          <span className="font-semibold text-gray-900 dark:text-gray-100">
            {"\u20B1"}
            {campaign.amount_raised.toLocaleString()}
          </span>{" "}
          raised of {"\u20B1"}
          {campaign.goal_amount.toLocaleString()}
        </p>

        {/* Spacer to push bottom content down */}
        <div className="mt-auto flex items-center justify-between pt-2">
          {/* Organizer row */}
          <div className="flex items-center gap-2">
            <Avatar src={campaign.users?.avatar_url} alt={organizerName} size="sm" />
            <span className="max-w-[120px] truncate text-sm text-gray-600 dark:text-gray-400">
              {organizerName}
            </span>
            {campaign.users?.is_verified && (
              <CheckBadgeIcon className="h-4 w-4 shrink-0 text-teal-500" variant="filled" />
            )}
          </div>

          {/* Donor count */}
          <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
            <UsersIcon className="h-4 w-4" />
            <span>
              {campaign.donor_count.toLocaleString()}{" "}
              {campaign.donor_count === 1 ? "donor" : "donors"}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
