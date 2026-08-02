"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// reef-validator/simEntry.ts
var simEntry_exports = {};
__export(simEntry_exports, {
  FIXED_DT: () => FIXED_DT,
  HIT_HALF_DEPTH: () => HIT_HALF_DEPTH,
  HIT_Z: () => HIT_Z,
  LANES: () => LANES,
  MAX_SUBSTEPS: () => MAX_SUBSTEPS,
  OBSTACLE_RECYCLE_Z: () => OBSTACLE_RECYCLE_Z,
  PLAYER_Z: () => PLAYER_Z,
  SPAWN_Z: () => SPAWN_Z,
  createSimState: () => createSimState,
  reefRunLeaderboardPointsForRound: () => reefRunLeaderboardPointsForRound,
  runFixedSteps: () => runFixedSteps,
  stepSim: () => stepSim
});
module.exports = __toCommonJS(simEntry_exports);

// src/pages/arcade/arcadeCharacterStats.ts
var CHARACTER_STATS = {
  clawb: { speed: 3, oxygen: 5, armor: 3 },
  milady: { speed: 5, oxygen: 3, armor: 3 },
  radbro: { speed: 3, oxygen: 3, armor: 5 }
};
function getCharacterStats(id) {
  return CHARACTER_STATS[id];
}
function oxygenCapacityForStars(stars) {
  return 80 + stars * 4;
}
function armorMaxForStars(stars) {
  return 40 + stars * 18;
}
function oxygenDrainPerSec(stars) {
  const t = Math.min(5, Math.max(1, stars));
  const k = (6 - t) / 3;
  return 4.5 * k;
}
function speedBandForStars(stars) {
  const t = Math.min(5, Math.max(1, stars));
  const min = 0.68 + (5 - t) * 0.02;
  const max = 1.12 + t * 0.06;
  return { min, max };
}

// src/pages/arcade/arcadeDifficulty.ts
var REEF_RUN_TIER_SECONDS = 45;
var REEF_RUN_MAX_SPEED_TIER = 28;
var REEF_RUN_SPEED_PER_TIER = 0.095;
var REEF_RUN_Z_TRAVEL = 2.8 - -52;
var REEF_RUN_TICK_Z_SCALE = 60 * 0.18;
var REEF_RUN_FIRST_HIT_TARGET_SEC = 10;
var REEF_RUN_OBSTACLE_BASE_SPEED = REEF_RUN_Z_TRAVEL / (REEF_RUN_FIRST_HIT_TARGET_SEC * REEF_RUN_TICK_Z_SCALE);
function clamp01(x) {
  return Math.min(1, Math.max(0, x));
}
function smoothstep(edge0, edge1, x) {
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}
function reefRunPlayIntensityMultiplier(survivalSec) {
  const tier = tierIndexFromSurvivalSec(survivalSec);
  const tierMul = swimSpeedMultiplierForTier(tier);
  const clockRamp = 1 + smoothstep(0, 120, survivalSec) * 0.5;
  return tierMul * clockRamp;
}
function reefRunSpawnIntervalSec(survivalSec) {
  const a = 2.35;
  const b = 0.62;
  return a + (b - a) * smoothstep(0, 120, survivalSec);
}
function reefRunSpawnRowThisWave(survivalSec, waveIndex, rng = Math.random) {
  if (waveIndex % 2 === 0) return true;
  if (survivalSec < 42) return false;
  if (survivalSec >= 82) return true;
  const t = smoothstep(42, 82, survivalSec);
  return rng() < t;
}
function reefRunTwoBlockRowChance(survivalSec) {
  return 0.2 + 0.78 * smoothstep(25, 125, survivalSec);
}
function tierIndexFromSurvivalSec(sec) {
  return Math.floor(sec / REEF_RUN_TIER_SECONDS);
}
function forcedOxyTankIntervalSec(survivalSec) {
  if (survivalSec < 135) {
    const earlyU = smoothstep(0, 135, survivalSec);
    return 5.4 + earlyU * 2.8;
  }
  const deepU = smoothstep(135, 260, survivalSec);
  return 8.2 + deepU * 6;
}
function reefRunAirTankRandomPickupWeight(survivalSec) {
  if (survivalSec < 135) {
    const earlyU = smoothstep(0, 135, survivalSec);
    return 13.5 - earlyU * 3;
  }
  const deepU = smoothstep(135, 260, survivalSec);
  return Math.max(3.6, 10.5 * (1 - 0.66 * deepU));
}
function swimSpeedMultiplierForTier(tierIndex) {
  const t = Math.min(Math.max(0, tierIndex), REEF_RUN_MAX_SPEED_TIER);
  return 1 + t * REEF_RUN_SPEED_PER_TIER;
}

