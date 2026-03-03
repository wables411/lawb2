// Netlify function: verify upload auth + NFT gate, then return a signed Firebase Storage upload URL.
//
// Required env vars (Netlify):
// - FIREBASE_SERVICE_ACCOUNT_JSON: service account JSON string
// - FIREBASE_DATABASE_URL: https://<project>-default-rtdb.firebaseio.com
// - FIREBASE_STORAGE_BUCKET: bucket name (e.g. <project>.appspot.com or <project>.firebasestorage.app)
// - LAWBAMP_UPLOAD_HMAC_SECRET: random secret used to sign auth tokens
// Optional:
// - ETH_RPC_URL: Ethereum mainnet RPC URL (defaults to https://eth.llamarpc.com)

const crypto = require('crypto');
const { ethers } = require('ethers');
const admin = require('firebase-admin');

const LAWbsters_CONTRACT = '0x0ef7ba09c38624b8e9cc4985790a2f5dbfc1dc42';
const LAWbstarz_CONTRACT = '0xd7922cd333da5ab3758c95f774b092a7b13a5449';

const ERC721_ABI = ['function balanceOf(address owner) view returns (uint256)'];

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
  const rpcUrl = process.env.ETH_RPC_URL || 'https://eth.llamarpc.com';
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const c1 = new ethers.Contract(LAWbsters_CONTRACT, ERC721_ABI, provider);
  const c2 = new ethers.Contract(LAWbstarz_CONTRACT, ERC721_ABI, provider);
  const [b1, b2] = await Promise.all([c1.balanceOf(address), c2.balanceOf(address)]);
  return (b1 && b1 > 0n) || (b2 && b2 > 0n);
}

exports.handler = async (event) => {
  // Support both Lambda event and Web API Request
  const method = event.httpMethod || event.method || (event.request && event.request.method);
  if (method === 'OPTIONS') return json(200, {});
  if (method !== 'POST') return json(405, { error: 'Method not allowed', debug: { receivedMethod: method } });

  const secret = process.env.LAWBAMP_UPLOAD_HMAC_SECRET;
  if (!secret) return json(500, { error: 'Missing LAWBAMP_UPLOAD_HMAC_SECRET' });

  let body;
  try {
    if (typeof event.json === 'function') {
      body = await event.json();
    } else {
      const raw = event.body || '{}';
      body = typeof raw === 'string' ? JSON.parse(raw) : raw;
    }
  } catch (e) {
    return json(400, { error: 'Invalid JSON body', message: e && e.message ? e.message : String(e) });
  }

  const address = normAddress(body.address);
  const token = body.token;
  const signature = String(body.signature || '');
  const title = String(body.title || '').trim().slice(0, 120) || null;
  const filename = sanitizeFilename(body.filename);
  const mime = String(body.mime || '');
  const bytes = Number(body.bytes || 0);
  const durationSec = Number(body.duration_sec || 0);

  try {
    if (!address) throw new Error('Invalid address');
    if (!signature) throw new Error('Missing signature');
    if (!filename) throw new Error('Missing filename');
    assertAllowedMime(mime);
    if (!Number.isFinite(bytes) || bytes <= 0) throw new Error('Invalid bytes');
    if (!Number.isFinite(durationSec) || durationSec <= 0 || durationSec > 5400) {
      throw new Error('Invalid duration (max 90 minutes)');
    }

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

    const entryId = crypto.randomUUID();
    const objectPath = `lawbamp_uploads/${address}/${entryId}/${filename}`;

    // Token-based download URL (keeps \"anyone can listen\" simple without auth).
    const downloadToken = crypto.randomUUID();

    // Signed URL for a single PUT upload.
    const expiresMs = Date.now() + 10 * 60 * 1000;
    const [uploadUrl] = await bucket.file(objectPath).getSignedUrl({
      version: 'v4',
      action: 'write',
      expires: expiresMs,
      contentType: mime,
      extensionHeaders: {
        // Firebase uses this metadata key to generate a stable download URL token.
        'x-goog-meta-firebaseStorageDownloadTokens': downloadToken,
      },
    });

    const bucketName = bucket.name;
    const downloadUrl = `https://firebasestorage.googleapis.com/v0/b/${encodeURIComponent(bucketName)}/o/${encodeURIComponent(objectPath)}?alt=media&token=${encodeURIComponent(downloadToken)}`;

    return json(200, {
      entryId,
      objectPath,
      uploadUrl,
      requiredHeaders: {
        'content-type': mime,
        'x-goog-meta-firebaseStorageDownloadTokens': downloadToken,
      },
      downloadUrl,
      titleHint: title,
    });
  } catch (err) {
    console.error('[lawbamp-upload-init] error:', err);
    return json(500, { error: 'Failed to init upload', message: err && err.message ? err.message : String(err) });
  }
};

