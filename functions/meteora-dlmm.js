/**
 * Server-side proxy for Meteora DLMM API (no CORS from browser).
 *
 * Meteora moved off dlmm-api.meteora.ag (/pair, /position → 404). Current host:
 * https://dlmm.datapi.meteora.ag — e.g. GET /pools/{addr}, GET /positions/{pool}/pnl?user=...
 *
 * GET ?path= URL-encoded path, optional query string after first ?
 */
const METEORA_BASE = 'https://dlmm.datapi.meteora.ag';

// Solana-style base58 (no 0 O I l)
const B58 = '[1-9A-HJ-NP-Za-km-z]+';

exports.handler = async (event) => {
  const cors = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
  };
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: cors, body: '' };
  }
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, headers: cors, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  let raw = '';
  try {
    raw = decodeURIComponent(event.queryStringParameters?.path || '');
  } catch {
    return { statusCode: 400, headers: cors, body: JSON.stringify({ error: 'Bad path encoding' }) };
  }

  const qIdx = raw.indexOf('?');
  const pathname = qIdx >= 0 ? raw.slice(0, qIdx) : raw;
  const search = qIdx >= 0 ? raw.slice(qIdx) : '';

  if (!pathname || pathname.includes('..') || raw.length > 512) {
    return { statusCode: 400, headers: cors, body: JSON.stringify({ error: 'Invalid path' }) };
  }

  const poolRe = new RegExp(`^/pools/${B58}$`);
  const posRe = new RegExp(`^/positions/${B58}/(pnl|historical)$`);
  if (!poolRe.test(pathname) && !posRe.test(pathname)) {
    return { statusCode: 400, headers: cors, body: JSON.stringify({ error: 'Path not allowed' }) };
  }

  const url = `${METEORA_BASE}${pathname}${search}`;
  try {
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(15000),
    });
    const text = await res.text();
    const ct = res.headers.get('content-type') || 'application/json';
    return {
      statusCode: res.status,
      headers: { ...cors, 'Content-Type': ct.includes('json') ? 'application/json' : ct },
      body: text,
    };
  } catch (e) {
    return {
      statusCode: 502,
      headers: cors,
      body: JSON.stringify({ error: 'Meteora proxy fetch failed', message: String(e?.message || e) }),
    };
  }
};