// src/pages/arcade/arcadePickupKinds.ts
function isBeneficialPickup(kind) {
  return kind === "air_tank" || kind === "coin" || kind === "trash" || kind === "cheese" || kind === "peptides";
}
function characterUsesOxygenMechanic(id) {
  return id === "milady" || id === "radbro";
}
function characterHasUnlimitedOxygen(id) {
  return id === "clawb";
}
function createInitialRunState(characterId, _nowSec) {
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
    throttle: 0
  };
}
var SPAWN_WEIGHTS_BASE = [
  // Trash hauling is the mission (see the brief) — trash is the most common pickup, period.
  { kind: "coin", w: 18 },
  { kind: "trash", w: 26 },
  { kind: "air_tank", w: 10 },
  { kind: "cheese", w: 8 },
  { kind: "peptides", w: 10 },
  { kind: "jellyfish", w: 7 },
  { kind: "pufferfish", w: 6 },
  { kind: "mine", w: 4 }
];
var PICKUP_TUNING = {
  air_tank: { oxygenDelta: 44, clearDrag: true, cameraShake: 0.03 },
  coin: { coins: 1, oxygenDelta: 2 },
  trash: { trash: 1, armorDelta: 3 },
  cheese: { cheeseSec: 3.6 },
  peptides: { armorDelta: 22, clearDrag: true, cameraShake: 0.04 },
  jellyfish: { armorDelta: -5, oxygenPenalty: 8, dragSec: 2.2, cameraShake: 0.1 },
  pufferfish: { armorDelta: -10, oxygenPenalty: 4, dragSec: 1.5, cameraShake: 0.12 },
  mine: { armorDelta: -26, oxygenPenalty: 10, dragSec: 1.2, cameraShake: 0.24 }
};
function rollPickupKind(survivalSec, characterId, rng = Math.random) {
  const rows = SPAWN_WEIGHTS_BASE.map((r2) => ({ ...r2 }));
  const depthU = Math.min(1, Math.max(0, (survivalSec - 20) / 140));
  const scale = (kind, mul) => {
    const row = rows.find((r2) => r2.kind === kind);
    if (row) row.w *= mul;
  };
  scale("coin", 1 - 0.2 * depthU);
  scale("trash", 1 - 0.12 * depthU);
  scale("cheese", 1 - 0.1 * depthU);
  scale("peptides", 1 + 0.16 * depthU);
  scale("jellyfish", 1 + 0.32 * depthU);
  scale("pufferfish", 1 + 0.38 * depthU);
  scale("mine", 1 + 0.62 * depthU);
  if (characterId === "clawb") {
    const i = rows.findIndex((r2) => r2.kind === "air_tank");
    if (i >= 0) rows[i].w = 0;
    const add = (kind, d) => {
      const row = rows.find((r2) => r2.kind === kind);
      if (row) row.w += d;
    };
    add("coin", 3);
    add("trash", 5);
    add("cheese", 2);
  } else {
    const air = rows.find((r2) => r2.kind === "air_tank");
    if (air) air.w = reefRunAirTankRandomPickupWeight(survivalSec);
  }
  const sum = rows.reduce((a, b) => a + Math.max(0, b.w), 0);
  if (sum <= 0) return "coin";
  let r = rng() * sum;
  for (const row of rows) {
    if (row.w <= 0) continue;
    r -= row.w;
    if (r <= 0) return row.kind;
  }
  return "coin";
}
function applyPickupEffect(kind, st, nowSec) {
  const fx = PICKUP_TUNING[kind];
  if (!fx) return {};
  if (fx.coins) st.coins += fx.coins;
  if (kind === "cheese") st.cheeseCollected += 1;
  if (kind === "peptides") st.peptidesCollected += 1;
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
      if (st.oxygen <= 0) return { gameOver: "oxygen", cameraShake: fx.cameraShake };
    }
  }
  if (typeof fx.armorDelta === "number" && fx.armorDelta !== 0) {
    st.armor = Math.min(st.armorMax, st.armor + fx.armorDelta);
    if (st.armor <= 0) {
      st.armor = 0;
      return { gameOver: "wrecked", cameraShake: fx.cameraShake };
    }
  }
  return fx.cameraShake ? { cameraShake: fx.cameraShake } : {};
}

