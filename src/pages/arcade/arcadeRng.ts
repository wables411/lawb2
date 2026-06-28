// Seeded PRNG for Reef Run — the foundation for deterministic, replay-validatable runs.
//
// Phase 1a: all GAMEPLAY randomness (spawns, lanes, pickup selection, difficulty rolls) draws from
// a single seeded stream so a run is reproducible from its seed + inputs. Cosmetic randomness
// (particles, camera shake, mesh rotation, impact FX) intentionally stays on Math.random() so
// rendering never perturbs the gameplay stream.
//
// NOTE: full cross-machine determinism also needs a fixed-timestep sim (Phase 1b) — until then the
// stream is seedable but the number of draws still depends on frame pacing. Default seed is random,
// so live free-play behaviour is unchanged.

/** Returns a float in [0, 1), like Math.random. */
export type Rng = () => number;

/** mulberry32 — small, fast, good-quality deterministic PRNG. */
export function makeRng(seed: number): Rng {
  let a = seed >>> 0;
  return function rng(): number {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Deterministic 32-bit seed from a string (e.g. a jackpot/run code) — FNV-1a. */
export function seedFromString(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Random seed for free-play (jackpot/replay runs are assigned a seed instead). */
export function randomSeed(): number {
  return (Math.floor(Math.random() * 0x100000000)) >>> 0;
}
