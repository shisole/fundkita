// ── Platform tip suggestions (PHP) ───────────────────────────────────────────

export interface TipTier {
  min: number;
  max: number;
  suggested: number;
}

export const TIP_SUGGESTIONS: readonly TipTier[] = [
  { min: 100, max: 499, suggested: 5 },
  { min: 500, max: 999, suggested: 20 },
  { min: 1_000, max: 4_999, suggested: 50 },
  { min: 5_000, max: Infinity, suggested: 100 },
] as const;

/** Returns the suggested tip amount (PHP) for a given donation amount. */
export function getSuggestedTip(amountPhp: number): number {
  const tier = TIP_SUGGESTIONS.find((t) => amountPhp >= t.min && amountPhp <= t.max);
  return tier?.suggested ?? 0;
}
