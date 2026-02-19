import React, { useEffect, useMemo, useState } from 'react';
import { createUseStyles } from 'react-jss';
import Popup from './Popup';
import { useLawbAudio } from '../contexts/LawbAudioContext';

const FALLBACK_ART_URL = '/images/lawb-logo.png';
const MASCOT_URL = '/assets/asciilawb.GIF';
const LS_VIZ_MODE = 'lawbamp_viz_mode';
const LS_BEAT_STROBE = 'lawbamp_beat_strobe';
type VizMode = 'bars' | 'ascii';

type StyleProps = { pct: number; isFullscreen: boolean; uiScale: number };

const useStyles = createUseStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    padding: 10,
    boxSizing: 'border-box',
    fontFamily: 'MS Sans Serif, Arial, sans-serif',
  },
  heroRow: {
    display: 'flex',
    gap: 10,
    alignItems: 'stretch',
    marginBottom: 10,
  },
  artBox: {
    width: (p: StyleProps) => (p.isFullscreen ? 64 : 96),
    height: (p: StyleProps) => (p.isFullscreen ? 64 : 96),
    border: '2px inset #fff',
    background: '#000',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    flex: '0 0 auto',
  },
  artImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    imageRendering: 'auto',
  },
  rightBox: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    minWidth: 0,
  },
  topRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  title: {
    flex: 1,
    border: '2px inset #fff',
    background: '#000',
    color: '#00ff66',
    padding: '6px 8px',
    fontFamily: 'monospace',
    fontSize: 12,
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
  },
  miniBadges: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    flex: '0 0 auto',
  },
  mascot: {
    width: 26,
    height: 26,
    border: '2px outset #fff',
    background: '#c0c0c0',
    imageRendering: 'pixelated',
  },
  btnRow: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  btn: {
    border: '2px outset #fff',
    background: '#c0c0c0',
    color: '#000',
    padding: (p: StyleProps) => `${Math.max(6, Math.round(6 * p.uiScale))}px ${Math.max(8, Math.round(10 * p.uiScale))}px`,
    cursor: 'pointer',
    fontSize: (p: StyleProps) => Math.max(12, Math.min(16, Math.round(12 * p.uiScale))),
    lineHeight: '1.1',
    '&:active': {
      border: '2px inset #c0c0c0',
    },
    '&:disabled': {
      opacity: 0.6,
      cursor: 'not-allowed',
    },
  },
  slimBtn: {
    padding: (p: StyleProps) => `${Math.max(6, Math.round(6 * p.uiScale))}px ${Math.max(6, Math.round(8 * p.uiScale))}px`,
    minWidth: 40,
    textAlign: 'center',
  },
  meter: {
    border: '2px inset #fff',
    background: '#0f0f0f',
    height: 10,
    width: '100%',
    position: 'relative',
    marginBottom: 10,
  },
  meterFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    background: 'linear-gradient(90deg, #00ff66, #00b7ff)',
    width: (p: StyleProps) => `${p.pct}%`,
  },
  vizWrap: {
    // In fullscreen, the viz becomes the main content.
    flex: (p: StyleProps) => (p.isFullscreen ? '1 1 auto' : '0 0 auto'),
    minHeight: (p: StyleProps) => (p.isFullscreen ? 260 : 84),
    marginBottom: 10,
  },
  eq: {
    border: '2px inset #fff',
    background: '#0b0b0b',
    height: '100%',
    width: '100%',
    display: 'flex',
    alignItems: 'flex-end',
    gap: 2,
    padding: 4,
    boxSizing: 'border-box',
    overflow: 'hidden',
  },
  eqBar: {
    flex: '1 1 0',
    minWidth: 0,
    background: 'linear-gradient(180deg, #00ff66 0%, #00b7ff 70%, #0b0b0b 100%)',
    transition: 'height 60ms linear',
  },
  // If real analyser is blocked (CORS), we still want "webamp vibes".
  eqFallback: {
    '& $eqBar': {
      height: '35%',
      animation: '$wobble 900ms ease-in-out infinite',
    },
    '& $eqBar:nth-child(2n)': { animationDuration: '740ms' },
    '& $eqBar:nth-child(3n)': { animationDuration: '1030ms' },
    '& $eqBar:nth-child(5n)': { animationDuration: '620ms' },
  },
  '@keyframes wobble': {
    '0%': { height: '10%' },
    '25%': { height: '70%' },
    '50%': { height: '25%' },
    '75%': { height: '90%' },
    '100%': { height: '15%' },
  },
  asciiViz: {
    border: '2px inset #fff',
    background: '#000',
    color: '#00ff66',
    height: '100%',
    width: '100%',
    padding: '6px 8px',
    boxSizing: 'border-box',
    overflow: 'hidden',
    fontFamily: 'monospace',
    fontSize: (p: StyleProps) => (p.isFullscreen ? 14 : 11),
    lineHeight: (p: StyleProps) => (p.isFullscreen ? '16px' : '12px'),
    whiteSpace: 'pre',
    userSelect: 'none',
  },
  strobe: {
    // Intentionally loud; short-lived per beat.
    filter: 'invert(1) hue-rotate(180deg) saturate(1.5)',
    boxShadow: '0 0 0 2px rgba(0, 255, 102, 0.6), 0 0 18px rgba(0, 183, 255, 0.35)',
  },
  metaRow: {
    display: 'flex',
    gap: 10,
    alignItems: 'center',
    marginTop: (p: StyleProps) => (p.isFullscreen ? 0 : 'auto'),
  },
  label: {
    fontSize: 12,
    color: '#000',
    userSelect: 'none',
  },
  slider: {
    flex: 1,
  },
  smallNote: {
    fontSize: 11,
    color: '#333',
    marginTop: 8,
  },
});

