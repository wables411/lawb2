import * as THREE from 'three';
import {
  setupUnderwaterLighting,
  setupUnderwaterFog,
  createSandFloor,
  createCausticPlane,
  createGodRays,
  createDustMotes,
  createBubbleParticles,
  createUnderwaterSkydome,
  createWaterSurface,
  createKelpField,
  createFishSchool,
  createJellyfish,
  createSeafloorDetailField,
  createRoomLandmarks,
  animateBubbles,
  animateCaustics,
  animateGodRays,
  animateDustMotes,
  animateSkydome,
  animateWaterSurface,
  animateKelpCurrent,
  animateFishSchool,
  animateJellyfish,
  animatePlantCurrentSway,
  createBioluminescentPlanktonCloud,
  animateBioluminescentPlanktonCloud,
  createShipwreckAmbienceNodes,
  animateShipwreckAmbienceNodes,
  getCurrentBiome,
} from '../utils/worldObjects';
import { FLOOR_Y, LAZY_ROOM_LOADING } from './WorldConfig';
import { ROOM_OFFSETS } from './WorldConfig';
import { loadModel } from './WorldCharacter';
import type { FishSchoolBehavior, FishSpecies } from '../utils/worldObjects';
import type { RoomContentRefs } from './WorldRoomContent';

export interface EnvironmentRefs {
  lights: {
    ambient: THREE.AmbientLight;
    directional: THREE.DirectionalLight;
    hemisphere: THREE.HemisphereLight;
    fillLight: THREE.DirectionalLight;
  };
  bubbles: THREE.Points;
  caustic: THREE.Mesh;
  godRays: THREE.Group;
  dustMotes: THREE.Points;
  skydome: THREE.Mesh;
  waterSurface: THREE.Mesh;
  kelp: THREE.Group;
  fishSchools: THREE.Group[];
  jellyfish: THREE.Group;
  seafloorDetails: THREE.Group;
  roomLandmarks: THREE.Group;
  transitionFlora: THREE.Group;
  bioluminescentClouds: THREE.Group;
  shipwreckAmbience: THREE.Group;
  titanSubmersible: THREE.Group;
  currentVector: THREE.Vector3;
  currentStrength: number;
  currentBoost: number;
  bioluminescenceBoost: number;
  predatorFrenzyBoost: number;
  sonarPulseBoost: number;
  /** When LAZY_ROOM_LOADING: room-specific content. Replaced when loading new room. */
  roomContentRefs: RoomContentRefs | null;
}

function addTitanProceduralFallback(titan: THREE.Group): void {
  const hullMat = new THREE.MeshStandardMaterial({
    color: '#ccd3db',
    roughness: 0.48,
    metalness: 0.42,
  });
  const trimMat = new THREE.MeshStandardMaterial({
    color: '#1e2733',
    roughness: 0.5,
    metalness: 0.35,
  });
  const glowMat = new THREE.MeshStandardMaterial({
    color: '#7fd3ff',
    emissive: '#65c8ff',
    emissiveIntensity: 0.55,
    roughness: 0.2,
    metalness: 0.15,
  });
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 2.4, 20), hullMat);
  body.rotation.z = Math.PI / 2;
  titan.add(body);
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.44, 18, 14), hullMat);
  nose.position.set(1.2, 0, 0);
  nose.scale.set(0.88, 0.88, 0.88);
  titan.add(nose);
  const tail = new THREE.Mesh(new THREE.ConeGeometry(0.36, 0.72, 16), trimMat);
  tail.rotation.z = -Math.PI / 2;
  tail.position.set(-1.5, 0, 0);
  titan.add(tail);
  const wingL = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.06, 0.24), trimMat);
  wingL.position.set(0, -0.28, 0.24);
  titan.add(wingL);
  const wingR = wingL.clone();
  wingR.position.z = -0.24;
  titan.add(wingR);
  for (let i = 0; i < 3; i++) {
    const porthole = new THREE.Mesh(new THREE.CircleGeometry(0.075, 16), glowMat);
    porthole.rotation.y = Math.PI / 2;
    porthole.position.set(0.35 + i * 0.35, 0.02, 0.28);
    titan.add(porthole);
  }
}

