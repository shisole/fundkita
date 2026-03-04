import Image from "next/image";
import Link from "next/link";

import { type CampaignWithOrganizer } from "@/components/campaigns/CampaignCard";
import { UsersIcon } from "@/components/icons";
import { getCategoryMeta } from "@/lib/constants/categories";

interface BentoCompactCardProps {
  campaign: CampaignWithOrganizer;
}

export default function BentoCompactCard({ campaign }: BentoCompactCardProps) {
  const categoryMeta = getCategoryMeta(campaign.category);
  const progressPercent =
    campaign.goal_amount > 0
      ? Math.min((campaign.amount_raised / campaign.goal_amount) * 100, 100)
      : 0;

  return (
    <Link
      href={`/campaigns/${campaign.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white transition-all hover:border-teal-300 hover:shadow-lg dark:border-gray-800 dark:bg-gray-900 dark:hover:border-teal-700"
    >
      {/* Image */}
      <div className="relative aspect-[16/10] w-full overflow-hidden">
        {campaign.featured_image_url ? (
          <Image
            src={campaign.featured_image_url}
            alt={campaign.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-teal-400 to-forest-500">
            <span className="text-3xl">{categoryMeta.icon}</span>
          </div>
        )}

        {/* Donor count pill overlay */}
        <div className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-black/50 px-2 py-1 text-xs font-medium text-white backdrop-blur-sm">
          <UsersIcon className="h-3 w-3" />
          <span>{campaign.donor_count.toLocaleString()}</span>
        </div>
      </div>

      {/* Card body */}
      <div className="flex flex-1 flex-col gap-2 p-3">
        <h3 className="line-clamp-2 font-heading text-sm font-semibold text-gray-900 dark:text-gray-100">
          {campaign.title}
        </h3>

        {/* Inline progress bar */}
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
          <div
            className="h-full rounded-full bg-teal-500 transition-all duration-300"
            style={{ width: `${String(progressPercent)}%` }}
          />
        </div>

        <p className="text-xs text-gray-600 dark:text-gray-400">
          <span className="font-semibold text-gray-900 dark:text-gray-100">
            {"\u20B1"}
            {campaign.amount_raised.toLocaleString()}
          </span>{" "}
          raised
        </p>
      </div>
    </Link>
  );
}
