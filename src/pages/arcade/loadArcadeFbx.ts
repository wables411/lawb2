import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { ARCADE_HERO_TARGET_HEIGHT, type ArcadeCharacterId } from './arcadeAssetConfig';

/** Uniform on-screen size: scale root so world AABB height ≈ ARCADE_HERO_TARGET_HEIGHT × multiplier. */
export function applyArcadeHeroScale(root: THREE.Object3D, sizeMultiplier = 1): void {
  root.scale.set(1, 1, 1);
  root.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(root);
  const h = box.max.y - box.min.y;
  if (h <= 0.0005) return;
  root.scale.setScalar((ARCADE_HERO_TARGET_HEIGHT * sizeMultiplier) / h);
}

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

/** Prefer the clip that actually drives the rig (FBX files may ship multiple stubs). */
export function pickArcadeAnimationClip(clips: THREE.AnimationClip[]): THREE.AnimationClip {
  if (!clips.length) throw new Error('pickArcadeAnimationClip: no clips');
  if (clips.length === 1) return clips[0]!;
  return clips.reduce((best, c) => {
    const score = c.tracks.length * (c.duration || 1);
    const bestScore = best.tracks.length * (best.duration || 1);
    return score > bestScore ? c : best;
  });
}

/**
 * Remap clip tracks to bone names present under `targetRoot` (Mixamo / nested paths / colons).
 * Mirrors clawb-world ViewerAvatarManager.retargetClip — fixes partial or “exploded” rigs.
 */
export function retargetClipToModel(clip: THREE.AnimationClip, targetRoot: THREE.Object3D): THREE.AnimationClip {
  const boneNames = new Set<string>();
  targetRoot.traverse((obj) => {
    if (obj.name) boneNames.add(obj.name);
  });

  const newTracks: THREE.KeyframeTrack[] = [];
  for (const track of clip.tracks) {
    const dotIdx = track.name.indexOf('.');
    if (dotIdx < 0) {
      newTracks.push(track.clone());
      continue;
    }
    const objPath = track.name.slice(0, dotIdx);
    const prop = track.name.slice(dotIdx);

    if (boneNames.has(objPath)) {
      newTracks.push(track.clone());
      continue;
    }

    const bare = objPath.includes('/') ? objPath.slice(objPath.lastIndexOf('/') + 1) : objPath;
    if (boneNames.has(bare)) {
      const cloned = track.clone();
      cloned.name = bare + prop;
      newTracks.push(cloned);
      continue;
    }

    const afterColon = bare.includes(':') ? bare.slice(bare.lastIndexOf(':') + 1) : '';
    if (afterColon && boneNames.has(afterColon)) {
      const cloned = track.clone();
      cloned.name = afterColon + prop;
      newTracks.push(cloned);
    }
  }
  return new THREE.AnimationClip(clip.name, clip.duration, newTracks, clip.blendMode);
}

/** Pick clip, optional swim XZ strip + retarget — shared by mesh playback and clip-only dance. */
export function buildArcadePlayableClip(
  clips: THREE.AnimationClip[],
  root: THREE.Object3D,
  opts?: { stripRootMotion?: boolean; retarget?: boolean },
): THREE.AnimationClip | null {
  if (!clips.length) return null;
  let clip = pickArcadeAnimationClip(clips);
  if (opts?.stripRootMotion) clip = clipSwimInPlace(clip);
  if (opts?.retarget) {
    const ret = retargetClipToModel(clip, root);
    if (ret.tracks.length >= Math.max(6, clip.tracks.length * 0.28)) clip = ret;
  }
  return clip;
}

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

export type ArcadeMatSnapshot = {
  emissive: THREE.Color;
  emissiveIntensity: number;
  color: THREE.Color;
};

/** Capture albedo/emissive after FBX repair so UI highlight never snapshots a dimmed state. */
function snapshotArcadeMaterialBase(m: THREE.MeshStandardMaterial): void {
  const u = m.userData as { arcadeMatBase?: ArcadeMatSnapshot };
  if (u.arcadeMatBase) return;
  u.arcadeMatBase = {
    emissive: m.emissive.clone(),
    emissiveIntensity: m.emissiveIntensity,
    color: m.color.clone(),
  };
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
        stdIn.envMapIntensity = THREE.MathUtils.clamp(stdIn.envMapIntensity ?? 0, 0, 0.42);
        if (stdIn.color.r + stdIn.color.g + stdIn.color.b < 0.02 && !stdIn.map) {
          stdIn.color.setScalar(0.72);
        }
        stdIn.needsUpdate = true;
        snapshotArcadeMaterialBase(stdIn);
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
          envMapIntensity: 0.38,
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
        snapshotArcadeMaterialBase(std);
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
          envMapIntensity: 0.38,
        });
        setColorTextureSRGB(std.map);
        setColorTextureSRGB(std.emissiveMap);
        lambert.dispose();
        std.needsUpdate = true;
        snapshotArcadeMaterialBase(std);
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
          envMapIntensity: 0.35,
        });
        setColorTextureSRGB(std.map);
        basic.dispose();
        std.needsUpdate = true;
        snapshotArcadeMaterialBase(std);
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

/**
 * Radbro tread FBX uses MeshPhysical (sheen/specular layers). With no scene `environment`, that reads as
 * blown-out white in play and flat grey on select. Strip to plain Standard + conservative PBR.
 */
