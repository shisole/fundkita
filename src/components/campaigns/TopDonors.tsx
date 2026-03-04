import { type DonationWithDonor } from "@/components/campaigns/DonorList";
import { TrophyIcon } from "@/components/icons";
import { Avatar } from "@/components/ui";
import { getTierForAmount } from "@/lib/constants/badge-tiers";
import { cn } from "@/lib/utils";

interface TopDonorsProps {
  donors: DonationWithDonor[];
  className?: string;
}

export default function TopDonors({ donors, className }: TopDonorsProps) {
  if (donors.length === 0) {
    return (
      <p className={cn("text-sm text-gray-500 dark:text-gray-400", className)}>No donors yet.</p>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      {donors.map((donor, index) => {
        const name = donor.is_anonymous
          ? "Anonymous Donor"
          : (donor.users?.full_name ?? "Anonymous Donor");
        const tier = getTierForAmount(donor.amount);
        const position = index + 1;

        return (
          <div key={donor.id} className="flex items-center gap-3">
            {/* Position number / trophy */}
            <div className="flex h-6 w-6 shrink-0 items-center justify-center">
              {position === 1 ? (
                <TrophyIcon className="h-5 w-5 text-golden-500" variant="filled" />
              ) : (
                <span className="text-sm font-bold text-gray-400 dark:text-gray-500">
                  {String(position)}
                </span>
              )}
            </div>

            <Avatar
              src={donor.is_anonymous ? null : donor.users?.avatar_url}
              alt={name}
              size="sm"
            />

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                {name}
                {tier ? ` ${tier.emoji}` : ""}
              </p>
              {tier && <p className="text-xs text-gray-500 dark:text-gray-400">{tier.name}</p>}
            </div>

            <p className="shrink-0 text-sm font-semibold text-gray-900 dark:text-gray-100">
              {"\u20B1"}
              {donor.amount.toLocaleString()}
            </p>
          </div>
        );
      })}
    </div>
  );
}
