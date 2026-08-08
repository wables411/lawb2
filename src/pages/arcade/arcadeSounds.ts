/**
 * Reef Run sound effects — fully SYNTHESIZED with the Web Audio API.
 *
 * Zero audio files (nothing to download or host — see hosting-cost constraints), a few KB of
 * code, shared by both builds (lawb.xyz arcade + the radbro.fun standalone) because hooks live
 * in ArcadeSceneController. Everything routes through a global low-pass filter so it reads as
 * underwater. Best-effort by design: no AudioContext (old browser, autoplay policy) → silence,
 * never an error. The context unlocks on the first user gesture (run start calls resume()).
 */

type SfxName =
  | 'coin'
  | 'trash'
  | 'cheese'
  | 'air'
  | 'peptides'
  | 'jelly'
  | 'puffer'
  | 'mine'
  | 'crash'
  | 'suffocate'
  | 'whoosh'
  | 'lane'
  | 'ui';

const MUTE_KEY = 'reefSfxMuted';

let ctx: AudioContext | null = null;
/** SFX bus (heavily low-passed = underwater). */
let master: GainNode | null = null;
/** Music bus — gentler filtering so the score stays audible under the SFX muffle. */
let musicBus: GainNode | null = null;
/** Final output; mute lives here so it silences SFX and music together. */
let outGain: GainNode | null = null;
let muted = false;
let ambienceNodes: {
  src: AudioBufferSourceNode;
  gain: GainNode;
  lfo: OscillatorNode;
  drones: OscillatorNode[];
} | null = null;
let noiseBuf: AudioBuffer | null = null;

try {
  muted = window.localStorage.getItem(MUTE_KEY) === '1';
} catch {
  /* storage unavailable (sandboxed iframe) — default unmuted */
}

function getCtx(): AudioContext | null {
  if (ctx) return ctx;
  try {
    const AC =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();

    outGain = ctx.createGain();
    outGain.gain.value = muted ? 0 : 1;
    outGain.connect(ctx.destination);

    // SFX: underwater character — everything muffled through one low-pass.
    master = ctx.createGain();
    master.gain.value = 0.5;
    const lowpass = ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.value = 2600;
    master.connect(lowpass);
    lowpass.connect(outGain);

    // Music: sits under the SFX and keeps more top end, so melodies read as "submerged"
    // rather than smothered.
    musicBus = ctx.createGain();
    musicBus.gain.value = 0.34;
    const musicLp = ctx.createBiquadFilter();
    musicLp.type = 'lowpass';
    musicLp.frequency.value = 5200;
    musicBus.connect(musicLp);
    musicLp.connect(outGain);

    return ctx;
  } catch {
    return null;
  }
}

function getNoiseBuffer(c: AudioContext): AudioBuffer {
  if (noiseBuf && noiseBuf.sampleRate === c.sampleRate) return noiseBuf;
  const len = c.sampleRate * 1.2;
  const buf = c.createBuffer(1, len, c.sampleRate);
  const d = buf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < len; i++) {
    // Brown-ish noise (integrated white) — softer than white, wateriest.
    const white = Math.random() * 2 - 1;
    last = (last + 0.02 * white) / 1.02;
    d[i] = last * 3.5;
  }
  noiseBuf = buf;
  return buf;
}

/** One enveloped oscillator note. */
function tone(
  c: AudioContext,
  out: AudioNode,
  opts: {
    type: OscillatorType;
    from: number;
    to?: number;
    at: number;
    dur: number;
    gain: number;
  },
): void {
  const osc = c.createOscillator();
  osc.type = opts.type;
  osc.frequency.setValueAtTime(opts.from, opts.at);
  if (opts.to !== undefined) osc.frequency.exponentialRampToValueAtTime(Math.max(1, opts.to), opts.at + opts.dur);
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, opts.at);
  g.gain.exponentialRampToValueAtTime(opts.gain, opts.at + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, opts.at + opts.dur);
  osc.connect(g);
  g.connect(out);
  osc.start(opts.at);
  osc.stop(opts.at + opts.dur + 0.05);
}

