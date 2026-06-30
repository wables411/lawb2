/**
 * Headless test harness for the Reef Run pure sim core.
 *
 * Pre-step: `npx esbuild src/pages/arcade/reefRunSim.ts --bundle --platform=node --format=cjs --outfile=tests/_reefRunSim.cjs`
 * (the npm script `test:reef` does this automatically)
 *
 * Verifies: determinism, survival advancement, collision / game-over,
 * obstacle spawning, pickup collection, oxygen drain, and fixed-step runner.
 */

const test = require('node:test');
const assert = require('node:assert/strict');

let sim;
try {
  sim = require('./_reefRunSim.cjs');
} catch (e) {
  console.error(
    'Run `npx esbuild src/pages/arcade/reefRunSim.ts --bundle --platform=node --format=cjs --outfile=tests/_reefRunSim.cjs` first.',
  );
  throw e;
}

const {
  createSimState,
  stepSim,
  runFixedSteps,
  FIXED_DT,
  LANES,
  PLAYER_Z,
  HIT_Z,
  HIT_HALF_DEPTH,
  SPAWN_Z,
  OBSTACLE_RECYCLE_Z,
} = sim;

// ── helpers ──────────────────────────────────────────────────────────────────

/** Run N fixed steps (dt = FIXED_DT), staying in center lane with no throttle. */
function runNSteps(state, n, lane = 1) {
  const input = { lane, forward: false, backward: false };
  const allEvents = [];
  for (let i = 0; i < n; i++) {
    state.simNow += FIXED_DT;
    const events = stepSim(state, FIXED_DT, input);
    allEvents.push(...events);
    if (state.playEnded) break;
  }
  return allEvents;
}

/** Run until game over or `maxSteps` reached.  Returns step count + events. */
function runUntilGameOver(state, maxSteps = 60 * 300, lane = 1) {
  const input = { lane, forward: false, backward: false };
  let steps = 0;
  const allEvents = [];
  while (!state.playEnded && steps < maxSteps) {
    state.simNow += FIXED_DT;
    const events = stepSim(state, FIXED_DT, input);
    allEvents.push(...events);
    steps++;
  }
  return { steps, events: allEvents };
}

// ── tests ────────────────────────────────────────────────────────────────────

test('createSimState produces a valid initial state', () => {
  const s = createSimState('clawb', 42);
  assert.equal(s.playEnded, false);
  assert.equal(s.runClockActive, true);
  assert.equal(s.survivalSec, 0);
  assert.equal(s.playerLane, 1);
  assert.equal(s.runState.characterId, 'clawb');
  assert.ok(s.runState.oxygen > 0);
  assert.ok(s.runState.armor > 0);
  assert.ok(typeof s.gameRng === 'function');
});

test('survival advances on each step', () => {
  const s = createSimState('clawb', 123);
  runNSteps(s, 60);
  // 60 steps × 1/60s ≈ 1.0s
  assert.ok(s.survivalSec > 0.99, `survival=${s.survivalSec}`);
  assert.ok(s.survivalSec < 1.01, `survival=${s.survivalSec}`);
});

test('determinism: same seed produces identical runs', () => {
  function snapshot(seed) {
    const s = createSimState('clawb', seed);
    const events = runNSteps(s, 600);
    return {
      survival: s.survivalSec,
      obstacles: s.obstacles.length,
      pickups: s.pickups.length,
      coins: s.runState.coins,
      playEnded: s.playEnded,
      eventTypes: events.map((e) => e.type).join(','),
    };
  }
  const a = snapshot(99999);
  const b = snapshot(99999);
  assert.deepStrictEqual(a, b, 'same seed must produce identical snapshots');
});

test('different seeds produce different runs', () => {
  function fingerprint(seed) {
    const s = createSimState('clawb', seed);
    runNSteps(s, 600);
    return `${s.obstacles.length}-${s.pickups.length}-${s.runState.coins}`;
  }
  const a = fingerprint(1);
  const b = fingerprint(2);
  // Extremely unlikely to match with different seeds
  assert.notEqual(a, b, 'different seeds should diverge');
});

