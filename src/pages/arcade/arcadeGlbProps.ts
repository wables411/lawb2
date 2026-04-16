import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { ARCADE_ASSET_BASE } from './arcadeAssetConfig';
import { createPrimitivePickupMesh, PICKUP_VISUAL_SCALE } from './arcadePickupMesh';
import type { PickupKind } from './arcadePickupKinds';
import { fitReefObstacleVisual } from './arcadePropPlacement';

const loader = new GLTFLoader();
loader.setMeshoptDecoder(MeshoptDecoder);

const PICKUP_GLB: Partial<Record<PickupKind, string>> = {
  air_tank: `${ARCADE_ASSET_BASE}/reef-o2-tank.glb`,
  cheese: `${ARCADE_ASSET_BASE}/cheese.glb`,
  coin: `${ARCADE_ASSET_BASE}/coin.glb`,
  jellyfish: `${ARCADE_ASSET_BASE}/jellyfish.glb`,
  mine: `${ARCADE_ASSET_BASE}/reef-mine.glb`,
  peptides: `${ARCADE_ASSET_BASE}/peptides.glb`,
  pufferfish: `${ARCADE_ASSET_BASE}/puffer-fish.glb`,
};

/** Trash variants: each gets its own target max axis (new GLBs vary a lot in authored scale). */
const TRASH_CONFIG = [
  { url: `${ARCADE_ASSET_BASE}/trash1.glb`, maxExtent: 0.72 },
  { url: `${ARCADE_ASSET_BASE}/trash2.glb`, maxExtent: 0.72 },
  { url: `${ARCADE_ASSET_BASE}/trash-cube.glb`, maxExtent: 0.62 },
] as const;

const CORAL_GLB = `${ARCADE_ASSET_BASE}/coral1.glb`;

const pickupTemplates: Partial<Record<PickupKind, THREE.Object3D>> = {};
type TrashProp = { tpl: THREE.Object3D; maxExtent: number };
let trashProps: TrashProp[] = [];
let coralTemplate: THREE.Object3D | null = null;

let templatesLoadPromise: Promise<void> | null = null;

async function loadSceneQuiet(url: string): Promise<THREE.Object3D | null> {
  try {
    const gltf = await loader.loadAsync(url);
    return gltf.scene;
  } catch (e) {
    console.warn('[Arcade] GLB load failed:', url, e);
    return null;
  }
}

/** Preload reef pickups + coral obstacle GLBs from `public/arcade-assets/`. Safe to call multiple times. */
export function loadArcadePropGlbTemplates(): Promise<void> {
  if (!templatesLoadPromise) {
    templatesLoadPromise = (async () => {
      const jobs: Promise<void>[] = [];
      for (const [kind, url] of Object.entries(PICKUP_GLB) as [PickupKind, string][]) {
        jobs.push(
          loadSceneQuiet(url).then((sc) => {
            if (sc) pickupTemplates[kind] = sc;
          }),
        );
      }
      jobs.push(
        (async () => {
          const loaded = await Promise.all(
            TRASH_CONFIG.map(({ url, maxExtent }) =>
              loadSceneQuiet(url).then((sc) => (sc ? ({ tpl: sc, maxExtent } as TrashProp) : null)),
            ),
          );
          trashProps = loaded.filter((x): x is TrashProp => x !== null);
        })(),
      );
      jobs.push(
        loadSceneQuiet(CORAL_GLB).then((sc) => {
          coralTemplate = sc;
        }),
      );
      await Promise.all(jobs);
    })();
  }
  return templatesLoadPromise;
}

/**
 * Largest axis after uniform fit (`fitReefObstacleVisual`), before `PICKUP_VISUAL_SCALE`.
 * Tuned for current `public/arcade-assets/*.glb` reef props (~1.32 m lane width; read at ~0.7–1.0 m).
 */
const PICKUP_MAX_EXTENT: Partial<Record<PickupKind, number>> = {
  air_tank: 0.86,
  cheese: 0.68,
  coin: 0.52,
  jellyfish: 1.02,
  mine: 0.96,
  peptides: 0.78,
  pufferfish: 0.98,
  trash: 0.7,
};

/** Coral obstacle: match `OBSTACLE_BOX_*` (~2.05 Y, 2.2 Z) so the mesh reads like the gameplay column. */
const CORAL_MAX_EXTENT = 2.14;

/** Spawn-ready pickup root (GLB clone + scale, or primitive mesh). */
export function clonePickupVisual(kind: PickupKind): THREE.Object3D {
  let tpl: THREE.Object3D | undefined;
  let extentOverride: number | undefined;
  if (kind === 'trash') {
    if (trashProps.length > 0) {
      const pick = trashProps[Math.floor(Math.random() * trashProps.length)]!;
      tpl = pick.tpl;
      extentOverride = pick.maxExtent;
    }
  } else {
    tpl = pickupTemplates[kind];
  }

  if (tpl) {
    const root = tpl.clone(true);
    root.userData.pickupKind = kind;
    const mx = extentOverride ?? PICKUP_MAX_EXTENT[kind] ?? 0.65;
    fitReefObstacleVisual(root, { maxExtent: mx });
    const s = PICKUP_VISUAL_SCALE[kind] ?? 1.15;
    root.scale.multiplyScalar(s);
    return root;
  }

  return createPrimitivePickupMesh(kind);
}

/** Coral obstacle mesh/group, or `null` if `coral1.glb` did not load (caller uses box fallback). */
export function cloneCoralObstacleVisual(): THREE.Object3D | null {
  if (!coralTemplate) return null;
  const root = coralTemplate.clone(true);
  fitReefObstacleVisual(root, { maxExtent: CORAL_MAX_EXTENT });
  return root;
}
