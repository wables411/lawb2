// Netlify function: verify auth + NFT gate, then write Lawbamp upload metadata to RTDB.
//
// This makes the \"token gated upload\" real because clients cannot write `lawbamp_uploads/*`
// directly (rules should deny), while the Admin SDK bypasses rules.

const crypto = require('crypto');
const { ethers } = require('ethers');
const admin = require('firebase-admin');

const LAWbsters_CONTRACT = '0x0ef7ba09c38624b8e9cc4985790a2f5dbfc1dc42';
const LAWbstarz_CONTRACT = '0xd7922cd333da5ab3758c95f774b092a7b13a5449';

function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Content-Type': 'application/json; charset=utf-8',
    },
    body: JSON.stringify(body),
  };
}

function base64UrlDecode(s) {
  const pad = '='.repeat((4 - (s.length % 4)) % 4);
  const b64 = (s + pad).replace(/-/g, '+').replace(/_/g, '/');
  return Buffer.from(b64, 'base64');
}

function base64UrlEncode(buf) {
  return Buffer.from(buf).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function verifyAndParseToken(secret, token) {
  if (!token || typeof token !== 'string') return { ok: false, error: 'Missing token' };
  const parts = token.split('.');
  if (parts.length !== 2) return { ok: false, error: 'Invalid token format' };
  const [payloadB64, sigB64] = parts;
  const expectedSig = base64UrlEncode(crypto.createHmac('sha256', secret).update(payloadB64).digest());
  if (expectedSig !== sigB64) return { ok: false, error: 'Bad token signature' };
  let payload;
  try {
    payload = JSON.parse(base64UrlDecode(payloadB64).toString('utf8'));
  } catch {
    return { ok: false, error: 'Bad token payload' };
  }
  const now = Date.now();
  if (!payload || payload.v !== 1) return { ok: false, error: 'Unsupported token version' };
  if (!payload.expiresAt || now > Number(payload.expiresAt)) return { ok: false, error: 'Token expired' };
  return { ok: true, payload };
}

function normAddress(raw) {
  const a = String(raw || '').trim();
  if (!/^0x[0-9a-fA-F]{40}$/.test(a)) return null;
  return a.toLowerCase();
}

function buildAuthMessage(p) {
  return [
    'LAWBAMP_UPLOAD',
    `address:${p.address}`,
    `nonce:${p.nonce}`,
    `issuedAt:${p.issuedAt}`,
    `expiresAt:${p.expiresAt}`,
  ].join('\n');
}

function sanitizeTitle(raw) {
  const t = String(raw || '').trim().slice(0, 120);
  return t || 'Untitled';
}

function sanitizeFilename(raw) {
  const base = String(raw || 'upload').trim().slice(0, 120);
  return base.replace(/[^\w.\-() ]+/g, '_');
}

function assertAllowedMime(mime) {
  const m = String(mime || '').toLowerCase();
  if (m.startsWith('audio/')) return;
  if (m.startsWith('video/')) return;
  throw new Error('Unsupported mime type');
}

function initAdmin() {
  if (admin.apps && admin.apps.length) return;
  const saRaw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!saRaw) throw new Error('Missing FIREBASE_SERVICE_ACCOUNT_JSON');
  const dbUrl = process.env.FIREBASE_DATABASE_URL;
  const bucket = process.env.FIREBASE_STORAGE_BUCKET;
  if (!dbUrl) throw new Error('Missing FIREBASE_DATABASE_URL');
  if (!bucket) throw new Error('Missing FIREBASE_STORAGE_BUCKET');
  const sa = JSON.parse(saRaw);
  admin.initializeApp({
    credential: admin.credential.cert(sa),
    databaseURL: dbUrl,
    storageBucket: bucket,
  });
}

