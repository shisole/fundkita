import { Avatar } from "@/components/ui";
import { cn } from "@/lib/utils";

import DonorBadgeIcon from "./DonorBadgeIcon";

// ── Types ────────────────────────────────────────────────────────────────────

export interface LeaderboardEntry {
  rank: number;
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  total_donated: number;
  badge_tier: number;
  donation_count: number;
  is_anonymous: boolean;
}

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
  currentUserId?: string;
}

// ── Rank display ─────────────────────────────────────────────────────────────

function RankCell({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-golden-100 text-lg dark:bg-golden-900">
        <span role="img" aria-label="Gold trophy">
          {"🏆"}
        </span>
      </span>
    );
  }

  if (rank === 2) {
    return (
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-lg dark:bg-gray-700">
        <span role="img" aria-label="Silver medal">
          {"🥈"}
        </span>
      </span>
    );
  }

  if (rank === 3) {
    return (
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-golden-50 text-lg dark:bg-golden-950">
        <span role="img" aria-label="Bronze medal">
          {"🥉"}
        </span>
      </span>
    );
  }

  return (
    <span className="inline-flex h-8 w-8 items-center justify-center text-sm font-semibold text-gray-500 dark:text-gray-400">
      {String(rank)}
    </span>
  );
}

// ── Format currency ──────────────────────────────────────────────────────────

function formatPHP(amount: number): string {
  return `\u20B1${amount.toLocaleString("en-PH")}`;
}

// ── Component ────────────────────────────────────────────────────────────────

export default function LeaderboardTable({ entries, currentUserId }: LeaderboardTableProps) {
  if (entries.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white px-6 py-12 text-center dark:border-gray-700 dark:bg-gray-900">
        <p className="text-gray-500 dark:text-gray-400">No donors to display yet.</p>
        <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">
          Be the first to donate and appear on the leaderboard!
        </p>
      </div>
    );
  }

  return (
    <>
      {/* ── Desktop table ─────────────────────────────────────────────── */}
      <div className="hidden overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900 md:block">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Rank
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Donor
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Badge
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Total Donated
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Donations
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {entries.map((entry) => {
              const isCurrentUser = currentUserId === entry.user_id;

              return (
                <tr
                  key={entry.user_id}
                  className={cn(
                    "transition-colors hover:bg-gray-50 dark:hover:bg-gray-800",
                    isCurrentUser && "bg-teal-50 dark:bg-teal-950/50",
                  )}
                >
                  <td className="px-4 py-3">
                    <RankCell rank={entry.rank} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar
                        src={entry.is_anonymous ? null : entry.avatar_url}
                        alt={entry.full_name}
                        size="sm"
                      />
                      <span
                        className={cn(
                          "text-sm font-medium",
                          entry.is_anonymous
                            ? "italic text-gray-400 dark:text-gray-500"
                            : "text-gray-900 dark:text-gray-100",
                          isCurrentUser && "text-teal-700 dark:text-teal-300",
                        )}
                      >
                        {entry.full_name}
                        {isCurrentUser && (
                          <span className="ml-2 text-xs font-normal text-teal-500 dark:text-teal-400">
                            (You)
                          </span>
                        )}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {entry.badge_tier > 0 ? (
                      <DonorBadgeIcon tier={entry.badge_tier} size="md" />
                    ) : (
                      <span className="text-xs text-gray-400 dark:text-gray-500">&mdash;</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span
                      className={cn(
                        "text-sm font-semibold",
                        entry.rank <= 3
                          ? "text-golden-600 dark:text-golden-400"
                          : "text-gray-900 dark:text-gray-100",
                      )}
                    >
                      {formatPHP(entry.total_donated)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-gray-600 dark:text-gray-400">
                    {String(entry.donation_count)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── Mobile card layout ────────────────────────────────────────── */}
      <div className="space-y-3 md:hidden">
        {entries.map((entry) => {
          const isCurrentUser = currentUserId === entry.user_id;

          return (
            <div
              key={entry.user_id}
              className={cn(
                "rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900",
                isCurrentUser &&
                  "border-teal-300 bg-teal-50 dark:border-teal-700 dark:bg-teal-950/50",
              )}
            >
              <div className="flex items-center gap-3">
                <RankCell rank={entry.rank} />
                <Avatar
                  src={entry.is_anonymous ? null : entry.avatar_url}
                  alt={entry.full_name}
                  size="sm"
                />
                <div className="min-w-0 flex-1">
                  <p
                    className={cn(
                      "truncate text-sm font-medium",
                      entry.is_anonymous
                        ? "italic text-gray-400 dark:text-gray-500"
                        : "text-gray-900 dark:text-gray-100",
                      isCurrentUser && "text-teal-700 dark:text-teal-300",
                    )}
                  >
                    {entry.full_name}
                    {isCurrentUser && (
                      <span className="ml-1 text-xs font-normal text-teal-500 dark:text-teal-400">
                        (You)
                      </span>
                    )}
                  </p>
                  <div className="flex items-center gap-2">
                    {entry.badge_tier > 0 && <DonorBadgeIcon tier={entry.badge_tier} size="sm" />}
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {String(entry.donation_count)} donation
                      {entry.donation_count === 1 ? "" : "s"}
                    </span>
                  </div>
                </div>
                <p
                  className={cn(
                    "text-sm font-semibold",
                    entry.rank <= 3
                      ? "text-golden-600 dark:text-golden-400"
                      : "text-gray-900 dark:text-gray-100",
                  )}
                >
                  {formatPHP(entry.total_donated)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