// src/pages/arcade/arcadeRng.ts
function makeRng(seed) {
  let a = seed >>> 0;
  return function rng() {
    a = a + 1831565813 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

// src/pages/arcade/reefRunSim.ts
var LANES = [-2.1, 0, 2.1];
var PLAYER_Z = 2.8;
var SPAWN_Z = -52;
var HIT_Z = PLAYER_Z;
var HIT_HALF_DEPTH = 1.35;
var OBSTACLE_RECYCLE_Z = 8;
var OBSTACLE_BOX_DEPTH_Z = 2.2;
var OBSTACLE_HALF_Z = OBSTACLE_BOX_DEPTH_Z / 2;
var ROW_Z_EPS = 0.04;
var FIRST_OBSTACLE_AFTER_S = 0.38;
var APPROACH_PIPE_Z = HIT_Z - HIT_HALF_DEPTH - 10;
function obstacleFrontPastApproachPipe(z) {
  return z + OBSTACLE_HALF_Z > APPROACH_PIPE_Z;
}
function createSimState(characterId, seed, maxActiveObstacles = 12) {
  const state = {
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
    nextForcedOxyTankSurvival: characterUsesOxygenMechanic(characterId) ? 4.4 : Number.POSITIVE_INFINITY,
    gameRng: makeRng(seed),
    lastSwimSpd: 1,
    maxActiveObstacles
  };
  seedInitialPickups(state);
  return state;
}
var INITIAL_PICKUP_ZS = [-16, -30, -44];
function seedInitialPickups(state) {
  for (let i = 0; i < INITIAL_PICKUP_ZS.length; i++) {
    const lane = Math.floor(state.gameRng() * 3);
    let kind = "trash";
    if (i > 1) {
      const rolled = rollPickupKind(0, state.runState.characterId, state.gameRng);
      kind = isBeneficialPickup(rolled) ? rolled : "coin";
    }
    spawnPickupInLane(state, lane, kind, INITIAL_PICKUP_ZS[i]);
  }
}
function lanesOnActiveTrack(obstacles) {
  const lanes = /* @__PURE__ */ new Set();
  for (const o of obstacles) {
    if (o.hit) continue;
    if (o.z >= OBSTACLE_RECYCLE_Z) continue;
    lanes.add(o.lane);
  }
  return lanes;
}
function lanesBusyInApproachPipe(obstacles) {
  const lanes = /* @__PURE__ */ new Set();
  for (const o of obstacles) {
    if (o.hit) continue;
    if (obstacleFrontPastApproachPipe(o.z)) lanes.add(o.lane);
  }
  return lanes;
}
function laneBlockedForPickup(obstacles, lane) {
  return obstacles.some(
    (o) => !o.hit && o.lane === lane && o.z > -50 && o.z < 5
  );
}
function spawnObstacleInLane(state, lane, z) {
  const speed = REEF_RUN_OBSTACLE_BASE_SPEED * (0.94 + state.gameRng() * 0.12);
  state.obstacles.push({ lane, z, speed, hit: false });
}
function trySpawnObstacleRow(state) {
  const activeCount = state.obstacles.filter(
    (o) => !o.hit && o.z < OBSTACLE_RECYCLE_Z
  ).length;
  if (activeCount >= state.maxActiveObstacles) return false;
  if (lanesBusyInApproachPipe(state.obstacles).size >= 2) return false;
  const track = lanesOnActiveTrack(state.obstacles);
  if (track.size >= 3) return false;
  if (track.size === 2) {
    const free = [0, 1, 2].find((l) => !track.has(l));
    if (free === void 0) return false;
    spawnObstacleInLane(state, free, SPAWN_Z);
    return true;
  }
  if (track.size === 1) {
    const busy = [...track][0];
    const open = [0, 1, 2].filter((l) => l !== busy);
    const lane = open[Math.floor(state.gameRng() * open.length)];
    spawnObstacleInLane(state, lane, SPAWN_Z);
    return true;
  }
  const gapLane = Math.floor(state.gameRng() * 3);
  const fillLanes = [0, 1, 2].filter((l) => l !== gapLane);
  const twoBlockRow = state.gameRng() < reefRunTwoBlockRowChance(state.survivalSec);
  if (twoBlockRow) {
    spawnObstacleInLane(state, fillLanes[0], SPAWN_Z);
    spawnObstacleInLane(state, fillLanes[1], SPAWN_Z + ROW_Z_EPS);
  } else {
    const lane = fillLanes[Math.floor(state.gameRng() * 2)];
    spawnObstacleInLane(state, lane, SPAWN_Z);
  }
  return true;
}
function spawnPickupInLane(state, lane, kind, z = SPAWN_Z) {
  const speed = REEF_RUN_OBSTACLE_BASE_SPEED * (0.88 + state.gameRng() * 0.12) * 0.74;
  state.pickups.push({ lane, z, speed, hit: false, kind });
}
function trySpawnPickup(state) {
  const cid = state.runState.characterId;
  for (let tryN = 0; tryN < 3; tryN++) {
    const lane = (Math.floor(state.gameRng() * 3) + tryN) % 3;
    if (!laneBlockedForPickup(state.obstacles, lane)) {
      spawnPickupInLane(
        state,
        lane,
        rollPickupKind(state.survivalSec, cid, state.gameRng)
      );
      return;
    }
  }
}
function trySpawnForcedOxygenTank(state) {
  const order = [1, 0, 2];
  for (const lane of order) {
    if (!laneBlockedForPickup(state.obstacles, lane)) {
      spawnPickupInLane(state, lane, "air_tank");
      return true;
    }
  }
  return false;
}
function pickupSpawnIntervalSec(survivalSec) {
  const x = Math.min(1, Math.max(0, survivalSec / 95));
  const s = x * x * (3 - 2 * x);
  return 1.35 + s * 0.75;
}
function stepSim(state, dt, input) {
  const events = [];
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
    const targetT = input.forward && !input.backward ? 1 : input.backward && !input.forward ? -1 : 0;
    state.throttleSmoothed += (targetT - state.throttleSmoothed) * Math.min(1, dt * 4.8);
    const band = speedBandForStars(getCharacterStats(st.characterId).speed);
    const u = (state.throttleSmoothed + 1) / 2;
    playerMult = band.min + u * (band.max - band.min);
    if (now < st.cheeseUntil) playerMult += 0.27;
    if (now < st.dragUntil) playerMult *= 0.54;
    if (characterHasUnlimitedOxygen(st.characterId)) {
      st.oxygen = st.oxygenMax;
    } else {
      const oxyStars = getCharacterStats(st.characterId).oxygen;
      const drain = oxygenDrainPerSec(oxyStars) * (0.86 + 0.16 * Math.min(
        1.55,
        intensityBase * playerMult / Math.max(1e-3, intensityBase)
      ));
      st.oxygen -= drain * dt;
      if (st.oxygen <= 0) {
        st.oxygen = 0;
        state.playEnded = true;
        events.push({ type: "gameOver", reason: "oxygen" });
      }
    }
  }
  swimSpd = intensityBase * (state.playEnded ? 1 : playerMult);
  if (state.playEnded) swimSpd = intensityBase;
  state.lastSwimSpd = swimSpd;
  if (!state.playEnded) {
    for (const o of state.obstacles) {
      if (o.hit) continue;
      o.z += o.speed * swimSpd * dt * REEF_RUN_TICK_Z_SCALE;
      if (Math.abs(o.z - HIT_Z) < HIT_HALF_DEPTH && o.lane === state.playerLane) {
        o.hit = true;
        state.playEnded = true;
        events.push({ type: "gameOver", reason: "crush" });
        events.push({ type: "obstacleHit", lane: o.lane, z: o.z });
        break;
      }
      if (o.z > OBSTACLE_RECYCLE_Z) {
        o.hit = true;
      }
    }
    state.obstacles = state.obstacles.filter(
      (o) => !(o.hit && o.z > OBSTACLE_RECYCLE_Z)
    );
    if (!state.playEnded) {
      const pickupHitZ = HIT_HALF_DEPTH * 0.78;
      for (const p of state.pickups) {
        if (p.hit) continue;
        p.z += p.speed * swimSpd * dt * REEF_RUN_TICK_Z_SCALE;
        if (Math.abs(p.z - HIT_Z) < pickupHitZ && p.lane === state.playerLane) {
          p.hit = true;
          events.push({
            type: "pickupHit",
            kind: p.kind,
            lane: p.lane,
            z: p.z
          });
          if (isBeneficialPickup(p.kind)) {
            events.push({ type: "playerPulse" });
          }
          const out = applyPickupEffect(p.kind, st, state.simNow);
          if (out.cameraShake) {
            events.push({ type: "cameraShake", peak: out.cameraShake });
          }
          if (out.gameOver) {
            state.playEnded = true;
            events.push({ type: "gameOver", reason: out.gameOver });
            break;
          }
        }
        if (p.z > OBSTACLE_RECYCLE_Z) {
          p.hit = true;
        }
      }
      state.pickups = state.pickups.filter((p) => !p.hit);
    }
    if (!state.playEnded && characterUsesOxygenMechanic(st.characterId)) {
      if (state.survivalSec >= state.nextForcedOxyTankSurvival) {
        if (trySpawnForcedOxygenTank(state)) {
          state.nextForcedOxyTankSurvival = state.survivalSec + forcedOxyTankIntervalSec(state.survivalSec);
        } else {
          state.nextForcedOxyTankSurvival = state.survivalSec + 0.28;
        }
      }
    }
    if (!state.playEnded) {
      state.pickupSpawnAcc += dt;
      if (state.pickupSpawnAcc >= pickupSpawnIntervalSec(state.survivalSec)) {
        state.pickupSpawnAcc = 0;
        trySpawnPickup(state);
      }
      const rowInterval = reefRunSpawnIntervalSec(state.survivalSec);
      state.spawnAcc += dt;
      if (state.spawnAcc >= rowInterval) {
        state.spawnWaveIndex++;
        if (reefRunSpawnRowThisWave(
          state.survivalSec,
          state.spawnWaveIndex,
          state.gameRng
        )) {
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
var FIXED_DT = 1 / 60;
var MAX_SUBSTEPS = 5;
function runFixedSteps(state, dt, simAcc, input, onStep) {
  simAcc += dt;
  let n = 0;
  const allEvents = [];
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

// src/utils/reefRunLeaderboardPoints.ts
function reefRunLeaderboardPointsForRound(survivalSec) {
  const sec = Math.floor(Math.max(0, survivalSec));
  if (sec < 60) return 1;
  return Math.floor(sec / 60) * 3;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  FIXED_DT,
  HIT_HALF_DEPTH,
  HIT_Z,
  LANES,
  MAX_SUBSTEPS,
  OBSTACLE_RECYCLE_Z,
  PLAYER_Z,
  SPAWN_Z,
  createSimState,
  reefRunLeaderboardPointsForRound,
  runFixedSteps,
  stepSim
});
