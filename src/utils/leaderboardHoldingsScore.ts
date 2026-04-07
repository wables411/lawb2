import { LEADERBOARD_HOLDINGS_TIERS, LEADERBOARD_TOKEN_BONUS } from '../config/leaderboardHoldings';
import type { NFTInventory } from './nftInventory';

function bigMin(a: bigint, b: bigint): bigint {
  return a < b ? a : b;
}

/** Weighted NFT holdings for leaderboard `points_breakdown.holdings`. */
export function computeWeightedNftHoldingsPoints(inventory: NFTInventory): number {
  const t = LEADERBOARD_HOLDINGS_TIERS;
  let sum = 0;
  sum += (inventory.lawbsters?.length ?? 0) * t.tier1;
  sum += (inventory.lawbstarz?.length ?? 0) * t.tier1;
  sum += (inventory.lawbstation?.length ?? 0) * t.tier2;
  sum += (inventory.halloween_lawbsters?.length ?? 0) * t.tier2;
  sum += (inventory.lawbnexus?.length ?? 0) * t.tier3;
  sum += (inventory.asciilawbs?.length ?? 0) * t.tier3;
  sum += (inventory.pixelawbs?.length ?? 0) * t.tier3;
  sum += (inventory.lawb_lore?.length ?? 0) * t.tier4;
  return sum;
}

/**
 * Base-chain LAWB + CLAWB (raw wei) → bonus holdings points.
 * Each "slot" is worth tier2 multiplier; capped per token type.
 */
export function computeTokenHoldingsBonusPoints(totalLawbRaw: bigint, totalClawbRaw: bigint): number {
  const { lawbPerEquivSlot, clawbPerEquivSlot, maxEquivSlotsPerToken } = LEADERBOARD_TOKEN_BONUS;
  const equivLawb = bigMin(totalLawbRaw / lawbPerEquivSlot, maxEquivSlotsPerToken);
  const equivClawb = bigMin(totalClawbRaw / clawbPerEquivSlot, maxEquivSlotsPerToken);
  const slots = equivLawb + equivClawb;
  return Number(LEADERBOARD_HOLDINGS_TIERS.tier2) * Number(slots);
}

/** Full value written to leaderboard points_breakdown.holdings via setHoldingsPoints. */
export function computeHoldingsLeaderboardScore(
  inventory: NFTInventory,
  tokenBonusPoints: number,
): number {
  const nft = computeWeightedNftHoldingsPoints(inventory);
  const bonus = Math.max(0, Math.floor(tokenBonusPoints));
  return nft + bonus;
}