function fmtTime(sec: number): string {
  if (!Number.isFinite(sec) || sec <= 0) return '0:00';
  const s = Math.floor(sec);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, '0')}`;
}

function beefUpArtworkUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  // SoundCloud art URLs often come as "...-large.jpg". Swap to a nicer size if possible.
  return url.replace('-large.', '-t300x300.');
}

function clamp01(v: number): number {
  if (!Number.isFinite(v)) return 0;
  return Math.max(0, Math.min(1, v));
}

function fmtBars(eq: number[], bands = 16): number[] {
  const src = (eq && eq.length ? eq : Array.from({ length: bands }, () => 0)).slice(0, bands);
  return src.map((v) => clamp01(v));
}

function resampleBars(bars: number[], targetCount: number): number[] {
  if (targetCount <= 0) return [];
  if (!bars.length) return Array.from({ length: targetCount }, () => 0);
  if (bars.length === targetCount) return bars.slice();
  const out: number[] = [];
  for (let i = 0; i < targetCount; i++) {
    const t = (i / Math.max(1, targetCount - 1)) * (bars.length - 1);
    const a = Math.floor(t);
    const b = Math.min(bars.length - 1, a + 1);
    const f = t - a;
    const v = (bars[a] ?? 0) * (1 - f) + (bars[b] ?? 0) * f;
    out.push(clamp01(v));
  }
  return out;
}

function buildOceanEqAscii(opts: {
  eqBars: number[];
  tick: number;
  cols: number;
  rows: number;
  beat: boolean;
}): string {
  // Oceanic equalizer scene with lobster emojis + anti-surveillance flavor.
  // Note: emojis are user-requested; alignment varies by font.
  const { eqBars, tick, cols, rows, beat } = opts;
  const w = Math.max(24, Math.min(140, Math.floor(cols)));
  const h = Math.max(10, Math.min(60, Math.floor(rows)));

  const energy = eqBars.reduce((a, b) => a + b, 0) / Math.max(1, eqBars.length); // 0..1
  const lvl = Math.round(energy * 99);

  const mulberry32 = (seed: number) => () => {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const rand = mulberry32(0x0CE4A + (tick * 733)); // stable-ish motion

  const grid: string[][] = Array.from({ length: h }, () => Array.from({ length: w }, () => ' '));

  const put = (x: number, y: number, ch: string) => {
    if (y < 0 || y >= h) return;
    if (x < 0 || x >= w) return;
    grid[y]![x] = ch;
  };

  const waterY = Math.max(2, Math.min(h - 6, Math.floor(h * 0.22)));

  // Header line (kept readable, not random).
  const header = `LAWBAMP  LVL:${String(lvl).padStart(2, '0')}  NO CCTV`;
  for (let i = 0; i < Math.min(w, header.length); i++) put(i, 0, header[i]!);
  put(0, 0, '🦞');
  put(Math.max(0, w - 2), 0, '🔒');

  // Sky: satellites / drones / "eye" hints.
  const skyY = 1;
  const satX = (tick * 2) % Math.max(1, w - 2);
  put(satX, skyY, '🛰️');
  if (energy > 0.55) put((satX + 13) % Math.max(1, w - 2), skyY, '👁️');
  put(w - 2, skyY, '🔒');

  const colsBars = resampleBars(eqBars, w);

  // Water surface: moving waves (modulated per column by EQ).
  for (let x = 0; x < w; x++) {
    const v = colsBars[x] ?? 0;
    const phase = (x * 0.22) + (tick * 0.35);
    const amp = 0.7 + (energy * 1.6) + (v * 2.4);
    const dy = Math.round(Math.sin(phase) * amp);
    const y = waterY + dy;
    put(x, y, '~');
    if (energy > 0.35 && rand() < 0.02) put(x, y - 1, '*'); // tiny spray
  }

  // Second surface layer for more motion/texture.
  for (let x = 0; x < w; x++) {
    const v = colsBars[x] ?? 0;
    const phase = (x * 0.14) + (tick * 0.22);
    const amp = 0.4 + (energy * 0.9) + (v * 1.2);
    const dy = Math.round(Math.cos(phase) * amp);
    const y = waterY + dy + 1;
    if (y > 1 && y < h - 3) put(x, y, rand() < 0.15 ? '=' : '-');
  }

  // Sonar sweep (anti-surveillance vs surveillance tug-of-war).
  const sweepX = (tick * 3) % Math.max(1, w);
  for (let y = waterY + 2; y < h - 3; y++) {
    if (rand() < 0.25) put(sweepX, y, '|');
  }
  if (beat) {
    put(sweepX, waterY - 1, '🦞');
  }

  // Equalizer as kelp "bars" rising from ocean floor.
  const floorY = h - 2;
  for (let x = 0; x < w; x++) {
    const v = colsBars[x] ?? 0;
    const kelpMax = Math.max(3, (h - waterY - 4));
    const kelpH = Math.max(1, Math.round(v * kelpMax));
    for (let k = 0; k < kelpH; k++) {
      const y = floorY - k;
      const ch = k % 3 === 0 ? '|' : k % 3 === 1 ? ':' : ';';
      put(x, y, ch);
    }
    // A lobster pops up when the beat hits (or energy is high).
    const peakY = floorY - kelpH - 1;
    if (beat && v > 0.72 && peakY > waterY) {
      put(x, peakY, '🦞');
    }
  }

  // Bubbles drifting upward (animated by tick).
  const bubbleCount = Math.max(3, Math.round((w / 16) * (0.8 + energy)));
  for (let i = 0; i < bubbleCount; i++) {
    const bx = Math.floor(rand() * w);
    const by = waterY + 1 + ((tick + (i * 17)) % Math.max(1, h - waterY - 3));
    const y = (h - 3) - (by - (waterY + 1));
    if (y > waterY + 1 && y < h - 3) put(bx, y, rand() < 0.5 ? 'o' : '.');
  }

  // Little fish / data packets moving with the current.
  const fishCount = Math.max(2, Math.round(w / 30));
  for (let i = 0; i < fishCount; i++) {
    const dir = i % 2 === 0 ? 1 : -1;
    const fx = dir > 0
      ? ((tick * 2) + (i * 19)) % Math.max(1, w - 4)
      : (w - 4) - (((tick * 2) + (i * 19)) % Math.max(1, w - 4));
    const fy = waterY + 3 + ((i * 5) % Math.max(1, h - waterY - 7));
    const isPacket = energy > 0.5 && rand() < 0.4;
    const fish = isPacket ? (dir > 0 ? '>>>' : '<<<') : (dir > 0 ? '><>' : '<><');
    for (let k = 0; k < fish.length; k++) put(fx + k, fy, fish[k]!);
  }

  // Ocean floor line + "encrypted seabed" footer.
  for (let x = 0; x < w; x++) put(x, h - 1, x % 2 === 0 ? '_' : '-');
  const footer = energy > 0.45 ? ':: SEA ENCRYPTED ::' : ':: ENCRYPT THE OCEAN ::';
  const footerStart = Math.max(0, Math.floor((w - footer.length) / 2));
  for (let i = 0; i < Math.min(w - footerStart, footer.length); i++) put(footerStart + i, h - 2, footer[i]!);
  put(0, h - 2, '🦞');

  return grid.map((row) => row.join('')).join('\n');
}

const LawbMiniPlayer: React.FC = () => {
  const { state, actions } = useLawbAudio();
  const pct = useMemo(() => {
    if (!state.durationSec) return 0;
    return Math.max(0, Math.min(100, (state.currentTimeSec / state.durationSec) * 100));
  }, [state.currentTimeSec, state.durationSec]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const [uiScale, setUiScale] = useState(1);
  const classes = useStyles({ pct, isFullscreen, uiScale });

  // Keep control text legible across popup sizes by scaling up (never down).
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    if (typeof ResizeObserver === 'undefined') return;

    const recompute = () => {
      const r = el.getBoundingClientRect();
      const baseW = 380; // matches initialSize width
      const raw = r.width / baseW;
      const next = Math.max(1, Math.min(1.35, raw)); // cap around 16px button text
      setUiScale(next);
    };

    recompute();
    const ro = new ResizeObserver(() => recompute());
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const [vizMode, setVizMode] = useState<VizMode>(() => {
    try {
      const raw = localStorage.getItem(LS_VIZ_MODE);
      return raw === 'ascii' ? 'ascii' : 'bars';
    } catch {
      return 'bars';
    }
  });
  useEffect(() => {
    try { localStorage.setItem(LS_VIZ_MODE, vizMode); } catch {}
  }, [vizMode]);

  const [beatStrobeEnabled, setBeatStrobeEnabled] = useState<boolean>(() => {
    try {
      const raw = localStorage.getItem(LS_BEAT_STROBE);
      if (raw === null) return true;
      return raw === 'true';
    } catch {
      return true;
    }
  });
  useEffect(() => {
    try { localStorage.setItem(LS_BEAT_STROBE, String(beatStrobeEnabled)); } catch {}
  }, [beatStrobeEnabled]);

  useEffect(() => {
    const onFs = () => {
      const el = document.fullscreenElement;
      setIsFullscreen(!!el && (el as HTMLElement).dataset?.popupId === 'lawb-mini-player');
    };
    document.addEventListener('fullscreenchange', onFs);
    onFs();
    return () => document.removeEventListener('fullscreenchange', onFs);
  }, []);

  // Drive ASCII motion even when EQ data is flat/blocked.
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (vizMode !== 'ascii') return;
    if (!state.isPlaying) return;
    const t = window.setInterval(() => setTick((x) => (x + 1) % 10_000), 120);
    return () => window.clearInterval(t);
  }, [vizMode, state.isPlaying]);

  const title = state.currentTrack
    ? `${state.currentTrack.user?.username ? `${state.currentTrack.user.username} - ` : ''}${state.currentTrack.title}`
    : 'Lawb Player';

  const artUrl = beefUpArtworkUrl(state.currentTrack?.artwork_url) || FALLBACK_ART_URL;
  const eq = state.eqBands && state.eqBands.length ? state.eqBands : Array.from({ length: 16 }, () => 0);
  const eqLooksDead = state.isPlaying && eq.every((v) => v <= 0.01);
  const eqBars = useMemo(() => fmtBars(eq, 16), [eq]);

  // Beat strobe: detect quick energy jumps; flash for ~90ms.
  const [strobeOn, setStrobeOn] = useState(false);
  const lastEnergyRef = React.useRef(0);
  const lastBeatMsRef = React.useRef(0);
  useEffect(() => {
    if (!beatStrobeEnabled) return;
    if (!state.isPlaying) return;
    const now = Date.now();
    const energy = eqBars.reduce((a, b) => a + b, 0) / Math.max(1, eqBars.length);
    const prev = lastEnergyRef.current;
    lastEnergyRef.current = energy;

    // Heuristic: require a rise and an absolute energy floor.
    const delta = energy - prev;
    const minGapMs = 180;
    const energyFloor = 0.22;
    const deltaFloor = 0.12;
    if (energy > energyFloor && delta > deltaFloor && (now - lastBeatMsRef.current) > minGapMs) {
      lastBeatMsRef.current = now;
      setStrobeOn(true);
      const t = window.setTimeout(() => setStrobeOn(false), 90);
      return () => window.clearTimeout(t);
    }
  }, [eqBars, beatStrobeEnabled, state.isPlaying]);

  const barsForDisplay = useMemo(() => resampleBars(eqBars, isFullscreen ? 96 : 32), [eqBars, isFullscreen]);
  const ascii = useMemo(() => buildOceanEqAscii({
    eqBars,
    tick,
    cols: isFullscreen ? 128 : 64,
    rows: isFullscreen ? 40 : 16,
    beat: beatStrobeEnabled && strobeOn,
  }), [beatStrobeEnabled, eqBars, isFullscreen, strobeOn, tick]);

  const toggleFullscreen = async () => {
    const el = document.querySelector('[data-popup-id="lawb-mini-player"]') as HTMLElement | null;
    if (!el) return;
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
        return;
      }
      await el.requestFullscreen();
    } catch {
      // Fullscreen can fail due to permissions or browser limitations; ignore.
    }
  };

  return (
    <Popup
      id="lawb-mini-player"
      isOpen={state.showMiniPlayer}
      onClose={() => actions.toggleMiniPlayer()}
      onMinimize={() => actions.toggleMiniPlayer()}
      title="LAWBAMP"
      initialPosition={{ x: 20, y: 80 }}
      initialSize={{ width: 380, height: 240 }}
      zIndex={999998}
    >
      <div ref={containerRef} className={classes.container}>
        <div className={classes.heroRow}>
          <div className={classes.artBox} title={state.currentTrack ? 'Track artwork' : 'LAWB'}>
            <img className={classes.artImg} src={artUrl} alt="Artwork" />
          </div>

          <div className={classes.rightBox}>
            <div className={classes.topRow}>
              <div className={classes.title} title={title}>
                {state.currentTrack ? title : 'LAWBAMP 1.0  🦞'}
              </div>
              <div className={classes.miniBadges}>
                <img className={classes.mascot} src={MASCOT_URL} alt="Lawb" title="Lawb" />
              </div>
            </div>
          </div>
        </div>

        <div className={classes.btnRow}>
          <button className={`${classes.btn} ${classes.slimBtn}`} type="button" onClick={() => { void actions.prev(); }} disabled={!state.isReady || state.isLoading}>
            {'<<'}
          </button>
          <button className={`${classes.btn} ${classes.slimBtn}`} type="button" onClick={() => { void actions.togglePlay(); }} disabled={!state.isReady || state.isLoading}>
            {state.isPlaying ? 'Pause' : 'Play'}
          </button>
          <button className={`${classes.btn} ${classes.slimBtn}`} type="button" onClick={() => { void actions.next(); }} disabled={!state.isReady || state.isLoading}>
            {'>>'}
          </button>

          <button className={classes.btn} type="button" onClick={() => actions.toggleShuffle()} disabled={!state.isReady}>
            {state.shuffleEnabled ? 'Shuffle:ON' : 'Shuffle:OFF'}
          </button>

          <button
            className={classes.btn}
            type="button"
            onClick={() => setVizMode((m) => (m === 'bars' ? 'ascii' : 'bars'))}
            title="Toggle visualization"
            disabled={!state.isReady}
          >
            {vizMode === 'ascii' ? 'VIZ:ASCII' : 'VIZ:BARS'}
          </button>

          <button
            className={classes.btn}
            type="button"
            onClick={() => setBeatStrobeEnabled((v) => !v)}
            title="Beat strobe (flash on beats)"
            disabled={!state.isReady}
          >
            {beatStrobeEnabled ? 'BEAT:ON' : 'BEAT:OFF'}
          </button>

          <button
            className={classes.btn}
            type="button"
            onClick={() => { void toggleFullscreen(); }}
            title="Fullscreen"
            disabled={!state.isReady}
          >
            {isFullscreen ? 'FS:EXIT' : 'FS:ON'}
          </button>

          {state.currentTrack?.permalink_url && (
            <a
              className={classes.btn}
              href={state.currentTrack.permalink_url}
              target="_blank"
              rel="noreferrer"
              title="Open on SoundCloud"
              style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}
            >
              SC
            </a>
          )}
        </div>

        <div className={classes.meter} title={`${fmtTime(state.currentTimeSec)} / ${fmtTime(state.durationSec)}`}>
          <div className={classes.meterFill} />
        </div>

        <div className={classes.vizWrap}>
          {vizMode === 'ascii' ? (
            <div
              className={`${classes.asciiViz} ${strobeOn ? classes.strobe : ''}`}
              title="ASCII Ocean EQ (toggle via VIZ button)"
            >
              {ascii}
            </div>
          ) : (
            <div
              className={`${classes.eq} ${eqLooksDead ? classes.eqFallback : ''} ${strobeOn ? classes.strobe : ''}`}
              title="Equalizer"
            >
              {barsForDisplay.map((v, i) => (
                <div
                  key={i}
                  className={classes.eqBar}
                  style={eqLooksDead ? undefined : { height: `${Math.max(4, Math.round(v * 100))}%` }}
                />
              ))}
            </div>
          )}
        </div>

        <div className={classes.metaRow}>
          <div className={classes.label}>Vol</div>
          <input
            className={classes.slider}
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={state.volume}
            onChange={(e) => actions.setVolume(Number(e.target.value))}
          />
          <div className={classes.label}>{fmtTime(state.currentTimeSec)}</div>
        </div>

        {state.error && (
          <div className={classes.smallNote} style={{ color: '#a10000' }}>
            {state.error}
          </div>
        )}
        {!state.currentTrack && (
          <div className={classes.smallNote}>
            Click Play to load SoundCloud likes and start shuffling.
          </div>
        )}
      </div>
    </Popup>
  );
};

export default LawbMiniPlayer;