/** One enveloped noise burst, optionally band/low-passed with a frequency sweep. */
function noise(
  c: AudioContext,
  out: AudioNode,
  opts: {
    at: number;
    dur: number;
    gain: number;
    filterType?: BiquadFilterType;
    from?: number;
    to?: number;
    q?: number;
  },
): void {
  const src = c.createBufferSource();
  src.buffer = getNoiseBuffer(c);
  src.loop = true;
  const f = c.createBiquadFilter();
  f.type = opts.filterType ?? 'lowpass';
  f.frequency.setValueAtTime(opts.from ?? 1200, opts.at);
  if (opts.to !== undefined) f.frequency.exponentialRampToValueAtTime(Math.max(20, opts.to), opts.at + opts.dur);
  if (opts.q !== undefined) f.Q.value = opts.q;
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, opts.at);
  g.gain.exponentialRampToValueAtTime(opts.gain, opts.at + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, opts.at + opts.dur);
  src.connect(f);
  f.connect(g);
  g.connect(out);
  src.start(opts.at);
  src.stop(opts.at + opts.dur + 0.05);
}

/**
 * RemiliaNET-style sound curation: every pitched SFX sits on the SOUNDTRACK's scale —
 * D minor pentatonic (D F G A C), the same lattice as `arcadeMusic.ts` — categorized by
 * UX type: loot/sustain = mid/high scale tones, hazards = low-register D roots (the one
 * deliberately detuned exception is the jellyfish beat), UI = a single high plink.
 * Random collisions of pickups, clicks and music then always harmonize; generative,
 * zero audio files, gamic and meditative.
 */
const hzOf = (midi: number): number => 440 * Math.pow(2, (midi - 69) / 12);
const P = {
  D1: hzOf(26), A1: hzOf(33),
  D2: hzOf(38), G2: hzOf(43), A2: hzOf(45),
  D3: hzOf(50), F3: hzOf(53), G3: hzOf(55), A3: hzOf(57), C4: hzOf(60),
  D4: hzOf(62), F4: hzOf(65), G4: hzOf(67), A4: hzOf(69), C5: hzOf(72),
  D5: hzOf(74), F5: hzOf(77), G5: hzOf(79), A5: hzOf(81), C6: hzOf(84),
  D6: hzOf(86),
} as const;
/** Every pentatonic degree bubbles are allowed to pop on (D minor pentatonic, low→high). */
const PENTA_POOL = [P.D3, P.F3, P.G3, P.A3, P.C4, P.D4, P.F4, P.G4, P.A4, P.C5, P.D5, P.F5, P.G5, P.A5] as const;

/** A few random rising bubble pops — the underwater seasoning, quantized to the scale. */
function bubbles(
  c: AudioContext,
  out: AudioNode,
  at: number,
  count: number,
  spreadSec: number,
  gain: number,
  lowHz = 420,
  highHz = 980,
): void {
  // Pentatonic degrees inside the requested band (fallback: whole pool).
  const pool = PENTA_POOL.filter((f) => f >= lowHz && f <= highHz);
  const notes = pool.length > 0 ? pool : PENTA_POOL;
  for (let i = 0; i < count; i++) {
    const t = at + Math.random() * spreadSec;
    const f0 = notes[Math.floor(Math.random() * notes.length)]!;
    // Octave rise (f0 → 2·f0) so each pop starts AND ends on the scale.
    tone(c, out, { type: 'sine', from: f0, to: f0 * 2, at: t, dur: 0.06 + Math.random() * 0.05, gain: gain * (0.6 + Math.random() * 0.4) });
  }
}

/**
 * Mobile autoplay unlock.
 *
 * iOS/Android only let an AudioContext start from inside a real user gesture, and the check is
 * SYNCHRONOUS — it must happen in the event handler itself. Calling `resume()` from run start
 * was too late: that path runs button click → React state → effect → engine, by which point the
 * gesture no longer counts, so the context stayed suspended and `play()` silently no-opped
 * (mobile had no sound at all). So: latch onto the very first gesture anywhere on the document,
 * create + resume the context there, and kick a silent one-sample buffer, which is what actually
 * flips iOS out of the blocked state. Listeners remove themselves once it's running.
 */
