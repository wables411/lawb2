/** Static paths — files copied from clawb-world `public/assets` → lawb2 `public/arcade-assets`. */

export const ARCADE_ASSET_BASE = '/arcade-assets';

export type ArcadeCharacterId = 'clawb' | 'milady' | 'radbro';

export type ArcadeCharacterDef = {
  id: ArcadeCharacterId;
  label: string;
  scale: number;
  idle: string;
  dance: string;
  swim: string;
};

export const ARCADE_CHARACTERS: ArcadeCharacterDef[] = [
  {
    id: 'clawb',
    label: 'CLAWB',
    scale: 0.012,
    idle: `${ARCADE_ASSET_BASE}/lawbidle.fbx`,
    dance: `${ARCADE_ASSET_BASE}/lawbdance1.fbx`,
    swim: `${ARCADE_ASSET_BASE}/lawbswim.fbx`,
  },
  {
    id: 'milady',
    label: 'MILADY',
    scale: 0.011,
    idle: `${ARCADE_ASSET_BASE}/milady11treading.fbx`,
    dance: `${ARCADE_ASSET_BASE}/milady11dance.fbx`,
    swim: `${ARCADE_ASSET_BASE}/milady11swimming.fbx`,
  },
  {
    id: 'radbro',
    label: 'RADBRO',
    scale: 0.011,
    idle: `${ARCADE_ASSET_BASE}/radbrotreading.fbx`,
    dance: `${ARCADE_ASSET_BASE}/radbrodance.fbx`,
    swim: `${ARCADE_ASSET_BASE}/radbroswimming.fbx`,
  },
];
