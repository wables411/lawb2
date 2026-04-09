/** Each tier spans this many seconds of survival (Roman numeral steps up). */
export const REEF_RUN_TIER_SECONDS = 45;

/** Cap tier contribution so speed does not explode unbounded. */
export const REEF_RUN_MAX_SPEED_TIER = 28;

/** Obstacle / swim speed multiplier += this per tier (tier 0 = baseline 1×). */
export const REEF_RUN_SPEED_PER_TIER = 0.095;

export type ReefRunHudPayload = {
  tierIndex: number;
  /** Display label: I, II, III, IV, … for current depth bracket. */
  roman: string;
  survivalSec: number;
  secondsElapsedInTier: number;
  tierDurationSec: number;
  speedMultiplier: number;
};

export function tierIndexFromSurvivalSec(sec: number): number {
  return Math.floor(sec / REEF_RUN_TIER_SECONDS);
}

export function swimSpeedMultiplierForTier(tierIndex: number): number {
  const t = Math.min(Math.max(0, tierIndex), REEF_RUN_MAX_SPEED_TIER);
  return 1 + t * REEF_RUN_SPEED_PER_TIER;
}

function intToRoman(n: number): string {
  if (n < 1) return 'I';
  const parts: [number, string][] = [
    [1000, 'M'],
    [900, 'CM'],
    [500, 'D'],
    [400, 'CD'],
    [100, 'C'],
    [90, 'XC'],
    [50, 'L'],
    [40, 'XL'],
    [10, 'X'],
    [9, 'IX'],
    [5, 'V'],
    [4, 'IV'],
    [1, 'I'],
  ];
  let x = n;
  let s = '';
  for (const [v, sym] of parts) {
    while (x >= v) {
      s += sym;
      x -= v;
    }
  }
  return s;
}

/** Tier 0 (first 45s) → `I`, tier 1 → `II`, etc. */
export function romanForTierIndex(tierIndex: number): string {
  return intToRoman(tierIndex + 1);
}

export function reefRunHudFromSurvivalSec(survivalSec: number): ReefRunHudPayload {
  const tierIndex = tierIndexFromSurvivalSec(survivalSec);
  const secondsElapsedInTier = survivalSec - tierIndex * REEF_RUN_TIER_SECONDS;
  return {
    tierIndex,
    roman: romanForTierIndex(tierIndex),
    survivalSec,
    secondsElapsedInTier,
    tierDurationSec: REEF_RUN_TIER_SECONDS,
    speedMultiplier: swimSpeedMultiplierForTier(tierIndex),
  };
}
