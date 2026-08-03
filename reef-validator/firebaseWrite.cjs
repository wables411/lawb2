/**
 * Firebase write path for VERIFIED Reef Run results — the validator is the only
 * writer of `reef_verified/*` (clients are read-only; admin credentials bypass
 * rules). Same zero-dep service-account JWT pattern as elo-indexer/indexer.mjs.
 *
 * Graceful skip: without /root/reef-validator/service-account.json (or
 * FIREBASE_SA), recordVerifiedRun() is a no-op that returns 'no-key' — the
 * validator still judges and publishes its proofs feed.
 *
 * Writes ONE bounded PATCH per verified run (RTDB writes are the cost driver):
 *   reef_verified/<walletKey> = { best_survival_sec, best_points, runs,
 *     last: {seed, characterId, survivalSec, points, endReason, at} }
 */

'use strict';

const { createSign } = require('node:crypto');
const { readFileSync, existsSync } = require('node:fs');
const { join } = require('node:path');

const FIREBASE_DB = process.env.FIREBASE_DB || 'https://chess-220ee-default-rtdb.firebaseio.com';
const SA_PATH = process.env.FIREBASE_SA || join(__dirname, 'service-account.json');

let cachedToken = null;
let cachedTokenExp = 0;

async function firebaseToken(sa) {
  const now = Math.floor(Date.now() / 1000);
  if (cachedToken && now < cachedTokenExp - 120) return cachedToken;
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
  const unsigned = `${b64({ alg: 'RS256', typ: 'JWT' })}.${b64({
    iss: sa.client_email,
    scope:
      'https://www.googleapis.com/auth/firebase.database https://www.googleapis.com/auth/userinfo.email',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  })}`;
  const signer = createSign('RSA-SHA256');
  signer.update(unsigned);
  const jwt = `${unsigned}.${signer.sign(sa.private_key).toString('base64url')}`;
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });
  const body = await res.json();
  if (!body.access_token) throw new Error(`token exchange failed: ${JSON.stringify(body)}`);
  cachedToken = body.access_token;
  cachedTokenExp = now + 3600;
  return cachedToken;
}

/** Firebase path key: lowercased, restricted to path-safe wallet chars. */
function walletKey(address) {
  if (typeof address !== 'string') return null;
  const k = address.trim().toLowerCase();
  if (!/^[a-z0-9]{20,64}$/i.test(k.replace(/^0x/, ''))) return null;
  if (/[.#$/\[\]]/.test(k)) return null;
  return k;
}

/**
 * Record a verified run for a wallet. Returns 'written' | 'no-key' |
 * 'no-wallet' | 'error:<msg>'. Never throws — score persistence must not take
 * the judge down.
 */
async function recordVerifiedRun({ walletAddress, seed, characterId, survivalSec, points, endReason }) {
  const key = walletKey(walletAddress);
  if (!key) return 'no-wallet';
  if (!existsSync(SA_PATH)) return 'no-key';
  try {
    const sa = JSON.parse(readFileSync(SA_PATH, 'utf8'));
    const token = await firebaseToken(sa);
    const base = `${FIREBASE_DB}/reef_verified/${key}`;
    const headers = { 'content-type': 'application/json', authorization: `Bearer ${token}` };

    const curRes = await fetch(`${base}.json`, { headers });
    const cur = curRes.ok ? await curRes.json() : null;

    const patch = {
      best_survival_sec: Math.max(cur?.best_survival_sec ?? 0, survivalSec),
      best_points: Math.max(cur?.best_points ?? 0, points),
      runs: (cur?.runs ?? 0) + 1,
      last: { seed, characterId, survivalSec, points, endReason, at: new Date().toISOString() },
    };
    const res = await fetch(`${base}.json`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(patch),
    });
    if (!res.ok) return `error:${res.status}`;
    return 'written';
  } catch (err) {
    return `error:${err.message}`;
  }
}

module.exports = { recordVerifiedRun, walletKey };