let unlockInstalled = false;

function installUnlock(): void {
  if (unlockInstalled || typeof window === 'undefined') return;
  unlockInstalled = true;

  const unlock = (): void => {
    const c = getCtx();
    if (!c) return teardown();
    // Silent blip inside the gesture — required by iOS; resume() alone is not enough there.
    try {
      const b = c.createBuffer(1, 1, 22050);
      const s = c.createBufferSource();
      s.buffer = b;
      s.connect(c.destination);
      s.start(0);
    } catch {
      /* ignore */
    }
    if (c.state === 'suspended') {
      void c.resume().then(
        () => {
          if (c.state === 'running') teardown();
        },
        () => {},
      );
    } else if (c.state === 'running') {
      teardown();
    }
  };

  const teardown = (): void => {
    for (const ev of ['pointerdown', 'touchend', 'mousedown', 'keydown'] as const) {
      window.removeEventListener(ev, unlock, true);
    }
  };

  for (const ev of ['pointerdown', 'touchend', 'mousedown', 'keydown'] as const) {
    // Capture phase so it fires even when the game stops propagation on its own controls.
    window.addEventListener(ev, unlock, true);
  }
}

installUnlock();

/**
 * Shared audio bus for the music sequencer (`arcadeMusic.ts`). One AudioContext for the whole
 * game: mobile browsers are unreliable with several, and the gesture unlock above only ever
 * unlocks this one. Returns null until audio is available/unlocked.
 */
export function getAudioBus(): { ctx: AudioContext; music: GainNode; noise: AudioBuffer } | null {
  const c = getCtx();
  if (!c || !musicBus) return null;
  return { ctx: c, music: musicBus, noise: getNoiseBuffer(c) };
}

