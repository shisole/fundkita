import { Avatar } from "@/components/ui";
import { cn } from "@/lib/utils";

export interface DonationWithDonor {
  id: string;
  amount: number;
  created_at: string;
  is_anonymous: boolean;
  users: { full_name: string | null; avatar_url: string | null } | null;
}

interface DonorListProps {
  donations: DonationWithDonor[];
  className?: string;
}

function getRelativeTime(dateString: string): string {
  const now = Date.now();
  const then = new Date(dateString).getTime();
  const diffMs = now - then;

  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${String(minutes)}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${String(hours)}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 30) return `${String(days)}d ago`;

  const months = Math.floor(days / 30);
  if (months < 12) return `${String(months)}mo ago`;

  const years = Math.floor(months / 12);
  return `${String(years)}y ago`;
}

export default function DonorList({ donations, className }: DonorListProps) {
  if (donations.length === 0) {
    return (
      <p className={cn("text-sm text-gray-500 dark:text-gray-400", className)}>
        No donations yet. Be the first to donate!
      </p>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      {donations.map((donation) => {
        const name = donation.is_anonymous
          ? "Anonymous"
          : (donation.users?.full_name ?? "Anonymous");

        return (
          <div key={donation.id} className="flex items-center gap-3">
            <Avatar
              src={donation.is_anonymous ? null : donation.users?.avatar_url}
              alt={name}
              size="sm"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                {name}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {getRelativeTime(donation.created_at)}
              </p>
            </div>
            <p className="shrink-0 text-sm font-semibold text-gray-900 dark:text-gray-100">
              {"\u20B1"}
              {donation.amount.toLocaleString()}
            </p>
          </div>
        );
      })}
    </div>
  );
}
