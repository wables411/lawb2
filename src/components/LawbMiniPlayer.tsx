import React, { useEffect, useMemo, useState } from 'react';
import { createUseStyles } from 'react-jss';
import Popup from './Popup';
import { useLawbAudio } from '../contexts/LawbAudioContext';

const FALLBACK_ART_URL = '/images/lawb-logo.png';
const MASCOT_URL = '/assets/asciilawb.GIF';
const LS_VIZ_MODE = 'lawbamp_viz_mode';
const LS_BEAT_STROBE = 'lawbamp_beat_strobe';
type VizMode = 'bars' | 'ascii';

type StyleProps = { pct: number; isFullscreen: boolean; isMobile: boolean; uiScale: number };

const useStyles = createUseStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    padding: (p: StyleProps) => (p.isMobile ? 8 : 10),
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
    minHeight: (p: StyleProps) => (p.isMobile ? 40 : 32),
    touchAction: 'manipulation',
    WebkitTapHighlightColor: 'transparent',
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
    minWidth: (p: StyleProps) => (p.isMobile ? 44 : 40),
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
    // When not fullscreen, give it an actual height; otherwise `height: 100%` children can
    // end up measuring 0px after toggling fullscreen on some browsers/sizes.
    height: (p: StyleProps) => (p.isFullscreen ? 'auto' : 84),
    minHeight: (p: StyleProps) => (p.isFullscreen ? 260 : 84),
    marginBottom: 10,
    display: 'flex',
    alignItems: 'stretch',
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
    padding: 0,
    boxSizing: 'border-box',
    overflow: 'hidden',
    fontFamily: 'monospace',
    fontSize: (p: StyleProps) => (p.isFullscreen ? (p.isMobile ? 12 : 14) : 11),
    lineHeight: (p: StyleProps) => (p.isFullscreen ? (p.isMobile ? '14px' : '16px') : '12px'),
    whiteSpace: 'pre',
    userSelect: 'none',
    display: 'flex',
    alignItems: 'stretch',
  },
  asciiCanvas: {
    width: '100%',
    height: '100%',
    display: 'block',
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

type Bubble = { x: number; y: number; vy: number; ch: string; life: number };

const LawbMiniPlayer: React.FC = () => {
  const { state, actions } = useLawbAudio();
  const pct = useMemo(() => {
    if (!state.durationSec) return 0;
    return Math.max(0, Math.min(100, (state.currentTimeSec / state.durationSec) * 100));
  }, [state.currentTimeSec, state.durationSec]);
  // Native fullscreen (Fullscreen API) is flaky / unavailable on some mobile browsers.
  // We support a "pseudo fullscreen" mode that maximizes the viz within the popup.
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPseudoFullscreen, setIsPseudoFullscreen] = useState(false);
  const [isMobile, setIsMobile] = useState(() => (typeof window !== 'undefined' ? window.innerWidth <= 768 : false));
  const effectiveFullscreen = isFullscreen || isPseudoFullscreen;
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const [uiScale, setUiScale] = useState(1);
  const classes = useStyles({ pct, isFullscreen: effectiveFullscreen, isMobile, uiScale });

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', onResize);
    onResize();
    return () => window.removeEventListener('resize', onResize);
  }, []);

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
      const isMine = !!el && (el as HTMLElement).dataset?.popupId === 'lawb-mini-player';
      setIsFullscreen(isMine);
      if (isMine) setIsPseudoFullscreen(false); // prefer native fullscreen when active
    };
    document.addEventListener('fullscreenchange', onFs);
    onFs();
    return () => document.removeEventListener('fullscreenchange', onFs);
  }, []);
  useEffect(() => {
    // If the window closes while pseudo-fullscreen is on, reset it.
    if (!state.showMiniPlayer && isPseudoFullscreen) setIsPseudoFullscreen(false);
  }, [state.showMiniPlayer, isPseudoFullscreen]);

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

  const barsForDisplay = useMemo(
    () => resampleBars(eqBars, effectiveFullscreen ? (isMobile ? 64 : 96) : (isMobile ? 24 : 32)),
    [eqBars, effectiveFullscreen, isMobile]
  );

  // Canvas ASCII visualizer state (more advanced animation without React re-renders).
  const supportsAsciiCanvas = useMemo(() => {
    try {
      if (typeof document === 'undefined') return false;
      const c = document.createElement('canvas');
      return !!c.getContext && !!c.getContext('2d');
    } catch {
      return false;
    }
  }, []);
  const asciiHostRef = React.useRef<HTMLDivElement | null>(null);
  const asciiCanvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const asciiGridRef = React.useRef<string[][]>([]);
  const asciiDimsRef = React.useRef({
    cols: 0,
    rows: 0,
    cellW: 10,
    cellH: 14,
    padX: 10,
    padY: 10,
    pxW: 0, // CSS pixels
    pxH: 0, // CSS pixels
  });
  const bubblesRef = React.useRef<Bubble[]>([]);
  const smoothBarsRef = React.useRef<number[]>(Array.from({ length: 96 }, () => 0));
  const rafRef = React.useRef<number | null>(null);
  const lastFrameMsRef = React.useRef<number>(0);

  const eqBarsRef = React.useRef<number[]>(eqBars);
  const beatRef = React.useRef<boolean>(false);
  const playingRef = React.useRef<boolean>(false);
  useEffect(() => { eqBarsRef.current = eqBars; }, [eqBars]);
  useEffect(() => { beatRef.current = beatStrobeEnabled && strobeOn; }, [beatStrobeEnabled, strobeOn]);
  useEffect(() => { playingRef.current = state.isPlaying; }, [state.isPlaying]);

  // Resize canvas + (re)build grid to match available pixels.
  useEffect(() => {
    const host = asciiHostRef.current;
    const canvas = asciiCanvasRef.current;
    if (!host || !canvas) return;
    if (typeof ResizeObserver === 'undefined') return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const recompute = () => {
      const r = host.getBoundingClientRect();
      const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
      const w = Math.max(1, Math.floor(r.width));
      const h = Math.max(1, Math.floor(r.height));
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const fontPx = effectiveFullscreen ? (isMobile ? 12 : 15) : (isMobile ? 11 : 12);
      // Include emoji-capable fallbacks so 🦞 / 🔒 render reliably (some monospace stacks omit emoji glyphs).
      ctx.font = `${fontPx}px ui-monospace, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace, "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji"`;
      ctx.textBaseline = 'top';

      const m = ctx.measureText('M');
      const cellW = Math.max(6, Math.floor(m.width));
      const cellH = Math.max(10, Math.floor(fontPx * 1.15));
      const padX = isMobile ? 6 : 10;
      const padY = isMobile ? 6 : 10;
      const cols = Math.max(24, Math.floor((w - padX * 2) / cellW));
      const rows = Math.max(10, Math.floor((h - padY * 2) / cellH));

      asciiDimsRef.current = { cols, rows, cellW, cellH, padX, padY, pxW: w, pxH: h };
      asciiGridRef.current = Array.from({ length: rows }, () => Array.from({ length: cols }, () => ' '));
      // Keep bubbles within bounds on resize.
      bubblesRef.current = bubblesRef.current.filter((b) => b.x >= 0 && b.x < cols && b.y >= 0 && b.y < rows);
    };

    recompute();
    const ro = new ResizeObserver(() => recompute());
    ro.observe(host);
    return () => ro.disconnect();
  }, [effectiveFullscreen, isMobile, vizMode]);

  useEffect(() => {
    if (vizMode !== 'ascii') return;
    if (!supportsAsciiCanvas) return;
    const canvas = asciiCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = (nowMs: number) => {
      rafRef.current = requestAnimationFrame(draw);

      // Throttle: 30fps target for mobile/low-end.
      if (nowMs - lastFrameMsRef.current < (isMobile ? 50 : 33)) return;
      lastFrameMsRef.current = nowMs;

      const { cols, rows, cellW, cellH, padX, padY, pxW, pxH } = asciiDimsRef.current;
      const grid = asciiGridRef.current;
      if (!cols || !rows || grid.length !== rows) return;

      // Background (slight trail for "water smear" feel).
      const beat = beatRef.current;
      ctx.fillStyle = beat ? 'rgba(0, 20, 10, 0.55)' : 'rgba(0, 0, 0, 0.55)';
      // Use measured CSS pixel size; `clientWidth/Height` can briefly be 0 when exiting fullscreen.
      ctx.fillRect(0, 0, pxW || 1, pxH || 1);

      // Clear grid.
      for (let y = 0; y < rows; y++) grid[y]!.fill(' ');

      const bars = eqBarsRef.current;
      const colBars = resampleBars(bars, cols);
      // Smooth bars so it feels watery.
      const smooth = smoothBarsRef.current;
      if (smooth.length !== cols) smoothBarsRef.current = Array.from({ length: cols }, () => 0);
      const smooth2 = smoothBarsRef.current;
      for (let x = 0; x < cols; x++) {
        const target = colBars[x] ?? 0;
        const prev = smooth2[x] ?? 0;
        const next = prev * 0.82 + target * 0.18;
        smooth2[x] = next;
      }

      const energy = smooth2.reduce((a, b) => a + b, 0) / Math.max(1, smooth2.length);
      const lvl = Math.round(energy * 99);
      const t = nowMs / 1000;

      const waterY = Math.max(2, Math.floor(rows * 0.22));
      const floorY = rows - 2;

      // Header + footer.
      const header = `LAWBAMP LVL:${String(lvl).padStart(2, '0')}  NO CCTV`;
      for (let i = 0; i < Math.min(cols, header.length); i++) grid[0]![i] = header[i]!;
      grid[0]![0] = '🦞';
      if (cols > 3) grid[0]![cols - 2] = '🔒';
      const footer = energy > 0.45 ? ':: SEA ENCRYPTED ::' : ':: ENCRYPT THE OCEAN ::';
      const footerStart = Math.max(0, Math.floor((cols - footer.length) / 2));
      for (let i = 0; i < Math.min(cols - footerStart, footer.length); i++) grid[rows - 2]![footerStart + i] = footer[i]!;

      // Parallax surfaces.
      for (let x = 0; x < cols; x++) {
        const v = smooth2[x] ?? 0;
        const amp1 = 0.6 + energy * 1.6 + v * 2.2;
        const amp2 = 0.3 + energy * 0.9 + v * 1.1;
        const y1 = waterY + Math.round(Math.sin(x * 0.22 + t * 2.1) * amp1);
        const y2 = waterY + 1 + Math.round(Math.cos(x * 0.14 + t * 1.4) * amp2);
        if (y1 > 1 && y1 < rows - 3) grid[y1]![x] = '~';
        if (y2 > 1 && y2 < rows - 3 && grid[y2]![x] === ' ') grid[y2]![x] = (Math.random() < 0.15 ? '=' : '-');
        if (energy > 0.35 && Math.random() < 0.008) {
          const ys = y1 - 1;
          if (ys > 1 && ys < rows - 3) grid[ys]![x] = '*';
        }
      }

      // Sonar sweep.
      const sweepX = Math.floor((t * 18) % Math.max(1, cols));
      for (let y = waterY + 2; y < floorY; y++) {
        if (Math.random() < 0.18) grid[y]![sweepX] = '|';
      }
      if (beat && waterY - 1 > 0) grid[waterY - 1]![sweepX] = '🦞';

      // Kelp EQ bars.
      for (let x = 0; x < cols; x++) {
        const v = smooth2[x] ?? 0;
        const kelpMax = Math.max(3, rows - waterY - 6);
        const kelpH = Math.max(1, Math.round(v * kelpMax));
        for (let k = 0; k < kelpH; k++) {
          const y = floorY - k;
          if (y <= waterY + 1) break;
          grid[y]![x] = k % 3 === 0 ? '|' : k % 3 === 1 ? ':' : ';';
        }
        const peakY = floorY - kelpH - 1;
        if (beat && v > 0.72 && peakY > waterY + 1) grid[peakY]![x] = '🦞';
      }

      // Bubble particles.
      const bubbles = bubblesRef.current;
      const spawn = Math.min(3, Math.round((cols / 90) * (0.5 + energy * 2)));
      for (let i = 0; i < spawn; i++) {
        if (Math.random() < 0.25 + energy * 0.25) {
          bubbles.push({
            x: Math.random() * cols,
            y: floorY - 1,
            vy: 0.35 + Math.random() * 0.6 + energy * 0.4,
            ch: Math.random() < 0.6 ? 'o' : '.',
            life: 3 + Math.random() * 4,
          });
        }
      }
      for (let i = bubbles.length - 1; i >= 0; i--) {
        const b = bubbles[i]!;
        b.y -= b.vy;
        b.x += Math.sin(t * 1.7 + i) * 0.015;
        b.life -= 0.05;
        const bx = Math.floor(b.x);
        const by = Math.floor(b.y);
        if (by > waterY + 2 && by < floorY && bx >= 0 && bx < cols) grid[by]![bx] = b.ch;
        if (b.y < waterY + 2 || b.life <= 0) bubbles.splice(i, 1);
      }

      // Fish / packets.
      const fishCount = Math.max(2, Math.round(cols / 34));
      for (let i = 0; i < fishCount; i++) {
        const dir = i % 2 === 0 ? 1 : -1;
        const base = (t * 10 + i * 7) % Math.max(1, cols - 4);
        const fx = dir > 0 ? Math.floor(base) : (cols - 4) - Math.floor(base);
        const fy = waterY + 4 + (i * 3) % Math.max(1, rows - waterY - 8);
        const isPacket = energy > 0.5 && Math.random() < 0.25;
        const fish = isPacket ? (dir > 0 ? '>>>' : '<<<') : (dir > 0 ? '><>' : '<><');
        for (let k = 0; k < fish.length; k++) {
          const x = fx + k;
          if (x >= 0 && x < cols && fy >= 0 && fy < rows) grid[fy]![x] = fish[k]!;
        }
      }

      // Seabed.
      for (let x = 0; x < cols; x++) grid[rows - 1]![x] = x % 2 === 0 ? '_' : '-';

      // Draw.
      ctx.fillStyle = beat ? '#b9fff0' : (energy > 0.55 ? '#00f0ff' : '#00ff66');
      ctx.font = ctx.font; // keep from resize recompute
      ctx.textBaseline = 'top';
      for (let y = 0; y < rows; y++) {
        const line = grid[y]!.join('');
        ctx.fillText(line, padX, padY + y * cellH);
      }

      // Scanlines overlay.
      ctx.fillStyle = 'rgba(0,0,0,0.12)';
      for (let y = 0; y < (pxH || 1); y += 4) {
        ctx.fillRect(0, y, pxW || 1, 1);
      }

      // If not playing, keep it calmer (but still rendered).
      if (!playingRef.current) {
        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        ctx.fillRect(0, 0, pxW || 1, pxH || 1);
      }
    };

    rafRef.current = requestAnimationFrame(draw);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [isMobile, supportsAsciiCanvas, vizMode]);

  const toggleFullscreen = async () => {
    const el = document.querySelector('[data-popup-id="lawb-mini-player"]') as HTMLElement | null;
    if (!el) return;
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
        return;
      }
      // Mobile browsers (especially iOS Safari) can reject fullscreen requests for arbitrary elements.
      // In that case, we toggle a pseudo-fullscreen mode instead.
      const canNative = !isMobile && typeof el.requestFullscreen === 'function';
      if (canNative) {
        await el.requestFullscreen();
        return;
      }
      setIsPseudoFullscreen((v) => !v);
    } catch {
      // Fullscreen can fail due to permissions or browser limitations; fall back to pseudo-fullscreen.
      setIsPseudoFullscreen((v) => !v);
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
            disabled={state.isLoading}
          >
            {vizMode === 'ascii' ? 'VIZ:ASCII' : 'VIZ:BARS'}
          </button>

          <button
            className={classes.btn}
            type="button"
            onClick={() => setBeatStrobeEnabled((v) => !v)}
            title="Beat strobe (flash on beats)"
            disabled={state.isLoading}
          >
            {beatStrobeEnabled ? 'BEAT:ON' : 'BEAT:OFF'}
          </button>

          <button
            className={classes.btn}
            type="button"
            onClick={() => { void toggleFullscreen(); }}
            title="Fullscreen"
            disabled={state.isLoading}
          >
            {effectiveFullscreen ? 'FS:EXIT' : 'FS:ON'}
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
              ref={asciiHostRef}
            >
              {supportsAsciiCanvas ? (
                <canvas ref={asciiCanvasRef} className={classes.asciiCanvas} />
              ) : (
                <div style={{ padding: 10, color: '#00ff66', fontFamily: 'monospace', fontSize: 12 }}>
                  ASCII mode requires canvas support.
                </div>
              )}
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

