import * as THREE from 'three';
import { loadModel } from './WorldCharacter';
import { FLOOR_Y } from './WorldConfig';

type LocalBehavior = 'static' | 'swim_circle' | 'swim_figure8' | 'bob';

type LocalManifestEntry = {
  id?: string;
  model: string;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number | [number, number, number];
  behavior?: LocalBehavior;
  speed?: number;
  radius?: number;
  verticalAmplitude?: number;
  reactiveRadius?: number;
  reactiveStrength?: number;
  autoplayAnimations?: boolean;
};

type LocalManifest = {
  entries?: LocalManifestEntry[];
};

type LocalMover = {
  id: string;
  root: THREE.Group;
  base: THREE.Vector3;
  behavior: LocalBehavior;
  speed: number;
  radius: number;
  verticalAmplitude: number;
  reactiveRadius: number;
  reactiveStrength: number;
  phase: number;
  mixer: THREE.AnimationMixer | null;
};

export type LocalWorldFaunaRefs = {
  movers: LocalMover[];
};

function normalizeScale(scale: LocalManifestEntry['scale']): THREE.Vector3 {
  if (Array.isArray(scale) && scale.length === 3) {
    return new THREE.Vector3(scale[0], scale[1], scale[2]);
  }
  if (typeof scale === 'number' && Number.isFinite(scale) && scale > 0) {
    return new THREE.Vector3(scale, scale, scale);
  }
  return new THREE.Vector3(1, 1, 1);
}

function normalizeBehavior(value: unknown): LocalBehavior {
  if (value === 'swim_circle' || value === 'swim_figure8' || value === 'bob' || value === 'static') {
    return value;
  }
  return 'static';
}

async function loadManifest(): Promise<LocalManifestEntry[]> {
  try {
    const res = await fetch(`/local-world-assets/manifest.json?v=${Date.now()}`, { cache: 'no-store' });
    if (!res.ok) return [];
    const data = (await res.json()) as LocalManifest;
    if (!Array.isArray(data?.entries)) return [];
    return data.entries.filter((e) => typeof e?.model === 'string' && e.model.trim().length > 0);
  } catch {
    return [];
  }
}

export async function loadLocalWorldFauna(scene: THREE.Scene): Promise<LocalWorldFaunaRefs> {
  const entries = await loadManifest();
  const movers: LocalMover[] = [];
  for (let i = 0; i < entries.length; i += 1) {
    const entry = entries[i];
    const id = entry.id || `local_asset_${i + 1}`;
    try {
      const model = await loadModel(entry.model);
      const base = new THREE.Vector3(
        entry.position?.[0] ?? 0,
        entry.position?.[1] ?? FLOOR_Y + 1.2,
        entry.position?.[2] ?? 0,
      );
      model.position.copy(base);
      model.rotation.set(
        entry.rotation?.[0] ?? 0,
        entry.rotation?.[1] ?? 0,
        entry.rotation?.[2] ?? 0,
      );
      model.scale.copy(normalizeScale(entry.scale));
      model.name = `local_world_asset:${id}`;
      model.traverse((child: THREE.Object3D) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          mesh.castShadow = true;
          mesh.receiveShadow = true;
        }
      });
      scene.add(model);

      let mixer: THREE.AnimationMixer | null = null;
      if (entry.autoplayAnimations !== false && model.animations?.length) {
        mixer = new THREE.AnimationMixer(model);
        for (const clip of model.animations) {
          mixer.clipAction(clip).play();
        }
      }

      movers.push({
        id,
        root: model,
        base,
        behavior: normalizeBehavior(entry.behavior),
        speed: Number.isFinite(entry.speed) ? Math.max(0.05, Number(entry.speed)) : 0.35,
        radius: Number.isFinite(entry.radius) ? Math.max(0, Number(entry.radius)) : 1.6,
        verticalAmplitude: Number.isFinite(entry.verticalAmplitude) ? Math.max(0, Number(entry.verticalAmplitude)) : 0.35,
        reactiveRadius: Number.isFinite(entry.reactiveRadius) ? Math.max(0, Number(entry.reactiveRadius)) : 2.5,
        reactiveStrength: Number.isFinite(entry.reactiveStrength) ? Math.max(0, Number(entry.reactiveStrength)) : 1.8,
        phase: Math.random() * Math.PI * 2,
        mixer,
      });
    } catch (err) {
      console.warn(`[LocalWorldFauna] Failed to load ${id}:`, err);
    }
  }
  return { movers };
}

export function updateLocalWorldFauna(
  refs: LocalWorldFaunaRefs | null,
  elapsed: number,
  delta: number,
  avoidPoint?: THREE.Vector3 | null,
) {
  if (!refs?.movers?.length) return;
  for (const mover of refs.movers) {
    mover.mixer?.update(delta);
    const t = elapsed * mover.speed + mover.phase;
    const target = mover.base.clone();

    if (mover.behavior === 'swim_circle') {
      target.x += Math.cos(t) * mover.radius;
      target.z += Math.sin(t) * mover.radius;
      target.y += Math.sin(t * 1.3) * mover.verticalAmplitude;
    } else if (mover.behavior === 'swim_figure8') {
      target.x += Math.sin(t) * mover.radius;
      target.z += Math.sin(t * 2) * mover.radius * 0.6;
      target.y += Math.sin(t * 1.8) * mover.verticalAmplitude;
    } else if (mover.behavior === 'bob') {
      target.y += Math.sin(t * 1.8) * mover.verticalAmplitude;
    }

    if (avoidPoint && mover.reactiveRadius > 0) {
      const toAvoid = mover.root.position.clone().sub(avoidPoint);
      const dist = toAvoid.length();
      if (dist > 0.001 && dist < mover.reactiveRadius) {
        const repel = ((mover.reactiveRadius - dist) / mover.reactiveRadius) * mover.reactiveStrength;
        target.add(toAvoid.normalize().multiplyScalar(repel));
      }
    }

    const lerpAlpha = Math.min(1, delta * (mover.behavior === 'static' ? 2.5 : 3.5));
    mover.root.position.lerp(target, lerpAlpha);

    if (mover.behavior !== 'static') {
      const tangent = target.clone().sub(mover.root.position);
      if (tangent.lengthSq() > 0.00001) {
        const yaw = Math.atan2(tangent.x, tangent.z);
        mover.root.rotation.y = THREE.MathUtils.damp(mover.root.rotation.y, yaw, 6, delta);
      }
    }
  }
}

export function disposeLocalWorldFauna(scene: THREE.Scene, refs: LocalWorldFaunaRefs | null) {
  if (!refs) return;
  for (const mover of refs.movers) {
    mover.mixer?.stopAllAction();
    scene.remove(mover.root);
  }
}
