import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { SoundCloudTrack } from '../utils/soundcloud';
import { fetchSoundCloudLikedTracks, getSoundCloudProfileUrl, resolveSoundCloudProgressiveStreamUrl } from '../utils/soundcloud';

type LawbAudioState = {
  isReady: boolean;
  isLoading: boolean;
  isPlaying: boolean;
  error: string | null;
  currentTrack: SoundCloudTrack | null;
  currentTimeSec: number;
  durationSec: number;
  volume: number; // 0..1
  shuffleEnabled: boolean;
  showMiniPlayer: boolean;
  queueSize: number;
};

type LawbAudioActions = {
  togglePlay: () => Promise<void>;
  play: () => Promise<void>;
  pause: () => void;
  next: () => Promise<void>;
  prev: () => Promise<void>;
  setVolume: (v: number) => void;
  toggleShuffle: () => void;
  toggleMiniPlayer: () => void;
  ensureQueueLoaded: () => Promise<void>;
};

type LawbAudioContextValue = {
  state: LawbAudioState;
  actions: LawbAudioActions;
};

const LawbAudioContext = createContext<LawbAudioContextValue | undefined>(undefined);

const LS_KEYS = {
  shuffle: 'lawb_audio_shuffle',
  showMiniPlayer: 'lawb_audio_show_mini_player',
  volume: 'lawb_audio_volume',
  lastTrackId: 'lawb_audio_last_track_id',
} as const;

function clamp01(v: number): number {
  if (Number.isNaN(v)) return 1;
  return Math.min(1, Math.max(0, v));
}

function tryReadBool(key: string, fallback: boolean): boolean {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return raw === 'true';
  } catch {
    return fallback;
  }
}

