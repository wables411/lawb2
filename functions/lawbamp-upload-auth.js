// Netlify function: issue short-lived upload auth token for Lawbamp uploads.
//
// Client flow:
// 1) GET this endpoint with ?address=0x...
// 2) Client signs the message (see buildAuthMessage below) with their wallet
// 3) Client uses { token, signature } with upload-init / upload-finalize

const crypto = require('crypto');

function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Content-Type': 'application/json; charset=utf-8',
    },
    body: JSON.stringify(body),
  };
}

function base64UrlEncode(buf) {
  return Buffer.from(buf).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function signToken(secret, payloadObj) {
  const payload = base64UrlEncode(JSON.stringify(payloadObj));
  const sig = base64UrlEncode(crypto.createHmac('sha256', secret).update(payload).digest());
  return `${payload}.${sig}`;
}

function normAddress(raw) {
  const a = String(raw || '').trim();
  if (!/^0x[0-9a-fA-F]{40}$/.test(a)) return null;
  return a.toLowerCase();
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return json(200, {});
  if (event.httpMethod !== 'GET') return json(405, { error: 'Method not allowed' });

  const secret = process.env.LAWBAMP_UPLOAD_HMAC_SECRET;
  if (!secret) return json(500, { error: 'Missing LAWBAMP_UPLOAD_HMAC_SECRET' });

  const address = normAddress(event.queryStringParameters && event.queryStringParameters.address);
  if (!address) return json(400, { error: 'Invalid address' });

  const now = Date.now();
  const ttlMs = 5 * 60 * 1000; // 5 minutes
  const payload = {
    address,
    nonce: crypto.randomBytes(16).toString('hex'),
    issuedAt: now,
    expiresAt: now + ttlMs,
    v: 1,
  };

  const token = signToken(secret, payload);
  return json(200, { token, payload });
};

