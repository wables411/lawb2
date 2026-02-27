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
}

export function createEnvironment(scene: THREE.Scene): EnvironmentRefs {
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

  const kelp = createKelpField(35, 30, FLOOR_Y);
  scene.add(kelp);

  const fishSchools: THREE.Group[] = [];
  for (let i = 0; i < 3; i++) {
    const school = createFishSchool(20);
    school.position.set(
      (Math.random() - 0.5) * 25,
      FLOOR_Y + 1 + Math.random() * 3,
      (Math.random() - 0.5) * 25,
    );
    scene.add(school);
    fishSchools.push(school);
  }

  const jellyfish = createJellyfish(6, 30);
  scene.add(jellyfish);

  return { lights, bubbles, caustic, godRays, dustMotes, skydome, waterSurface, kelp, fishSchools, jellyfish };
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
