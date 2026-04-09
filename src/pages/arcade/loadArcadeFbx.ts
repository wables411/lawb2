import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';

/** Drop root motion XZ like clawb-world treadmill clips (keeps vertical bob). */
export function clipSwimInPlace(clip: THREE.AnimationClip): THREE.AnimationClip {
  const c = clip.clone();
  c.tracks = c.tracks.filter((t) => !t.name.toLowerCase().includes('.position'));
  if (c.tracks.length > 0) {
    c.resetDuration();
    return c;
  }
  const out = clip.clone();
  out.tracks = clip.tracks.map((track) => {
    if (!track.name.toLowerCase().includes('.position')) return track.clone();
    if (track instanceof THREE.VectorKeyframeTrack) {
      const v = track.clone();
      const arr = (v.values as Float32Array).slice();
      for (let i = 0; i < arr.length; i += 3) {
        arr[i] = 0;
        arr[i + 2] = 0;
      }
      v.values = arr;
      return v;
    }
    return track.clone();
  });
  out.resetDuration();
  return out;
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
): { mixer: THREE.AnimationMixer; action: THREE.AnimationAction | null } {
  const mixer = new THREE.AnimationMixer(root);
  if (!clips.length) return { mixer, action: null };
  const action = mixer.clipAction(clipSwimInPlace(clips[0]));
  action.setLoop(THREE.LoopRepeat, Infinity);
  action.play();
  return { mixer, action };
}
