// Pure, Three-free Reef Run simulation core.
// The game renders from this; the headless validator runs the identical module.
// RNG draw order MUST match the original ArcadeSceneController.stepPlaySim exactly.

import type { ArcadeCharacterId } from './arcadeAssetConfig';
import {
  getCharacterStats,
  oxygenDrainPerSec,
  speedBandForStars,
} from './arcadeCharacterStats';
import {
  forcedOxyTankIntervalSec,
  reefRunPlayIntensityMultiplier,
  reefRunSpawnIntervalSec,
  reefRunSpawnRowThisWave,
  reefRunTwoBlockRowChance,
  REEF_RUN_OBSTACLE_BASE_SPEED,
  REEF_RUN_TICK_Z_SCALE,
} from './arcadeDifficulty';
import {
  applyPickupEffect,
  characterHasUnlimitedOxygen,
  characterUsesOxygenMechanic,
  createInitialRunState,
  isBeneficialPickup,
  rollPickupKind,
  type PickupKind,
  type RunEndReason,
  type RunState,
} from './arcadePickupKinds';
import { makeRng, type Rng } from './arcadeRng';

// ── Constants (canonical — ArcadeSceneController must use these) ─────────────

export const LANES = [-2.1, 0, 2.1] as const;
export const PLAYER_Z = 2.8;
export const SPAWN_Z = -52;
export const HIT_Z = PLAYER_Z;
export const HIT_HALF_DEPTH = 1.35;
export const OBSTACLE_RECYCLE_Z = 8;
const OBSTACLE_BOX_DEPTH_Z = 2.2;
const OBSTACLE_HALF_Z = OBSTACLE_BOX_DEPTH_Z / 2;
const ROW_Z_EPS = 0.04;
const FIRST_OBSTACLE_AFTER_S = 0.38;
const APPROACH_PIPE_Z = HIT_Z - HIT_HALF_DEPTH - 10;

function obstacleFrontPastApproachPipe(z: number): boolean {
  return z + OBSTACLE_HALF_Z > APPROACH_PIPE_Z;
}

// ── Pure sim entity types ────────────────────────────────────────────────────

export type SimObstacle = {
  lane: number;
  z: number;
  speed: number;
  hit: boolean;
};

export type SimPickup = {
  lane: number;
  z: number;
  speed: number;
  hit: boolean;
  kind: PickupKind;
};

export type SimInput = {
  lane: number;
  forward: boolean;
  backward: boolean;
};

export type SimEvent =
  | { type: 'gameOver'; reason: RunEndReason }
  | { type: 'pickupHit'; kind: PickupKind; lane: number; z: number }
  | { type: 'obstacleHit'; lane: number; z: number }
  | { type: 'cameraShake'; peak: number }
  | { type: 'playerPulse' };

export type ReefRunSimState = {
  runState: RunState;
  playEnded: boolean;
  runClockActive: boolean;
  survivalSec: number;
  simNow: number;

  playerLane: number;
  throttleSmoothed: number;

  obstacles: SimObstacle[];
  pickups: SimPickup[];

  spawnAcc: number;
  spawnWaveIndex: number;
  pickupSpawnAcc: number;
  nextForcedOxyTankSurvival: number;

  gameRng: Rng;
  lastSwimSpd: number;
  maxActiveObstacles: number;
};

export function createSimState(
  characterId: ArcadeCharacterId,
  seed: number,
  maxActiveObstacles = 12,
): ReefRunSimState {
  return {
    runState: createInitialRunState(characterId, 0),
    playEnded: false,
    runClockActive: true,
    survivalSec: 0,
    simNow: 0,
    playerLane: 1,
    throttleSmoothed: 0,
    obstacles: [],
    pickups: [],
    spawnAcc: Math.max(0, reefRunSpawnIntervalSec(0) - FIRST_OBSTACLE_AFTER_S),
    spawnWaveIndex: -1,
    pickupSpawnAcc: 0,
    nextForcedOxyTankSurvival: characterUsesOxygenMechanic(characterId)
      ? 4.4
      : Number.POSITIVE_INFINITY,
    gameRng: makeRng(seed),
    lastSwimSpd: 1,
    maxActiveObstacles,
  };
}

