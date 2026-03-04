import { ProgressBar } from "@/components/ui";
import { getNextTier, getProgressToNextTier, getTierForAmount } from "@/lib/constants/badge-tiers";

interface BadgeProgressProps {
  totalDonated: number;
}

export default function BadgeProgress({ totalDonated }: BadgeProgressProps) {
  const currentTier = getTierForAmount(totalDonated);
  const nextTier = currentTier ? getNextTier(currentTier.tier) : null;
  const { progress } = getProgressToNextTier(totalDonated);

  if (currentTier && !nextTier) {
    return (
      <div className="rounded-xl border border-golden-200 bg-golden-50 p-4 dark:border-golden-800 dark:bg-golden-950">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{currentTier.emoji}</span>
          <div>
            <p className="font-heading text-lg font-bold text-golden-700 dark:text-golden-300">
              {currentTier.name}
            </p>
            <p className="text-sm text-golden-600 dark:text-golden-400">
              You&apos;ve reached the highest tier!
            </p>
          </div>
        </div>
      </div>
    );
  }

  const nextTarget = nextTier ?? getNextTier(0);
  const remaining = nextTarget ? nextTarget.threshold - totalDonated : 0;

  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
      <div className="mb-3 flex items-center gap-3">
        {currentTier ? (
          <>
            <span className="text-3xl">{currentTier.emoji}</span>
            <div>
              <p className="font-heading text-lg font-bold text-gray-900 dark:text-gray-100">
                {currentTier.name}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Current tier</p>
            </div>
          </>
        ) : (
          <div>
            <p className="font-heading text-lg font-bold text-gray-900 dark:text-gray-100">
              No tier yet
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Start donating to earn badges
            </p>
          </div>
        )}
      </div>
      <ProgressBar value={progress} size="md" showLabel />
      {nextTarget && (
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          PHP {remaining.toLocaleString()} more to reach {nextTarget.emoji} {nextTarget.name}
        </p>
      )}
    </div>
  );
}
