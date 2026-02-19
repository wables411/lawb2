// Netlify function: fetch liked tracks from a SoundCloud profile.
// Uses SoundCloud API v2 endpoints (requires SOUNDCLOUD_CLIENT_ID).

const DEFAULT_PROFILE_URL = 'https://soundcloud.com/companioncube143';

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

async function scFetch(url) {
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      // Some edges behave better with a UA.
      'User-Agent': 'lawb.xyz-netlify-function',
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`SoundCloud API error: ${res.status} ${res.statusText} ${text.slice(0, 200)}`);
  }
  return res.json();
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

  const profileUrl = (event.queryStringParameters && event.queryStringParameters.profileUrl) || DEFAULT_PROFILE_URL;
  const parsed = safeUrl(profileUrl);
  if (!parsed || (parsed.protocol !== 'https:' && parsed.protocol !== 'http:')) {
    return json(400, { error: 'Invalid profileUrl' });
  }

  try {
    const resolveUrl = `https://api-v2.soundcloud.com/resolve?url=${encodeURIComponent(profileUrl)}&client_id=${encodeURIComponent(clientId)}`;
    const resolved = await scFetch(resolveUrl);

    const userId = resolved && resolved.kind === 'user' ? resolved.id : null;
    if (!userId) {
      return json(400, { error: 'Could not resolve SoundCloud user from profileUrl' });
    }

    const tracks = [];
    let nextHref = `https://api-v2.soundcloud.com/users/${userId}/likes?limit=50&linked_partitioning=1&client_id=${encodeURIComponent(clientId)}`;

    // Cap to keep payload safe and predictable.
    const MAX_TRACKS = 300;
    const MAX_PAGES = 15;
    let pages = 0;

    while (nextHref && tracks.length < MAX_TRACKS && pages < MAX_PAGES) {
      pages++;
      const page = await scFetch(nextHref);
      const collection = Array.isArray(page && page.collection) ? page.collection : [];

      for (const item of collection) {
        const t = item && item.track;
        if (!t || !t.id || !t.title || !t.permalink_url) continue;
        if (t.kind !== 'track') continue;

        let progressive = null;
        const transcodings = t.media && Array.isArray(t.media.transcodings) ? t.media.transcodings : [];
        for (const tr of transcodings) {
          if (tr && tr.format && tr.format.protocol === 'progressive' && tr.url) {
            progressive = tr.url;
            break;
          }
        }

        tracks.push({
          id: t.id,
          title: t.title,
          permalink_url: t.permalink_url,
          artwork_url: t.artwork_url || null,
          duration_ms: t.duration || null,
          user: t.user ? { username: t.user.username, permalink_url: t.user.permalink_url } : undefined,
          progressive_transcoding_url: progressive,
        });

        if (tracks.length >= MAX_TRACKS) break;
      }

      nextHref = page && page.next_href ? `${page.next_href}&client_id=${encodeURIComponent(clientId)}` : null;
    }

    return json(
      200,
      {
        profileUrl,
        fetchedAt: Date.now(),
        tracks,
      },
      {
        // Cache at the edge; likes don't need to be realtime.
        'Cache-Control': 'public, max-age=0, s-maxage=900, stale-while-revalidate=900',
      }
    );
  } catch (err) {
    console.error('[soundcloud-likes] error:', err);
    return json(500, { error: 'Failed to fetch SoundCloud likes', message: err && err.message ? err.message : String(err) });
  }
};

