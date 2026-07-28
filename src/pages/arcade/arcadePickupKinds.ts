import type { ArcadeCharacterId } from './arcadeAssetConfig';
import {
  armorMaxForStars,
  getCharacterStats,
  oxygenCapacityForStars,
} from './arcadeCharacterStats';
import { reefRunAirTankRandomPickupWeight } from './arcadeDifficulty';
import type { Rng } from './arcadeRng';

export type PickupKind =
  | 'air_tank'
  | 'coin'
  | 'trash'
  | 'cheese'
  | 'peptides'
  | 'jellyfish'
  | 'pufferfish'
  | 'mine';

export function isBeneficialPickup(kind: PickupKind): boolean {
  return (
    kind === 'air_tank' ||
    kind === 'coin' ||
    kind === 'trash' ||
    kind === 'cheese' ||
    kind === 'peptides'
  );
}

export type RunEndReason = 'oxygen' | 'crush' | 'wrecked';

export type ArcadeRunHudState = {
  oxygen: number;
  oxygenMax: number;
  /** Clawb: underwater lobster — no breath meter / no O₂ fail state. */
  oxygenInfinite: boolean;
  armor: number;
  armorMax: number;
  coins: number;
  trash: number;
  cheeseCollected: number;
  peptidesCollected: number;
  /** Effective forward intensity vs baseline (W/S + cheese + drag). */
  relativeSpeed: number;
  cheeseSecLeft: number;
  dragSecLeft: number;
};

export function characterUsesOxygenMechanic(id: ArcadeCharacterId): boolean {
  return id === 'milady' || id === 'radbro';
}

/** Clawb only — no O₂ drain / no breath game over (lobster underwater). */
export function characterHasUnlimitedOxygen(id: ArcadeCharacterId): boolean {
  return id === 'clawb';
}

export type RunState = {
  characterId: ArcadeCharacterId;
  oxygen: number;
  oxygenMax: number;
  armor: number;
  armorMax: number;
  coins: number;
  trash: number;
  cheeseCollected: number;
  peptidesCollected: number;
  cheeseUntil: number;
  dragUntil: number;
  /** 0 = coast, 1 = full W, -1 = full S — lerped in controller */
  throttle: number;
};

export function createInitialRunState(characterId: ArcadeCharacterId, _nowSec: number): RunState {
  const s = getCharacterStats(characterId);
  const oxyMax = oxygenCapacityForStars(s.oxygen);
  const armMax = armorMaxForStars(s.armor);
  return {
    characterId,
    oxygen: oxyMax,
    oxygenMax: oxyMax,
    armor: armMax,
    armorMax: armMax,
    coins: 0,
    trash: 0,
    cheeseCollected: 0,
    peptidesCollected: 0,
    cheeseUntil: 0,
    dragUntil: 0,
    throttle: 0,
  };
}

/**
 * Weighted pickup table — favors loot & sustain, hazards readable but not spammy.
 * Clawb: no air tanks (redistribute weight). Milady/Radbro: air weight scales down with depth, never to 0
 * (see also guaranteed tank cadence in `ArcadeSceneController`).
 */
const SPAWN_WEIGHTS_BASE: { kind: PickupKind; w: number }[] = [
  // Trash hauling is the mission (see the brief) — trash is the most common pickup, period.
  { kind: 'coin', w: 18 },
  { kind: 'trash', w: 26 },
  { kind: 'air_tank', w: 10 },
  { kind: 'cheese', w: 8 },
  { kind: 'peptides', w: 10 },
  { kind: 'jellyfish', w: 7 },
  { kind: 'pufferfish', w: 6 },
  { kind: 'mine', w: 4 },
];

type PickupTuning = {
  coins?: number;
  trash?: number;
  oxygenDelta?: number;
  armorDelta?: number;
  oxygenPenalty?: number;
  cheeseSec?: number;
  dragSec?: number;
  clearDrag?: boolean;
  cameraShake?: number;
};

/**
 * Per-object gameplay identity:
 * - loot/sustain: coin, trash, air_tank, peptides
 * - tempo buffs/debuffs: cheese, jellyfish, pufferfish
 * - high-threat spike: mine
 */
const PICKUP_TUNING: Record<PickupKind, PickupTuning> = {
  air_tank: { oxygenDelta: 44, clearDrag: true, cameraShake: 0.03 },
  coin: { coins: 1, oxygenDelta: 2 },
  trash: { trash: 1, armorDelta: 3 },
  cheese: { cheeseSec: 3.6 },
  peptides: { armorDelta: 22, clearDrag: true, cameraShake: 0.04 },
  jellyfish: { armorDelta: -5, oxygenPenalty: 8, dragSec: 2.2, cameraShake: 0.1 },
  pufferfish: { armorDelta: -10, oxygenPenalty: 4, dragSec: 1.5, cameraShake: 0.12 },
  mine: { armorDelta: -26, oxygenPenalty: 10, dragSec: 1.2, cameraShake: 0.24 },
};

