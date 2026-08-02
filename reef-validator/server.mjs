/**
 * Reef Run validator HTTP service — zero-dep Node, same deploy style as the
 * chess ELO indexer (droplet + nginx proxy or local dev).
 *
 *   POST /validate  ← run proof JSON (getRunProof() output) → verdict JSON
 *   GET  /health    → {ok:true}
 *
 * Run locally: `npm run validator:serve` (builds the sim bundle first).
 * Binds 127.0.0.1 by default — put nginx in front on the droplet.
 * Score persistence (Firebase write of validated scores) is intentionally NOT
 * here yet; this service only judges proofs, so it needs no credentials.
 */

import http from 'node:http';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { validateRunProof } = require('./replayProof.cjs');

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