export function createTitanSubmersible(anchor: THREE.Vector3): THREE.Group {
  const titan = new THREE.Group();
  titan.name = 'titan_submersible';

  const headlight = new THREE.PointLight(0x9ee2ff, 1.2, 16, 2);
  headlight.position.set(1.35, 0.02, 0);
  headlight.userData.baseIntensity = 1.2;
  titan.add(headlight);

  titan.position.copy(anchor);
  titan.scale.setScalar(2.5);
  titan.userData.home = anchor.clone();
  titan.userData.phase = Math.random() * Math.PI * 2;
  titan.userData.commandPulseUntil = 0;

  // Load exact model first; only show procedural fallback if it fails.
  void loadModel('/local-world-assets/models/TitanSubmersible.glb')
    .then((loaded) => {
      const box = new THREE.Box3().setFromObject(loaded);
      const size = new THREE.Vector3();
      const center = new THREE.Vector3();
      box.getSize(size);
      box.getCenter(center);
      const maxDim = Math.max(0.001, size.x, size.y, size.z);
      const targetDim = 2.8;
      const fitScale = targetDim / maxDim;

      loaded.position.sub(center);
      loaded.scale.setScalar(fitScale);
      loaded.rotation.y = Math.PI / 2;
      loaded.name = 'titan_model_exact';
      loaded.traverse((child: THREE.Object3D) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          mesh.castShadow = true;
          mesh.receiveShadow = true;
        }
      });
      titan.add(loaded);
      titan.userData.modelReady = true;
    })
    .catch(() => {
      titan.userData.modelReady = false;
      addTitanProceduralFallback(titan);
    });

  return titan;
}

function animateTitanSubmersible(
  titan: THREE.Group,
  elapsed: number,
  current: THREE.Vector3,
  currentStrength: number,
  frenzyBoost: number,
  sonarBoost: number,
) {
  const home = (titan.userData.home as THREE.Vector3 | undefined) || titan.position.clone();
  const phase = Number.isFinite(titan.userData.phase) ? Number(titan.userData.phase) : 0;
  const pulseUntil = Number(titan.userData.commandPulseUntil || 0);
  const commandActive = Date.now() < pulseUntil;

  const r = 4.2 + (commandActive ? 3.2 : 0) + frenzyBoost * 1.1;
  const a = elapsed * (0.18 + frenzyBoost * 0.06) + phase;
  const titanDive = commandActive ? Math.sin((Date.now() - (pulseUntil - 14000)) * 0.002) * 0.8 : 0;
  const target = new THREE.Vector3(
    home.x + Math.cos(a) * r + current.x * currentStrength * 0.75,
    home.y + Math.sin(elapsed * 0.9 + phase) * 0.22 + titanDive,
    home.z + Math.sin(a * 0.8) * r * 0.7 + current.z * currentStrength * 0.75,
  );
  titan.position.lerp(target, 0.05 + frenzyBoost * 0.02);

  const tangent = new THREE.Vector3(-Math.sin(a), 0, Math.cos(a * 0.8)).normalize();
  const targetYaw = Math.atan2(tangent.x, tangent.z);
  titan.rotation.y = THREE.MathUtils.damp(titan.rotation.y, targetYaw, 3.4, 1 / 60);
  titan.rotation.z = Math.sin(elapsed * 1.3 + phase) * (commandActive ? 0.12 : 0.05);

  titan.children.forEach((child) => {
    if (child instanceof THREE.PointLight) {
      const base = Number(child.userData.baseIntensity || 1.2);
      const sonarPulse = 1 + sonarBoost * (0.45 + 0.55 * Math.sin(elapsed * 10));
      const commandPulse = commandActive ? 2.8 + 1.2 * Math.sin(elapsed * 8) : 1;
      child.intensity = base * sonarPulse * commandPulse;
    }
  });
}

const TERRAIN_FLOOR_URL = '/local-world-assets/models/terrain1.glb';
const FLOOR_TARGET_SIZE = 250;

