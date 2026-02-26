// Netlify serverless function to proxy Magic Eden NFT API calls.
// This avoids browser CORS issues when fetching Solana collection/owner data.

const MAGIC_EDEN_API_BASE = 'https://api-mainnet.magiceden.dev/v2';

function clampLimit(input, fallback = 50) {
  const n = Number(input);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(1, Math.min(100, Math.floor(n)));
}

exports.handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const qs = event.queryStringParameters || {};
    const mode = String(qs.mode || '').toLowerCase();
    const limit = clampLimit(qs.limit, 50);
    const offset = Math.max(0, Number(qs.offset) || 0);

    let upstreamUrl = '';

    if (mode === 'collection') {
      const collectionSlug = String(qs.collectionSlug || '').trim();
      if (!collectionSlug) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Missing required parameter: collectionSlug' }),
        };
      }
      upstreamUrl = `${MAGIC_EDEN_API_BASE}/collections/${encodeURIComponent(collectionSlug)}/listings?offset=${offset}&limit=${limit}`;
    } else if (mode === 'owner') {
      const owner = String(qs.owner || '').trim();
      if (!owner) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Missing required parameter: owner' }),
        };
      }
      upstreamUrl = `${MAGIC_EDEN_API_BASE}/wallets/${encodeURIComponent(owner)}/tokens?offset=${offset}&limit=${limit}`;
    } else {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid mode. Use mode=collection or mode=owner' }),
      };
    }

    const response = await fetch(upstreamUrl, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'lawb.xyz-netlify-proxy/1.0',
      },
    });

    const responseText = await response.text();
    if (!response.ok) {
      return {
        statusCode: response.status,
        headers,
        body: JSON.stringify({
          error: 'Magic Eden API error',
          status: response.status,
          details: responseText.slice(0, 500),
        }),
      };
    }

    return {
      statusCode: 200,
      headers,
      body: responseText || '[]',
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Internal server error',
        message: error?.message || 'Unknown error',
      }),
    };
  }
};