function flattenRadbroPhysicalMaterials(root: THREE.Object3D): void {
  root.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (!mesh.isMesh) return;
    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    const next: THREE.Material[] = [];
    for (const m of mats) {
      const phys = m as THREE.MeshPhysicalMaterial;
      if (phys.isMeshPhysicalMaterial) {
        const std = new THREE.MeshStandardMaterial({
          name: phys.name,
          color: phys.color.clone(),
          map: phys.map,
          normalMap: phys.normalMap,
          normalScale: phys.normalScale?.clone() ?? new THREE.Vector2(1, 1),
          roughnessMap: phys.roughnessMap,
          metalnessMap: phys.metalnessMap,
          aoMap: phys.aoMap,
          bumpMap: phys.bumpMap,
          bumpScale: phys.bumpScale ?? 1,
          emissive: phys.emissive.clone(),
          emissiveMap: phys.emissiveMap,
          emissiveIntensity: phys.emissiveIntensity,
          roughness: THREE.MathUtils.clamp(phys.roughness, 0.42, 0.92),
          metalness: THREE.MathUtils.clamp(phys.metalness, 0, 0.18),
          envMapIntensity: 0,
          side: THREE.DoubleSide,
          transparent: false,
          depthWrite: true,
        });
        setColorTextureSRGB(std.map);
        setColorTextureSRGB(std.emissiveMap);
        setDataTextureLinear(std.normalMap);
        setDataTextureLinear(std.roughnessMap);
        setDataTextureLinear(std.metalnessMap);
        setDataTextureLinear(std.aoMap);
        setDataTextureLinear(std.bumpMap);
        phys.dispose();
        next.push(std);
      } else {
        next.push(m);
      }
    }
    mesh.material = next.length === 1 ? next[0]! : next;
  });
}

/** Final Radbro pass: diffuse-first shading, no env probe, refresh material snapshots for UI highlight. */
function toneRadbroForArcade(root: THREE.Object3D): void {
  root.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (!mesh.isMesh) return;
    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    for (const m of mats) {
      const sm = m as THREE.MeshStandardMaterial;
      if (!sm.isMeshStandardMaterial) continue;
      sm.envMap = null;
      sm.envMapIntensity = 0;
      // Maps multiply uniforms — a dark metalness tex or glossy roughness tex still reads metallic in play.
      sm.metalnessMap = null;
      sm.roughnessMap = null;
      sm.metalness = THREE.MathUtils.clamp(sm.metalness * 0.4, 0, 0.06);
      sm.roughness = THREE.MathUtils.clamp(Math.max(sm.roughness, 0.55), 0.55, 0.95);
      sm.emissive.setRGB(0, 0, 0);
      sm.emissiveIntensity = 0;
      sm.needsUpdate = true;
      const u = sm.userData as { arcadeMatBase?: ArcadeMatSnapshot };
      delete u.arcadeMatBase;
      snapshotArcadeMaterialBase(sm);
    }
  });
}

export function prepareArcadeModel(
  root: THREE.Group,
  opts?: { characterId?: ArcadeCharacterId },
): void {
  repairFbxMaterials(root);
  if (opts?.characterId === 'radbro') {
    flattenRadbroPhysicalMaterials(root);
    toneRadbroForArcade(root);
  }
  // NOTE: do NOT run sanitizeSceneMaterials here. FBXLoader populates some
  // embedded texture images asynchronously, so any sync sweep will see image
  // data == null and incorrectly strip the texture, leaving characters
  // untextured. repairFbxMaterials already handles the FBX-specific cleanup.
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

/** Dispose mesh data from a loaded FBX group (e.g. after extracting clips only). */
export function disposeArcadeLoadedRoot(root: THREE.Object3D): void {
  root.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (!mesh.isMesh || !mesh.geometry) return;
    mesh.geometry.dispose();
    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    for (const mat of mats) {
      (mat as THREE.Material | undefined)?.dispose?.();
    }
  });
}

/** Load an FBX, clone its animation clips, throw away geometry/materials (no scene add). */
export async function loadArcadeFbxClipsOnly(url: string): Promise<THREE.AnimationClip[]> {
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
    const clips = group.animations?.length ? group.animations.map((c) => c.clone()) : [];
    disposeArcadeLoadedRoot(group);
    return clips;
  } finally {
    console.warn = prevWarn;
  }
}

export async function loadArcadeFbx(
  url: string,
  characterId?: ArcadeCharacterId,
): Promise<{
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
    prepareArcadeModel(group, { characterId });
    const clips = group.animations?.length ? [...group.animations] : [];
    return { root: group, clips };
  } finally {
    console.warn = prevWarn;
  }
}

export function startLoopClip(
  root: THREE.Group,
  clips: THREE.AnimationClip[],
  opts?: { stripRootMotion?: boolean; retarget?: boolean },
): { mixer: THREE.AnimationMixer; action: THREE.AnimationAction | null } {
  const mixer = new THREE.AnimationMixer(root);
  const clip = buildArcadePlayableClip(clips, root, opts);
  if (!clip) return { mixer, action: null };
  const action = mixer.clipAction(clip);
  action.setLoop(THREE.LoopRepeat, Infinity);
  action.play();
  return { mixer, action };
}
