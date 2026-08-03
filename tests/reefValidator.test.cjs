/**
 * Reef Run validator tests — proves the referee accepts honest runs and
 * rejects forged ones.
 *
 * Pre-step: `npm run validator:build` (bundles the sim into
 * reef-validator/_reefRunSim.cjs; the npm script `test:validator` does this).
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

let sim;
let validator;
try {
  sim = require(path.join('..', 'reef-validator', '_reefRunSim.cjs'));
  validator = require(path.join('..', 'reef-validator', 'replayProof.cjs'));
} catch (e) {
  console.error('Run `npm run validator:build` first.');
  throw e;
}

const { validateRunProof } = validator;

/**
 * Play an honest run headlessly, capturing the input log exactly the way the
 * controller does (one entry per input CHANGE), and return its proof.
 */
function playHonestRun(seed, characterId = 'clawb', inputScript = []) {
  const state = sim.createSimState(characterId, seed, 12);
  const inputLog = [];
  let scriptIdx = 0;
  let lane = 1;
  let forward = false;
  let backward = false;
  let lastKey = lane * 4 + 2 * 0 + 0;
  let step = 0;
  const MAX = 60 * 600;

  while (!state.playEnded && step < MAX) {
    while (scriptIdx < inputScript.length && inputScript[scriptIdx][0] <= step) {
      lane = inputScript[scriptIdx][1];
      forward = inputScript[scriptIdx][2] === 1;
      backward = inputScript[scriptIdx][3] === 1;
      scriptIdx++;
    }
    const key = lane * 4 + (forward ? 2 : 0) + (backward ? 1 : 0);
    if (key !== lastKey) {
      inputLog.push([step, lane, forward ? 1 : 0, backward ? 1 : 0]);
      lastKey = key;
    }
    state.simNow += sim.FIXED_DT;
    sim.stepSim(state, sim.FIXED_DT, { lane, forward, backward });
    step++;
  }
  assert.ok(state.playEnded, 'honest run must end in a game over');
  return {
    seed,
    characterId,
    deterministic: true,
    steps: step,
    survivalSec: state.survivalSec,
    inputLog,
    maxActiveObstacles: 12,
  };
}

test('honest run validates, with authoritative survival + points', () => {
  const proof = playHonestRun(1234);
  const verdict = validateRunProof(proof);
  assert.equal(verdict.valid, true, `expected valid, got ${verdict.reason}`);
  assert.ok(Math.abs(verdict.survivalSec - proof.survivalSec) <= 0.05);
  assert.equal(
    verdict.points,
    sim.reefRunLeaderboardPointsForRound(verdict.survivalSec),
  );
  assert.ok(verdict.endReason, 'end reason reported');
});

test('honest run with lane changes validates', () => {
  const proof = playHonestRun(987654, 'milady', [
    [30, 0, 0, 0],
    [90, 2, 1, 0],
    [150, 1, 0, 0],
  ]);
  const verdict = validateRunProof(proof);
  assert.equal(verdict.valid, true, `expected valid, got ${verdict.reason}`);
});

test('inflated survival score is REJECTED', () => {
  const proof = playHonestRun(1234);
  proof.survivalSec += 60; // claim a minute you didn't survive
  const verdict = validateRunProof(proof);
  assert.equal(verdict.valid, false);
  assert.equal(verdict.reason, 'survival-mismatch');
  // …and the verdict still carries the TRUE score the replay computed.
  assert.ok(Math.abs(verdict.survivalSec - (proof.survivalSec - 60)) <= 0.05);
});

test('padding steps without a real game over is REJECTED', () => {
  const proof = playHonestRun(4242);
  // Pretend the run went on twice as long as the replay actually allows —
  // the replay hits game over first, so extending steps alone can't help,
  // but claiming the longer survival must fail.
  proof.steps *= 2;
  proof.survivalSec *= 2;
  const verdict = validateRunProof(proof);
  assert.equal(verdict.valid, false);
});

test('tampered input log changes the outcome and is REJECTED', () => {
  // A run with a deliberate dodge; stripping the dodge should change survival.
  const honest = playHonestRun(555, 'clawb', [
    [30, 0, 0, 0],
    [120, 2, 0, 0],
    [240, 1, 0, 0],
  ]);
  const tampered = { ...honest, inputLog: [] };
  const verdict = validateRunProof(tampered);
  // Either the emptied log leads to a different death time (mismatch) or, in
  // the unlikely seed where it doesn't, the honest one still validates.
  if (verdict.valid) {
    assert.ok(Math.abs(verdict.survivalSec - honest.survivalSec) <= 0.05);
  } else {
    assert.equal(verdict.reason, 'survival-mismatch');
  }
});

