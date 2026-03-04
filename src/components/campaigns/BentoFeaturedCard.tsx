import Image from "next/image";
import Link from "next/link";

import { type CampaignWithOrganizer } from "@/components/campaigns/CampaignCard";
import { UsersIcon } from "@/components/icons";
import { Badge } from "@/components/ui";
import { getCategoryMeta } from "@/lib/constants/categories";
import { getImageUrl } from "@/lib/utils/image-url";

interface BentoFeaturedCardProps {
  campaign: CampaignWithOrganizer;
}

export default function BentoFeaturedCard({ campaign }: BentoFeaturedCardProps) {
  const categoryMeta = getCategoryMeta(campaign.category);
  const imageUrl = getImageUrl(campaign.featured_image_url);
  const progressPercent =
    campaign.goal_amount > 0
      ? Math.min((campaign.amount_raised / campaign.goal_amount) * 100, 100)
      : 0;

  return (
    <Link
      href={`/campaigns/${campaign.slug}`}
      className="group relative flex h-full min-h-[320px] flex-col overflow-hidden rounded-2xl bg-gray-900"
    >
      {/* Image */}
      <div className="absolute inset-0">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={campaign.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 1024px) 100vw, 33vw"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-teal-400 to-forest-500">
            <span className="text-6xl">{categoryMeta.icon}</span>
          </div>
        )}
      </div>

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

      {/* Category badge */}
      <div className="relative p-4">
        <Badge variant="info" className="backdrop-blur-sm">
          {categoryMeta.icon} {categoryMeta.label}
        </Badge>
      </div>

      {/* Bottom content */}
      <div className="relative mt-auto flex flex-col gap-3 p-5">
        <h3 className="line-clamp-2 font-heading text-xl font-bold text-white sm:text-2xl">
          {campaign.title}
        </h3>

        {/* Inline progress bar */}
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/30">
          <div
            className="h-full rounded-full bg-teal-400 transition-all duration-300"
            style={{ width: `${String(progressPercent)}%` }}
          />
        </div>

        <div className="flex items-center justify-between">
          <p className="text-sm text-white/90">
            <span className="font-semibold text-white">
              {"\u20B1"}
              {campaign.amount_raised.toLocaleString()}
            </span>{" "}
            raised
          </p>

          <div className="flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
            <UsersIcon className="h-3.5 w-3.5" />
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