export function rollPickupKind(
  survivalSec: number,
  characterId: ArcadeCharacterId,
  rng: Rng = Math.random,
): PickupKind {
  const rows = SPAWN_WEIGHTS_BASE.map((r) => ({ ...r }));
  /**
   * Depth ramp: hazards become more common deeper in the run while sustain/loot taper a bit.
   * Keeps early game readable and late game tense.
   */
  const depthU = Math.min(1, Math.max(0, (survivalSec - 20) / 140));
  const scale = (kind: PickupKind, mul: number) => {
    const row = rows.find((r) => r.kind === kind);
    if (row) row.w *= mul;
  };
  scale('coin', 1 - 0.2 * depthU);
  scale('trash', 1 - 0.12 * depthU);
  scale('cheese', 1 - 0.1 * depthU);
  scale('peptides', 1 + 0.16 * depthU);
  scale('jellyfish', 1 + 0.32 * depthU);
  scale('pufferfish', 1 + 0.38 * depthU);
  scale('mine', 1 + 0.62 * depthU);

  if (characterId === 'clawb') {
    const i = rows.findIndex((r) => r.kind === 'air_tank');
    if (i >= 0) rows[i]!.w = 0;
    const add = (kind: PickupKind, d: number) => {
      const row = rows.find((r) => r.kind === kind);
      if (row) row.w += d;
    };
    add('coin', 3);
    add('trash', 5);
    add('cheese', 2);
  } else {
    const air = rows.find((r) => r.kind === 'air_tank');
    if (air) air.w = reefRunAirTankRandomPickupWeight(survivalSec);
  }
  const sum = rows.reduce((a, b) => a + Math.max(0, b.w), 0);
  if (sum <= 0) return 'coin';
  let r = rng() * sum;
  for (const row of rows) {
    if (row.w <= 0) continue;
    r -= row.w;
    if (r <= 0) return row.kind;
  }
  return 'coin';
}

export function applyPickupEffect(
  kind: PickupKind,
  st: RunState,
  nowSec: number,
): { gameOver?: RunEndReason; cameraShake?: number } {
  const fx = PICKUP_TUNING[kind];
  if (!fx) return {};

  if (fx.coins) st.coins += fx.coins;
  if (kind === 'cheese') st.cheeseCollected += 1;
  if (kind === 'peptides') st.peptidesCollected += 1;
  if (fx.trash) st.trash += fx.trash;

  if (fx.cheeseSec && fx.cheeseSec > 0) {
    const buffEnd = Math.max(nowSec, st.cheeseUntil) + fx.cheeseSec;
    st.cheeseUntil = Math.min(nowSec + 7.4, buffEnd);
  }

  if (fx.dragSec && fx.dragSec > 0) {
    const debuffEnd = Math.max(nowSec, st.dragUntil) + fx.dragSec;
    st.dragUntil = Math.min(nowSec + 4.8, debuffEnd);
  }
  if (fx.clearDrag) st.dragUntil = nowSec;

  if (characterUsesOxygenMechanic(st.characterId)) {
    if (fx.oxygenDelta && fx.oxygenDelta > 0) {
      st.oxygen = Math.min(st.oxygenMax, st.oxygen + fx.oxygenDelta);
    }
    if (fx.oxygenPenalty && fx.oxygenPenalty > 0) {
      st.oxygen = Math.max(0, st.oxygen - fx.oxygenPenalty);
      if (st.oxygen <= 0) return { gameOver: 'oxygen', cameraShake: fx.cameraShake };
    }
  }

  if (typeof fx.armorDelta === 'number' && fx.armorDelta !== 0) {
    st.armor = Math.min(st.armorMax, st.armor + fx.armorDelta);
    if (st.armor <= 0) {
      st.armor = 0;
      return { gameOver: 'wrecked', cameraShake: fx.cameraShake };
    }
  }

  return fx.cameraShake ? { cameraShake: fx.cameraShake } : {};
}

export function runStateToHud(
  st: RunState,
  nowSec: number,
  relativeSpeed: number,
): ArcadeRunHudState {
  return {
    oxygen: st.oxygen,
    oxygenMax: st.oxygenMax,
    oxygenInfinite: characterHasUnlimitedOxygen(st.characterId),
    armor: st.armor,
    armorMax: st.armorMax,
    coins: st.coins,
    trash: st.trash,
    cheeseCollected: st.cheeseCollected,
    peptidesCollected: st.peptidesCollected,
    relativeSpeed,
    cheeseSecLeft: Math.max(0, st.cheeseUntil - nowSec),
    dragSecLeft: Math.max(0, st.dragUntil - nowSec),
  };
}
