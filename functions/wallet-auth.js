/**
 * Wallet -> Firebase Auth bridge.
 *
 * POST { address, chain: 'evm' | 'solana', message, signature }
 *  - Verifies the signature proves control of `address`.
 *  - Mints a Firebase custom token with uid = normalized address
 *    (EVM lowercased 0x..., Solana base58 as-is).
 *
 * The client exchanges the token via signInWithCustomToken; database rules
 * then only accept writes to leaderboard/profiles/usernames/wallet_links
 * entries whose key matches auth.uid. This is what stops anyone from writing
 * scores or profile data into another wallet's entry.
 *
 * Env (already configured in Netlify for the previous admin functions):
 *   FIREBASE_SERVICE_ACCOUNT_JSON, FIREBASE_DATABASE_URL
 */
const admin = require('firebase-admin');
const { verifyMessage } = require('ethers');
const nacl = require('tweetnacl');

const MESSAGE_PREFIX = 'lawb.xyz wallet login';
const MAX_MESSAGE_AGE_MS = 10 * 60 * 1000;

// Light per-IP rate limit (in-memory per lambda instance).
const ipHits = new Map();
const RATE_WINDOW_MS = 60 * 1000;
const RATE_MAX = 20;

function rateLimited(ip) {
  const now = Date.now();
  const hits = (ipHits.get(ip) || []).filter((t) => now - t < RATE_WINDOW_MS);
  hits.push(now);
  ipHits.set(ip, hits);
  return hits.length > RATE_MAX;
}

let app = null;
function getAdmin() {
  if (app) return app;
  const serviceJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  const dbUrl = process.env.FIREBASE_DATABASE_URL;
  if (!serviceJson || !dbUrl) {
    throw new Error('Missing FIREBASE_SERVICE_ACCOUNT_JSON / FIREBASE_DATABASE_URL');
  }
  app = admin.apps.length
    ? admin.apps[0]
    : admin.initializeApp({
        credential: admin.credential.cert(JSON.parse(serviceJson)),
        databaseURL: dbUrl,
      });
  return app;
}

const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
function base58Decode(str) {
  let num = 0n;
  for (const ch of str) {
    const idx = BASE58_ALPHABET.indexOf(ch);
    if (idx < 0) throw new Error('invalid base58');
    num = num * 58n + BigInt(idx);
  }
  const bytes = [];
  while (num > 0n) {
    bytes.unshift(Number(num & 0xffn));
    num >>= 8n;
  }
  for (const ch of str) {
    if (ch === '1') bytes.unshift(0);
    else break;
  }
  return Uint8Array.from(bytes);
}

/** EVM lowercased; Solana base58 as stored. Mirrors src/firebaseLeaderboard.ts normalizeLeaderboardPathKey. */
function normalizeKey(addr) {
  const t = String(addr || '').trim();
  if (!t || t === '0x0000000000000000000000000000000000000000') return null;
  if (/^0x[0-9a-fA-F]{40}$/.test(t)) return t.toLowerCase();
  if (/^[1-9A-HJ-NP-Za-km-z]{32,48}$/.test(t)) return t;
  return null;
}

function parseIssuedAt(message) {
  const m = message.match(/^issued: (.+)$/m);
  if (!m) return null;
  const t = Date.parse(m[1]);
  return Number.isFinite(t) ? t : null;
}

function json(statusCode, body) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    body: JSON.stringify(body),
  };
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { error: 'POST only' });

  const ip =
    (event.headers && (event.headers['x-nf-client-connection-ip'] || event.headers['client-ip'])) || 'unknown';
  if (rateLimited(ip)) return json(429, { error: 'Too many requests' });

  let payload;
  try {
    payload = JSON.parse(event.body || '{}');
  } catch {
    return json(400, { error: 'Invalid JSON' });
  }

  const { address, chain, message, signature } = payload;
  const key = normalizeKey(address);
  if (!key) return json(400, { error: 'Invalid address' });
  if (typeof message !== 'string' || typeof signature !== 'string') {
    return json(400, { error: 'Missing message/signature' });
  }

  // Message must be our login format, name this wallet, and be fresh.
  if (!message.startsWith(MESSAGE_PREFIX)) return json(400, { error: 'Bad message prefix' });
  if (!message.includes(`address: ${key}`)) return json(400, { error: 'Message/address mismatch' });
  const issued = parseIssuedAt(message);
  if (issued === null || Math.abs(Date.now() - issued) > MAX_MESSAGE_AGE_MS) {
    return json(400, { error: 'Message expired' });
  }

  try {
    if (chain === 'solana') {
      if (key.startsWith('0x')) return json(400, { error: 'EVM address with solana chain' });
      const ok = nacl.sign.detached.verify(
        new TextEncoder().encode(message),
        base58Decode(signature),
        base58Decode(key),
      );
      if (!ok) return json(401, { error: 'Bad signature' });
    } else {
      if (!key.startsWith('0x')) return json(400, { error: 'Non-EVM address with evm chain' });
      const recovered = verifyMessage(message, signature);
      if (recovered.toLowerCase() !== key) return json(401, { error: 'Bad signature' });
    }
  } catch (err) {
    return json(401, { error: 'Signature verification failed' });
  }

  try {
    const token = await getAdmin().auth().createCustomToken(key);
    return json(200, { token, uid: key });
  } catch (err) {
    console.error('[wallet-auth] token mint failed:', err && err.message);
    return json(500, { error: 'Token mint failed' });
  }
};