// ── Helpers (Three-free equivalents of controller methods) ───────────────────

function lanesOnActiveTrack(obstacles: SimObstacle[]): Set<number> {
  const lanes = new Set<number>();
  for (const o of obstacles) {
    if (o.hit) continue;
    if (o.z >= OBSTACLE_RECYCLE_Z) continue;
    lanes.add(o.lane);
  }
  return lanes;
}

function lanesBusyInApproachPipe(obstacles: SimObstacle[]): Set<number> {
  const lanes = new Set<number>();
  for (const o of obstacles) {
    if (o.hit) continue;
    if (obstacleFrontPastApproachPipe(o.z)) lanes.add(o.lane);
  }
  return lanes;
}

function laneBlockedForPickup(obstacles: SimObstacle[], lane: number): boolean {
  return obstacles.some(
    (o) => !o.hit && o.lane === lane && o.z > -50 && o.z < 5,
  );
}

// RNG draw: 1 call (speed jitter)
function spawnObstacleInLane(state: ReefRunSimState, lane: number, z: number): void {
  const speed = REEF_RUN_OBSTACLE_BASE_SPEED * (0.94 + state.gameRng() * 0.12);
  state.obstacles.push({ lane, z, speed, hit: false });
}

// RNG draws: variable (see trySpawnObstacleRow in controller)
function trySpawnObstacleRow(state: ReefRunSimState): boolean {
  const activeCount = state.obstacles.filter(
    (o) => !o.hit && o.z < OBSTACLE_RECYCLE_Z,
  ).length;
  if (activeCount >= state.maxActiveObstacles) return false;
  if (lanesBusyInApproachPipe(state.obstacles).size >= 2) return false;

  const track = lanesOnActiveTrack(state.obstacles);
  if (track.size >= 3) return false;

  if (track.size === 2) {
    const free = ([0, 1, 2] as const).find((l) => !track.has(l));
    if (free === undefined) return false;
    spawnObstacleInLane(state, free, SPAWN_Z);
    return true;
  }

  if (track.size === 1) {
    const busy = [...track][0]!;
    const open = [0, 1, 2].filter((l) => l !== busy);
    const lane = open[Math.floor(state.gameRng() * open.length)]!;
    spawnObstacleInLane(state, lane, SPAWN_Z);
    return true;
  }

  // track empty — full row logic
  const gapLane = Math.floor(state.gameRng() * 3);
  const fillLanes = [0, 1, 2].filter((l) => l !== gapLane);
  const twoBlockRow = state.gameRng() < reefRunTwoBlockRowChance(state.survivalSec);
  if (twoBlockRow) {
    spawnObstacleInLane(state, fillLanes[0]!, SPAWN_Z);
    spawnObstacleInLane(state, fillLanes[1]!, SPAWN_Z + ROW_Z_EPS);
  } else {
    const lane = fillLanes[Math.floor(state.gameRng() * 2)]!;
    spawnObstacleInLane(state, lane, SPAWN_Z);
  }
  return true;
}

// RNG draw: 1 call (speed jitter)
function spawnPickupInLane(state: ReefRunSimState, lane: number, kind: PickupKind): void {
  const speed = REEF_RUN_OBSTACLE_BASE_SPEED * (0.88 + state.gameRng() * 0.12) * 0.74;
  state.pickups.push({ lane, z: SPAWN_Z, speed, hit: false, kind });
}

// RNG draws: up to 3 (lane) + 1 (rollPickupKind) + 1 (spawnPickupInLane speed)
function trySpawnPickup(state: ReefRunSimState): void {
  const cid = state.runState.characterId;
  for (let tryN = 0; tryN < 3; tryN++) {
    const lane = (Math.floor(state.gameRng() * 3) + tryN) % 3;
    if (!laneBlockedForPickup(state.obstacles, lane)) {
      spawnPickupInLane(
        state,
        lane,
        rollPickupKind(state.survivalSec, cid, state.gameRng),
      );
      return;
    }
  }
}

