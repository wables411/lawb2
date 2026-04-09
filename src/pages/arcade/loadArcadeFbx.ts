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

function setColorTextureSRGB(tex: THREE.Texture | null | undefined): void {
  if (!tex) return;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
}

function setDataTextureLinear(tex: THREE.Texture | null | undefined): void {
  if (!tex) return;
  tex.colorSpace = THREE.LinearSRGBColorSpace;
  tex.needsUpdate = true;
}

/**
 * FBXLoader often yields MeshPhongMaterial with diffuse on `.map`. Three's FBX parser skips
 * some legacy maps (e.g. ShininessExponent) — converting to MeshStandardMaterial matches
 * clawb-world ViewerAvatarManager and fixes missing body / face / clothing textures.
 */
export function repairFbxMaterials(root: THREE.Object3D): void {
  root.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (!mesh.isMesh) return;

    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    const next: THREE.Material[] = [];

    for (const m of mats) {
      m.side = THREE.DoubleSide;
      m.transparent = false;
      m.depthWrite = true;

      const stdIn = m as THREE.MeshStandardMaterial;
      if (stdIn.isMeshStandardMaterial) {
        setColorTextureSRGB(stdIn.map);
        setColorTextureSRGB(stdIn.emissiveMap);
        setDataTextureLinear(stdIn.normalMap);
        setDataTextureLinear(stdIn.roughnessMap);
        setDataTextureLinear(stdIn.metalnessMap);
        setDataTextureLinear(stdIn.aoMap);
        stdIn.roughness = THREE.MathUtils.clamp(stdIn.roughness, 0.06, 0.92);
        stdIn.metalness = THREE.MathUtils.clamp(stdIn.metalness, 0, 0.45);
        stdIn.envMapIntensity = Math.max(stdIn.envMapIntensity ?? 0, 0.9);
        if (stdIn.color.r + stdIn.color.g + stdIn.color.b < 0.02 && !stdIn.map) {
          stdIn.color.setScalar(0.72);
        }
        stdIn.needsUpdate = true;
        next.push(stdIn);
        continue;
      }

      const phong = m as THREE.MeshPhongMaterial;
      if (phong.isMeshPhongMaterial) {
        const std = new THREE.MeshStandardMaterial({
          color: phong.color?.clone() ?? new THREE.Color(0xffffff),
          map: phong.map ?? null,
          normalMap: phong.normalMap ?? null,
          bumpMap: phong.bumpMap ?? null,
          bumpScale: phong.bumpScale ?? 1,
          emissive: phong.emissive?.clone() ?? new THREE.Color(0x000000),
          emissiveMap: phong.emissiveMap ?? null,
          side: THREE.DoubleSide,
          transparent: false,
          depthWrite: true,
          roughness: 0.4,
          metalness: 0.12,
          envMapIntensity: 1.05,
        });
        setColorTextureSRGB(std.map);
        setColorTextureSRGB(std.emissiveMap);
        setDataTextureLinear(std.normalMap);
        setDataTextureLinear(std.bumpMap);
        if (std.color.r + std.color.g + std.color.b < 0.03 && !std.map) {
          std.color.setScalar(0.72);
        }
        phong.dispose();
        std.needsUpdate = true;
        next.push(std);
        continue;
      }

      const lambert = m as THREE.MeshLambertMaterial;
      if (lambert.isMeshLambertMaterial) {
        const std = new THREE.MeshStandardMaterial({
          color: lambert.color?.clone() ?? new THREE.Color(0xffffff),
          map: lambert.map ?? null,
          emissive: lambert.emissive?.clone() ?? new THREE.Color(0),
          emissiveMap: lambert.emissiveMap ?? null,
          side: THREE.DoubleSide,
          transparent: false,
          depthWrite: true,
          roughness: 0.55,
          metalness: 0.06,
          envMapIntensity: 1.05,
        });
        setColorTextureSRGB(std.map);
        setColorTextureSRGB(std.emissiveMap);
        lambert.dispose();
        std.needsUpdate = true;
        next.push(std);
        continue;
      }

      const basic = m as THREE.MeshBasicMaterial;
      if (basic.isMeshBasicMaterial) {
        const std = new THREE.MeshStandardMaterial({
          color: basic.color?.clone() ?? new THREE.Color(0xffffff),
          map: basic.map ?? null,
          side: THREE.DoubleSide,
          transparent: false,
          depthWrite: true,
          roughness: 0.5,
          metalness: 0.08,
          envMapIntensity: 1.0,
        });
        setColorTextureSRGB(std.map);
        basic.dispose();
        std.needsUpdate = true;
        next.push(std);
        continue;
      }

      next.push(m);
    }

    mesh.material = next.length === 1 ? next[0]! : next;
  });
}

/**
 * With root parentless (or only uniform transform), set Y so AABB bottom sits at `targetBottomY`
 * in the space `setFromObject` uses (world space when parent is scene/null stack).
 */
export function alignFbxBottomBeforeParent(root: THREE.Object3D, targetBottomY: number): void {
  root.position.x = 0;
  root.position.z = 0;
  root.position.y = 0;
  root.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(root);
  if (!Number.isFinite(box.min.y)) {
    root.position.y = targetBottomY;
    return;
  }
  root.position.y = targetBottomY - box.min.y;
}

/** After position/scale/rotation (and optional parent), nudge Y so AABB bottom hits `targetWorldMinY`. */
export function alignFbxVerticalAfterLayout(root: THREE.Object3D, targetWorldMinY: number): void {
  root.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(root);
  if (!Number.isFinite(box.min.y)) return;
  root.position.y += targetWorldMinY - box.min.y;
  root.updateMatrixWorld(true);
}

export function prepareArcadeModel(root: THREE.Group): void {
  repairFbxMaterials(root);
  root.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (mesh.isMesh) {
      mesh.castShadow = true;
      mesh.receiveShadow = true;
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
    const s = typeof args[0] === 'string' ? args[0] : '';
    if (s.includes('Vertex has more than 4 skinning weights')) return;
    if (s.includes('ShininessExponent map is not supported')) return;
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