function tryReadNumber(key: string, fallback: number): number {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    const n = Number(raw);
    return Number.isFinite(n) ? n : fallback;
  } catch {
    return fallback;
  }
}

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export const LawbAudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [queue, setQueue] = useState<SoundCloudTrack[]>([]);
  const [order, setOrder] = useState<number[]>([]); // indices into queue
  const [orderPos, setOrderPos] = useState<number>(0);

  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [currentTimeSec, setCurrentTimeSec] = useState(0);
  const [durationSec, setDurationSec] = useState(0);
  const [volume, setVolumeState] = useState(() => clamp01(tryReadNumber(LS_KEYS.volume, 0.8)));
  const [shuffleEnabled, setShuffleEnabled] = useState(() => tryReadBool(LS_KEYS.shuffle, true));
  const [showMiniPlayer, setShowMiniPlayer] = useState(() => tryReadBool(LS_KEYS.showMiniPlayer, false));

  const currentTrack = useMemo(() => {
    if (!queue.length || !order.length) return null;
    const queueIdx = order[orderPos];
    return queue[queueIdx] ?? null;
  }, [queue, order, orderPos]);

  // Init audio element once.
  useEffect(() => {
    const a = new Audio();
    a.preload = 'none';
    a.crossOrigin = 'anonymous';
    a.volume = volume;
    audioRef.current = a;

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onTime = () => setCurrentTimeSec(a.currentTime || 0);
    const onDur = () => setDurationSec(Number.isFinite(a.duration) ? a.duration : 0);
    const onEnded = () => {
      // Fire and forget; state will update from events.
      void next();
    };
    const onError = () => {
      // Keep message simple; browser error objects aren't consistent.
      setError('Audio playback error. Trying next track.');
      void next();
    };

    a.addEventListener('play', onPlay);
    a.addEventListener('pause', onPause);
    a.addEventListener('timeupdate', onTime);
    a.addEventListener('durationchange', onDur);
    a.addEventListener('ended', onEnded);
    a.addEventListener('error', onError);

    setIsReady(true);

    return () => {
      a.pause();
      a.src = '';
      a.removeEventListener('play', onPlay);
      a.removeEventListener('pause', onPause);
      a.removeEventListener('timeupdate', onTime);
      a.removeEventListener('durationchange', onDur);
      a.removeEventListener('ended', onEnded);
      a.removeEventListener('error', onError);
      audioRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist prefs.
  useEffect(() => {
    try { localStorage.setItem(LS_KEYS.shuffle, String(shuffleEnabled)); } catch {}
  }, [shuffleEnabled]);
  useEffect(() => {
    try { localStorage.setItem(LS_KEYS.showMiniPlayer, String(showMiniPlayer)); } catch {}
  }, [showMiniPlayer]);
  useEffect(() => {
    try { localStorage.setItem(LS_KEYS.volume, String(volume)); } catch {}
  }, [volume]);
  useEffect(() => {
    if (!currentTrack?.id) return;
    try { localStorage.setItem(LS_KEYS.lastTrackId, String(currentTrack.id)); } catch {}
  }, [currentTrack?.id]);

  const rebuildOrder = useCallback((nextQueue: SoundCloudTrack[], keepTrackId?: number | null) => {
    const base = nextQueue.map((_, idx) => idx);
    const ordered = shuffleEnabled ? shuffleArray(base) : base;

    // If we can, keep current track at the same logical position (pos 0).
    if (keepTrackId != null) {
      const keepIdx = nextQueue.findIndex((t) => t.id === keepTrackId);
      if (keepIdx >= 0) {
        const filtered = ordered.filter((i) => i !== keepIdx);
        filtered.unshift(keepIdx);
        setOrder(filtered);
        setOrderPos(0);
        return;
      }
    }

    setOrder(ordered);
    setOrderPos(0);
  }, [shuffleEnabled]);

  const ensureQueueLoaded = useCallback(async () => {
    if (queue.length) return;
    setIsLoading(true);
    setError(null);
    try {
      const profileUrl = getSoundCloudProfileUrl();
      const res = await fetchSoundCloudLikedTracks(profileUrl);
      const tracks = (res.tracks || []).filter((t) => !!t?.permalink_url);
      setQueue(tracks);

      // Prefer last track if it exists (nice continuity).
      let lastId: number | null = null;
      try {
        const raw = localStorage.getItem(LS_KEYS.lastTrackId);
        if (raw) lastId = Number(raw);
        if (!Number.isFinite(lastId)) lastId = null;
      } catch {}

      rebuildOrder(tracks, lastId);
    } catch (e: any) {
      setError(e?.message || 'Failed to load SoundCloud likes');
      throw e;
    } finally {
      setIsLoading(false);
    }
  }, [queue.length, rebuildOrder]);

  const playTrack = useCallback(async (track: SoundCloudTrack) => {
    const a = audioRef.current;
    if (!a) return;
    setError(null);

    if (!track.progressive_transcoding_url) {
      throw new Error('Track has no playable stream (missing progressive transcoding).');
    }

    setIsLoading(true);
    try {
      const streamUrl = await resolveSoundCloudProgressiveStreamUrl(track.progressive_transcoding_url);
      a.src = streamUrl;
      a.volume = volume;
      await a.play();
    } finally {
      setIsLoading(false);
    }
  }, [volume]);

  const play = useCallback(async () => {
    const a = audioRef.current;
    if (!a) return;
    setError(null);

    // If we already have a src, just resume.
    if (a.src) {
      await a.play();
      return;
    }

    await ensureQueueLoaded();
    if (!currentTrack) throw new Error('No tracks available to play');
    await playTrack(currentTrack);
  }, [ensureQueueLoaded, currentTrack, playTrack]);

  const pause = useCallback(() => {
    const a = audioRef.current;
    if (!a) return;
    a.pause();
  }, []);

  const togglePlay = useCallback(async () => {
    const a = audioRef.current;
    if (!a) return;
    if (!a.paused) {
      a.pause();
      return;
    }
    await play();
  }, [play]);

  const next = useCallback(async () => {
    if (!queue.length) {
      await ensureQueueLoaded();
    }
    if (!order.length) return;
    const nextPos = (orderPos + 1) % order.length;
    setOrderPos(nextPos);
    const nextTrack = queue[order[nextPos]];
    if (nextTrack) {
      try {
        await playTrack(nextTrack);
      } catch (e: any) {
        setError(e?.message || 'Failed to play next track');
      }
    }
  }, [queue, order, orderPos, ensureQueueLoaded, playTrack]);

  const prev = useCallback(async () => {
    const a = audioRef.current;
    if (a && a.currentTime > 3) {
      a.currentTime = 0;
      return;
    }
    if (!queue.length) {
      await ensureQueueLoaded();
    }
    if (!order.length) return;
    const prevPos = (orderPos - 1 + order.length) % order.length;
    setOrderPos(prevPos);
    const prevTrack = queue[order[prevPos]];
    if (prevTrack) {
      try {
        await playTrack(prevTrack);
      } catch (e: any) {
        setError(e?.message || 'Failed to play previous track');
      }
    }
  }, [queue, order, orderPos, ensureQueueLoaded, playTrack]);

  const setVolume = useCallback((v: number) => {
    const vv = clamp01(v);
    setVolumeState(vv);
    const a = audioRef.current;
    if (a) a.volume = vv;
  }, []);

  const toggleShuffle = useCallback(() => {
    setShuffleEnabled((prev) => !prev);
    // Rebuild order while keeping current track, so toggling feels stable.
    setOrder((prevOrder) => {
      const keep = currentTrack?.id ?? null;
      const next = shuffleEnabled ? queue.map((_, idx) => idx) : shuffleArray(queue.map((_, idx) => idx));
      if (keep != null) {
        const keepIdx = queue.findIndex((t) => t.id === keep);
        if (keepIdx >= 0) {
          const filtered = next.filter((i) => i !== keepIdx);
          filtered.unshift(keepIdx);
          setOrderPos(0);
          return filtered;
        }
      }
      setOrderPos(0);
      return next;
    });
  }, [queue, currentTrack?.id, shuffleEnabled]);

  const toggleMiniPlayer = useCallback(() => {
    setShowMiniPlayer((prev) => !prev);
  }, []);

  const value = useMemo<LawbAudioContextValue>(() => ({
    state: {
      isReady,
      isLoading,
      isPlaying,
      error,
      currentTrack,
      currentTimeSec,
      durationSec,
      volume,
      shuffleEnabled,
      showMiniPlayer,
      queueSize: queue.length,
    },
    actions: {
      togglePlay,
      play,
      pause,
      next,
      prev,
      setVolume,
      toggleShuffle,
      toggleMiniPlayer,
      ensureQueueLoaded,
    },
  }), [
    isReady,
    isLoading,
    isPlaying,
    error,
    currentTrack,
    currentTimeSec,
    durationSec,
    volume,
    shuffleEnabled,
    showMiniPlayer,
    queue.length,
    togglePlay,
    play,
    pause,
    next,
    prev,
    setVolume,
    toggleShuffle,
    toggleMiniPlayer,
    ensureQueueLoaded,
  ]);

  return (
    <LawbAudioContext.Provider value={value}>
      {children}
    </LawbAudioContext.Provider>
  );
};

export const useLawbAudio = (): LawbAudioContextValue => {
  const ctx = useContext(LawbAudioContext);
  if (!ctx) {
    // Fail soft so we don't crash old pages if provider isn't mounted.
    return {
      state: {
        isReady: false,
        isLoading: false,
        isPlaying: false,
        error: null,
        currentTrack: null,
        currentTimeSec: 0,
        durationSec: 0,
        volume: 1,
        shuffleEnabled: true,
        showMiniPlayer: false,
        queueSize: 0,
      },
      actions: {
        togglePlay: async () => {},
        play: async () => {},
        pause: () => {},
        next: async () => {},
        prev: async () => {},
        setVolume: () => {},
        toggleShuffle: () => {},
        toggleMiniPlayer: () => {},
        ensureQueueLoaded: async () => {},
      },
    };
  }
  return ctx;
};

