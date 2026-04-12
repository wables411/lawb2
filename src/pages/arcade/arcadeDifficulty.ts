/** Each tier spans this many seconds of survival (Roman numeral steps up). */
export const REEF_RUN_TIER_SECONDS = 45;

/** Cap tier contribution so speed does not explode unbounded. */
export const REEF_RUN_MAX_SPEED_TIER = 28;

/** Obstacle / swim speed multiplier += this per tier (tier 0 = baseline 1×). */
export const REEF_RUN_SPEED_PER_TIER = 0.095;

/**
 * Must match `ArcadeSceneController`: `HIT_Z - SPAWN_Z` (obstacle center travel to reach player plane).
 * Keep in sync when those constants change.
 */
export const REEF_RUN_Z_TRAVEL = 2.8 - -52;

/** Same as obstacle motion in `ArcadeSceneController`: `dt * 60 * 0.18` factor → units/sec = speed * mult * this. */
export const REEF_RUN_TICK_Z_SCALE = 60 * 0.18;

/** Target seconds from spawn (at obstacle Z) until the first row reaches the player at tier-0 baseline intensity. */
export const REEF_RUN_FIRST_HIT_TARGET_SEC = 10;

/** Obstacle Z-scroll base (mean); matches `spawnObstacleInLane` before 0.94–1.06 jitter. Tunnel rings use the same rate. */
export const REEF_RUN_OBSTACLE_BASE_SPEED =
  REEF_RUN_Z_TRAVEL / (REEF_RUN_FIRST_HIT_TARGET_SEC * REEF_RUN_TICK_Z_SCALE);

function clamp01(x: number): number {
  return Math.min(1, Math.max(0, x));
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

/**
 * Global run intensity: Roman tiers (every {@link REEF_RUN_TIER_SECONDS}) plus a smooth ramp over ~2 minutes
 * so speed tightens gradually (harder = faster scroll + tighter row cadence via {@link reefRunSpawnIntervalSec}).
 */
export function reefRunPlayIntensityMultiplier(survivalSec: number): number {
  const tier = tierIndexFromSurvivalSec(survivalSec);
  const tierMul = swimSpeedMultiplierForTier(tier);
  const clockRamp = 1 + smoothstep(0, 120, survivalSec) * 0.5;
  return tierMul * clockRamp;
}

/** Seconds between row *timers*; early game is sparser (see {@link reefRunSpawnRowThisWave}). */
export function reefRunSpawnIntervalSec(survivalSec: number): number {
  const a = 2.35;
  const b = 0.62;
  return a + (b - a) * smoothstep(0, 120, survivalSec);
}

/**
 * Early: only even-index waves place blocks (every other row). Mid: blend in odd rows; late (~80s+): every wave.
 */
export function reefRunSpawnRowThisWave(survivalSec: number, waveIndex: number): boolean {
  if (waveIndex % 2 === 0) return true;
  if (survivalSec < 42) return false;
  if (survivalSec >= 82) return true;
  const t = smoothstep(42, 82, survivalSec);
  return Math.random() < t;
}

/**
 * Probability of a **two-block** row (one clear lane) when the track is empty. Rises toward ~1 by ~2 min so
 * most rows have a single correct lane.
 */
export function reefRunTwoBlockRowChance(survivalSec: number): number {
  return 0.2 + 0.78 * smoothstep(25, 125, survivalSec);
}

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

/**
 * Guaranteed O₂ tank cadence for Milady/Radbro — spacing widens with depth (more timing pressure)
 * but stays within sustainable oxygen math (~10–14s at typical drain).
 */
export function forcedOxyTankIntervalSec(survivalSec: number): number {
  const u = smoothstep(0, 165, survivalSec);
  return 10 + u * 4.2;
}

/** Random pickup table: air-tank weight vs survival (never below floor — never “zero air” in the table). */
export function reefRunAirTankRandomPickupWeight(survivalSec: number): number {
  const u = smoothstep(0, 200, survivalSec);
  return Math.max(3.6, 10 * (1 - 0.58 * u));
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
    speedMultiplier: reefRunPlayIntensityMultiplier(survivalSec),
  };
}