export const reefSfx = {
  /** Call from a user-gesture path (run start) so autoplay policy unlocks the context. */
  resume(): void {
    installUnlock();
    const c = getCtx();
    if (c && c.state === 'suspended') void c.resume().catch(() => {});
  },

  setMuted(m: boolean): void {
    muted = m;
    if (outGain) outGain.gain.value = m ? 0 : 1;
    try {
      window.localStorage.setItem(MUTE_KEY, m ? '1' : '0');
    } catch {
      /* ignore */
    }
  },

  isMuted(): boolean {
    return muted;
  },

  play(name: SfxName): void {
    if (muted) return;
    const c = getCtx();
    if (!c || !master || c.state !== 'running') return;
    const t = c.currentTime;
    try {
      switch (name) {
        // ── Loot: rising pentatonic intervals, high register ──
        case 'coin':
          tone(c, master, { type: 'sine', from: P.A5, at: t, dur: 0.07, gain: 0.2 });
          tone(c, master, { type: 'sine', from: P.D6, at: t + 0.07, dur: 0.1, gain: 0.16 });
          break;
        case 'trash':
          // The mission thunk: G→D root fall, kept woody with the noise thud.
          tone(c, master, { type: 'triangle', from: P.G3, to: P.D3, at: t, dur: 0.12, gain: 0.28 });
          noise(c, master, { at: t, dur: 0.09, gain: 0.1, from: 900, to: 300 });
          bubbles(c, master, t + 0.04, 2, 0.12, 0.08);
          break;
        // ── Buffs/sustain: mid-register scale sweeps ──
        case 'cheese':
          tone(c, master, { type: 'sawtooth', from: P.D4, to: P.A5, at: t, dur: 0.22, gain: 0.14 });
          tone(c, master, { type: 'sine', from: P.D5, to: P.D6, at: t + 0.03, dur: 0.2, gain: 0.1 });
          break;
        case 'air':
          bubbles(c, master, t, 6, 0.34, 0.16, 380, 900);
          noise(c, master, { at: t, dur: 0.35, gain: 0.07, from: 500, to: 1400 });
          break;
        case 'peptides':
          bubbles(c, master, t, 4, 0.25, 0.12, 260, 620);
          tone(c, master, { type: 'sine', from: P.A4, to: P.D5, at: t + 0.1, dur: 0.18, gain: 0.14 });
          break;
        // ── Hazards: low-register D roots; jelly keeps its detuned beat on purpose ──
        case 'jelly':
          tone(c, master, { type: 'square', from: P.D3, at: t, dur: 0.22, gain: 0.12 });
          tone(c, master, { type: 'square', from: P.D3 * 1.045, at: t, dur: 0.22, gain: 0.1 });
          noise(c, master, { at: t, dur: 0.2, gain: 0.08, filterType: 'bandpass', from: 2200, q: 3 });
          break;
        case 'puffer':
          noise(c, master, { at: t, dur: 0.2, gain: 0.22, from: 1400, to: 260 });
          tone(c, master, { type: 'triangle', from: P.G4, to: P.G3, at: t, dur: 0.18, gain: 0.16 });
          break;
        case 'mine':
          tone(c, master, { type: 'sine', from: P.D3, to: P.D1, at: t, dur: 0.5, gain: 0.42 });
          noise(c, master, { at: t, dur: 0.45, gain: 0.3, from: 1800, to: 90 });
          bubbles(c, master, t + 0.12, 5, 0.4, 0.1);
          break;
        case 'crash':
          tone(c, master, { type: 'sine', from: P.D3, to: P.D1, at: t, dur: 0.6, gain: 0.5 });
          noise(c, master, { at: t, dur: 0.55, gain: 0.34, from: 1500, to: 70 });
          bubbles(c, master, t + 0.1, 9, 0.6, 0.13);
          break;
        case 'suffocate':
          bubbles(c, master, t, 10, 1.5, 0.12, 300, 760);
          tone(c, master, { type: 'sine', from: P.A3, to: P.A1, at: t + 0.2, dur: 1.2, gain: 0.1 });
          break;
        // ── Motion: unpitched noise (percussion section — no scale to break) ──
        case 'whoosh':
          noise(c, master, { at: t, dur: 0.28, gain: 0.16, filterType: 'bandpass', from: 500, to: 2400, q: 1.2 });
          break;
        case 'lane':
          noise(c, master, { at: t, dur: 0.09, gain: 0.07, filterType: 'bandpass', from: 900, to: 1800, q: 1 });
          break;
        // ── UI: one high scale plink (menu + console clicks) ──
        case 'ui':
          tone(c, master, { type: 'sine', from: P.D5, at: t, dur: 0.06, gain: 0.12 });
          break;
      }
    } catch {
      /* never let audio break gameplay */
    }
  },

  /** Very quiet looping underwater bed (filtered noise, slow swell). Idempotent. */
  startAmbience(): void {
    if (ambienceNodes) return;
    const c = getCtx();
    if (!c || !master) return;
    try {
      const src = c.createBufferSource();
      src.buffer = getNoiseBuffer(c);
      src.loop = true;
      const f = c.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = 240;
      const g = c.createGain();
      g.gain.value = 0.05;
      // Slow swell so the bed breathes instead of hissing statically.
      const lfo = c.createOscillator();
      lfo.frequency.value = 0.13;
      const lfoGain = c.createGain();
      lfoGain.gain.value = 0.02;
      lfo.connect(lfoGain);
      lfoGain.connect(g.gain);
      src.connect(f);
      f.connect(g);
      g.connect(master);
      src.start();
      lfo.start();
      // Barely-there D root + fifth drone under the noise bed — the ambience hums on the
      // same D-minor-pentatonic lattice as the SFX and score (RemiliaNET-style curation).
      const drones: OscillatorNode[] = [];
      for (const [freq, gainV] of [
        [P.D2, 0.014],
        [P.A2, 0.009],
      ] as const) {
        const osc = c.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = freq;
        const og = c.createGain();
        og.gain.value = gainV;
        osc.connect(og);
        og.connect(master);
        osc.start();
        drones.push(osc);
      }
      ambienceNodes = { src, gain: g, lfo, drones };
    } catch {
      ambienceNodes = null;
    }
  },

  stopAmbience(): void {
    if (!ambienceNodes) return;
    try {
      ambienceNodes.src.stop();
      ambienceNodes.lfo.stop();
      for (const d of ambienceNodes.drones) d.stop();
    } catch {
      /* ignore */
    }
    ambienceNodes = null;
  },
};
