import * as THREE from 'three';
import { loadModel } from './WorldCharacter';
import { FLOOR_Y } from './WorldConfig';

type LocalBehavior =
  | 'static'
  | 'swim_circle'
  | 'swim_figure8'
  | 'bob'
  | 'swim_fish'
  | 'swim_shark'
  | 'jelly_drift';

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
  modelPath: string;
  behavior: LocalBehavior;
  speed: number;
  radius: number;
  verticalAmplitude: number;
  reactiveRadius: number;
  reactiveStrength: number;
  phase: number;
  mixer: THREE.AnimationMixer | null;
  swimAxis: THREE.Vector3;
  baseRotation: THREE.Euler;
  baseScale: THREE.Vector3;
  headingYaw: number;
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
  if (
    value === 'swim_circle' ||
    value === 'swim_figure8' ||
    value === 'bob' ||
    value === 'static' ||
    value === 'swim_fish' ||
    value === 'swim_shark' ||
    value === 'jelly_drift'
  ) {
    return value;
  }
  return 'static';
}

function inferBehavior(entry: LocalManifestEntry): LocalBehavior {
  if (entry.behavior) return normalizeBehavior(entry.behavior);
  const raw = `${entry.id || ''} ${entry.model || ''}`.toLowerCase();
  if (raw.includes('jelly')) return 'jelly_drift';
  if (raw.includes('shark') || raw.includes('dogfish')) return 'swim_shark';
  if (raw.includes('fish') || raw.includes('reef') || raw.includes('fistularis')) return 'swim_fish';
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
        modelPath: entry.model,
        behavior: inferBehavior(entry),
        speed: Number.isFinite(entry.speed) ? Math.max(0.05, Number(entry.speed)) : 0.35,
        radius: Number.isFinite(entry.radius) ? Math.max(0, Number(entry.radius)) : 1.6,
        verticalAmplitude: Number.isFinite(entry.verticalAmplitude) ? Math.max(0, Number(entry.verticalAmplitude)) : 0.35,
        reactiveRadius: Number.isFinite(entry.reactiveRadius) ? Math.max(0, Number(entry.reactiveRadius)) : 2.5,
        reactiveStrength: Number.isFinite(entry.reactiveStrength) ? Math.max(0, Number(entry.reactiveStrength)) : 1.8,
        phase: Math.random() * Math.PI * 2,
        mixer,
        swimAxis: new THREE.Vector3(Math.random() - 0.5, 0, Math.random() - 0.5).normalize(),
        baseRotation: model.rotation.clone(),
        baseScale: model.scale.clone(),
        headingYaw: model.rotation.y,
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
  current?: THREE.Vector3 | null,
  currentStrength: number = 0,
) {
  if (!refs?.movers?.length) return;
  for (const mover of refs.movers) {
    mover.mixer?.update(delta);
    const t = elapsed * mover.speed + mover.phase;
    const target = mover.base.clone();
    const rot = mover.baseRotation.clone();

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
    } else if (mover.behavior === 'swim_fish') {
      target.x += Math.sin(t * 1.15) * mover.radius;
      target.z += Math.cos(t * 0.82) * mover.radius * 0.9;
      target.y += Math.sin(t * 1.9) * mover.verticalAmplitude * 0.35;
      rot.z += Math.sin(t * 6.2) * 0.07; // tail-like body yaw wobble
      rot.x += Math.cos(t * 2.1) * 0.025;
    } else if (mover.behavior === 'swim_shark') {
      const orbitFreq = 0.46;
      const orbitT = t * orbitFreq;
      const radiusX = mover.radius * 1.45;
      const radiusZ = mover.radius * 1.1;
      target.x += Math.cos(orbitT) * radiusX;
      target.z += Math.sin(orbitT) * radiusZ;
      target.y += Math.sin(orbitT * 0.55) * mover.verticalAmplitude * 0.08; // flatter shark glide
      // Yaw follows the tangent of the glide path for a cleaner heading.
      const velX = -Math.sin(orbitT) * radiusX;
      const velZ = Math.cos(orbitT) * radiusZ;
      const yawTarget = Math.atan2(velX, velZ);
      mover.headingYaw = THREE.MathUtils.damp(mover.headingYaw, yawTarget, 2.2, delta);
      rot.y = mover.headingYaw;
      // Subtle body roll + pitch (less twitchy than previous oscillation).
      rot.z += Math.sin(orbitT * 1.8) * 0.045;
      rot.x += Math.cos(orbitT * 1.05) * 0.018;
    } else if (mover.behavior === 'jelly_drift') {
      target.x += Math.sin(t * 0.34) * mover.radius * 0.4;
      target.z += Math.cos(t * 0.27) * mover.radius * 0.45;
      target.y += Math.sin(t * 1.6) * mover.verticalAmplitude * 0.85;
      const pulse = 1 + Math.sin(t * 3.0) * 0.06;
      mover.root.scale.copy(mover.baseScale.clone().multiplyScalar(pulse));
    }

    if (mover.behavior !== 'static') {
      const drift = Math.sin(t * 0.6) * 0.4 + Math.cos(t * 0.4) * 0.25;
      const driftScale = mover.behavior === 'swim_shark' ? 0.35 : 1;
      target.add(mover.swimAxis.clone().multiplyScalar(drift * driftScale));
    }

    if (current && mover.behavior !== 'static') {
      target.x += current.x * currentStrength * 0.6;
      target.z += current.z * currentStrength * 0.6;
    }

    if (avoidPoint && mover.reactiveRadius > 0) {
      const toAvoid = mover.root.position.clone().sub(avoidPoint);
      const dist = toAvoid.length();
      if (dist > 0.001 && dist < mover.reactiveRadius) {
        const behaviorFactor = mover.behavior === 'swim_shark' ? 0.72 : 1.75;
        const repel = ((mover.reactiveRadius - dist) / mover.reactiveRadius) * mover.reactiveStrength * behaviorFactor;
        target.add(toAvoid.normalize().multiplyScalar(repel));
      }
    }

    const lerpAlpha = Math.min(
      1,
      delta * (mover.behavior === 'swim_shark' ? 2.1 : mover.behavior === 'static' ? 2.5 : 3.5),
    );
    mover.root.position.lerp(target, lerpAlpha);

    if (mover.behavior !== 'static') {
      const tangent = target.clone().sub(mover.root.position);
      if (mover.behavior !== 'swim_shark' && tangent.lengthSq() > 0.00001) {
        const yaw = Math.atan2(tangent.x, tangent.z);
        mover.root.rotation.y = THREE.MathUtils.damp(mover.root.rotation.y, yaw, 6, delta);
      } else if (mover.behavior === 'swim_shark') {
        mover.root.rotation.y = THREE.MathUtils.damp(mover.root.rotation.y, rot.y, 3.2, delta);
      }
      mover.root.rotation.x = THREE.MathUtils.damp(mover.root.rotation.x, rot.x, 4, delta);
      mover.root.rotation.z = THREE.MathUtils.damp(mover.root.rotation.z, rot.z, 4, delta);
    } else {
      mover.root.rotation.x = THREE.MathUtils.damp(mover.root.rotation.x, mover.baseRotation.x, 4, delta);
      mover.root.rotation.z = THREE.MathUtils.damp(mover.root.rotation.z, mover.baseRotation.z, 4, delta);
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
