import * as THREE from 'three';
import type { PickupKind } from './arcadePickupKinds';

/** Per-kind scale multiplier (applied after GLB fit or on primitives). */
export const PICKUP_VISUAL_SCALE: Record<PickupKind, number> = {
  air_tank: 1.18,
  coin: 1.28,
  trash: 1.15,
  cheese: 1.22,
  peptides: 1.2,
  jellyfish: 1.32,
  pufferfish: 1.28,
  mine: 1.38,
};

/** Primitive fallback when no GLB template exists for this kind. */
export function createPrimitivePickupMesh(kind: PickupKind): THREE.Mesh {
  let mesh: THREE.Mesh;
  switch (kind) {
    case 'air_tank':
      mesh = new THREE.Mesh(
        new THREE.CylinderGeometry(0.24, 0.32, 0.62, 12),
        new THREE.MeshStandardMaterial({
          color: 0x5ee0ff,
          emissive: 0x1a6088,
          emissiveIntensity: 0.55,
          metalness: 0.42,
          roughness: 0.38,
        }),
      );
      break;
    case 'coin':
      mesh = new THREE.Mesh(
        new THREE.CylinderGeometry(0.3, 0.3, 0.1, 20),
        new THREE.MeshStandardMaterial({
          color: 0xffdd44,
          emissive: 0xaa6600,
          emissiveIntensity: 0.55,
          metalness: 0.82,
          roughness: 0.22,
        }),
      );
      mesh.rotation.x = Math.PI / 2;
      break;
    case 'trash':
      mesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.48, 0.38, 0.4),
        new THREE.MeshStandardMaterial({
          color: 0x8a9098,
          emissive: 0x222428,
          emissiveIntensity: 0.15,
          roughness: 0.82,
        }),
      );
      mesh.rotation.y = Math.random() * Math.PI;
      break;
    case 'cheese':
      mesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.44, 0.26, 0.48),
        new THREE.MeshStandardMaterial({
          color: 0xfff0a0,
          emissive: 0xaa8800,
          emissiveIntensity: 0.42,
          roughness: 0.55,
        }),
      );
      mesh.rotation.y = Math.random() * 0.8;
      break;
    case 'peptides':
      mesh = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.19, 0.46, 5, 10),
        new THREE.MeshStandardMaterial({
          color: 0x6cffb8,
          emissive: 0x148050,
          emissiveIntensity: 0.62,
          roughness: 0.42,
        }),
      );
      break;
    case 'jellyfish':
      mesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.38, 16, 14),
        new THREE.MeshStandardMaterial({
          color: 0xd4a8ff,
          emissive: 0x6b2fc4,
          emissiveIntensity: 0.75,
          transparent: true,
          opacity: 0.94,
          roughness: 0.35,
        }),
      );
      mesh.scale.set(1.05, 0.82, 1.05);
      break;
    case 'pufferfish':
      mesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.42, 14, 12),
        new THREE.MeshStandardMaterial({
          color: 0xe8c49a,
          emissive: 0x6a4830,
          emissiveIntensity: 0.38,
          roughness: 0.48,
        }),
      );
      break;
    case 'mine':
      mesh = new THREE.Mesh(
        new THREE.IcosahedronGeometry(0.4, 0),
        new THREE.MeshStandardMaterial({
          color: 0x252530,
          emissive: 0xff1a00,
          emissiveIntensity: 0.85,
          metalness: 0.62,
          roughness: 0.32,
        }),
      );
      break;
    default:
      mesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.35, 0.35, 0.35),
        new THREE.MeshStandardMaterial({ color: 0xffffff }),
      );
  }
  mesh.userData.pickupKind = kind;
  const s = PICKUP_VISUAL_SCALE[kind] ?? 1.15;
  mesh.scale.multiplyScalar(s);
  return mesh;
}

/** @deprecated Use `createPrimitivePickupMesh` or `clonePickupVisual`. */
export function pickupMeshForKind(kind: PickupKind): THREE.Mesh {
  return createPrimitivePickupMesh(kind);
}

const PULSE_TABLE: Record<PickupKind, { rate: number; amp: number }> = {
  mine: { rate: 12, amp: 0.5 },
  jellyfish: { rate: 7, amp: 0.28 },
  pufferfish: { rate: 6, amp: 0.2 },
  peptides: { rate: 8, amp: 0.22 },
  cheese: { rate: 9, amp: 0.25 },
  coin: { rate: 10, amp: 0.18 },
  air_tank: { rate: 5, amp: 0.12 },
  trash: { rate: 3, amp: 0.06 },
};

/** Emissive pulse on all `MeshStandardMaterial` children (GLB or primitive). */
export function pulsePickupVisual(root: THREE.Object3D, elapsed: number): void {
  const kind = root.userData.pickupKind as PickupKind | undefined;
  if (!kind) return;
  const { rate, amp } = PULSE_TABLE[kind];
  root.traverse((child) => {
    if (!(child as THREE.Mesh).isMesh) return;
    const mesh = child as THREE.Mesh;
    const mat = mesh.material;
    if (!(mat instanceof THREE.MeshStandardMaterial)) return;
    if (mesh.userData._emBase == null) {
      mesh.userData._emBase = mat.emissiveIntensity;
    }
    const base = mesh.userData._emBase as number;
    mat.emissiveIntensity = base * (1 + Math.sin(elapsed * rate) * amp);
  });
}

export function spinPickupVisual(root: THREE.Object3D, dt: number): void {
  const kind = root.userData.pickupKind as PickupKind | undefined;
  if (kind === 'coin') {
    root.rotation.y += dt * 2.8;
  } else if (kind === 'cheese' || kind === 'trash') {
    root.rotation.y += dt * 1.2;
  } else if (kind === 'air_tank') {
    root.rotation.y += dt * 0.9;
  } else if (kind === 'mine') {
    root.rotation.y += dt * 1.6;
    root.rotation.x += dt * 0.4;
  }
}
