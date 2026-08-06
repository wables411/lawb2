/**
 * Reef Run validator HTTP service — zero-dep Node, same deploy style as the
 * chess ELO indexer (droplet + nginx proxy or local dev).
 *
 *   POST /validate  ← run proof JSON (getRunProof() output) → verdict JSON
 *   GET  /proofs    → last 100 accepted proofs (public transparency feed —
 *                     anyone can re-run any of them through the open-source sim)
 *   GET  /verified  → per-wallet verified aggregates (best survival, runs,
 *                     points) — the credential-free score store, same pattern
 *                     as chess elo.json: frontend reads THIS, no Firebase needed
 *   GET  /health    → {ok:true}
 *
 * Run locally: `npm run validator:serve` (builds the sim bundle first).
 * Binds 127.0.0.1 by default — put nginx in front on the droplet.
 * Accepted proofs append to accepted.jsonl next to this file; verified results
 * also write to Firebase `reef_verified/<wallet>` IF a service-account key is
 * present (see firebaseWrite.cjs — graceful no-op without one).
 */

import http from 'node:http';
import { appendFileSync, existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { validateRunProof } = require('./replayProof.cjs');
const { recordVerifiedRun } = require('./firebaseWrite.cjs');

// ── Jackpot score signing (OPTIONAL — inert without env) ────────────────────
// With REEF_SCORE_SIGNER_KEY + REEF_JACKPOT_ADDRESS + REEF_JACKPOT_CHAIN_ID set
// (droplet: /root/reef-validator/env), an accepted proof that carries an
// `entryNonce` also gets an EIP-712 signature the ReefRunJackpot contract
// accepts in submitScore(). The signature binds (player, entryNonce, seed,
// survivalMs, deadline); the CONTRACT enforces that (entryNonce, seed) matches
// the player's on-chain entry, so the validator only attests what it replayed.
const SCORE_SIGNER_KEY = process.env.REEF_SCORE_SIGNER_KEY || '';
const JACKPOT_ADDRESS = process.env.REEF_JACKPOT_ADDRESS || '';
const JACKPOT_CHAIN_ID = Number(process.env.REEF_JACKPOT_CHAIN_ID || 0);
const SIG_TTL_SEC = Number(process.env.REEF_SCORE_SIG_TTL_SEC || 3600);
let scoreSigner = null;
if (SCORE_SIGNER_KEY && JACKPOT_ADDRESS && JACKPOT_CHAIN_ID > 0) {
  try {
    scoreSigner = require('./_scoreSigner.cjs');
    console.log(
      `[reef-validator] jackpot score signing ENABLED — signer ${scoreSigner.signerAddress(SCORE_SIGNER_KEY)}, ` +
        `contract ${JACKPOT_ADDRESS}, chain ${JACKPOT_CHAIN_ID}`,
    );
  } catch (err) {
    console.error('[reef-validator] score signing DISABLED (_scoreSigner.cjs missing/broken):', err.message);
  }
} else {
  console.log('[reef-validator] jackpot score signing disabled (no signer env)');
}

// One signature per (player, entryNonce), persisted across restarts: an entry buys ONE
// submitted attempt — without this a player could validate many runs of their assigned
// seed and pick the best signature. (The contract's entry TTL bounds the window too.)
const SIGNED_NONCES_PATH =
  process.env.REEF_SIGNED_NONCES_PATH ||
  join(dirname(fileURLToPath(import.meta.url)), 'signed-nonces.jsonl');
const signedNonces = new Set();
if (existsSync(SIGNED_NONCES_PATH)) {
  try {
    for (const line of readFileSync(SIGNED_NONCES_PATH, 'utf8').trim().split('\n')) {
      if (line) signedNonces.add(line.trim());
    }
  } catch {
    // unreadable — start empty (worst case: one extra signature per old nonce)
  }
}

/** Attach a jackpot Score signature to an accepted verdict, if signing is on. */
function maybeSignScore(proof, verdict) {
  if (!scoreSigner || !verdict.valid || !verdict.walletAddress) return null;
  const nonce = proof.entryNonce;
  if (!Number.isInteger(nonce) || nonce <= 0 || nonce > Number.MAX_SAFE_INTEGER) return null;
  const nonceKey = `${String(verdict.walletAddress).toLowerCase()}:${nonce}`;
  if (signedNonces.has(nonceKey)) {
    console.log(`[reef-validator] refusing second signature for ${nonceKey}`);
    return { alreadySigned: true };
  }
  const value = {
    player: verdict.walletAddress,
    entryNonce: nonce,
    seed: proof.seed >>> 0,
    survivalMs: Math.round(verdict.survivalSec * 1000), // replayed (authoritative) time
    deadline: Math.floor(Date.now() / 1000) + SIG_TTL_SEC,
  };
  try {
    const domain = scoreSigner.scoreDomain(JACKPOT_CHAIN_ID, JACKPOT_ADDRESS);
    const signature = scoreSigner.signScore(SCORE_SIGNER_KEY, domain, value);
    signedNonces.add(nonceKey);
    try {
      appendFileSync(SIGNED_NONCES_PATH, `${nonceKey}\n`);
    } catch (err) {
      console.error('[reef-validator] signed-nonces append failed:', err.message);
    }
    return { ...value, signature, signer: scoreSigner.signerAddress(SCORE_SIGNER_KEY) };
  } catch (err) {
    console.error('[reef-validator] score signing failed:', err.message);
    return null;
  }
}

const ACCEPTED_PATH =
  process.env.REEF_ACCEPTED_PATH ||
  join(dirname(fileURLToPath(import.meta.url)), 'accepted.jsonl');
const FEED_MAX = 100;

// Transparency feed: ring buffer of accepted proofs, warm-started from disk.
// Verified aggregates: per-wallet running totals rebuilt from the FULL log at
// boot — accepted.jsonl is the source of truth, so a restart loses nothing.
const recentAccepted = [];
const verifiedByWallet = {};

function applyToAggregates(entry) {
  if (!entry.wallet) return;
  const key = String(entry.wallet).toLowerCase();
  const agg = (verifiedByWallet[key] ??= {
    best_survival_sec: 0,
    best_points: 0,
    total_points: 0,
    runs: 0,
    last_at: null,
  });
  agg.best_survival_sec = Math.max(agg.best_survival_sec, entry.survivalSec);
  agg.best_points = Math.max(agg.best_points, entry.points);
  agg.total_points += entry.points;
  agg.runs += 1;
  agg.last_at = entry.at;
}

if (existsSync(ACCEPTED_PATH)) {
  try {
    const lines = readFileSync(ACCEPTED_PATH, 'utf8').trim().split('\n');
    for (const line of lines) {
      try {
        const entry = JSON.parse(line);
        applyToAggregates(entry);
        recentAccepted.push(entry);
        if (recentAccepted.length > FEED_MAX) recentAccepted.shift();
      } catch {
        // skip torn line
      }
    }
  } catch {
    // unreadable log — feed starts empty, judging still works
  }
}

function recordAccepted(proof, verdict) {
  const entry = {
    at: new Date().toISOString(),
    wallet: verdict.walletAddress,
    characterId: proof.characterId,
    seed: proof.seed,
    steps: proof.steps,
    maxActiveObstacles: proof.maxActiveObstacles ?? 12,
    survivalSec: verdict.survivalSec,
    points: verdict.points,
    endReason: verdict.endReason,
    pickups: verdict.pickups,
    // The full input log IS the proof — with seed + character it makes the run
    // publicly recomputable by anyone running the open-source sim.
    inputLog: proof.inputLog,
  };
  recentAccepted.push(entry);
  if (recentAccepted.length > FEED_MAX) recentAccepted.shift();
  applyToAggregates(entry);
  try {
    appendFileSync(ACCEPTED_PATH, `${JSON.stringify(entry)}\n`);
  } catch (err) {
    console.error('[reef-validator] accepted.jsonl append failed:', err.message);
  }
  void recordVerifiedRun({
    walletAddress: entry.wallet,
    seed: entry.seed,
    characterId: entry.characterId,
    survivalSec: entry.survivalSec,
    points: entry.points,
    endReason: entry.endReason,
  }).then((status) => {
    if (status !== 'no-wallet') console.log(`[reef-validator] firebase: ${status}`);
  });
}

const PORT = Number(process.env.REEF_VALIDATOR_PORT || 8787);
const HOST = process.env.REEF_VALIDATOR_HOST || '127.0.0.1';
const MAX_BODY_BYTES = 512 * 1024; // a 20k-entry input log is ~400KB worst case

function sendJson(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    'content-type': 'application/json',
    'access-control-allow-origin': '*',
    'access-control-allow-methods': 'POST, GET, OPTIONS',
    'access-control-allow-headers': 'content-type',
  });
  res.end(payload);
}

