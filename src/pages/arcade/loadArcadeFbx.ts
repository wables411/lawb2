import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';

/**
 * True for armature root / hips translation only — not every bone `.position`.
 * Stripping all bone positions breaks skinning (partial / missing limbs).
 */
function isRootHipsPositionTrack(trackName: string): boolean {
  const n = trackName.toLowerCase().replace(/:/g, '');
  return (
    n.endsWith('hips.position') ||
    n.endsWith('pelvis.position') ||
    n.endsWith('root.position') ||
    n.endsWith('rootmotion.position') ||
    n.endsWith('armature.position') ||
    /^[^.]*bip01\.position$/.test(n)
  );
}

/** Zero root XZ on swim clips (treadmill); keeps vertical bob and all bone offsets. */
export function clipSwimInPlace(clip: THREE.AnimationClip): THREE.AnimationClip {
  const c = clip.clone();
  c.tracks = c.tracks.map((track) => {
    if (!isRootHipsPositionTrack(track.name)) return track.clone();
    if (track instanceof THREE.VectorKeyframeTrack) {
      const v = track.clone();
      const src = v.values as Float32Array;
      const arr = src.slice();
      for (let i = 0; i < arr.length; i += 3) {
        arr[i] = 0;
        arr[i + 2] = 0;
      }
      v.values = arr;
      return v;
    }
    return track.clone();
  });
  c.resetDuration();
  return c;
}

export function prepareArcadeModel(root: THREE.Group): void {
  root.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (mesh.isMesh) {
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      mats.forEach((m) => {
        m.side = THREE.DoubleSide;
        const std = m as THREE.MeshStandardMaterial;
        if (std.isMeshStandardMaterial) {
          std.envMapIntensity = Math.max(std.envMapIntensity ?? 0, 0.85);
        }
      });
    }
    const skin = child as THREE.SkinnedMesh;
    if (skin.isSkinnedMesh) {
      skin.frustumCulled = false;
      skin.skeleton?.update();
      skin.geometry?.computeBoundingSphere();
    }
  });
}

export async function loadArcadeFbx(url: string): Promise<{
  root: THREE.Group;
  clips: THREE.AnimationClip[];
}> {
  const loader = new FBXLoader();
  const prevWarn = console.warn;
  console.warn = (...args: unknown[]) => {
    if (typeof args[0] === 'string' && args[0].includes('Vertex has more than 4 skinning weights')) return;
    prevWarn.apply(console, args);
  };
  try {
    const group = await loader.loadAsync(url);
    prepareArcadeModel(group);
    const clips = group.animations?.length ? [...group.animations] : [];
    return { root: group, clips };
  } finally {
    console.warn = prevWarn;
  }
}

export function startLoopClip(
  root: THREE.Group,
  clips: THREE.AnimationClip[],
  opts?: { stripRootMotion?: boolean },
): { mixer: THREE.AnimationMixer; action: THREE.AnimationAction | null } {
  const mixer = new THREE.AnimationMixer(root);
  if (!clips.length) return { mixer, action: null };
  const clip = opts?.stripRootMotion ? clipSwimInPlace(clips[0]) : clips[0];
  const action = mixer.clipAction(clip);
  action.setLoop(THREE.LoopRepeat, Infinity);
  action.play();
  return { mixer, action };
}
