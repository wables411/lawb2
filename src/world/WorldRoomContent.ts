/**
 * Per-room environment content for lazy loading.
 * Creates kelp, fish, jellyfish, seafloor, etc. for a single room.
 */
import * as THREE from 'three';
import {
  createKelpField,
  createFishSchool,
  createJellyfish,
  createSeafloorDetailField,
  createBioluminescentPlanktonCloud,
  createShipwreckAmbienceNodes,
} from '../utils/worldObjects';
import { FLOOR_Y } from './WorldConfig';
import { ROOM_OFFSETS } from './WorldConfig';
import { createTitanSubmersible } from './WorldEnvironment';
import type { FishSchoolBehavior, FishSpecies } from '../utils/worldObjects';

export interface RoomContentRefs {
  kelp: THREE.Group;
  fishSchools: THREE.Group[];
  jellyfish: THREE.Group;
  seafloorDetails: THREE.Group;
  roomLandmarks: THREE.Group;
  transitionFlora: THREE.Group;
  bioluminescentClouds: THREE.Group;
  shipwreckAmbience: THREE.Group;
  titanSubmersible: THREE.Group | null;
  group: THREE.Group;
}

type RoomKey = keyof typeof ROOM_OFFSETS;

const ROOM_KELP_SPEC: Record<string, Array<{ count: number; spread: number; offset: THREE.Vector3 }>> = {
  main: [
    { count: 40, spread: 28, offset: ROOM_OFFSETS.main },
    { count: 16, spread: 14, offset: ROOM_OFFSETS.main.clone().add(new THREE.Vector3(-20, 0, -14)) },
    { count: 16, spread: 14, offset: ROOM_OFFSETS.main.clone().add(new THREE.Vector3(20, 0, -14)) },
  ],
  bedroom: [{ count: 16, spread: 16, offset: ROOM_OFFSETS.bedroom }],
  workshop: [{ count: 20, spread: 20, offset: ROOM_OFFSETS.workshop }],
  vault: [{ count: 8, spread: 12, offset: ROOM_OFFSETS.vault }],
  leaderboard: [],
};

const ROOM_KELP_SPEC_STREAM: Record<string, Array<{ count: number; spread: number; offset: THREE.Vector3 }>> = {
  main: [
    { count: 16, spread: 14, offset: ROOM_OFFSETS.main.clone().add(new THREE.Vector3(-20, 0, -14)) },
    { count: 16, spread: 14, offset: ROOM_OFFSETS.main.clone().add(new THREE.Vector3(20, 0, -14)) },
  ],
  bedroom: [{ count: 12, spread: 14, offset: ROOM_OFFSETS.bedroom }],
  workshop: [{ count: 14, spread: 16, offset: ROOM_OFFSETS.workshop }],
  vault: [{ count: 8, spread: 10, offset: ROOM_OFFSETS.vault }],
  leaderboard: [],
};

const ROOM_FISH_SPEC: Record<string, Array<{ count: number; radius: number; offset: THREE.Vector3; species: FishSpecies; behavior: FishSchoolBehavior }>> = {
  main: [
    { count: 24, radius: 20, offset: ROOM_OFFSETS.main, species: 'reef', behavior: 'orbit' },
    { count: 18, radius: 16, offset: ROOM_OFFSETS.main, species: 'dart', behavior: 'scatter' },
  ],
  bedroom: [{ count: 12, radius: 10, offset: ROOM_OFFSETS.bedroom, species: 'reef', behavior: 'orbit' }],
  workshop: [{ count: 12, radius: 12, offset: ROOM_OFFSETS.workshop, species: 'predator', behavior: 'patrol' }],
  vault: [{ count: 10, radius: 8, offset: ROOM_OFFSETS.vault, species: 'bottom', behavior: 'patrol' }],
  leaderboard: [],
};

const ROOM_FISH_SPEC_STREAM: Record<string, Array<{ count: number; radius: number; offset: THREE.Vector3; species: FishSpecies; behavior: FishSchoolBehavior }>> = {
  main: [
    { count: 12, radius: 12, offset: ROOM_OFFSETS.main.clone().add(new THREE.Vector3(18, 0, -12)), species: 'reef', behavior: 'orbit' },
    { count: 8, radius: 12, offset: ROOM_OFFSETS.main.clone().add(new THREE.Vector3(-18, 0, -12)), species: 'dart', behavior: 'scatter' },
  ],
  bedroom: [{ count: 8, radius: 8, offset: ROOM_OFFSETS.bedroom, species: 'reef', behavior: 'orbit' }],
  workshop: [{ count: 6, radius: 9, offset: ROOM_OFFSETS.workshop, species: 'predator', behavior: 'patrol' }],
  vault: [{ count: 5, radius: 7, offset: ROOM_OFFSETS.vault, species: 'bottom', behavior: 'patrol' }],
  leaderboard: [],
};

