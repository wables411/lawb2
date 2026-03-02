/**
 * Client-side cache for fetch requests to reduce Netlify function invocations.
 * Caches responses by URL for a short TTL. Used for alchemy-nft and other proxy calls.
 */

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

interface CacheEntry {
  data: unknown;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry>();

function getCacheKey(url: string): string {
  return url;
}

export async function cachedFetch(url: string, init?: RequestInit): Promise<Response> {
  const key = getCacheKey(url);
  const now = Date.now();
  const entry = cache.get(key);

  if (entry && entry.expiresAt > now) {
    return new Response(JSON.stringify(entry.data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const response = await fetch(url, init);
  if (response.ok && response.headers.get('content-type')?.includes('application/json')) {
    const data = await response.clone().json();
    cache.set(key, {
      data,
      expiresAt: now + CACHE_TTL_MS,
    });
  }
  return response;
}

/** Clear cache (e.g. after mint, when user expects fresh data) */
export function clearFetchCache(): void {
  cache.clear();
}
