/**
 * Proxies whitelisted Solana JSON-RPC calls to upstream mainnet endpoints.
 * Browsers cannot reach many public RPCs (CSP connect-src + 403 on api.mainnet-beta.solana.com).
 *
 * Netlify env (optional, first match wins before public fallbacks):
 * - SOLANA_RPC_URL — full HTTPS URL (Helius, QuickNode, etc.)
 * - Else ALCHEMY_API_KEY — uses https://solana-mainnet.g.alchemy.com/v2/<key> (enable Solana on the app in Alchemy)
 * - Else public RPCs only
 */

const RPC_TIMEOUT_MS = 12_000;

const ALLOWED_METHODS = new Set(['getBalance', 'getTokenAccountsByOwner']);

function upstreamList() {
  const defaults = [
    'https://solana.publicnode.com',
    'https://rpc.ankr.com/solana',
    'https://api.mainnet-beta.solana.com',
  ];
  const custom = (process.env.SOLANA_RPC_URL || '').trim();
  if (custom) {
    return [custom, ...defaults];
  }
  const alchemyKey = (process.env.ALCHEMY_API_KEY || '').trim();
  if (alchemyKey) {
    return [`https://solana-mainnet.g.alchemy.com/v2/${alchemyKey}`, ...defaults];
  }
  return defaults;
}

exports.handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Invalid JSON body' }),
    };
  }

  if (!body || body.jsonrpc !== '2.0' || typeof body.method !== 'string' || !ALLOWED_METHODS.has(body.method)) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Unsupported or invalid JSON-RPC request' }),
    };
  }

  const payload = JSON.stringify({
    jsonrpc: '2.0',
    id: body.id ?? 1,
    method: body.method,
    params: body.params ?? [],
  });

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), RPC_TIMEOUT_MS);

  let lastErr = 'All upstream RPCs failed';
  try {
    for (const url of [...new Set(upstreamList())]) {
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            'User-Agent': 'lawb.xyz-solana-proxy/1.0',
          },
          body: payload,
          signal: controller.signal,
        });
        const text = await res.text();
        if (res.ok) {
          return { statusCode: 200, headers, body: text };
        }
        lastErr = `HTTP ${res.status} from ${url}`;
      } catch (e) {
        lastErr = e?.message || String(e);
      }
    }
  } finally {
    clearTimeout(timer);
  }

  return {
    statusCode: 502,
    headers,
    body: JSON.stringify({ jsonrpc: '2.0', id: body.id ?? 1, error: { code: -32000, message: lastErr } }),
  };
};
