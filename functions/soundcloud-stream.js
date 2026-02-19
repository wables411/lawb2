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

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return json(200, {}, { 'Content-Type': 'text/plain' });
  }
  if (event.httpMethod !== 'GET') {
    return json(405, { error: 'Method not allowed' });
  }

  const clientId = process.env.SOUNDCLOUD_CLIENT_ID;
  if (!clientId) {
    return json(500, { error: 'Missing SOUNDCLOUD_CLIENT_ID env var' });
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
  url.searchParams.set('client_id', clientId);

  try {
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
      { url: data.url },
      { 'Cache-Control': 'public, max-age=0, s-maxage=60, stale-while-revalidate=60' }
    );
  } catch (err) {
    console.error('[soundcloud-stream] error:', err);
    return json(500, { error: 'Failed to resolve SoundCloud stream', message: err && err.message ? err.message : String(err) });
  }
};

