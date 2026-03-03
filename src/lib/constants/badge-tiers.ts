// ── Badge tier thresholds (PHP) ──────────────────────────────────────────────

export interface BadgeTier {
  tier: number;
  name: string;
  emoji: string;
  /** Minimum lifetime donations in PHP to earn this badge */
  threshold: number;
}

export const BADGE_TIERS: readonly BadgeTier[] = [
  { tier: 1, name: "First Step", emoji: "\u{1F331}", threshold: 100 },
  { tier: 2, name: "Supporter", emoji: "\u{1F91D}", threshold: 500 },
  { tier: 3, name: "Helper", emoji: "\u{1F496}", threshold: 1_000 },
  { tier: 4, name: "Advocate", emoji: "\u2B50", threshold: 5_000 },
  { tier: 5, name: "Champion", emoji: "\u{1F3C5}", threshold: 10_000 },
  { tier: 6, name: "Patron", emoji: "\u{1F451}", threshold: 25_000 },
  { tier: 7, name: "Legacy Builder", emoji: "\u{1F3DB}\uFE0F", threshold: 50_000 },
  { tier: 8, name: "Humanitarian", emoji: "\u{1F30D}", threshold: 100_000 },
  { tier: 9, name: "Benefactor", emoji: "\u{1F3DB}\uFE0F", threshold: 250_000 },
  { tier: 10, name: "Philanthropist", emoji: "\u{1F54A}\uFE0F", threshold: 500_000 },
] as const;

/** Returns the highest badge tier earned for a given lifetime donation amount. */
export function getTierForAmount(amountPhp: number): BadgeTier | null {
  for (let i = BADGE_TIERS.length - 1; i >= 0; i--) {
    if (amountPhp >= BADGE_TIERS[i].threshold) {
      return BADGE_TIERS[i];
    }
  }
  return null;
}

/** Returns the next badge tier after the current one, or null if already max. */
export function getNextTier(currentTier: number): BadgeTier | null {
  return BADGE_TIERS.find((t) => t.tier === currentTier + 1) ?? null;
}

/** Returns progress percentage (0-100) toward the next badge tier. */
export function getProgressToNextTier(amountPhp: number): {
  current: BadgeTier | null;
  next: BadgeTier | null;
  progress: number;
} {
  const current = getTierForAmount(amountPhp);
  const next = current ? getNextTier(current.tier) : BADGE_TIERS[0];

  if (!next) {
    return { current, next: null, progress: 100 };
  }

  const floor = current?.threshold ?? 0;
  const progress = Math.min(((amountPhp - floor) / (next.threshold - floor)) * 100, 100);
  return { current, next, progress: Math.round(progress) };
}
