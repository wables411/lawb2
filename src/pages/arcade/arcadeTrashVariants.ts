/**
 * Canonical trash variant roster — the dive log's "species list" (Beetleboy-style:
 * every variant gets a name, a faux-Latin binomial, and its own satchel slot).
 *
 * Variant ids are FIREBASE KEYS (profiles/<key>/reef_run_stats/trash_by_kind/<id>) —
 * never rename one, or lifetime tallies orphan. Display names live in reefLang (EN/ZH);
 * the Latin stays here because it is language-neutral.
 *
 * Which variant a given trash pickup is gets derived from (runSeed, nth-trash-spawn)
 * by `trashVariantIndexFor` — deterministic without consuming the gameplay RNG stream,
 * so the sim (`reefRunSim.ts`) and the droplet validator are untouched: replays verify
 * exactly as before, yet the same run always shows (and tallies) the same variants.
 */

export const TRASH_VARIANTS = [
  { id: 'trash1', glb: 'trash1.glb', latin: 'Conserva antiqua' },
  { id: 'trash2', glb: 'trash2.glb', latin: 'Dolium toxicum' },
  { id: 'cube', glb: 'trash-cube.glb', latin: 'Cubus compactus' },
  { id: 'cigpack', glb: 'trash-cigpack.glb', latin: 'Fumus pelagicus' },
  { id: 'energycan', glb: 'trash-energycan.glb', latin: 'Stimulans vacuum' },
  { id: 'vape', glb: 'trash-vape.glb', latin: 'Vaporis extinctus' },
  { id: 'bag', glb: 'trash-bag.glb', latin: 'Saccus aeternus' },
  { id: 'crt', glb: 'trash-crt.glb', latin: 'Tubus cathodicus' },
] as const;

export type TrashVariantId = (typeof TRASH_VARIANTS)[number]['id'];

export const TRASH_VARIANT_IDS = TRASH_VARIANTS.map((v) => v.id) as TrashVariantId[];

/**
 * Deterministic variant for the n-th trash spawn of a run. Integer mix (murmur-style
 * finalizer) over seed + counter — no RNG stream, no float drift, stable across builds.
 */
export function trashVariantIndexFor(runSeed: number, trashSpawnIndex: number): number {
  let h = (runSeed ^ Math.imul(trashSpawnIndex + 1, 0x9e3779b9)) >>> 0;
  h ^= h >>> 16;
  h = Math.imul(h, 0x45d9f3b) >>> 0;
  // Final XOR runs on SIGNED int32 — force back to unsigned or ~half of all
  // spawns index the roster negatively and crash the game loop.
  h = (h ^ (h >>> 16)) >>> 0;
  return h % TRASH_VARIANTS.length;
}

export function trashVariantIdFor(runSeed: number, trashSpawnIndex: number): TrashVariantId {
  return TRASH_VARIANTS[trashVariantIndexFor(runSeed, trashSpawnIndex)]!.id;
}
