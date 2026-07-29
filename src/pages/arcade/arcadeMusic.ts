import { getAudioBus } from './arcadeSounds';

/**
 * Reef Run soundtrack — 80s oceanic-adventure chiptune, SYNTHESIZED at runtime.
 *
 * Same deal as the SFX: no audio files, so it adds nothing to the download or the hosting
 * bill, and both builds (lawb.xyz + the radbro.fun ZIP) get it for free. Two looping tracks in
 * D minor sharing one chord progression (Dm – Bb – F – C), so the menu and the run feel like
 * the same world: the menu version is slow and sparse, the gameplay version adds a driving
 * 16th bass, hats and a lead hook.
 *
 * Scheduling uses the standard lookahead pattern (a timer that queues notes slightly into the
 * future against the audio clock) rather than firing notes from a timer directly — timers drift
 * and would make the music stutter, especially under WebGL load.
 */

type TrackName = 'menu' | 'play';

/** MIDI note → Hz. */
function hz(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

/** Dm – Bb – F – C. `root` is the bass note; `triad` feeds the arpeggio and pad. */
const PROGRESSION = [
  { root: 50, triad: [50, 53, 57] }, // Dm
  { root: 46, triad: [46, 50, 53] }, // Bb
  { root: 41, triad: [41, 45, 48] }, // F
  { root: 48, triad: [48, 52, 55] }, // C
] as const;

const STEPS_PER_BAR = 16; // 16th notes
const BARS = 4;
const TOTAL_STEPS = STEPS_PER_BAR * BARS;

/** Bass hits within a bar (16th indices). Syncopated so it drives without being a machine gun. */
const BASS_STEPS = [0, 3, 6, 8, 11, 14];

/** Lead melody: [absolute step, midi note, length in steps]. D minor pentatonic. */
const LEAD_PLAY: Array<[number, number, number]> = [
  [0, 74, 3], [4, 72, 2], [7, 69, 3], [12, 72, 4],
  [16, 72, 3], [20, 70, 2], [23, 65, 3], [28, 69, 4],
  [32, 69, 3], [36, 72, 2], [39, 74, 3], [44, 77, 4],
  [48, 76, 3], [52, 74, 2], [55, 72, 3], [60, 69, 6],
];

/** Menu: far sparser — a phrase per bar, leaving room for the ambience bed. */
const LEAD_MENU: Array<[number, number, number]> = [
  [0, 62, 8], [10, 65, 5],
  [16, 69, 8], [26, 65, 5],
  [32, 60, 8], [42, 64, 5],
  [48, 67, 8], [58, 62, 5],
];

type TrackDef = {
  bpm: number;
  lead: Array<[number, number, number]>;
  /** 16th-step interval for the arpeggio (2 = 8ths, 4 = quarters). */
  arpEvery: number;
  bass: boolean;
  hats: boolean;
  leadGain: number;
};

const TRACKS: Record<TrackName, TrackDef> = {
  menu: { bpm: 96, lead: LEAD_MENU, arpEvery: 4, bass: false, hats: false, leadGain: 0.1 },
  play: { bpm: 132, lead: LEAD_PLAY, arpEvery: 2, bass: true, hats: true, leadGain: 0.13 },
};

const LOOKAHEAD_MS = 25;
const SCHEDULE_AHEAD_SEC = 0.12;

let timer: number | null = null;
let current: TrackName | null = null;
let step = 0;
let nextNoteTime = 0;

/** Sustained chord pad, retriggered per bar. */
function pad(ctx: AudioContext, out: GainNode, notes: readonly number[], at: number, dur: number): void {
  for (const n of notes) {
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    // Slight detune per voice = chorus-y width without extra nodes.
    osc.frequency.value = hz(n);
    osc.detune.value = (Math.random() - 0.5) * 9;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(0.05, at + 0.35); // slow swell
    g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    osc.connect(g);
    g.connect(out);
    osc.start(at);
    osc.stop(at + dur + 0.05);
  }
}

function bassNote(ctx: AudioContext, out: GainNode, midi: number, at: number): void {
  const osc = ctx.createOscillator();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(hz(midi), at);
  const f = ctx.createBiquadFilter();
  f.type = 'lowpass';
  f.frequency.setValueAtTime(900, at);
  f.frequency.exponentialRampToValueAtTime(320, at + 0.16);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, at);
  g.gain.exponentialRampToValueAtTime(0.24, at + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, at + 0.2);
  osc.connect(f);
  f.connect(g);
  g.connect(out);
  osc.start(at);
  osc.stop(at + 0.26);
}

