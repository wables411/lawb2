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

export const getSoundCloudProfileUrl = (): string => {
  // Vite env (optional). Keep a sane default so prod doesn't break if env isn't set.
  const fromEnv = (import.meta as any)?.env?.VITE_SOUNDCLOUD_PROFILE_URL as string | undefined;
  return (fromEnv && fromEnv.trim()) ? fromEnv.trim() : DEFAULT_PROFILE_URL;
};

export async function fetchSoundCloudLikedTracks(profileUrl: string = getSoundCloudProfileUrl()): Promise<SoundCloudLikesResponse> {
  const url = new URL('/.netlify/functions/soundcloud-likes', window.location.origin);
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

export async function resolveSoundCloudProgressiveStreamUrl(transcodingUrl: string, profileUrl: string = getSoundCloudProfileUrl()): Promise<string> {
  const url = new URL('/.netlify/functions/soundcloud-stream', window.location.origin);
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
  return data.url;
}

