import React, { useEffect, useMemo, useState } from 'react';
import { createUseStyles } from 'react-jss';
import Popup from './Popup';
import { useLawbAudio } from '../contexts/LawbAudioContext';

const FALLBACK_ART_URL = '/images/lawb-logo.png';
const MASCOT_URL = '/assets/asciilawb.GIF';
const LS_VIZ_MODE = 'lawbamp_viz_mode';
const LS_BEAT_STROBE = 'lawbamp_beat_strobe';
type VizMode = 'bars' | 'ascii';

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
    width: 96,
    height: 96,
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
    gap: 6,
    marginBottom: 10,
  },
  btn: {
    border: '2px outset #fff',
    background: '#c0c0c0',
    color: '#000',
    padding: '6px 10px',
    cursor: 'pointer',
    fontSize: 12,
    '&:active': {
      border: '2px inset #c0c0c0',
    },
    '&:disabled': {
      opacity: 0.6,
      cursor: 'not-allowed',
    },
  },
  slimBtn: {
    padding: '6px 8px',
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
    width: (p: { pct: number }) => `${p.pct}%`,
  },
  eq: {
    border: '2px inset #fff',
    background: '#0b0b0b',
    height: 40,
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
    height: 84,
    padding: '6px 8px',
    boxSizing: 'border-box',
    overflow: 'hidden',
    fontFamily: 'monospace',
    fontSize: 11,
    lineHeight: '12px',
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
    marginTop: 'auto',
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

function buildLawbsterAscii(eqBars: number[], tick: number): string {
  // Neochibi lobster techno matrix anti-surveillance-state core.
  // Note: includes emojis by user request; width alignment will vary by font.
  const width = 34;

  const heights = eqBars.map((v) => Math.max(0, Math.min(8, Math.round(v * 8))));
  const energy = heights.reduce((a, b) => a + b, 0) / Math.max(1, heights.length * 8); // 0..1
  const lvl = Math.round(energy * 99);

  // Deterministic pseudo-random based on tick so it "moves" predictably.
  const mulberry32 = (seed: number) => () => {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const rand = mulberry32(0xC1A0B + (tick * 1337));

  const glyphs = '01LAWB$#@*+=-.:';
  const density = 0.25 + (energy * 0.55); // 0.25..0.8
  const glitchChance = 0.05 + (energy * 0.15);

  const matrixLine = (salt: number): string => {
    const r = mulberry32(0x5EED + salt + (tick * 97));
    let s = '';
    for (let i = 0; i < width; i++) {
      const p = r();
      if (p > density) { s += ' '; continue; }
      const g = glyphs[Math.floor(r() * glyphs.length)] || '0';
      s += g;
    }
    // occasional "glitch injection"
    if (r() < glitchChance) {
      const pos = Math.floor(r() * Math.max(1, width - 6));
      const stamp = r() < 0.5 ? '🛰️' : '🔒';
      s = s.slice(0, pos) + stamp + s.slice(pos + 2);
    }
    return s;
  };

  const slogans = [
    'NO EYES NO SPIES',
    'ANTI-SURVEILLANCE CORE',
    'ENCRYPT THE OCEAN',
    'LAWBS IN THE WIRES',
    'DISABLE THE 👁️',
    'SEALED SIGNAL 🔒',
    'MATRIX LOBSTER MODE 🦞',
  ];
  const slogan = slogans[Math.floor(rand() * slogans.length)] || slogans[0];

  const wavePhase = tick % width;
  const waveChars = Array.from({ length: width }, (_, i) => {
    const d = Math.abs(i - wavePhase);
    if (d === 0) return '#';
    if (d === 1) return '=';
    if (d === 2) return '-';
    return (rand() < 0.02 && energy > 0.35) ? '*' : ' ';
  }).join('');

  const eye = energy > 0.65 ? '◉' : energy > 0.35 ? 'o' : '.';
  const blush = energy > 0.5 ? '^' : "'";
  const mouth = energy > 0.55 ? '_' : '.';
  const clawL = energy > 0.7 ? '≋≋' : energy > 0.4 ? '≡' : '-';
  const clawR = energy > 0.7 ? '≋≋' : energy > 0.4 ? '≡' : '-';
  const heart = energy > 0.75 ? '♥' : energy > 0.55 ? '<3' : '  ';

  const lines: string[] = [];
  lines.push(`NEOCHIBI🦞 LAWBAMP  [${String(lvl).padStart(2, '0')}]`.padEnd(width));
  lines.push(matrixLine(11));
  lines.push(matrixLine(22));
  lines.push(`${slogan}`.slice(0, width).padEnd(width));
  lines.push(waveChars);

  // Spectrum (6 rows tall, compact)
  for (let row = 6; row >= 1; row--) {
    let s = '';
    for (let i = 0; i < 16; i++) {
      const h = heights[i] ?? 0;
      s += h >= row ? '|' : '.';
      s += i % 2 === 1 ? ' ' : '';
    }
    lines.push(s.trimEnd().padEnd(width));
  }

  // Chibi lobster "face" footer (techno cute)
  const wob = tick % 3;
  const pad = wob === 0 ? '' : wob === 1 ? ' ' : '  ';
  lines.push(`${pad}${clawL}  ( ${eye}${blush}${mouth}${blush}${eye} )  ${clawR}   ${heart} 🛰️🔒`.slice(0, width).padEnd(width));
  lines.push(`${pad}  \\___/  /__LAWB__\\  \\___/   :: NO CCTV ::`.slice(0, width).padEnd(width));

  return lines.slice(0, 11).join('\n');
}

const LawbMiniPlayer: React.FC = () => {
  const { state, actions } = useLawbAudio();
  const pct = useMemo(() => {
    if (!state.durationSec) return 0;
    return Math.max(0, Math.min(100, (state.currentTimeSec / state.durationSec) * 100));
  }, [state.currentTimeSec, state.durationSec]);
  const classes = useStyles({ pct });

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

  const [isFullscreen, setIsFullscreen] = useState(false);
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
  const ascii = useMemo(() => buildLawbsterAscii(eqBars, tick), [eqBars, tick]);

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
      <div className={classes.container}>
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

            {vizMode === 'ascii' ? (
              <div className={`${classes.asciiViz} ${strobeOn ? classes.strobe : ''}`} title="ASCII Visualizer (toggle via VIZ button)">
                {ascii}
              </div>
            ) : (
              <div className={`${classes.eq} ${eqLooksDead ? classes.eqFallback : ''} ${strobeOn ? classes.strobe : ''}`} title="Equalizer">
                {eqBars.slice(0, 16).map((v, i) => (
                  <div
                    key={i}
                    className={classes.eqBar}
                    style={eqLooksDead ? undefined : { height: `${Math.max(4, Math.round(v * 100))}%` }}
                  />
                ))}
              </div>
            )}
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