const ROOM_JELLYFISH_SPEC: Record<string, Array<{ count: number; spread: number; offset: THREE.Vector3 }>> = {
  main: [{ count: 4, spread: 18, offset: ROOM_OFFSETS.main }],
  bedroom: [{ count: 2, spread: 12, offset: ROOM_OFFSETS.bedroom }],
  workshop: [{ count: 2, spread: 14, offset: ROOM_OFFSETS.workshop }],
  vault: [{ count: 1, spread: 8, offset: ROOM_OFFSETS.vault }],
  leaderboard: [],
};

const ROOM_SEAFLOOR_SPEC: Record<string, Array<{ count: number; spread: number; offset: THREE.Vector3 }>> = {
  main: [
    { count: 520, spread: 44, offset: ROOM_OFFSETS.main },
  ],
  bedroom: [{ count: 210, spread: 22, offset: ROOM_OFFSETS.bedroom }],
  workshop: [{ count: 250, spread: 24, offset: ROOM_OFFSETS.workshop }],
  vault: [{ count: 90, spread: 16, offset: ROOM_OFFSETS.vault }],
  leaderboard: [],
};

const ROOM_SEAFLOOR_SPEC_STREAM: Record<string, Array<{ count: number; spread: number; offset: THREE.Vector3 }>> = {
  main: [
    { count: 80, spread: 14, offset: ROOM_OFFSETS.main.clone().add(new THREE.Vector3(-22, 0, -14)) },
    { count: 80, spread: 14, offset: ROOM_OFFSETS.main.clone().add(new THREE.Vector3(22, 0, -14)) },
  ],
  bedroom: [{ count: 70, spread: 16, offset: ROOM_OFFSETS.bedroom }],
  workshop: [{ count: 70, spread: 16, offset: ROOM_OFFSETS.workshop }],
  vault: [{ count: 45, spread: 12, offset: ROOM_OFFSETS.vault }],
  leaderboard: [],
};