/** Load terrain1.glb as the floor; scales to cover targetSize, positions at floorY. Returns null on failure. */
export function loadTerrainFloor(floorY: number, targetSize: number = FLOOR_TARGET_SIZE): Promise<THREE.Group | null> {
  return loadModel(TERRAIN_FLOOR_URL)
    .then((group) => {
      const box = new THREE.Box3().setFromObject(group);
      const size = new THREE.Vector3();
      const center = new THREE.Vector3();
      box.getSize(size);
      box.getCenter(center);
      const maxHoriz = Math.max(size.x, size.z);
      const scale = maxHoriz > 0.001 ? targetSize / maxHoriz : 1;
      group.scale.setScalar(scale);
      group.position.set(-center.x * scale, floorY - box.min.y * scale, -center.z * scale);
      group.name = 'terrain_floor';
      group.traverse((child: THREE.Object3D) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          mesh.castShadow = true;
          mesh.receiveShadow = true;
        }
      });
      return group;
    })
    .catch((err) => {
      console.warn('[WorldEnvironment] Failed to load terrain floor, using sand fallback:', err);
      return null;
    });
}

export function createEnvironment(scene: THREE.Scene, isStreamMode: boolean = false): EnvironmentRefs {
  setupUnderwaterFog(scene, true);
  const lights = setupUnderwaterLighting(scene, true);

  const floor = createSandFloor(FLOOR_TARGET_SIZE);
  floor.position.y = FLOOR_Y;
  floor.name = 'floor_placeholder';
  scene.add(floor);

  void loadTerrainFloor(FLOOR_Y, FLOOR_TARGET_SIZE).then((terrain) => {
    if (terrain) {
      scene.remove(floor);
      if (floor.geometry) floor.geometry.dispose();
      const mat = floor.material as THREE.Material;
      if (mat) {
        if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
        else mat.dispose();
      }
      scene.add(terrain);
    }
  });

  const bubbles = createBubbleParticles(isStreamMode ? 180 : 420);
  scene.add(bubbles);

  const caustic = createCausticPlane();
  caustic.position.y = FLOOR_Y + 0.02;
  scene.add(caustic);

  const godRays = createGodRays(isStreamMode ? 10 : 20);
  scene.add(godRays);

  const dustMotes = createDustMotes(isStreamMode ? 120 : 300);
  scene.add(dustMotes);

  const skydome = createUnderwaterSkydome(90);
  scene.add(skydome);

  const waterSurface = createWaterSurface(100);
  waterSurface.position.y = 8;
  scene.add(waterSurface);

  let kelp = new THREE.Group();
  kelp.name = 'kelp_rooms';
  const fishSchools: THREE.Group[] = [];
  let jellyfish = new THREE.Group();
  jellyfish.name = 'jellyfish_rooms';
  let seafloorDetails = new THREE.Group();
  seafloorDetails.name = 'seafloor_rooms';
  let roomLandmarks = new THREE.Group();
  roomLandmarks.name = 'room_landmarks';
  let transitionFlora = new THREE.Group();
  transitionFlora.name = 'transition_flora';
  let bioluminescentClouds = new THREE.Group();
  bioluminescentClouds.name = 'bioluminescent_clouds';
  let shipwreckAmbience: THREE.Group = new THREE.Group();
  shipwreckAmbience.name = 'shipwreck_ambience';
  let titanSubmersible: THREE.Group = new THREE.Group();
  titanSubmersible.name = 'titan_submersible';

  if (!LAZY_ROOM_LOADING) {
    const absorbKelpField = (count: number, spread: number, offset: THREE.Vector3) => {
      const field = createKelpField(count, spread, FLOOR_Y);
      field.children.forEach((child) => {
        child.position.add(offset);
        kelp.add(child);
      });
    };
    if (isStreamMode) {
      absorbKelpField(16, 14, ROOM_OFFSETS.main.clone().add(new THREE.Vector3(-20, 0, -14)));
      absorbKelpField(16, 14, ROOM_OFFSETS.main.clone().add(new THREE.Vector3(20, 0, -14)));
      absorbKelpField(12, 14, ROOM_OFFSETS.bedroom);
      absorbKelpField(14, 16, ROOM_OFFSETS.workshop);
      absorbKelpField(8, 10, ROOM_OFFSETS.vault);
    } else {
      absorbKelpField(40, 28, ROOM_OFFSETS.main);
      absorbKelpField(16, 16, ROOM_OFFSETS.bedroom);
      absorbKelpField(20, 20, ROOM_OFFSETS.workshop);
      absorbKelpField(8, 12, ROOM_OFFSETS.vault);
    }
    scene.add(kelp);

    const addTransitionKelp = (count: number, spread: number, center: THREE.Vector3) => {
      const patch = createKelpField(count, spread, FLOOR_Y);
      patch.children.forEach((child) => {
        child.position.add(center);
        transitionFlora.add(child);
      });
    };
    const transitionAnchors = [
      ROOM_OFFSETS.main.clone().add(new THREE.Vector3(-14, 0, -12)),
      ROOM_OFFSETS.main.clone().add(new THREE.Vector3(14, 0, -12)),
      ROOM_OFFSETS.main.clone().add(new THREE.Vector3(0, 0, -20)),
      ROOM_OFFSETS.main.clone().add(new THREE.Vector3(16, 0, 6)),
    ];
    transitionAnchors.forEach((anchor) => {
      addTransitionKelp(isStreamMode ? 8 : 14, isStreamMode ? 6 : 10, anchor);
    });
    scene.add(transitionFlora);

    const spawnFishSchool = (
      count: number,
      radius: number,
      roomOffset: THREE.Vector3,
      species: FishSpecies,
      behavior: FishSchoolBehavior,
    ) => {
      const school = createFishSchool(count, { species, behavior });
      school.position.set(
        roomOffset.x + (Math.random() - 0.5) * radius,
        FLOOR_Y + 1 + Math.random() * 3,
        roomOffset.z + (Math.random() - 0.5) * radius,
      );
      scene.add(school);
      fishSchools.push(school);
    };
    if (isStreamMode) {
      spawnFishSchool(12, 12, ROOM_OFFSETS.main.clone().add(new THREE.Vector3(18, 0, -12)), 'reef', 'orbit');
      spawnFishSchool(8, 12, ROOM_OFFSETS.main.clone().add(new THREE.Vector3(-18, 0, -12)), 'dart', 'scatter');
      spawnFishSchool(6, 9, ROOM_OFFSETS.workshop, 'predator', 'patrol');
      spawnFishSchool(8, 8, ROOM_OFFSETS.bedroom, 'reef', 'orbit');
      spawnFishSchool(5, 7, ROOM_OFFSETS.vault, 'bottom', 'patrol');
    } else {
      spawnFishSchool(24, 20, ROOM_OFFSETS.main, 'reef', 'orbit');
      spawnFishSchool(18, 16, ROOM_OFFSETS.main, 'dart', 'scatter');
      spawnFishSchool(12, 12, ROOM_OFFSETS.workshop, 'predator', 'patrol');
      spawnFishSchool(12, 10, ROOM_OFFSETS.bedroom, 'reef', 'orbit');
      spawnFishSchool(10, 8, ROOM_OFFSETS.vault, 'bottom', 'patrol');
    }

    const absorbJellyfishField = (count: number, spread: number, offset: THREE.Vector3) => {
      const field = createJellyfish(count, spread);
      field.children.forEach((child) => {
        child.position.add(offset);
        jellyfish.add(child);
      });
    };
    if (isStreamMode) {
      absorbJellyfishField(4, 18, ROOM_OFFSETS.main);
      absorbJellyfishField(2, 12, ROOM_OFFSETS.bedroom);
      absorbJellyfishField(2, 14, ROOM_OFFSETS.workshop);
      absorbJellyfishField(1, 8, ROOM_OFFSETS.vault);
    } else {
      absorbJellyfishField(4, 18, ROOM_OFFSETS.main);
      absorbJellyfishField(2, 12, ROOM_OFFSETS.bedroom);
      absorbJellyfishField(2, 14, ROOM_OFFSETS.workshop);
      absorbJellyfishField(1, 8, ROOM_OFFSETS.vault);
    }
    scene.add(jellyfish);

    const addSeafloorDetails = (count: number, spread: number, offset: THREE.Vector3) => {
      const details = createSeafloorDetailField(count, spread, FLOOR_Y);
      details.position.copy(offset);
      seafloorDetails.add(details);
    };
    if (isStreamMode) {
      addSeafloorDetails(80, 14, ROOM_OFFSETS.main.clone().add(new THREE.Vector3(-22, 0, -14)));
      addSeafloorDetails(80, 14, ROOM_OFFSETS.main.clone().add(new THREE.Vector3(22, 0, -14)));
      addSeafloorDetails(70, 16, ROOM_OFFSETS.bedroom);
      addSeafloorDetails(70, 16, ROOM_OFFSETS.workshop);
      addSeafloorDetails(45, 12, ROOM_OFFSETS.vault);
    } else {
      addSeafloorDetails(520, 44, ROOM_OFFSETS.main);
      addSeafloorDetails(210, 22, ROOM_OFFSETS.bedroom);
      addSeafloorDetails(250, 24, ROOM_OFFSETS.workshop);
      addSeafloorDetails(90, 16, ROOM_OFFSETS.vault);
    }
    scene.add(seafloorDetails);

    if (!isStreamMode) {
      const landmarks = createRoomLandmarks(ROOM_OFFSETS, FLOOR_Y);
      roomLandmarks.add(landmarks);
      scene.add(roomLandmarks);
    }

    const bioCount = isStreamMode ? 80 : 220;
    const bioCountV = isStreamMode ? 60 : 180;
    const bioCountW = isStreamMode ? 50 : 160;
    bioluminescentClouds.add(
      createBioluminescentPlanktonCloud(bioCount, 7, ROOM_OFFSETS.main.clone().add(new THREE.Vector3(-4, 0.8, -16))),
      createBioluminescentPlanktonCloud(bioCountV, 6, ROOM_OFFSETS.vault.clone().add(new THREE.Vector3(0, 0.6, 2))),
      createBioluminescentPlanktonCloud(bioCountW, 5, ROOM_OFFSETS.workshop.clone().add(new THREE.Vector3(-3, 0.4, -2))),
    );
    scene.add(bioluminescentClouds);

    shipwreckAmbience = createShipwreckAmbienceNodes([
      ROOM_OFFSETS.main.clone().add(new THREE.Vector3(8, 0.2, -18)),
      ROOM_OFFSETS.workshop.clone().add(new THREE.Vector3(-6, 0.3, -6)),
    ]);
    scene.add(shipwreckAmbience);
    titanSubmersible = createTitanSubmersible(ROOM_OFFSETS.main.clone().add(new THREE.Vector3(-2, FLOOR_Y + 1.2, -21)));
    scene.add(titanSubmersible);
  }

  return {
    lights,
    bubbles,
    caustic,
    godRays,
    dustMotes,
    skydome,
    waterSurface,
    kelp,
    fishSchools,
    jellyfish,
    seafloorDetails,
    roomLandmarks,
    transitionFlora,
    bioluminescentClouds,
    shipwreckAmbience,
    titanSubmersible,
    currentVector: new THREE.Vector3(0, 0, 0),
    currentStrength: 0,
    currentBoost: 1,
    bioluminescenceBoost: 1,
    predatorFrenzyBoost: 0,
    sonarPulseBoost: 0,
    roomContentRefs: null,
  };
}