async function hasUploadGate(address) {
  const key = process.env.ALCHEMY_API_KEY;
  if (!key) throw new Error('Missing ALCHEMY_API_KEY (required for NFT gate)');
  const base = `https://eth-mainnet.g.alchemy.com/nft/v3/${key}`;
  const [r1, r2] = await Promise.all([
    fetch(`${base}/getNFTsForOwner?owner=${encodeURIComponent(address)}&contractAddresses[]=${encodeURIComponent(LAWbsters_CONTRACT)}&withMetadata=false&pageSize=1`),
    fetch(`${base}/getNFTsForOwner?owner=${encodeURIComponent(address)}&contractAddresses[]=${encodeURIComponent(LAWbstarz_CONTRACT)}&withMetadata=false&pageSize=1`),
  ]);
  if (!r1.ok || !r2.ok) throw new Error(`Alchemy API error: ${r1.status || r2.status}`);
  const [d1, d2] = await Promise.all([r1.json(), r2.json()]);
  const hasLawbsters = Array.isArray(d1.ownedNfts) && d1.ownedNfts.length > 0;
  const hasLawbstarz = Array.isArray(d2.ownedNfts) && d2.ownedNfts.length > 0;
  return hasLawbsters || hasLawbstarz;
}

exports.handler = async (event) => {
  const method = event.httpMethod || event.method;
  if (method === 'OPTIONS') return json(200, {});
  if (method !== 'POST') return json(405, { error: 'Method not allowed' });

  const secret = process.env.LAWBAMP_UPLOAD_HMAC_SECRET;
  if (!secret) return json(500, { error: 'Missing LAWBAMP_UPLOAD_HMAC_SECRET' });

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return json(400, { error: 'Invalid JSON body' });
  }

  const address = normAddress(body.address);
  const token = body.token;
  const signature = String(body.signature || '');
  const entryId = String(body.entryId || '').trim();
  const filename = sanitizeFilename(body.filename);
  const mime = String(body.mime || '');
  const bytes = Number(body.bytes || 0);
  const durationSec = Number(body.duration_sec || 0);
  const title = sanitizeTitle(body.title || filename);
  const downloadUrl = String(body.downloadUrl || '').trim();
  const objectPath = String(body.objectPath || '').trim();

  try {
    if (!address) throw new Error('Invalid address');
    if (!signature) throw new Error('Missing signature');
    if (!entryId) throw new Error('Missing entryId');
    if (!filename) throw new Error('Missing filename');
    assertAllowedMime(mime);
    if (!Number.isFinite(bytes) || bytes <= 0) throw new Error('Invalid bytes');
    if (!Number.isFinite(durationSec) || durationSec <= 0 || durationSec > 5400) {
      throw new Error('Invalid duration (max 90 minutes)');
    }
    if (!downloadUrl || !downloadUrl.startsWith('https://')) throw new Error('Missing downloadUrl');
    if (!objectPath) throw new Error('Missing objectPath');

    const t = verifyAndParseToken(secret, token);
    if (!t.ok) throw new Error(t.error);
    if (!t.payload || t.payload.address !== address) throw new Error('Token address mismatch');

    const msg = buildAuthMessage(t.payload);
    const recovered = ethers.verifyMessage(msg, signature);
    if (normAddress(recovered) !== address) throw new Error('Bad signature');

    const ok = await hasUploadGate(address);
    if (!ok) {
      return json(403, { error: 'Upload requires Lawbsters or Lawbstarz (Ethereum)' });
    }

    initAdmin();
    const bucket = admin.storage().bucket();

    // Ensure object exists before writing metadata.
    const [exists] = await bucket.file(objectPath).exists();
    if (!exists) throw new Error('Uploaded object not found (upload may have failed)');

    // Set cache headers so repeat plays hit browser/CDN cache instead of re-downloading.
    await bucket.file(objectPath).setMetadata({ cacheControl: 'public, max-age=31536000' });

    const now = Date.now();
    const entry = {
      id: entryId,
      uploader: address,
      title,
      filename,
      mime,
      bytes,
      duration_sec: Math.round(durationSec),
      created_at: now,
      storage_url: downloadUrl,
      object_path: objectPath,
      // Optional server-side timestamp for debugging.
      created_at_server: admin.database.ServerValue.TIMESTAMP,
    };

    await admin.database().ref(`lawbamp_uploads/${entryId}`).set(entry);
    await admin.database().ref(`lawbamp_uploads_by_user/${address}/${entryId}`).set(true);

    return json(200, { ok: true, entry });
  } catch (err) {
    console.error('[lawbamp-upload-finalize] error:', err);
    return json(500, { error: 'Failed to finalize upload', message: err && err.message ? err.message : String(err) });
  }
};

