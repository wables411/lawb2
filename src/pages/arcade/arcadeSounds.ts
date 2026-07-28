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
let master: GainNode | null = null;
let muted = false;
let ambienceNodes: { src: AudioBufferSourceNode; gain: GainNode; lfo: OscillatorNode } | null = null;
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
    master = ctx.createGain();
    master.gain.value = muted ? 0 : 0.5;
    // Underwater character: everything muffled through one low-pass.
    const lowpass = ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.value = 2600;
    master.connect(lowpass);
    lowpass.connect(ctx.destination);
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

/** A few random rising bubble pops — the underwater seasoning. */
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
  for (let i = 0; i < count; i++) {
    const t = at + Math.random() * spreadSec;
    const f0 = lowHz + Math.random() * (highHz - lowHz);
    tone(c, out, { type: 'sine', from: f0, to: f0 * 1.7, at: t, dur: 0.06 + Math.random() * 0.05, gain: gain * (0.6 + Math.random() * 0.4) });
  }
}

export const reefSfx = {
  /** Call from a user-gesture path (run start) so autoplay policy unlocks the context. */
  resume(): void {
    const c = getCtx();
    if (c && c.state === 'suspended') void c.resume().catch(() => {});
  },

  setMuted(m: boolean): void {
    muted = m;
    if (master) master.gain.value = m ? 0 : 0.5;
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
        case 'coin':
          tone(c, master, { type: 'sine', from: 920, at: t, dur: 0.07, gain: 0.2 });
          tone(c, master, { type: 'sine', from: 1380, at: t + 0.07, dur: 0.1, gain: 0.16 });
          break;
        case 'trash':
          tone(c, master, { type: 'triangle', from: 240, to: 170, at: t, dur: 0.12, gain: 0.28 });
          noise(c, master, { at: t, dur: 0.09, gain: 0.1, from: 900, to: 300 });
          bubbles(c, master, t + 0.04, 2, 0.12, 0.08);
          break;
        case 'cheese':
          tone(c, master, { type: 'sawtooth', from: 320, to: 980, at: t, dur: 0.22, gain: 0.14 });
          tone(c, master, { type: 'sine', from: 640, to: 1960, at: t + 0.03, dur: 0.2, gain: 0.1 });
          break;
        case 'air':
          bubbles(c, master, t, 6, 0.34, 0.16, 380, 900);
          noise(c, master, { at: t, dur: 0.35, gain: 0.07, from: 500, to: 1400 });
          break;
        case 'peptides':
          bubbles(c, master, t, 4, 0.25, 0.12, 260, 620);
          tone(c, master, { type: 'sine', from: 520, to: 780, at: t + 0.1, dur: 0.18, gain: 0.14 });
          break;
        case 'jelly':
          tone(c, master, { type: 'square', from: 130, at: t, dur: 0.22, gain: 0.12 });
          tone(c, master, { type: 'square', from: 137, at: t, dur: 0.22, gain: 0.1 });
          noise(c, master, { at: t, dur: 0.2, gain: 0.08, filterType: 'bandpass', from: 2200, q: 3 });
          break;
        case 'puffer':
          noise(c, master, { at: t, dur: 0.2, gain: 0.22, from: 1400, to: 260 });
          tone(c, master, { type: 'triangle', from: 480, to: 190, at: t, dur: 0.18, gain: 0.16 });
          break;
        case 'mine':
          tone(c, master, { type: 'sine', from: 150, to: 42, at: t, dur: 0.5, gain: 0.42 });
          noise(c, master, { at: t, dur: 0.45, gain: 0.3, from: 1800, to: 90 });
          bubbles(c, master, t + 0.12, 5, 0.4, 0.1);
          break;
        case 'crash':
          tone(c, master, { type: 'sine', from: 130, to: 36, at: t, dur: 0.6, gain: 0.5 });
          noise(c, master, { at: t, dur: 0.55, gain: 0.34, from: 1500, to: 70 });
          bubbles(c, master, t + 0.1, 9, 0.6, 0.13);
          break;
        case 'suffocate':
          bubbles(c, master, t, 10, 1.5, 0.12, 300, 760);
          tone(c, master, { type: 'sine', from: 220, to: 90, at: t + 0.2, dur: 1.2, gain: 0.1 });
          break;
        case 'whoosh':
          noise(c, master, { at: t, dur: 0.28, gain: 0.16, filterType: 'bandpass', from: 500, to: 2400, q: 1.2 });
          break;
        case 'lane':
          noise(c, master, { at: t, dur: 0.09, gain: 0.07, filterType: 'bandpass', from: 900, to: 1800, q: 1 });
          break;
        case 'ui':
          tone(c, master, { type: 'sine', from: 660, at: t, dur: 0.06, gain: 0.12 });
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
      ambienceNodes = { src, gain: g, lfo };
    } catch {
      ambienceNodes = null;
    }
  },

  stopAmbience(): void {
    if (!ambienceNodes) return;
    try {
      ambienceNodes.src.stop();
      ambienceNodes.lfo.stop();
    } catch {
      /* ignore */
    }
    ambienceNodes = null;
  },
};
