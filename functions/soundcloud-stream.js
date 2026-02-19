// Netlify function: resolve a progressive SoundCloud stream URL for playback.
// Input: ?transcodingUrl=<SoundCloud API v2 transcoding url>
// Output: { url: "<signed stream url>" }

function json(statusCode, body, extraHeaders = {}) {
  return {
    statusCode,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Content-Type': 'application/json; charset=utf-8',
      ...extraHeaders,
    },
    body: JSON.stringify(body),
  };
}

function safeUrl(raw) {
  try {
    return new URL(raw);
  } catch {
    return null;
  }
}

function extractScHydration(html) {
  const marker = 'window.__sc_hydration =';
  const idx = html.indexOf(marker);
  if (idx < 0) return null;
  const start = html.indexOf('[', idx);
  if (start < 0) return null;
  let depth = 0;
  let end = -1;
  for (let i = start; i < html.length; i++) {
    const ch = html[i];
    if (ch === '[') depth++;
    if (ch === ']') depth--;
    if (depth === 0) { end = i + 1; break; }
  }
  if (end < 0) return null;
  try {
    return JSON.parse(html.slice(start, end));
  } catch {
    return null;
  }
}

async function extractApiClientId(profileUrl) {
  const likesUrl = profileUrl.endsWith('/likes') ? profileUrl : `${profileUrl.replace(/\/+$/, '')}/likes`;
  const res = await fetch(likesUrl, {
    method: 'GET',
    headers: { 'Accept': 'text/html', 'User-Agent': 'lawb.xyz-netlify-function' },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`SoundCloud page error: ${res.status} ${res.statusText} ${text.slice(0, 200)}`);
  }
  const html = await res.text();
  const hyd = extractScHydration(html);
  if (!Array.isArray(hyd)) throw new Error('Could not extract SoundCloud hydration payload');
  const apiClient = hyd.find((h) => h && h.hydratable === 'apiClient' && h.data && h.data.id);
  const id = apiClient && apiClient.data && apiClient.data.id;
  if (!id || typeof id !== 'string') throw new Error('Could not extract SoundCloud apiClient id');
  return id;
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return json(200, {}, { 'Content-Type': 'text/plain' });
  }
  if (event.httpMethod !== 'GET') {
    return json(405, { error: 'Method not allowed' });
  }

  const transcodingUrlRaw = event.queryStringParameters && event.queryStringParameters.transcodingUrl;
  if (!transcodingUrlRaw) {
    return json(400, { error: 'Missing transcodingUrl' });
  }

  const parsed = safeUrl(transcodingUrlRaw);
  if (!parsed || parsed.protocol !== 'https:' || parsed.hostname !== 'api-v2.soundcloud.com') {
    return json(400, { error: 'Invalid transcodingUrl host' });
  }

  const url = new URL(parsed.toString());
  const profileUrl = (event.queryStringParameters && event.queryStringParameters.profileUrl) || 'https://soundcloud.com/companioncube143';

  try {
    const clientId = await extractApiClientId(profileUrl);
    url.searchParams.set('client_id', clientId);
    const res = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'lawb.xyz-netlify-function',
      },
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      return json(502, { error: 'SoundCloud API error', status: res.status, body: text.slice(0, 200) });
    }
    const data = await res.json();
    if (!data || !data.url) {
      return json(502, { error: 'SoundCloud stream response missing url' });
    }
    return json(
      200,
      { url: data.url, clientIdHint: clientId },
      { 'Cache-Control': 'public, max-age=0, s-maxage=60, stale-while-revalidate=60' }
    );
  } catch (err) {
    console.error('[soundcloud-stream] error:', err);
    return json(500, { error: 'Failed to resolve SoundCloud stream', message: err && err.message ? err.message : String(err) });
  }
};

