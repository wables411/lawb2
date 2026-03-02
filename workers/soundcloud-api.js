/**
 * Cloudflare Worker: SoundCloud proxy (likes + stream resolution).
 * Replaces Netlify functions to avoid burning Netlify credits.
 * Deploy: wrangler deploy (from workers/ dir)
 * URL: https://lawb-soundcloud-api.wablesphoto.workers.dev
 */

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function json(status, body, extra = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...CORS, ...extra },
  });
}

function safeUrl(raw) {
  try { return new URL(raw); } catch { return null; }
}

function extractScHydration(html) {
  const marker = 'window.__sc_hydration =';
  const idx = html.indexOf(marker);
  if (idx < 0) return null;
  const start = html.indexOf('[', idx);
  if (start < 0) return null;
  let depth = 0;
  for (let i = start; i < html.length; i++) {
    if (html[i] === '[') depth++;
    if (html[i] === ']') depth--;
    if (depth === 0) {
      try { return JSON.parse(html.slice(start, i + 1)); } catch { return null; }
    }
  }
  return null;
}

async function extractApiClientId(profileUrl) {
  const likesUrl = profileUrl.endsWith('/likes') ? profileUrl : `${profileUrl.replace(/\/+$/, '')}/likes`;
  const res = await fetch(likesUrl, {
    headers: { 'Accept': 'text/html', 'User-Agent': 'lawb-soundcloud-worker' },
  });
  if (!res.ok) throw new Error(`SoundCloud page error: ${res.status}`);
  const html = await res.text();
  const hyd = extractScHydration(html);
  if (!Array.isArray(hyd)) throw new Error('Could not extract SoundCloud hydration');
  const apiClient = hyd.find((h) => h?.hydratable === 'apiClient' && h?.data?.id);
  const id = apiClient?.data?.id;
  if (!id || typeof id !== 'string') throw new Error('Could not extract apiClient id');
  return id;
}

async function handleLikes(profileUrl) {
  const u = safeUrl(profileUrl);
  if (!u || u.hostname !== 'soundcloud.com') return json(400, { error: 'Invalid profileUrl' });
  const parts = u.pathname.split('/').filter(Boolean);
  if (!parts.length) return json(400, { error: 'Invalid profileUrl' });
  const likesUrl = `https://soundcloud.com/${parts[0]}/likes`;

  const clientId = await extractApiClientId(profileUrl);
  const resolved = await fetch(
    `https://api-v2.soundcloud.com/resolve?url=${encodeURIComponent(profileUrl)}&client_id=${encodeURIComponent(clientId)}`,
    { headers: { 'Accept': 'application/json', 'User-Agent': 'lawb-soundcloud-worker' } }
  ).then((r) => r.json());
  const userId = resolved?.kind === 'user' ? resolved.id : null;
  if (!userId) throw new Error('Could not resolve SoundCloud user');

  const tracks = [];
  let nextHref = `https://api-v2.soundcloud.com/users/${userId}/likes?limit=50&linked_partitioning=1&client_id=${encodeURIComponent(clientId)}`;
  let pages = 0;
  while (nextHref && tracks.length < 300 && pages < 15) {
    pages++;
    const page = await fetch(nextHref, {
      headers: { 'Accept': 'application/json', 'User-Agent': 'lawb-soundcloud-worker' },
    }).then((r) => r.json());
    const collection = Array.isArray(page?.collection) ? page.collection : [];
    for (const item of collection) {
      const t = item?.track;
      if (!t || t.kind !== 'track' || !t.id || !t.permalink_url) continue;
      let progressive = null;
      const trans = t.media?.transcodings || [];
      for (const tr of trans) {
        if (tr?.format?.protocol === 'progressive' && tr.url) {
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
    }
    nextHref = page?.next_href ? `${page.next_href}&client_id=${encodeURIComponent(clientId)}` : null;
  }

  return json(200, { profileUrl, fetchedAt: Date.now(), tracks }, {
    'Cache-Control': 'public, max-age=0, s-maxage=900, stale-while-revalidate=900',
  });
}

async function handleStream(transcodingUrlRaw, profileUrl) {
  const parsed = safeUrl(transcodingUrlRaw);
  if (!parsed || parsed.protocol !== 'https:' || parsed.hostname !== 'api-v2.soundcloud.com') {
    return json(400, { error: 'Invalid transcodingUrl host' });
  }
  const url = new URL(parsed.toString());
  const clientId = await extractApiClientId(profileUrl);
  url.searchParams.set('client_id', clientId);
  const res = await fetch(url.toString(), {
    headers: { 'Accept': 'application/json', 'User-Agent': 'lawb-soundcloud-worker' },
  });
  if (!res.ok) return json(502, { error: 'SoundCloud API error', status: res.status });
  const data = await res.json();
  if (!data?.url) return json(502, { error: 'SoundCloud stream response missing url' });
  return json(200, { url: data.url }, {
    'Cache-Control': 'public, max-age=0, s-maxage=60, stale-while-revalidate=60',
  });
}

export default {
  async fetch(request) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: { ...CORS, 'Access-Control-Max-Age': '86400' } });
    }
    if (request.method !== 'GET') {
      return json(405, { error: 'Method not allowed' });
    }

    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, '') || '/';
    const params = Object.fromEntries(url.searchParams);

    try {
      if (path === '/soundcloud-likes' || path === '/.netlify/functions/soundcloud-likes') {
        const profileUrl = params.profileUrl || 'https://soundcloud.com/companioncube143';
        return await handleLikes(profileUrl);
      }
      if (path === '/soundcloud-stream' || path === '/.netlify/functions/soundcloud-stream') {
        const transcodingUrl = params.transcodingUrl;
        const profileUrl = params.profileUrl || 'https://soundcloud.com/companioncube143';
        if (!transcodingUrl) return json(400, { error: 'Missing transcodingUrl' });
        return await handleStream(transcodingUrl, profileUrl);
      }
      return json(404, { error: 'Not found' });
    } catch (err) {
      return json(500, { error: 'Failed', message: err?.message || String(err) });
    }
  },
};
