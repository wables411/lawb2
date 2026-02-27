import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import {
  CLAWB_MODEL_URLS,
  CLAWB_MODEL_FALLBACKS,
  CLAWB_SCALE,
  type ClawbModelKey,
} from './WorldConfig';

const fbxLoader = new FBXLoader();
const gltfLoader = new GLTFLoader();

export function loadModel(url: string): Promise<THREE.Group> {
  if (url.endsWith('.glb') || url.endsWith('.gltf')) {
    return gltfLoader.loadAsync(url).then((gltf) => {
      const group = gltf.scene;
      if (gltf.animations?.length > 0) {
        (group as any).animations = gltf.animations;
      }
      return group;
    });
  }
  return new Promise<THREE.Group>((resolve, reject) =>
    fbxLoader.load(url, resolve, undefined, reject),
  );
}

export function prepareCharacterModel(
  object: THREE.Group,
  position: THREE.Vector3,
) {
  object.scale.setScalar(CLAWB_SCALE);
  object.position.copy(position);
  object.rotation.y = Math.PI / 2;
  object.traverse((child: THREE.Object3D) => {
    if ((child as THREE.Mesh).isMesh) {
      const mesh = child as THREE.Mesh;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      mats.forEach((m) => {
        m.side = THREE.DoubleSide;
        m.transparent = false;
        const stdMat = m as THREE.MeshStandardMaterial;
        if (stdMat.map) {
          stdMat.map.magFilter = THREE.LinearFilter;
          stdMat.map.minFilter = THREE.LinearFilter;
        }
        if (stdMat.isMeshStandardMaterial) {
          stdMat.roughness = Math.min(stdMat.roughness, 0.65);
          stdMat.metalness = Math.max(stdMat.metalness, 0.1);
          stdMat.envMapIntensity = 0.8;
        }
      });
    }
  });
}

export async function loadClawbModelWithFallback(
  key: ClawbModelKey,
): Promise<THREE.Group> {
  const urls = [CLAWB_MODEL_URLS[key], ...CLAWB_MODEL_FALLBACKS[key]];
  let lastErr: unknown = null;
  for (const url of urls) {
    try {
      return await loadModel(url);
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr;
}

export function getPlayableClip(
  clip: THREE.AnimationClip,
): THREE.AnimationClip {
  return clip.clone();
}

export function applyBlueTint(object: THREE.Group) {
  object.traverse((child: THREE.Object3D) => {
    if ((child as THREE.Mesh).isMesh) {
      const mesh = child as THREE.Mesh;
      const mats = Array.isArray(mesh.material)
        ? mesh.material
        : [mesh.material];
      mats.forEach((m) => {
        const stdMat = m as THREE.MeshStandardMaterial;
        if (stdMat.color) {
          stdMat.color.lerp(new THREE.Color(0x4488cc), 0.35);
        }
      });
    }
  });
}

export function applyClawbGlow(object: THREE.Group) {
  object.traverse((child: THREE.Object3D) => {
    if ((child as THREE.Mesh).isMesh) {
      const mesh = child as THREE.Mesh;
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      mats.forEach((m) => {
        const stdMat = m as THREE.MeshStandardMaterial;
        if (stdMat.isMeshStandardMaterial) {
          stdMat.emissive = new THREE.Color(0x44bbff);
          stdMat.emissiveIntensity = 0.35;
        }
      });
    }
  });

  const glowLight = new THREE.PointLight(0x44ccff, 1.8, 8, 1.5);
  glowLight.name = 'clawb_glow_light';
  glowLight.position.set(0, 0.5, 0);
  object.add(glowLight);
}

export function pulseClawbGlow(object: THREE.Group, elapsed: number) {
  const light = object.getObjectByName('clawb_glow_light') as THREE.PointLight | undefined;
  if (light) {
    light.intensity = 1.4 + 0.6 * Math.sin(elapsed * 1.2);
  }
}