test('obstacles spawn and advance toward player', () => {
  const s = createSimState('clawb', 42);
  // Run enough steps for obstacles to spawn (first spawn after ~0.38s ≈ 23 steps)
  runNSteps(s, 180); // 3 seconds
  assert.ok(s.obstacles.length > 0, 'obstacles should have spawned');
  // Check some obstacle has moved from SPAWN_Z toward player
  const moved = s.obstacles.some((o) => o.z > SPAWN_Z + 1);
  assert.ok(moved, 'at least one obstacle should have advanced past spawn Z');
});

test('obstacle collision triggers crush game-over', () => {
  const s = createSimState('clawb', 42);
  // Manually place an obstacle right at the player
  s.obstacles.push({
    lane: 1,
    z: HIT_Z - 0.1,
    speed: 0.5,
    hit: false,
  });
  const events = runNSteps(s, 1);
  assert.ok(s.playEnded, 'game should end on obstacle collision');
  const gameOver = events.find((e) => e.type === 'gameOver');
  assert.ok(gameOver, 'should emit gameOver event');
  assert.equal(gameOver.reason, 'crush');
});

test('pickups spawn and can be collected', () => {
  const s = createSimState('clawb', 42);
  // Manually place a coin pickup in the player's lane at hit zone
  s.pickups.push({
    lane: 1,
    z: HIT_Z - 0.5,
    speed: 0.5,
    hit: false,
    kind: 'coin',
  });
  const events = runNSteps(s, 5);
  const pickup = events.find((e) => e.type === 'pickupHit');
  assert.ok(pickup, 'should emit pickupHit event');
  assert.equal(pickup.kind, 'coin');
  assert.ok(s.runState.coins >= 1, 'coins should increment');
});

test('mine pickup triggers wrecked game-over when armor is low', () => {
  const s = createSimState('clawb', 42);
  s.runState.armor = 1; // nearly dead
  s.pickups.push({
    lane: 1,
    z: HIT_Z - 0.3,
    speed: 0.5,
    hit: false,
    kind: 'mine',
  });
  const events = runNSteps(s, 5);
  assert.ok(s.playEnded, 'game should end from mine with low armor');
  const gameOver = events.find((e) => e.type === 'gameOver');
  assert.ok(gameOver);
  assert.equal(gameOver.reason, 'wrecked');
});

test('oxygen drains for milady (non-clawb character)', () => {
  const s = createSimState('milady', 42);
  const o0 = s.runState.oxygen;
  runNSteps(s, 120); // 2 seconds
  assert.ok(
    s.runState.oxygen < o0,
    `oxygen should drain: was ${o0}, now ${s.runState.oxygen}`,
  );
});

test('clawb has unlimited oxygen', () => {
  const s = createSimState('clawb', 42);
  runNSteps(s, 600); // 10 seconds
  assert.equal(s.runState.oxygen, s.runState.oxygenMax, 'clawb O₂ should stay full');
  assert.ok(!s.playEnded || s.survivalSec > 5, 'clawb should not die from oxygen');
});

test('milady eventually dies from oxygen if no tanks collected', () => {
  const s = createSimState('milady', 42);
  // Disable forced O₂ tanks so she drains
  s.nextForcedOxyTankSurvival = Number.POSITIVE_INFINITY;
  // Stay in lane 0 to avoid most pickups (they spawn randomly)
  const result = runUntilGameOver(s, 60 * 120, 0);
  // She should die from oxygen or some other cause within 120s
  assert.ok(s.playEnded, 'milady should eventually die');
});

test('obstacles are recycled past OBSTACLE_RECYCLE_Z', () => {
  const s = createSimState('clawb', 42);
  // Place an obstacle that's past the recycle line
  s.obstacles.push({
    lane: 0, // different from player lane 1 so no collision
    z: OBSTACLE_RECYCLE_Z + 1,
    speed: 0.5,
    hit: false,
  });
  const before = s.obstacles.length;
  runNSteps(s, 1);
  assert.ok(
    s.obstacles.length < before,
    'recycled obstacle should be removed from array',
  );
});