export function updateEnvironment(
  refs: EnvironmentRefs,
  scene: THREE.Scene,
  camera: THREE.PerspectiveCamera,
  elapsed: number,
  delta: number,
) {
  const nearestRoom = Object.entries(ROOM_OFFSETS).reduce(
    (best, [key, offset]) => {
      const d = camera.position.distanceTo(new THREE.Vector3(offset.x, camera.position.y, offset.z));
      return d < best.dist ? { key, dist: d } : best;
    },
    { key: 'main', dist: Number.POSITIVE_INFINITY }
  );
  const roomCurrentBias: Record<string, { x: number; z: number; turbulence: number }> = {
    main: { x: 0.45, z: 0.2, turbulence: 0.35 },
    bedroom: { x: 0.15, z: -0.22, turbulence: 0.2 },
    workshop: { x: 0.58, z: 0.35, turbulence: 0.65 },
    vault: { x: -0.42, z: -0.55, turbulence: 0.72 },
    leaderboard: { x: 0.25, z: -0.12, turbulence: 0.28 },
  };
  const bias = roomCurrentBias[nearestRoom.key] || roomCurrentBias.main;
  const baseCurrentX = Math.sin(elapsed * 0.24) * 0.65 + Math.sin(elapsed * 0.57) * 0.3 + bias.x;
  const baseCurrentZ = Math.cos(elapsed * 0.2 + 1.2) * 0.6 + Math.sin(elapsed * 0.33) * 0.25 + bias.z;
  const turbulence = Math.sin(elapsed * 1.9 + camera.position.x * 0.07) * Math.cos(elapsed * 1.3 + camera.position.z * 0.06);
  refs.currentStrength = (0.6 + 0.4 * (0.5 + 0.5 * Math.sin(elapsed * 0.11))) * Math.max(0.2, refs.currentBoost || 1);
  refs.currentVector
    .set(baseCurrentX + turbulence * bias.turbulence, 0, baseCurrentZ - turbulence * bias.turbulence * 0.8)
    .multiplyScalar(0.45);

  animateBubbles(refs.bubbles, delta);
  animateCaustics(refs.caustic, elapsed);
  animateGodRays(refs.godRays, elapsed);
  animateDustMotes(refs.dustMotes, elapsed, delta);
  animateSkydome(refs.skydome, elapsed);
  animateWaterSurface(refs.waterSurface, elapsed);

  const room = refs.roomContentRefs;
  const kelp = room ? room.kelp : refs.kelp;
  const transitionFlora = room ? room.transitionFlora : refs.transitionFlora;
  const fishSchools = room ? room.fishSchools : refs.fishSchools;
  const jellyfish = room ? room.jellyfish : refs.jellyfish;
  const bioluminescentClouds = room ? room.bioluminescentClouds : refs.bioluminescentClouds;
  const shipwreckAmbience = room ? room.shipwreckAmbience : refs.shipwreckAmbience;
  const titanSubmersible = room?.titanSubmersible ?? refs.titanSubmersible;

  animateKelpCurrent(kelp, elapsed, refs.currentVector, refs.currentStrength);
  animateKelpCurrent(transitionFlora, elapsed, refs.currentVector, refs.currentStrength * 1.15);
  refs.predatorFrenzyBoost = Math.max(0, refs.predatorFrenzyBoost - delta * 0.22);
  refs.sonarPulseBoost = Math.max(0, refs.sonarPulseBoost - delta * 0.7);
  fishSchools.forEach((s) =>
    animateFishSchool(
      s,
      elapsed,
      refs.currentVector,
      refs.currentStrength,
      camera.position,
      refs.predatorFrenzyBoost,
    )
  );
  animateJellyfish(jellyfish, elapsed, refs.currentVector, refs.currentStrength);
  animatePlantCurrentSway(scene, elapsed, refs.currentVector, refs.currentStrength);
  const sonarBeat = refs.sonarPulseBoost > 0 ? 0.45 + 0.55 * Math.sin(elapsed * 12) : 0;
  const bioIntensity = THREE.MathUtils.clamp(
    refs.bioluminescenceBoost * (1.0 + (refs.currentStrength - 0.5) * 0.35) * (1 + sonarBeat * refs.sonarPulseBoost),
    0.25,
    2.6
  );
  bioluminescentClouds.children.forEach((child) => {
    if (child instanceof THREE.Points) {
      animateBioluminescentPlanktonCloud(child, elapsed, delta, bioIntensity);
    }
  });
  animateShipwreckAmbienceNodes(shipwreckAmbience, elapsed, bioIntensity * (1 + refs.sonarPulseBoost * 0.55));
  if (titanSubmersible && titanSubmersible.children.length > 0) {
    animateTitanSubmersible(
      titanSubmersible,
      elapsed,
      refs.currentVector,
      refs.currentStrength,
      refs.predatorFrenzyBoost,
      refs.sonarPulseBoost,
    );
  }

  // Biome-based fog blending
  const biome = getCurrentBiome(camera.position.x, camera.position.z);
  if (scene.fog && scene.fog instanceof THREE.Fog) {
    const targetColor = new THREE.Color(biome.fogColor);
    scene.fog.color.lerp(targetColor, delta * 1.5);
    scene.fog.near += (biome.fogNear - scene.fog.near) * delta * 1.5;
    scene.fog.far += (biome.fogFar - scene.fog.far) * delta * 1.5;
    (scene.background as THREE.Color)?.lerp(targetColor, delta * 1.5);
  }
}
