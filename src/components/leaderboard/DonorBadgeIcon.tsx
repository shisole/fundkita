import { BADGE_TIERS } from "@/lib/constants/badge-tiers";
import { cn } from "@/lib/utils";

interface DonorBadgeIconProps {
  tier: number;
  size?: "sm" | "md";
}

export default function DonorBadgeIcon({ tier, size = "sm" }: DonorBadgeIconProps) {
  const badge = BADGE_TIERS.find((b) => b.tier === tier);

  if (!badge) return null;

  return (
    <span
      className={cn("inline-block", {
        "text-sm": size === "sm",
        "text-base": size === "md",
      })}
      title={`${badge.name} \u2022 \u20B1${String(badge.threshold)}+`}
      role="img"
      aria-label={`${badge.name} badge`}
    >
      {badge.emoji}
    </span>
  );
}
