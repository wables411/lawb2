// Netlify function: fetch liked tracks from a SoundCloud profile by scraping
// the public /likes page hydration payload.
//
// This avoids SoundCloud API v2 client_id restrictions and is compatible with
// playing tracks via the official SoundCloud Widget on the frontend.

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

function normalizeProfileLikesUrl(profileUrl) {
  const u = safeUrl(profileUrl);
  if (!u) return null;
  if (u.hostname !== 'soundcloud.com') return null;
  // Ensure /likes suffix.
  const parts = u.pathname.split('/').filter(Boolean);
  if (!parts.length) return null;
  const username = parts[0];
  return `https://soundcloud.com/${username}/likes`;
}

function extractHydrationJson(html) {
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
    if (depth === 0) {
      end = i + 1;
      break;
    }
  }
  if (end < 0) return null;
  const json = html.slice(start, end);
  try {
    return JSON.parse(json);
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

  const profileUrl = (event.queryStringParameters && event.queryStringParameters.profileUrl) || DEFAULT_PROFILE_URL;
  const likesUrl = normalizeProfileLikesUrl(profileUrl);
  if (!likesUrl) {
    return json(400, { error: 'Invalid profileUrl (expected soundcloud.com/<user>)' });
  }

  try {
    const res = await fetch(likesUrl, {
      method: 'GET',
      headers: {
        'Accept': 'text/html',
        'User-Agent': 'lawb.xyz-netlify-function',
      },
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`SoundCloud likes page error: ${res.status} ${res.statusText} ${text.slice(0, 200)}`);
    }
    const html = await res.text();
    const hydration = extractHydrationJson(html);
    if (!Array.isArray(hydration)) {
      throw new Error('Could not extract SoundCloud hydration payload');
    }

    const tracks = [];
    const seen = new Set();
    const MAX_TRACKS = 300;

    for (const h of hydration) {
      const d = h && h.data;
      if (!d || d.kind !== 'track') continue;
      if (!d.permalink_url || !d.title || !d.id) continue;
      if (seen.has(d.id)) continue;
      seen.add(d.id);
      tracks.push({
        id: d.id,
        title: d.title,
        permalink_url: d.permalink_url,
        artwork_url: d.artwork_url || null,
        duration_ms: d.duration || null,
        user: d.user ? { username: d.user.username, permalink_url: d.user.permalink_url } : undefined,
      });
      if (tracks.length >= MAX_TRACKS) break;
    }

    return json(
      200,
      {
        profileUrl,
        fetchedAt: Date.now(),
        tracks,
      },
      {
        'Cache-Control': 'public, max-age=0, s-maxage=900, stale-while-revalidate=900',
      }
    );
  } catch (err) {
    console.error('[soundcloud-likes] error:', err);
    return json(500, { error: 'Failed to fetch SoundCloud likes', message: err && err.message ? err.message : String(err) });
  }
};

// --- Old API v2 approach (blocked by 403 for some client_ids) removed ---

/* eslint-disable no-unreachable */
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
/* eslint-enable no-unreachable */
