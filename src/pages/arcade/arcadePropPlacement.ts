import * as THREE from 'three';

/**
 * Dispose all geometries and materials under a prop root (cloned GLB/FBX or procedural Group).
 */
export function disposeObject3DResources(root: THREE.Object3D): void {
  root.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      const mesh = child as THREE.Mesh;
      mesh.geometry?.dispose();
      const m = mesh.material;
      if (Array.isArray(m)) m.forEach((mat) => mat.dispose?.());
      else (m as THREE.Material | undefined)?.dispose?.();
    }
  });
}

/**
 * Reef Run hazard placement (see `ArcadeSceneController`):
 * - Parent is positioned at `(LANES[lane], OBSTACLE_CENTER_Y, z)`.
 * - Gameplay collision is **lane index + Z slab only** — not mesh AABB — so the visual can extend
 *   beyond the old red box as long as it feels fair.
 * - Obstacles move along **+world Z** toward the player at `PLAYER_Z` (~2.8). Export models facing +Z
 *   (into the run); if they face +X in DCC, rotate the root `rotation.y = Math.PI / 2` (tune per asset).
 *
 * Pipeline after `GLTFLoader.load` (clone the scene graph per instance):
 * 1. `fitReefObstacleVisual(root, { maxExtent: 2.1 })` — uniform scale + bbox center at local origin.
 * 2. Parent to `obstacleGroup` and set parent position as the controller does for boxes.
 */
export function fitReefObstacleVisual(
  root: THREE.Object3D,
  opts: { maxExtent: number },
): void {
  root.scale.set(1, 1, 1);
  root.position.set(0, 0, 0);
  root.rotation.set(0, 0, 0);
  root.updateMatrixWorld(true);
  let box = new THREE.Box3().setFromObject(root);
  if (box.isEmpty()) return;
  const sz = box.getSize(new THREE.Vector3());
  const maxAxis = Math.max(sz.x, sz.y, sz.z);
  if (maxAxis < 1e-6) return;
  root.scale.setScalar(opts.maxExtent / maxAxis);
  root.updateMatrixWorld(true);
  box = new THREE.Box3().setFromObject(root);
  const c = box.getCenter(new THREE.Vector3());
  root.position.sub(c);
}
