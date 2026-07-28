/** Static paths — character FBX + reef prop GLBs in `public/arcade-assets/` (see `arcadeGlbProps.ts`). */

/**
 * Site builds serve from the absolute `/arcade-assets`. Portable builds (the radbro.fun ZIP,
 * served from an arbitrary blob path inside a sandboxed iframe) override this with a RELATIVE
 * path via `VITE_ARCADE_ASSET_BASE` so assets resolve next to index.html.
 */
export const ARCADE_ASSET_BASE =
  (import.meta.env?.VITE_ARCADE_ASSET_BASE as string | undefined) ?? '/arcade-assets';

/** World-space height after FBX load (each rig is scaled to match — fixes tiny/huge heroes). */
export const ARCADE_HERO_TARGET_HEIGHT = 2.08;

export type ArcadeCharacterId = 'clawb' | 'milady' | 'radbro';

export type ArcadeCharacterDef = {
  id: ArcadeCharacterId;
  label: string;
  /** Applied after height normalize (1 = default). */
  heightMul?: number;
  /**
   * Load `dance` as animation clips only and play on the idle mesh (same skeleton/textures as tread).
   * Avoids a second FBX body that often shows as white shards when skinning/textures mismatch.
   */
  danceUsesIdleMesh?: boolean;
  /**
   * Play mode: clone idle rig and drive it with `swim` clips only (no separate swim FBX mesh).
   */
  swimUsesIdleMesh?: boolean;
  idle: string;
  dance: string;
  swim: string;
};

/** Plinth order left → right matches UI chips: Clawb, Radbro, Milady. */
export const ARCADE_CHARACTERS: ArcadeCharacterDef[] = [
  {
    id: 'clawb',
    label: 'CLAWB',
    heightMul: 1,
    idle: `${ARCADE_ASSET_BASE}/lawbidle.fbx`,
    dance: `${ARCADE_ASSET_BASE}/lawbdance1.fbx`,
    swim: `${ARCADE_ASSET_BASE}/lawbswim.fbx`,
  },
  {
    id: 'radbro',
    label: 'RADBRO',
    heightMul: 1,
    danceUsesIdleMesh: true,
    swimUsesIdleMesh: true,
    idle: `${ARCADE_ASSET_BASE}/radbrotreading.fbx`,
    dance: `${ARCADE_ASSET_BASE}/radbrodance.fbx`,
    swim: `${ARCADE_ASSET_BASE}/radbroswimming.fbx`,
  },
  {
    id: 'milady',
    label: 'MILADY',
    heightMul: 1,
    danceUsesIdleMesh: true,
    swimUsesIdleMesh: true,
    idle: `${ARCADE_ASSET_BASE}/milady11treading.fbx`,
    dance: `${ARCADE_ASSET_BASE}/milady11dance.fbx`,
    swim: `${ARCADE_ASSET_BASE}/milady11swimming.fbx`,
  },
];
