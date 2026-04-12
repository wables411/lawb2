import type { ArcadeCharacterId } from './arcadeAssetConfig';
import {
  armorMaxForStars,
  getCharacterStats,
  oxygenCapacityForStars,
} from './arcadeCharacterStats';
import { reefRunAirTankRandomPickupWeight } from './arcadeDifficulty';

export type PickupKind =
  | 'air_tank'
  | 'coin'
  | 'trash'
  | 'cheese'
  | 'peptides'
  | 'jellyfish'
  | 'pufferfish'
  | 'mine';

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
  { kind: 'coin', w: 26 },
  { kind: 'trash', w: 12 },
  { kind: 'air_tank', w: 10 },
  { kind: 'cheese', w: 8 },
  { kind: 'peptides', w: 9 },
  { kind: 'jellyfish', w: 8 },
  { kind: 'pufferfish', w: 7 },
  { kind: 'mine', w: 3 },
];

export function rollPickupKind(
  survivalSec: number,
  characterId: ArcadeCharacterId,
): PickupKind {
  const rows = SPAWN_WEIGHTS_BASE.map((r) => ({ ...r }));
  if (characterId === 'clawb') {
    const i = rows.findIndex((r) => r.kind === 'air_tank');
    if (i >= 0) rows[i]!.w = 0;
    const add = (kind: PickupKind, d: number) => {
      const row = rows.find((r) => r.kind === kind);
      if (row) row.w += d;
    };
    add('coin', 5);
    add('trash', 3);
    add('cheese', 2);
  } else {
    const air = rows.find((r) => r.kind === 'air_tank');
    if (air) air.w = reefRunAirTankRandomPickupWeight(survivalSec);
  }
  const sum = rows.reduce((a, b) => a + Math.max(0, b.w), 0);
  if (sum <= 0) return 'coin';
  let r = Math.random() * sum;
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
  switch (kind) {
    case 'air_tank': {
      if (characterUsesOxygenMechanic(st.characterId)) {
        st.oxygen = Math.min(st.oxygenMax, st.oxygen + 38);
      }
      break;
    }
    case 'coin':
      st.coins += 1;
      break;
    case 'trash':
      st.trash += 1;
      break;
    case 'cheese':
      st.cheeseUntil = Math.max(st.cheeseUntil, nowSec + 4.2);
      break;
    case 'peptides':
      st.armor = Math.min(st.armorMax, st.armor + 26);
      break;
    case 'jellyfish':
    case 'pufferfish':
      st.dragUntil = Math.max(st.dragUntil, nowSec + 2.8);
      st.armor -= 7;
      if (st.armor <= 0) {
        st.armor = 0;
        return { gameOver: 'wrecked' };
      }
      return { cameraShake: kind === 'jellyfish' ? 0.09 : 0.07 };
    case 'mine':
      st.armor -= 32;
      if (st.armor <= 0) {
        st.armor = 0;
        return { gameOver: 'wrecked', cameraShake: 0.28 };
      }
      return { cameraShake: 0.22 };
    default:
      break;
  }
  return {};
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
    relativeSpeed,
    cheeseSecLeft: Math.max(0, st.cheeseUntil - nowSec),
    dragSecLeft: Math.max(0, st.dragUntil - nowSec),
  };
}