// No RNG draws (fixed lane order [1,0,2])
function trySpawnForcedOxygenTank(state: ReefRunSimState): boolean {
  const order = [1, 0, 2] as const;
  for (const lane of order) {
    if (!laneBlockedForPickup(state.obstacles, lane)) {
      spawnPickupInLane(state, lane, 'air_tank');
      return true;
    }
  }
  return false;
}

function pickupSpawnIntervalSec(survivalSec: number): number {
  const x = Math.min(1, Math.max(0, survivalSec / 95));
  const s = x * x * (3 - 2 * x);
  return 2.18 + s * 0.62;
}

// ── Main step function ──────────────────────────────────────────────────────

/**
 * One pure sim step. Advances all gameplay state by `dt` seconds.
 * NO Three.js dependency — all positions are plain numbers.
 *
 * Returns events emitted during this step (game-over, pickup hits, etc.)
 * for the renderer or validator to act on.
 */
export function stepSim(
  state: ReefRunSimState,
  dt: number,
  input: SimInput,
): SimEvent[] {
  const events: SimEvent[] = [];
  state.playerLane = input.lane;

  let swimSpd = 1;
  if (!state.playEnded && state.runClockActive) {
    state.survivalSec += dt;
  }

  const intensityBase = reefRunPlayIntensityMultiplier(state.survivalSec);
  let playerMult = 1;
  const st = state.runState;

  if (!state.playEnded) {
    const now = state.simNow;
    const targetT = input.forward && !input.backward
      ? 1
      : input.backward && !input.forward
        ? -1
        : 0;
    state.throttleSmoothed +=
      (targetT - state.throttleSmoothed) * Math.min(1, dt * 4.8);
    const band = speedBandForStars(getCharacterStats(st.characterId).speed);
    const u = (state.throttleSmoothed + 1) / 2;
    playerMult = band.min + u * (band.max - band.min);
    if (now < st.cheeseUntil) playerMult += 0.27;
    if (now < st.dragUntil) playerMult *= 0.54;

    if (characterHasUnlimitedOxygen(st.characterId)) {
      st.oxygen = st.oxygenMax;
    } else {
      const oxyStars = getCharacterStats(st.characterId).oxygen;
      const drain =
        oxygenDrainPerSec(oxyStars) *
        (0.86 +
          0.16 *
            Math.min(
              1.55,
              (intensityBase * playerMult) / Math.max(0.001, intensityBase),
            ));
      st.oxygen -= drain * dt;
      if (st.oxygen <= 0) {
        st.oxygen = 0;
        state.playEnded = true;
        events.push({ type: 'gameOver', reason: 'oxygen' });
      }
    }
  }

  swimSpd = intensityBase * (state.playEnded ? 1 : playerMult);
  if (state.playEnded) swimSpd = intensityBase;
  state.lastSwimSpd = swimSpd;

  if (!state.playEnded) {
    // ── Move and collide obstacles ──
    for (const o of state.obstacles) {
      if (o.hit) continue;
      o.z += o.speed * swimSpd * dt * REEF_RUN_TICK_Z_SCALE;
      if (
        Math.abs(o.z - HIT_Z) < HIT_HALF_DEPTH &&
        o.lane === state.playerLane
      ) {
        o.hit = true;
        state.playEnded = true;
        events.push({ type: 'gameOver', reason: 'crush' });
        events.push({ type: 'obstacleHit', lane: o.lane, z: o.z });
        break;
      }
      if (o.z > OBSTACLE_RECYCLE_Z) {
        o.hit = true;
      }
    }
    // Remove recycled obstacles (collision-hit stay — game is over anyway)
    state.obstacles = state.obstacles.filter(
      (o) => !(o.hit && o.z > OBSTACLE_RECYCLE_Z),
    );

    // ── Move and collide pickups ──
    if (!state.playEnded) {
      const pickupHitZ = HIT_HALF_DEPTH * 0.78;
      for (const p of state.pickups) {
        if (p.hit) continue;
        p.z += p.speed * swimSpd * dt * REEF_RUN_TICK_Z_SCALE;
        if (
          Math.abs(p.z - HIT_Z) < pickupHitZ &&
          p.lane === state.playerLane
        ) {
          p.hit = true;
          events.push({
            type: 'pickupHit',
            kind: p.kind,
            lane: p.lane,
            z: p.z,
          });
          if (isBeneficialPickup(p.kind)) {
            events.push({ type: 'playerPulse' });
          }
          const out = applyPickupEffect(p.kind, st, state.simNow);
          if (out.cameraShake) {
            events.push({ type: 'cameraShake', peak: out.cameraShake });
          }
          if (out.gameOver) {
            state.playEnded = true;
            events.push({ type: 'gameOver', reason: out.gameOver });
            break;
          }
        }
        if (p.z > OBSTACLE_RECYCLE_Z) {
          p.hit = true;
        }
      }
      // Remove all hit pickups (player-hit or recycled)
      state.pickups = state.pickups.filter((p) => !p.hit);
    }

    // ── Forced O₂ tanks ──
    if (
      !state.playEnded &&
      characterUsesOxygenMechanic(st.characterId)
    ) {
      if (state.survivalSec >= state.nextForcedOxyTankSurvival) {
        if (trySpawnForcedOxygenTank(state)) {
          state.nextForcedOxyTankSurvival =
            state.survivalSec +
            forcedOxyTankIntervalSec(state.survivalSec);
        } else {
          state.nextForcedOxyTankSurvival = state.survivalSec + 0.28;
        }
      }
    }

    // ── Pickup spawning ──
    if (!state.playEnded) {
      state.pickupSpawnAcc += dt;
      if (state.pickupSpawnAcc >= pickupSpawnIntervalSec(state.survivalSec)) {
        state.pickupSpawnAcc = 0;
        trySpawnPickup(state);
      }

      // ── Obstacle spawning ──
      const rowInterval = reefRunSpawnIntervalSec(state.survivalSec);
      state.spawnAcc += dt;
      if (state.spawnAcc >= rowInterval) {
        state.spawnWaveIndex++;
        if (
          reefRunSpawnRowThisWave(
            state.survivalSec,
            state.spawnWaveIndex,
            state.gameRng,
          )
        ) {
          if (trySpawnObstacleRow(state)) {
            state.spawnAcc = 0;
          } else {
            state.spawnAcc = Math.max(0, rowInterval - 0.32);
          }
        } else {
          state.spawnAcc = 0;
        }
      }
    }
  }

  return events;
}

// ── Fixed-timestep runner (deterministic mode) ──────────────────────────────

export const FIXED_DT = 1 / 60;
export const MAX_SUBSTEPS = 5;

export type FixedStepResult = {
  stepsRun: number;
  /** Leftover accumulator (for render interpolation: alpha = simAcc / FIXED_DT). */
  simAcc: number;
  events: SimEvent[];
};

/**
 * Run the sim with a fixed timestep accumulator (deterministic mode).
 * Call once per frame with real `dt`.  Returns total events + leftover `simAcc`
 * for render interpolation.
 */
export function runFixedSteps(
  state: ReefRunSimState,
  dt: number,
  simAcc: number,
  input: SimInput,
  onStep?: (step: number) => void,
): FixedStepResult {
  simAcc += dt;
  let n = 0;
  const allEvents: SimEvent[] = [];
  while (simAcc >= FIXED_DT && n < MAX_SUBSTEPS) {
    state.simNow += FIXED_DT;
    onStep?.(n);
    const events = stepSim(state, FIXED_DT, input);
    allEvents.push(...events);
    n++;
    simAcc -= FIXED_DT;
    if (state.playEnded) break;
  }
  return { stepsRun: n, simAcc, events: allEvents };
}