const server = http.createServer((req, res) => {
  if (req.method === 'OPTIONS') {
    sendJson(res, 204, {});
    return;
  }
  if (req.method === 'GET' && req.url === '/health') {
    sendJson(res, 200, { ok: true });
    return;
  }
  if (req.method === 'GET' && req.url === '/proofs') {
    sendJson(res, 200, { count: recentAccepted.length, proofs: recentAccepted });
    return;
  }
  if (req.method === 'GET' && (req.url === '/verified' || req.url === '/verified.json')) {
    sendJson(res, 200, { wallets: verifiedByWallet });
    return;
  }
  if (req.method !== 'POST' || req.url !== '/validate') {
    sendJson(res, 404, { error: 'not-found' });
    return;
  }

  let size = 0;
  const chunks = [];
  let aborted = false;
  req.on('data', (chunk) => {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) {
      aborted = true;
      sendJson(res, 413, { error: 'body-too-large' });
      req.destroy();
      return;
    }
    chunks.push(chunk);
  });
  req.on('end', () => {
    if (aborted) return;
    let proof;
    try {
      proof = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    } catch {
      sendJson(res, 400, { error: 'bad-json' });
      return;
    }
    try {
      const verdict = validateRunProof(proof);
      if (verdict.valid) {
        recordAccepted(proof, verdict);
        const jackpot = maybeSignScore(proof, verdict);
        if (jackpot) verdict.jackpot = jackpot;
      }
      sendJson(res, 200, verdict);
    } catch (err) {
      console.error('[reef-validator] replay crashed:', err);
      sendJson(res, 500, { error: 'replay-failed' });
    }
  });
});

server.listen(PORT, HOST, () => {
  console.log(`[reef-validator] listening on http://${HOST}:${PORT}`);
});
