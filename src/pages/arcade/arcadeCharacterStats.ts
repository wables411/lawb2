import type { ArcadeCharacterId } from './arcadeAssetConfig';

/** 1–5 stars per stat; drives oxygen drain, speed range, armor pool. */
export type CharacterStatSpread = {
  speed: number;
  oxygen: number;
  armor: number;
};

export const CHARACTER_STATS: Record<ArcadeCharacterId, CharacterStatSpread> = {
  clawb: { speed: 3, oxygen: 5, armor: 3 },
  milady: { speed: 5, oxygen: 3, armor: 3 },
  radbro: { speed: 3, oxygen: 3, armor: 5 },
};

export function getCharacterStats(id: ArcadeCharacterId): CharacterStatSpread {
  return CHARACTER_STATS[id];
}

/** Max O₂ (0–100 scale in run state). */
export function oxygenCapacityForStars(stars: number): number {
  return 80 + stars * 4;
}

/** Armor points at run start. */
export function armorMaxForStars(stars: number): number {
  return 40 + stars * 18;
}

/**
 * O₂ drain units per second at 1× world intensity (scaled in controller).
 * Higher oxygen stars = slower drain.
 */
export function oxygenDrainPerSec(stars: number): number {
  const t = Math.min(5, Math.max(1, stars));
  const k = (6 - t) / 3;
  return 4.5 * k;
}

/**
 * Relative speed band from W/S input: min / max multiplier contribution from stats.
 * Milady (5★ speed) reaches higher top speed when holding W.
 */
export function speedBandForStars(stars: number): { min: number; max: number } {
  const t = Math.min(5, Math.max(1, stars));
  const min = 0.68 + (5 - t) * 0.02;
  const max = 1.12 + t * 0.06;
  return { min, max };
}

export function starsRow(label: string, n: number): string {
  const filled = '★'.repeat(Math.min(5, Math.max(0, n)));
  const empty = '☆'.repeat(5 - Math.min(5, Math.max(0, n)));
  return `${label} ${filled}${empty}`;
}
