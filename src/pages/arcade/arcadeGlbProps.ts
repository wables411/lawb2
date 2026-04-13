import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { ARCADE_ASSET_BASE } from './arcadeAssetConfig';
import { createPrimitivePickupMesh, PICKUP_VISUAL_SCALE } from './arcadePickupMesh';
import type { PickupKind } from './arcadePickupKinds';
import { fitReefObstacleVisual } from './arcadePropPlacement';

const loader = new GLTFLoader();

const PICKUP_GLB: Partial<Record<PickupKind, string>> = {
  air_tank: `${ARCADE_ASSET_BASE}/reef-o2-tank.glb`,
  cheese: `${ARCADE_ASSET_BASE}/cheese.glb`,
  coin: `${ARCADE_ASSET_BASE}/coin.glb`,
  jellyfish: `${ARCADE_ASSET_BASE}/jellyfish.glb`,
  mine: `${ARCADE_ASSET_BASE}/reef-mine.glb`,
  peptides: `${ARCADE_ASSET_BASE}/peptides.glb`,
  pufferfish: `${ARCADE_ASSET_BASE}/puffer-fish.glb`,
};

const TRASH_GLB = [`${ARCADE_ASSET_BASE}/trash1.glb`, `${ARCADE_ASSET_BASE}/trash2.glb`] as const;
const CORAL_GLB = `${ARCADE_ASSET_BASE}/coral1.glb`;

const pickupTemplates: Partial<Record<PickupKind, THREE.Object3D>> = {};
const trashTemplates: THREE.Object3D[] = [];
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
      for (const url of TRASH_GLB) {
        jobs.push(
          loadSceneQuiet(url).then((sc) => {
            if (sc) trashTemplates.push(sc);
          }),
        );
      }
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

/** Largest axis after uniform scale — tuned to match old primitive silhouettes. */
const PICKUP_MAX_EXTENT: Partial<Record<PickupKind, number>> = {
  air_tank: 0.9,
  cheese: 0.68,
  coin: 0.52,
  jellyfish: 1.02,
  mine: 1.02,
  peptides: 0.74,
  pufferfish: 0.98,
  trash: 0.7,
};

const CORAL_MAX_EXTENT = 2.22;

/** Spawn-ready pickup root (GLB clone + scale, or primitive mesh). */
export function clonePickupVisual(kind: PickupKind): THREE.Object3D {
  let tpl: THREE.Object3D | undefined;
  if (kind === 'trash') {
    if (trashTemplates.length > 0) {
      tpl = trashTemplates[Math.floor(Math.random() * trashTemplates.length)];
    }
  } else {
    tpl = pickupTemplates[kind];
  }

  if (tpl) {
    const root = tpl.clone(true);
    root.userData.pickupKind = kind;
    const mx = PICKUP_MAX_EXTENT[kind] ?? 0.65;
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