function arpNote(ctx: AudioContext, out: GainNode, midi: number, at: number): void {
  const osc = ctx.createOscillator();
  osc.type = 'square';
  osc.frequency.value = hz(midi);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, at);
  g.gain.exponentialRampToValueAtTime(0.055, at + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, at + 0.13);
  osc.connect(g);
  g.connect(out);
  osc.start(at);
  osc.stop(at + 0.18);
}

/** Two detuned saws = the classic 80s lead. */
function leadNote(ctx: AudioContext, out: GainNode, midi: number, at: number, dur: number, gain: number): void {
  for (const det of [-6, 6]) {
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.value = hz(midi);
    osc.detune.value = det;
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.setValueAtTime(2400, at);
    f.frequency.exponentialRampToValueAtTime(1200, at + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(gain, at + 0.05);
    g.gain.setValueAtTime(gain, at + dur * 0.6);
    g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    osc.connect(f);
    f.connect(g);
    g.connect(out);
    osc.start(at);
    osc.stop(at + dur + 0.05);
  }
}

function hat(ctx: AudioContext, out: GainNode, noise: AudioBuffer, at: number, accent: boolean): void {
  const src = ctx.createBufferSource();
  src.buffer = noise;
  src.loop = true;
  const f = ctx.createBiquadFilter();
  f.type = 'highpass';
  f.frequency.value = 7000;
  const g = ctx.createGain();
  const peak = accent ? 0.05 : 0.024;
  g.gain.setValueAtTime(0.0001, at);
  g.gain.exponentialRampToValueAtTime(peak, at + 0.004);
  g.gain.exponentialRampToValueAtTime(0.0001, at + (accent ? 0.09 : 0.05));
  src.connect(f);
  f.connect(g);
  g.connect(out);
  src.start(at);
  src.stop(at + 0.14);
}

function scheduleStep(
  ctx: AudioContext,
  out: GainNode,
  noise: AudioBuffer,
  def: TrackDef,
  s: number,
  at: number,
): void {
  const bar = Math.floor(s / STEPS_PER_BAR);
  const inBar = s % STEPS_PER_BAR;
  const chord = PROGRESSION[bar % PROGRESSION.length]!;
  const secPerStep = 60 / def.bpm / 4;

  // Pad swells in at the top of each bar.
  if (inBar === 0) {
    pad(ctx, out, chord.triad.map((n) => n + 12), at, secPerStep * STEPS_PER_BAR * 0.98);
  }

  if (def.bass && BASS_STEPS.includes(inBar)) {
    // Drop an octave on the off-beats for that 80s bounce.
    bassNote(ctx, out, inBar === 8 || inBar === 14 ? chord.root - 12 : chord.root, at);
  }

  if (inBar % def.arpEvery === 0) {
    const idx = Math.floor(inBar / def.arpEvery);
    const tone = chord.triad[idx % chord.triad.length]! + 12;
    arpNote(ctx, out, tone, at);
  }

  if (def.hats && inBar % 2 === 0) {
    hat(ctx, out, noise, at, inBar % 8 === 4);
  }

  for (const [ls, note, len] of def.lead) {
    if (ls === s) leadNote(ctx, out, note, at, secPerStep * len, def.leadGain);
  }
}

function tick(): void {
  const bus = getAudioBus();
  if (!bus || !current) return;
  const { ctx, music, noise } = bus;
  // Before the gesture unlock the context is suspended; just idle until it starts, then
  // re-anchor so the loop doesn't try to catch up on a pile of missed steps.
  if (ctx.state !== 'running') {
    nextNoteTime = 0;
    return;
  }
  const def = TRACKS[current];
  const secPerStep = 60 / def.bpm / 4;
  if (nextNoteTime === 0) nextNoteTime = ctx.currentTime + 0.06;

  while (nextNoteTime < ctx.currentTime + SCHEDULE_AHEAD_SEC) {
    scheduleStep(ctx, music, noise, def, step, nextNoteTime);
    nextNoteTime += secPerStep;
    step = (step + 1) % TOTAL_STEPS;
  }
}

export const reefMusic = {
  /** Switch tracks (no-op if already playing that one). Safe to call before audio unlocks. */
  setTrack(name: TrackName): void {
    if (current === name && timer !== null) return;
    current = name;
    step = 0;
    nextNoteTime = 0;
    if (timer === null && typeof window !== 'undefined') {
      timer = window.setInterval(tick, LOOKAHEAD_MS);
    }
  },

  stop(): void {
    current = null;
    step = 0;
    nextNoteTime = 0;
    if (timer !== null) {
      window.clearInterval(timer);
      timer = null;
    }
  },
};
