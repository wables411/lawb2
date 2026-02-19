// Netlify function: fetch liked tracks from a SoundCloud profile.
//
// SoundCloud often blocks arbitrary client_ids with 403. The most reliable trick
// is to extract the current site apiClient id from the public HTML and use it
// for api-v2 calls.

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

async function scJson(url) {
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'lawb.xyz-netlify-function',
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`SoundCloud API error: ${res.status} ${res.statusText} ${text.slice(0, 200)}`);
  }
  return res.json();
}

async function extractApiClientIdFromLikesPage(likesUrl) {
  const res = await fetch(likesUrl, {
    method: 'GET',
    headers: { 'Accept': 'text/html', 'User-Agent': 'lawb.xyz-netlify-function' },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`SoundCloud likes page error: ${res.status} ${res.statusText} ${text.slice(0, 200)}`);
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

  const profileUrl = (event.queryStringParameters && event.queryStringParameters.profileUrl) || DEFAULT_PROFILE_URL;
  const likesUrl = normalizeProfileLikesUrl(profileUrl);
  if (!likesUrl) {
    return json(400, { error: 'Invalid profileUrl (expected soundcloud.com/<user>)' });
  }

  try {
    const clientId = await extractApiClientIdFromLikesPage(likesUrl);

    // Resolve user id
    const resolved = await scJson(
      `https://api-v2.soundcloud.com/resolve?url=${encodeURIComponent(profileUrl)}&client_id=${encodeURIComponent(clientId)}`
    );
    const userId = resolved && resolved.kind === 'user' ? resolved.id : null;
    if (!userId) throw new Error('Could not resolve SoundCloud user');

    const tracks = [];
    const MAX_TRACKS = 300;
    let nextHref = `https://api-v2.soundcloud.com/users/${userId}/likes?limit=50&linked_partitioning=1&client_id=${encodeURIComponent(clientId)}`;
    let pages = 0;
    const MAX_PAGES = 15;

    while (nextHref && tracks.length < MAX_TRACKS && pages < MAX_PAGES) {
      pages++;
      const page = await scJson(nextHref);
      const collection = Array.isArray(page && page.collection) ? page.collection : [];
      for (const item of collection) {
        const t = item && item.track;
        if (!t || t.kind !== 'track') continue;
        if (!t.id || !t.title || !t.permalink_url) continue;

        // Find a progressive transcoding URL for direct audio playback
        let progressive = null;
        const trans = t.media && Array.isArray(t.media.transcodings) ? t.media.transcodings : [];
        for (const tr of trans) {
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
        clientIdHint: clientId,
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
