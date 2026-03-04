import { BADGE_TIERS } from "@/lib/constants/badge-tiers";
import { cn } from "@/lib/utils";

interface BadgeGalleryProps {
  earnedTiers: number[];
}

export default function BadgeGallery({ earnedTiers }: BadgeGalleryProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
      {BADGE_TIERS.map((badge) => {
        const isEarned = earnedTiers.includes(badge.tier);

        return (
          <div
            key={badge.tier}
            className={cn(
              "flex flex-col items-center rounded-xl border p-4 text-center transition-all",
              isEarned
                ? "border-teal-200 bg-white shadow-sm dark:border-teal-800 dark:bg-gray-900"
                : "border-gray-200 bg-gray-50 opacity-50 dark:border-gray-700 dark:bg-gray-800",
            )}
          >
            <span className="text-3xl">{badge.emoji}</span>
            <p
              className={cn(
                "mt-2 text-sm font-semibold",
                isEarned ? "text-gray-900 dark:text-gray-100" : "text-gray-400 dark:text-gray-500",
              )}
            >
              {badge.name}
            </p>
            <p
              className={cn(
                "mt-1 text-xs",
                isEarned ? "text-teal-600 dark:text-teal-400" : "text-gray-400 dark:text-gray-500",
              )}
            >
              PHP {badge.threshold.toLocaleString()}+
            </p>
          </div>
        );
      })}
    </div>
  );
}
