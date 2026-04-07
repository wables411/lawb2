/**
 * Server-side proxy for Meteora DLMM API (no CORS from browser).
 * GET ?path=%2Fposition%2F... or ?path=%2Fpair%2F...
 */
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

  let path = '';
  try {
    path = decodeURIComponent(event.queryStringParameters?.path || '');
  } catch {
    return { statusCode: 400, headers: cors, body: JSON.stringify({ error: 'Bad path encoding' }) };
  }

  if (!path.startsWith('/position/') && !path.startsWith('/pair/')) {
    return { statusCode: 400, headers: cors, body: JSON.stringify({ error: 'Invalid path' }) };
  }
  if (path.includes('..') || path.length > 256) {
    return { statusCode: 400, headers: cors, body: JSON.stringify({ error: 'Invalid path' }) };
  }

  const url = `https://dlmm-api.meteora.ag${path}`;
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
