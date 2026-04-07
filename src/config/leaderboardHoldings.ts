/**
 * Leaderboard "holdings" score: weighted NFT counts + optional Base token bonus.
 * Tune multipliers / chunk sizes here only.
 *
 * Tiers (highest → lowest):
 * 1 — Ethereum Lawbsters, Lawbstarz
 * 2 — Lawbstation (Solana), Halloween Lawbsters (Base)
 * 3 — LawbNexus (Solana), ASCII LAWBS, Pixelawbsters
 * 4 — Lawb Lore (Ethereum)
 *
 * Token bonus: Base $LAWB + $CLAWB summed across linked EVM wallets; each "equivalent slot"
 * uses the tier-2 multiplier (counts like tier-2 NFT weight).
 */
export const LEADERBOARD_HOLDINGS_TIERS = {
  tier1: 4,
  tier2: 3,
  tier3: 2,
  tier4: 1,
} as const;

/** Raw ERC-20 totals on Base → integer bonus points (already includes tier-2 weight). */
export const LEADERBOARD_TOKEN_BONUS = {
  /** Whole LAWB (6 decimals) that count as one tier-2-equivalent slot */
  lawbPerEquivSlot: 5_000n * 10n ** 6n,
  /** Whole CLAWB (18 decimals) that count as one tier-2-equivalent slot */
  clawbPerEquivSlot: 500_000n * 10n ** 18n,
  /** Max slots counted per token (prevents one whale from dominating) */
  maxEquivSlotsPerToken: 12n,
} as const;
