export type SoundCloudTrackUser = {
  username: string;
  permalink_url?: string;
};

export type SoundCloudTrack = {
  id: number;
  title: string;
  permalink_url: string;
  artwork_url?: string | null;
  duration_ms?: number;
  user?: SoundCloudTrackUser;
  /**
   * SoundCloud API v2 transcoding URL for a progressive stream.
   * Not directly playable; must be resolved server-side.
   */
  progressive_transcoding_url?: string | null;
};

export type SoundCloudLikesResponse = {
  profileUrl: string;
  fetchedAt: number;
  tracks: SoundCloudTrack[];
};

const DEFAULT_PROFILE_URL = 'https://soundcloud.com/companioncube143';

function getSoundCloudApiBase(): string {
  const fromEnv = (import.meta as any)?.env?.VITE_SOUNDCLOUD_API_BASE as string | undefined;
  const envBase = (fromEnv && fromEnv.trim()) ? fromEnv.trim() : '';
  if (envBase) return envBase;
  try {
    const qp = new URLSearchParams(window.location.search).get('apiBase');
    if (qp && qp.trim()) return qp.trim();
  } catch {
    // ignore and fall back
  }
  return window.location.origin;
}

export const getSoundCloudProfileUrl = (): string => {
  // Vite env (optional). Keep a sane default so prod doesn't break if env isn't set.
  const fromEnv = (import.meta as any)?.env?.VITE_SOUNDCLOUD_PROFILE_URL as string | undefined;
  return (fromEnv && fromEnv.trim()) ? fromEnv.trim() : DEFAULT_PROFILE_URL;
};

export async function fetchSoundCloudLikedTracks(profileUrl: string = getSoundCloudProfileUrl()): Promise<SoundCloudLikesResponse> {
  const base = getSoundCloudApiBase();
  const path = base.includes('workers.dev') ? '/soundcloud-likes' : '/.netlify/functions/soundcloud-likes';
  const url = new URL(path, base);
  url.searchParams.set('profileUrl', profileUrl);

  const res = await fetch(url.toString(), {
    method: 'GET',
    headers: { 'Accept': 'application/json' },
  });
  if (!res.ok) {
    throw new Error(`soundcloud-likes failed: ${res.status} ${res.statusText}`);
  }
  const data = (await res.json()) as SoundCloudLikesResponse;
  if (!data || !Array.isArray((data as any).tracks)) {
    throw new Error('soundcloud-likes returned invalid payload');
  }
  return data;
}

// Cache resolved stream URLs + dedupe in-flight requests to avoid Netlify function storms.
const streamUrlCache = new Map<string, { url: string; ts: number }>();
const inFlight = new Map<string, Promise<string>>();
const STREAM_CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

export async function resolveSoundCloudProgressiveStreamUrl(transcodingUrl: string, profileUrl: string = getSoundCloudProfileUrl()): Promise<string> {
  const cacheKey = `${transcodingUrl}|${profileUrl}`;

  // Return cached result if still valid
  const cached = streamUrlCache.get(cacheKey);
  if (cached && Date.now() - cached.ts < STREAM_CACHE_TTL_MS) {
    return cached.url;
  }

  // Dedupe: if same request already in flight, wait for it instead of firing another
  const existing = inFlight.get(cacheKey);
  if (existing) return existing;

  const promise = (async () => {
    try {
      const base = getSoundCloudApiBase();
      const path = base.includes('workers.dev') ? '/soundcloud-stream' : '/.netlify/functions/soundcloud-stream';
      const url = new URL(path, base);
      url.searchParams.set('transcodingUrl', transcodingUrl);
      url.searchParams.set('profileUrl', profileUrl);

      const res = await fetch(url.toString(), {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
      });
      if (!res.ok) {
        throw new Error(`soundcloud-stream failed: ${res.status} ${res.statusText}`);
      }
      const data = (await res.json()) as { url?: string };
      if (!data?.url) throw new Error('soundcloud-stream returned no url');
      streamUrlCache.set(cacheKey, { url: data.url, ts: Date.now() });
      return data.url;
    } finally {
      inFlight.delete(cacheKey);
    }
  })();

  inFlight.set(cacheKey, promise);
  return promise;
}

