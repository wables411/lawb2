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
  animateKelp,
  animateFishSchool,
  animateJellyfish,
  getCurrentBiome,
} from '../utils/worldObjects';
import { FLOOR_Y } from './WorldConfig';
import { ROOM_OFFSETS } from './WorldConfig';

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
}

export function createEnvironment(scene: THREE.Scene, isStreamMode: boolean = false): EnvironmentRefs {
  setupUnderwaterFog(scene, true);
  const lights = setupUnderwaterLighting(scene, true);

  const floor = createSandFloor(250);
  floor.position.y = FLOOR_Y;
  scene.add(floor);

  const bubbles = createBubbleParticles(250);
  scene.add(bubbles);

  const caustic = createCausticPlane();
  caustic.position.y = FLOOR_Y + 0.02;
  scene.add(caustic);

  const godRays = createGodRays(14);
  scene.add(godRays);

  const dustMotes = createDustMotes(300);
  scene.add(dustMotes);

  const skydome = createUnderwaterSkydome(90);
  scene.add(skydome);

  const waterSurface = createWaterSurface(100);
  waterSurface.position.y = 8;
  scene.add(waterSurface);

  const kelp = new THREE.Group();
  kelp.name = 'kelp_rooms';
  const absorbKelpField = (count: number, spread: number, offset: THREE.Vector3) => {
    const field = createKelpField(count, spread, FLOOR_Y);
    field.children.forEach((child) => {
      child.position.add(offset);
      kelp.add(child);
    });
  };
  // Room density profile: in stream mode, keep center lane visually clear.
  if (isStreamMode) {
    absorbKelpField(4, 10, ROOM_OFFSETS.main.clone().add(new THREE.Vector3(-20, 0, -14)));
    absorbKelpField(4, 10, ROOM_OFFSETS.main.clone().add(new THREE.Vector3(20, 0, -14)));
    absorbKelpField(4, 10, ROOM_OFFSETS.bedroom);
    absorbKelpField(5, 10, ROOM_OFFSETS.workshop);
    absorbKelpField(2, 7, ROOM_OFFSETS.vault);
  } else {
    absorbKelpField(22, 22, ROOM_OFFSETS.main);
    absorbKelpField(8, 12, ROOM_OFFSETS.bedroom);
    absorbKelpField(10, 14, ROOM_OFFSETS.workshop);
    absorbKelpField(3, 8, ROOM_OFFSETS.vault);
  }
  scene.add(kelp);

  const fishSchools: THREE.Group[] = [];
  const spawnFishSchool = (count: number, radius: number, roomOffset: THREE.Vector3) => {
    const school = createFishSchool(count);
    school.position.set(
      roomOffset.x + (Math.random() - 0.5) * radius,
      FLOOR_Y + 1 + Math.random() * 3,
      roomOffset.z + (Math.random() - 0.5) * radius,
    );
    scene.add(school);
    fishSchools.push(school);
  };
  if (isStreamMode) {
    spawnFishSchool(9, 10, ROOM_OFFSETS.main.clone().add(new THREE.Vector3(18, 0, -12)));
    spawnFishSchool(8, 9, ROOM_OFFSETS.main.clone().add(new THREE.Vector3(-18, 0, -12)));
    spawnFishSchool(8, 10, ROOM_OFFSETS.workshop);
    spawnFishSchool(6, 8, ROOM_OFFSETS.bedroom);
  } else {
    spawnFishSchool(20, 20, ROOM_OFFSETS.main);
    spawnFishSchool(16, 16, ROOM_OFFSETS.main);
    spawnFishSchool(14, 12, ROOM_OFFSETS.workshop);
    spawnFishSchool(10, 10, ROOM_OFFSETS.bedroom);
    spawnFishSchool(8, 8, ROOM_OFFSETS.vault);
  }

  const jellyfish = new THREE.Group();
  jellyfish.name = 'jellyfish_rooms';
  const absorbJellyfishField = (count: number, spread: number, offset: THREE.Vector3) => {
    const field = createJellyfish(count, spread);
    field.children.forEach((child) => {
      child.position.add(offset);
      jellyfish.add(child);
    });
  };
  if (isStreamMode) {
    absorbJellyfishField(1, 8, ROOM_OFFSETS.main.clone().add(new THREE.Vector3(-20, 0, -12)));
    absorbJellyfishField(1, 10, ROOM_OFFSETS.workshop);
    absorbJellyfishField(1, 8, ROOM_OFFSETS.bedroom);
  } else {
    absorbJellyfishField(4, 18, ROOM_OFFSETS.main);
    absorbJellyfishField(2, 12, ROOM_OFFSETS.bedroom);
    absorbJellyfishField(2, 14, ROOM_OFFSETS.workshop);
    absorbJellyfishField(1, 8, ROOM_OFFSETS.vault);
  }
  scene.add(jellyfish);

  const seafloorDetails = new THREE.Group();
  seafloorDetails.name = 'seafloor_rooms';
  const addSeafloorDetails = (count: number, spread: number, offset: THREE.Vector3) => {
    const details = createSeafloorDetailField(count, spread, FLOOR_Y);
    details.position.copy(offset);
    seafloorDetails.add(details);
  };
  if (isStreamMode) {
    addSeafloorDetails(70, 11, ROOM_OFFSETS.main.clone().add(new THREE.Vector3(-22, 0, -14)));
    addSeafloorDetails(70, 11, ROOM_OFFSETS.main.clone().add(new THREE.Vector3(22, 0, -14)));
    addSeafloorDetails(90, 16, ROOM_OFFSETS.bedroom);
    addSeafloorDetails(100, 16, ROOM_OFFSETS.workshop);
    addSeafloorDetails(50, 12, ROOM_OFFSETS.vault);
  } else {
    addSeafloorDetails(520, 44, ROOM_OFFSETS.main);
    addSeafloorDetails(210, 22, ROOM_OFFSETS.bedroom);
    addSeafloorDetails(250, 24, ROOM_OFFSETS.workshop);
    addSeafloorDetails(90, 16, ROOM_OFFSETS.vault);
  }
  scene.add(seafloorDetails);

  const roomLandmarks = createRoomLandmarks(ROOM_OFFSETS, FLOOR_Y);
  scene.add(roomLandmarks);

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
  };
}

export function updateEnvironment(
  refs: EnvironmentRefs,
  scene: THREE.Scene,
  camera: THREE.PerspectiveCamera,
  elapsed: number,
  delta: number,
) {
  animateBubbles(refs.bubbles, delta);
  animateCaustics(refs.caustic, elapsed);
  animateGodRays(refs.godRays, elapsed);
  animateDustMotes(refs.dustMotes, elapsed, delta);
  animateSkydome(refs.skydome, elapsed);
  animateWaterSurface(refs.waterSurface, elapsed);
  animateKelp(refs.kelp, elapsed);
  refs.fishSchools.forEach((s) => animateFishSchool(s, elapsed));
  animateJellyfish(refs.jellyfish, elapsed);

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