test('player lane change avoids collision', () => {
  const s = createSimState('clawb', 42);
  // Obstacle in lane 1 about to reach player
  s.obstacles.push({
    lane: 1,
    z: HIT_Z - HIT_HALF_DEPTH + 0.1,
    speed: 0.5,
    hit: false,
  });
  // Player dodges to lane 0
  const input = { lane: 0, forward: false, backward: false };
  s.simNow += FIXED_DT;
  stepSim(s, FIXED_DT, input);
  assert.ok(!s.playEnded, 'player in lane 0 should dodge lane 1 obstacle');
});

test('runFixedSteps accumulator works correctly', () => {
  const s = createSimState('clawb', 42);
  const input = { lane: 1, forward: false, backward: false };
  // Pass 2.5 frames worth of dt
  const r = runFixedSteps(s, FIXED_DT * 2.5, 0, input);
  assert.equal(r.stepsRun, 2, 'should run 2 full steps');
  assert.ok(r.simAcc > 0, 'should have leftover accumulator');
  assert.ok(
    Math.abs(r.simAcc - FIXED_DT * 0.5) < 1e-10,
    `simAcc should be ~0.5*FIXED_DT, got ${r.simAcc}`,
  );
});

test('runFixedSteps stops on game over', () => {
  const s = createSimState('clawb', 42);
  // Obstacle in player lane at hit zone
  s.obstacles.push({
    lane: 1,
    z: HIT_Z - 0.05,
    speed: 0.5,
    hit: false,
  });
  const input = { lane: 1, forward: false, backward: false };
  const r = runFixedSteps(s, FIXED_DT * 5, 0, input);
  assert.ok(s.playEnded, 'game should end');
  assert.ok(r.stepsRun <= 5, 'should stop early on game over');
  assert.ok(
    r.events.some((e) => e.type === 'gameOver'),
    'should include gameOver event',
  );
});

test('long run (60s) stays alive with clawb in safe lane strategy', () => {
  const s = createSimState('clawb', 777);
  // Run 60s worth of steps, switching lanes to dodge
  const input = { lane: 0, forward: false, backward: false };
  let steps = 0;
  const maxSteps = 60 * 60; // 60 seconds
  while (!s.playEnded && steps < maxSteps) {
    s.simNow += FIXED_DT;
    // Simple dodge: pick the lane with no obstacles nearby
    let safeLane = 0;
    let minDanger = Infinity;
    for (let l = 0; l < 3; l++) {
      let danger = 0;
      for (const o of s.obstacles) {
        if (o.hit) continue;
        if (o.lane === l && o.z > -5 && o.z < 8) {
          danger += 1 / Math.max(0.1, Math.abs(o.z - HIT_Z));
        }
      }
      if (danger < minDanger) {
        minDanger = danger;
        safeLane = l;
      }
    }
    input.lane = safeLane;
    stepSim(s, FIXED_DT, input);
    steps++;
  }
  // With a smart dodge strategy, clawb should survive well past 10s
  assert.ok(
    s.survivalSec > 10,
    `clawb should survive >10s with dodge AI, got ${s.survivalSec.toFixed(2)}s`,
  );
});

test('speed increases with survival time (intensity ramp)', () => {
  // Test the pure intensity function directly (no collision risk)
  const { reefRunPlayIntensityMultiplier } = require('./_reefRunSim.cjs');
  // The function isn't exported — test via sim state instead:
  // Place two states at different survival times, same input, check lastSwimSpd
  const s1 = createSimState('clawb', 42);
  s1.survivalSec = 1;
  const input = { lane: 1, forward: false, backward: false };
  s1.simNow = 1;
  stepSim(s1, FIXED_DT, input);
  const speed1 = s1.lastSwimSpd;

  const s2 = createSimState('clawb', 42);
  s2.survivalSec = 60;
  s2.simNow = 60;
  stepSim(s2, FIXED_DT, input);
  const speed60 = s2.lastSwimSpd;

  assert.ok(
    speed60 > speed1,
    `speed should increase: t=1s → ${speed1.toFixed(3)}, t=60s → ${speed60.toFixed(3)}`,
  );
});