/** Create environment content for a single room. Returns group + refs for animation. */
export function createRoomContent(
  scene: THREE.Scene,
  roomKey: RoomKey,
  isStreamMode: boolean
): RoomContentRefs {
  const group = new THREE.Group();
  group.name = `room_content_${roomKey}`;

  const kelpSpec = isStreamMode ? ROOM_KELP_SPEC_STREAM[roomKey] : ROOM_KELP_SPEC[roomKey];
  const kelp = new THREE.Group();
  kelp.name = `kelp_${roomKey}`;
  if (kelpSpec) {
    kelpSpec.forEach(({ count, spread, offset }) => {
      const field = createKelpField(count, spread, FLOOR_Y);
      field.children.forEach((child) => {
        child.position.add(offset);
        kelp.add(child);
      });
    });
  }
  group.add(kelp);

  const fishSchools: THREE.Group[] = [];
  const fishSpec = isStreamMode ? ROOM_FISH_SPEC_STREAM[roomKey] : ROOM_FISH_SPEC[roomKey];
  if (fishSpec) {
    fishSpec.forEach(({ count, radius, offset, species, behavior }) => {
      const school = createFishSchool(count, { species, behavior });
      school.position.set(
        offset.x + (Math.random() - 0.5) * radius,
        FLOOR_Y + 1 + Math.random() * 3,
        offset.z + (Math.random() - 0.5) * radius
      );
      group.add(school);
      fishSchools.push(school);
    });
  }

  const jellyfishSpec = ROOM_JELLYFISH_SPEC[roomKey];
  const jellyfish = new THREE.Group();
  jellyfish.name = `jellyfish_${roomKey}`;
  if (jellyfishSpec) {
    jellyfishSpec.forEach(({ count, spread, offset }) => {
      const field = createJellyfish(count, spread);
      field.children.forEach((child) => {
        child.position.add(offset);
        jellyfish.add(child);
      });
    });
  }
  group.add(jellyfish);

  const seafloorSpec = isStreamMode ? ROOM_SEAFLOOR_SPEC_STREAM[roomKey] : ROOM_SEAFLOOR_SPEC[roomKey];
  const seafloorDetails = new THREE.Group();
  seafloorDetails.name = `seafloor_${roomKey}`;
  if (seafloorSpec) {
    seafloorSpec.forEach(({ count, spread, offset }) => {
      const details = createSeafloorDetailField(count, spread, FLOOR_Y);
      details.position.copy(offset);
      seafloorDetails.add(details);
    });
  }
  group.add(seafloorDetails);

  const roomLandmarks = new THREE.Group();
  roomLandmarks.name = `landmarks_${roomKey}`;
  if (!isStreamMode && roomKey !== 'leaderboard') {
    const colors: Record<string, string> = { main: '#6f7f96', bedroom: '#8aa6d0', workshop: '#92704f', vault: '#53627f' };
    const offsets: Record<string, [number, number]> = { main: [8, -2], bedroom: [-4, 2], workshop: [4, 2], vault: [0, 4] };
    const center = ROOM_OFFSETS[roomKey];
    const [dx, dz] = offsets[roomKey] ?? [0, 0];
    const mesh = new THREE.Mesh(
      new THREE.TorusGeometry(0.9, 0.12, 10, 18),
      new THREE.MeshStandardMaterial({ color: colors[roomKey] ?? '#6f7f96', roughness: 0.78, metalness: 0.12 }),
    );
    mesh.position.set(center.x + dx, FLOOR_Y + 1.25, center.z + dz);
    mesh.rotation.x = Math.PI / 2;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    roomLandmarks.add(mesh);
  }
  group.add(roomLandmarks);

  const transitionFlora = new THREE.Group();
  transitionFlora.name = `transition_flora_${roomKey}`;
  group.add(transitionFlora);

  const bioluminescentClouds = new THREE.Group();
  bioluminescentClouds.name = `bio_${roomKey}`;
  if (roomKey === 'main') {
    const bioCount = isStreamMode ? 80 : 220;
    bioluminescentClouds.add(createBioluminescentPlanktonCloud(bioCount, 7, ROOM_OFFSETS.main.clone().add(new THREE.Vector3(-4, 0.8, -16))));
  }
  if (roomKey === 'vault') {
    const bioCount = isStreamMode ? 60 : 180;
    bioluminescentClouds.add(createBioluminescentPlanktonCloud(bioCount, 6, ROOM_OFFSETS.vault.clone().add(new THREE.Vector3(0, 0.6, 2))));
  }
  if (roomKey === 'workshop') {
    const bioCount = isStreamMode ? 50 : 160;
    bioluminescentClouds.add(createBioluminescentPlanktonCloud(bioCount, 5, ROOM_OFFSETS.workshop.clone().add(new THREE.Vector3(-3, 0.4, -2))));
  }
  group.add(bioluminescentClouds);

  let shipwreckAmbience = new THREE.Group();
  shipwreckAmbience.name = `shipwreck_${roomKey}`;
  if (roomKey === 'main') {
    shipwreckAmbience = createShipwreckAmbienceNodes([ROOM_OFFSETS.main.clone().add(new THREE.Vector3(8, 0.2, -18))]);
  } else if (roomKey === 'workshop') {
    shipwreckAmbience = createShipwreckAmbienceNodes([ROOM_OFFSETS.workshop.clone().add(new THREE.Vector3(-6, 0.3, -6))]);
  }
  group.add(shipwreckAmbience);

  let titanSubmersible: THREE.Group | null = null;
  if (roomKey === 'main') {
    titanSubmersible = createTitanSubmersible(ROOM_OFFSETS.main.clone().add(new THREE.Vector3(-2, FLOOR_Y + 1.2, -21)));
    group.add(titanSubmersible);
  }

  scene.add(group);

  return {
    kelp,
    fishSchools,
    jellyfish,
    seafloorDetails,
    roomLandmarks,
    transitionFlora,
    bioluminescentClouds,
    shipwreckAmbience,
    titanSubmersible,
    group,
  };
}

/** Remove room content from scene and dispose. */
export function disposeRoomContent(refs: RoomContentRefs): void {
  const disposeObject = (obj: THREE.Object3D) => {
    obj.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.geometry?.dispose();
        const mat = mesh.material;
        if (mat) {
          if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
          else mat.dispose();
        }
      }
    });
  };
  disposeObject(refs.group);
  if (refs.group.parent) refs.group.parent.remove(refs.group);
}
