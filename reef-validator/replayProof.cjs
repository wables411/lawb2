/**
 * Reef Run replay validator — the referee.
 *
 * Takes a run proof `{seed, characterId, deterministic, steps, survivalSec,
 * inputLog, maxActiveObstacles}` (from ArcadeSceneController.getRunProof()),
 * replays it through the SAME pure sim the game runs (bundled by
 * `npm run validator:build`), and returns an authoritative verdict:
 * the claimed score is only trusted if the replay reproduces it.
 *
 * Zero deps, no Firebase, no keys — pure compute. Score persistence is the
 * caller's job (server.mjs / a future droplet writer).
 */

'use strict';

let sim;
try {
  sim = require('./_reefRunSim.cjs');
} catch {
  throw new Error(
    'Sim bundle missing — run `npm run validator:build` first (esbuild bundles the game sim).',
  );
}

const CHARACTER_IDS = new Set(['clawb', 'milady', 'radbro']);
// 60 fps × 30 minutes — far beyond any real run; a hard cap so a hostile proof
// can't make the validator spin.
const MAX_STEPS = 60 * 60 * 30;
const MAX_INPUT_ENTRIES = 20000;
// Live deterministic runs are sim-driven, so claimed vs replayed survival
// should agree to the step; 0.05s of slack covers float accumulation.
const SURVIVAL_TOLERANCE_SEC = 0.05;

/** Structural checks before we spend any compute on a replay. */
function checkShape(proof) {
  if (typeof proof !== 'object' || proof === null) return 'not-an-object';
  const { seed, characterId, deterministic, steps, survivalSec, inputLog } = proof;
  if (deterministic !== true) return 'not-deterministic';
  if (!CHARACTER_IDS.has(characterId)) return 'bad-character';
  if (!Number.isInteger(seed) || seed < 0 || seed > 0xffffffff) return 'bad-seed';
  if (!Number.isInteger(steps) || steps < 1 || steps > MAX_STEPS) return 'bad-steps';
  if (!Number.isFinite(survivalSec) || survivalSec < 0 || survivalSec > MAX_STEPS / 60) {
    return 'bad-survival';
  }
  if (!Array.isArray(inputLog) || inputLog.length > MAX_INPUT_ENTRIES) return 'bad-input-log';
  let prevStep = -1;
  for (const entry of inputLog) {
    if (!Array.isArray(entry) || entry.length !== 4) return 'bad-input-entry';
    const [step, lane, w, s] = entry;
    if (!Number.isInteger(step) || step < prevStep || step > steps) return 'bad-input-entry';
    if (!Number.isInteger(lane) || lane < 0 || lane > 2) return 'bad-input-entry';
    if ((w !== 0 && w !== 1) || (s !== 0 && s !== 1)) return 'bad-input-entry';
    prevStep = step;
  }
  const maxActive = proof.maxActiveObstacles ?? 12;
  // 8 = lowPowerMode, 12 = default — the only values the game ever runs with.
  if (maxActive !== 8 && maxActive !== 12) return 'bad-max-obstacles';
  // Wallet is optional identity (null when not connected) — bound but not required.
  if (proof.walletAddress != null) {
    if (typeof proof.walletAddress !== 'string' || proof.walletAddress.length > 64) {
      return 'bad-wallet';
    }
  }
  return null;
}

/**
 * Replay the proof and judge it. Returns:
 * `{valid, reason?, survivalSec, points, endReason, steps, pickups}` —
 * `survivalSec`/`points` are the REPLAYED (authoritative) values, never the claim.
 */
function validateRunProof(proof) {
  const shapeError = checkShape(proof);
  if (shapeError) return { valid: false, reason: shapeError };

  const state = sim.createSimState(
    proof.characterId,
    proof.seed >>> 0,
    proof.maxActiveObstacles ?? 12,
  );

  // Same input-application loop as the game's in-run parity check.
  let logIdx = 0;
  let lane = 1;
  let forward = false;
  let backward = false;
  const pickups = {};
  let endReason = null;

  for (let step = 0; step < proof.steps; step++) {
    while (logIdx < proof.inputLog.length && proof.inputLog[logIdx][0] <= step) {
      const entry = proof.inputLog[logIdx];
      lane = entry[1];
      forward = entry[2] === 1;
      backward = entry[3] === 1;
      logIdx++;
    }
    state.simNow += sim.FIXED_DT;
    const events = sim.stepSim(state, sim.FIXED_DT, { lane, forward, backward });
    for (const ev of events) {
      if (ev.type === 'pickupHit') pickups[ev.kind] = (pickups[ev.kind] ?? 0) + 1;
      else if (ev.type === 'gameOver') endReason = ev.reason;
    }
    if (state.playEnded) break;
  }

  const survivalSec = state.survivalSec;
  const result = {
    survivalSec,
    points: sim.reefRunLeaderboardPointsForRound(survivalSec),
    endReason,
    pickups,
    walletAddress: typeof proof.walletAddress === 'string' ? proof.walletAddress : null,
    seed: proof.seed,
    characterId: proof.characterId,
  };

  if (!state.playEnded) {
    return { valid: false, reason: 'run-never-ended', ...result };
  }
  if (Math.abs(survivalSec - proof.survivalSec) > SURVIVAL_TOLERANCE_SEC) {
    return { valid: false, reason: 'survival-mismatch', claimedSurvivalSec: proof.survivalSec, ...result };
  }
  return { valid: true, ...result };
}

module.exports = { validateRunProof, MAX_STEPS, MAX_INPUT_ENTRIES, SURVIVAL_TOLERANCE_SEC };