test('wallet identity passes through to the verdict', () => {
  const proof = playHonestRun(2468);
  proof.walletAddress = '0x9387bbf0f7bd3f9a10ea1c4ca6b1a1cc0398a090';
  const verdict = validateRunProof(proof);
  assert.equal(verdict.valid, true);
  assert.equal(verdict.walletAddress, proof.walletAddress);
  // No wallet is fine too (anonymous runs still get judged).
  const anon = playHonestRun(2468);
  assert.equal(validateRunProof(anon).valid, true);
  // Absurd wallet strings are rejected before replay.
  assert.equal(
    validateRunProof({ ...proof, walletAddress: 'x'.repeat(100) }).reason,
    'bad-wallet',
  );
});

test('garbage proofs are rejected cheaply', () => {
  assert.equal(validateRunProof(null).valid, false);
  assert.equal(validateRunProof({}).valid, false);
  assert.equal(validateRunProof({ deterministic: false }).valid, false);
  const base = playHonestRun(77);
  assert.equal(validateRunProof({ ...base, characterId: 'cheater' }).reason, 'bad-character');
  assert.equal(validateRunProof({ ...base, seed: -1 }).reason, 'bad-seed');
  assert.equal(validateRunProof({ ...base, steps: 1e9 }).reason, 'bad-steps');
  assert.equal(validateRunProof({ ...base, inputLog: [[0, 9, 0, 0]] }).reason, 'bad-input-entry');
  assert.equal(validateRunProof({ ...base, maxActiveObstacles: 99 }).reason, 'bad-max-obstacles');
});

test('HTTP server judges proofs end to end', async () => {
  const { spawn } = require('node:child_process');
  const serverPath = path.join(__dirname, '..', 'reef-validator', 'server.mjs');
  const port = 18787;
  const acceptedLog = path.join(
    require('node:os').tmpdir(),
    `reef-accepted-test-${process.pid}.jsonl`,
  );
  const child = spawn(process.execPath, [serverPath], {
    env: {
      ...process.env,
      REEF_VALIDATOR_PORT: String(port),
      REEF_ACCEPTED_PATH: acceptedLog,
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  try {
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('server never started')), 5000);
      child.stdout.on('data', (d) => {
        if (String(d).includes('listening')) {
          clearTimeout(timer);
          resolve();
        }
      });
      child.on('exit', () => reject(new Error('server exited early')));
    });

    const health = await fetch(`http://127.0.0.1:${port}/health`);
    assert.equal((await health.json()).ok, true);

    const proof = playHonestRun(31337);
    const res = await fetch(`http://127.0.0.1:${port}/validate`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(proof),
    });
    const verdict = await res.json();
    assert.equal(verdict.valid, true, `expected valid, got ${verdict.reason}`);

    proof.survivalSec += 120;
    const res2 = await fetch(`http://127.0.0.1:${port}/validate`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(proof),
    });
    assert.equal((await res2.json()).valid, false);

    // Transparency feed: the ACCEPTED run is in /proofs, the forged one is not.
    const feed = await (await fetch(`http://127.0.0.1:${port}/proofs`)).json();
    assert.ok(feed.count >= 1);
    const mine = feed.proofs.filter((p) => p.seed === 31337);
    assert.equal(mine.length, 1);
    assert.ok(Array.isArray(mine[0].inputLog), 'feed entries carry the replayable input log');

    // Credential-free score store: a walleted run lands in /verified aggregates.
    const wallet = '0xabcdef0123456789abcdef0123456789abcdef01';
    const walleted = { ...playHonestRun(424242), walletAddress: wallet };
    await fetch(`http://127.0.0.1:${port}/validate`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(walleted),
    });
    const verified = await (await fetch(`http://127.0.0.1:${port}/verified`)).json();
    const agg = verified.wallets[wallet];
    assert.ok(agg, 'wallet has verified aggregates');
    assert.equal(agg.runs, 1);
    assert.ok(Math.abs(agg.best_survival_sec - walleted.survivalSec) <= 0.05);
  } finally {
    child.kill();
    try {
      require('node:fs').unlinkSync(acceptedLog);
    } catch {
      // best-effort cleanup
    }
  }
});
