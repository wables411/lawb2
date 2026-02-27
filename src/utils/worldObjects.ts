/**
 * worldObjects.ts — Shared utility for rendering Clawb's World objects.
 * Used by both WorldBackground (desktop) and ClawbWorld (/world page).
 */
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// --- Types ---

export interface WorldObject {
  id: string;
  type: string;
  position: [number, number, number];
  color: string | null;
  rotation: [number, number, number];
  scale: number;
}

export interface WorldState {
  version: number;
  objectCount: number;
  objects: WorldObject[];
}

// --- Default Colors by Type ---

const DEFAULT_COLORS: Record<string, string> = {
  // Corals — warm tones
  coral_branch: '#e85d75',
  coral_brain: '#d4a06a',
  coral_bulb: '#f0a0b0',
  coral_fan: '#c76b8f',
  coral_tube: '#e8927c',
  // Rocks — gray/brown
  rock_boulder: '#7a7a6e',
  rock_slab: '#8a8578',
  rock_cluster: '#6e6e62',
  rock_arch: '#8a7e72',
  // Plants — greens
  seagrass: '#4a9e5c',
  anemone: '#a85ea0',
  // Decorations
  shell: '#e8d8c0',
  starfish: '#d4785a',
  treasure_chest: '#8b6914',
  bubbler: '#88c8e8',
  // Landmarks
  shell_door: '#d4c8a8',
  cave_crack: '#5a5a52',
};

export function getDefaultColor(type: string): string {
  return DEFAULT_COLORS[type] || '#aaaaaa';
}

// --- GLTF Model Loading Pipeline ---

const gltfLoader = new GLTFLoader();
const modelCache = new Map<string, THREE.Group>();
const modelLoadPromises = new Map<string, Promise<THREE.Group | null>>();

const MODEL_PATHS: Record<string, string> = {
  coral_branch: '/models/coral_branch.glb',
  coral_brain: '/models/coral_brain.glb',
  coral_fan: '/models/coral_fan.glb',
  coral_tube: '/models/coral_tube.glb',
  coral_bulb: '/models/coral_bulb.glb',
  rock_boulder: '/models/rock_boulder.glb',
  rock_slab: '/models/rock_slab.glb',
  rock_cluster: '/models/rock_cluster.glb',
  rock_arch: '/models/rock_arch.glb',
  seagrass: '/models/seagrass.glb',
  anemone: '/models/anemone.glb',
  shell: '/models/shell.glb',
  starfish: '/models/starfish.glb',
  treasure_chest: '/models/treasure_chest.glb',
  shell_door: '/models/shell_door.glb',
  cave_crack: '/models/cave_crack.glb',
};

export function loadWorldModel(type: string): Promise<THREE.Group | null> {
  const path = MODEL_PATHS[type];
  if (!path) return Promise.resolve(null);

  if (modelCache.has(type)) {
    return Promise.resolve(modelCache.get(type)!.clone());
  }

  if (modelLoadPromises.has(type)) {
    return modelLoadPromises.get(type)!.then((g) => g?.clone() ?? null);
  }

  const promise = gltfLoader
    .loadAsync(path)
    .then((gltf) => {
      const scene = gltf.scene;
      scene.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          mesh.castShadow = true;
          mesh.receiveShadow = true;
        }
      });
      modelCache.set(type, scene);
      return scene.clone();
    })
    .catch(() => null);

  modelLoadPromises.set(type, promise);
  return promise;
}

export function preloadModels(): Promise<void> {
  const types = Object.keys(MODEL_PATHS);
  return Promise.all(types.map((t) => loadWorldModel(t))).then(() => {});
}

// --- LOD (Level of Detail) Helper ---

export function applyLOD(
  object: THREE.Object3D,
  cameraPos: THREE.Vector3,
  thresholds: { near: number; mid: number; far: number } = { near: 30, mid: 60, far: 90 },
) {
  const dist = object.position.distanceTo(cameraPos);
  if (dist > thresholds.far) {
    object.visible = false;
  } else {
    object.visible = true;
    const scale = dist > thresholds.mid ? 0.6 : 1.0;
    if (object.userData._lodBaseScale === undefined) {
      object.userData._lodBaseScale = object.scale.x;
    }
    const base = object.userData._lodBaseScale;
    object.scale.setScalar(base * scale);
  }
}

export function applyGroupLOD(
  group: THREE.Group,
  cameraPos: THREE.Vector3,
  thresholds?: { near: number; mid: number; far: number },
) {
  group.children.forEach((child) => applyLOD(child, cameraPos, thresholds));
}

// --- Biome Definitions ---

export interface BiomeDef {
  name: string;
  center: [number, number, number];
  radius: number;
  fogColor: string;
  fogNear: number;
  fogFar: number;
  ambientColor: string;
  ambientIntensity: number;
}

export const BIOMES: BiomeDef[] = [
  {
    name: 'Shallow Reef',
    center: [0, 0, 0],
    radius: 35,
    fogColor: '#14334e',
    fogNear: 8,
    fogFar: 65,
    ambientColor: '#4466aa',
    ambientIntensity: 0.4,
  },
  {
    name: 'NFT Gallery',
    center: [-35, 0, -30],
    radius: 20,
    fogColor: '#0f1a2d',
    fogNear: 5,
    fogFar: 50,
    ambientColor: '#334488',
    ambientIntensity: 0.35,
  },
  {
    name: 'Workshop Forge',
    center: [35, 0, -30],
    radius: 20,
    fogColor: '#1a2030',
    fogNear: 6,
    fogFar: 55,
    ambientColor: '#445588',
    ambientIntensity: 0.35,
  },
  {
    name: 'Deep Trench',
    center: [0, 0, -55],
    radius: 25,
    fogColor: '#050c18',
    fogNear: 3,
    fogFar: 35,
    ambientColor: '#1a2244',
    ambientIntensity: 0.2,
  },
  {
    name: 'Leaderboard Shrine',
    center: [45, 0, 10],
    radius: 18,
    fogColor: '#102040',
    fogNear: 6,
    fogFar: 55,
    ambientColor: '#4488aa',
    ambientIntensity: 0.4,
  },
];

export function getCurrentBiome(x: number, z: number): BiomeDef {
  let closest = BIOMES[0];
  let closestDist = Infinity;
  for (const biome of BIOMES) {
    const dx = x - biome.center[0];
    const dz = z - biome.center[2];
    const dist = Math.sqrt(dx * dx + dz * dz);
    if (dist < closestDist) {
      closestDist = dist;
      closest = biome;
    }
  }
  return closest;
}

// --- Geometry Factories ---

// Cache geometries so identical types share a single geometry instance
const geometryCache = new Map<string, THREE.BufferGeometry>();

export function createObjectGeometry(type: string): THREE.BufferGeometry {
  const cached = geometryCache.get(type);
  if (cached) return cached;

  let geo: THREE.BufferGeometry;

  switch (type) {
    // --- Corals ---
    case 'coral_branch': {
      // Cluster of thin cylinders branching upward
      const group = new THREE.BufferGeometry();
      const c1 = new THREE.CylinderGeometry(0.04, 0.06, 0.6, 6);
      const c2 = new THREE.CylinderGeometry(0.03, 0.05, 0.45, 6);
      c2.translate(0.1, 0.1, 0.08);
      c2.rotateZ(0.3);
      const c3 = new THREE.CylinderGeometry(0.03, 0.05, 0.5, 6);
      c3.translate(-0.08, 0.05, -0.06);
      c3.rotateZ(-0.25);
      const merged = mergeGeometries([c1, c2, c3]);
      geo = merged || c1;
      break;
    }
    case 'coral_brain': {
      // Sphere with slight displacement
      geo = new THREE.IcosahedronGeometry(0.3, 2);
      displaceVertices(geo, 0.04);
      break;
    }
    case 'coral_fan': {
      // Thin disc with slight wave
      geo = new THREE.CircleGeometry(0.35, 12);
      geo.rotateX(-0.2);
      displaceVertices(geo, 0.02);
      break;
    }
    case 'coral_tube': {
      // Group of tall thin cylinders
      const t1 = new THREE.CylinderGeometry(0.03, 0.04, 0.5, 6);
      const t2 = new THREE.CylinderGeometry(0.03, 0.04, 0.4, 6);
      t2.translate(0.08, -0.05, 0.04);
      const t3 = new THREE.CylinderGeometry(0.025, 0.035, 0.35, 6);
      t3.translate(-0.06, -0.07, -0.05);
      const merged2 = mergeGeometries([t1, t2, t3]);
      geo = merged2 || t1;
      break;
    }
    case 'coral_bulb': {
      geo = new THREE.SphereGeometry(0.25, 10, 8);
      break;
    }

    // --- Rocks ---
    case 'rock_boulder': {
      geo = new THREE.IcosahedronGeometry(0.35, 1);
      displaceVertices(geo, 0.06);
      break;
    }
    case 'rock_slab': {
      geo = new THREE.BoxGeometry(0.6, 0.12, 0.4);
      displaceVertices(geo, 0.02);
      break;
    }
    case 'rock_cluster': {
      const r1 = new THREE.IcosahedronGeometry(0.15, 1);
      const r2 = new THREE.IcosahedronGeometry(0.12, 1);
      r2.translate(0.18, 0.02, 0.1);
      const r3 = new THREE.IcosahedronGeometry(0.1, 1);
      r3.translate(-0.1, 0.01, 0.15);
      const merged3 = mergeGeometries([r1, r2, r3]);
      geo = merged3 || r1;
      break;
    }
    case 'rock_arch': {
      // Two pillars + curved top (approximated with boxes + torus segment)
      const pillarL = new THREE.BoxGeometry(0.15, 0.8, 0.15);
      pillarL.translate(-0.3, 0, 0);
      const pillarR = new THREE.BoxGeometry(0.15, 0.8, 0.15);
      pillarR.translate(0.3, 0, 0);
      const arch = new THREE.TorusGeometry(0.3, 0.08, 6, 8, Math.PI);
      arch.rotateZ(Math.PI);
      arch.translate(0, 0.4, 0);
      const merged4 = mergeGeometries([pillarL, pillarR, arch]);
      geo = merged4 || pillarL;
      break;
    }

    // --- Plants ---
    case 'seagrass': {
      // Thin planes (will animate via shader or time-based in the scene)
      const blade1 = new THREE.PlaneGeometry(0.05, 0.5);
      blade1.translate(0, 0.25, 0);
      const blade2 = new THREE.PlaneGeometry(0.04, 0.4);
      blade2.translate(0.06, 0.2, 0.02);
      blade2.rotateY(0.8);
      const blade3 = new THREE.PlaneGeometry(0.04, 0.35);
      blade3.translate(-0.05, 0.18, -0.03);
      blade3.rotateY(-0.6);
      const merged5 = mergeGeometries([blade1, blade2, blade3]);
      geo = merged5 || blade1;
      break;
    }
    case 'anemone': {
      // Cylinder base + thin tentacles
      const base = new THREE.CylinderGeometry(0.12, 0.15, 0.15, 8);
      const tentacles: THREE.BufferGeometry[] = [base];
      for (let i = 0; i < 6; i++) {
        const t = new THREE.CylinderGeometry(0.015, 0.02, 0.25, 4);
        const angle = (i / 6) * Math.PI * 2;
        t.translate(Math.cos(angle) * 0.08, 0.2, Math.sin(angle) * 0.08);
        t.rotateZ(Math.cos(angle) * 0.15);
        t.rotateX(Math.sin(angle) * 0.15);
        tentacles.push(t);
      }
      const merged6 = mergeGeometries(tentacles);
      geo = merged6 || base;
      break;
    }

    // --- Decorations ---
    case 'shell': {
      geo = new THREE.TorusGeometry(0.12, 0.05, 6, 8, Math.PI * 1.5);
      geo.rotateX(Math.PI / 2);
      break;
    }
    case 'starfish': {
      // 5-armed flat star using extrude
      geo = createStarGeometry(5, 0.2, 0.08, 0.04);
      break;
    }
    case 'treasure_chest': {
      // Box body + angled lid
      const body = new THREE.BoxGeometry(0.4, 0.2, 0.25);
      const lid = new THREE.BoxGeometry(0.42, 0.06, 0.27);
      lid.translate(0, 0.13, 0);
      lid.rotateX(-0.15);
      const merged7 = mergeGeometries([body, lid]);
      geo = merged7 || body;
      break;
    }
    case 'bubbler': {
      // Small sphere base (bubbles are particles, added at scene level)
      geo = new THREE.SphereGeometry(0.1, 8, 6);
      break;
    }

    // --- Landmarks ---
    case 'shell_door': {
      // Two half-spheres slightly open
      const half1 = new THREE.SphereGeometry(0.4, 10, 8, 0, Math.PI);
      half1.rotateY(-0.15);
      const half2 = new THREE.SphereGeometry(0.4, 10, 8, 0, Math.PI);
      half2.rotateY(Math.PI + 0.15);
      const merged8 = mergeGeometries([half1, half2]);
      geo = merged8 || half1;
      break;
    }
    case 'cave_crack': {
      // Two tall boxes with a gap
      const wall1 = new THREE.BoxGeometry(0.3, 1.0, 0.6);
      wall1.translate(-0.2, 0, 0);
      const wall2 = new THREE.BoxGeometry(0.3, 1.0, 0.6);
      wall2.translate(0.2, 0, 0);
      const merged9 = mergeGeometries([wall1, wall2]);
      geo = merged9 || wall1;
      break;
    }

    default: {
      // Fallback: small icosahedron
      geo = new THREE.IcosahedronGeometry(0.2, 1);
      break;
    }
  }

  geometryCache.set(type, geo);
  return geo;
}

// --- Helper: merge multiple geometries into one ---

function mergeGeometries(geos: THREE.BufferGeometry[]): THREE.BufferGeometry | null {
  // Manual merge: concatenate position, normal, index buffers
  let totalVerts = 0;
  let totalIndices = 0;
  const allPositions: number[] = [];
  const allNormals: number[] = [];
  const allIndices: number[] = [];

  for (const g of geos) {
    g.computeVertexNormals();
    const pos = g.getAttribute('position');
    const norm = g.getAttribute('normal');
    const idx = g.getIndex();

    if (!pos) continue;

    for (let i = 0; i < pos.count; i++) {
      allPositions.push(pos.getX(i), pos.getY(i), pos.getZ(i));
      if (norm) {
        allNormals.push(norm.getX(i), norm.getY(i), norm.getZ(i));
      } else {
        allNormals.push(0, 1, 0);
      }
    }

    if (idx) {
      for (let i = 0; i < idx.count; i++) {
        allIndices.push((idx as any).array[i] + totalVerts);
      }
      totalIndices += idx.count;
    } else {
      for (let i = 0; i < pos.count; i++) {
        allIndices.push(i + totalVerts);
      }
      totalIndices += pos.count;
    }
    totalVerts += pos.count;
  }

  const merged = new THREE.BufferGeometry();
  merged.setAttribute('position', new THREE.Float32BufferAttribute(allPositions, 3));
  merged.setAttribute('normal', new THREE.Float32BufferAttribute(allNormals, 3));
  merged.setIndex(allIndices);
  return merged;
}

// --- Helper: displace vertices randomly for organic feel ---

function displaceVertices(geo: THREE.BufferGeometry, amount: number) {
  const pos = geo.getAttribute('position');
  for (let i = 0; i < pos.count; i++) {
    pos.setX(i, pos.getX(i) + (Math.random() - 0.5) * amount);
    pos.setY(i, pos.getY(i) + (Math.random() - 0.5) * amount);
    pos.setZ(i, pos.getZ(i) + (Math.random() - 0.5) * amount);
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
}

// --- Helper: create a 2D star shape extruded ---

function createStarGeometry(points: number, outer: number, inner: number, depth: number): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  for (let i = 0; i < points * 2; i++) {
    const angle = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2;
    const r = i % 2 === 0 ? outer : inner;
    const x = Math.cos(angle) * r;
    const y = Math.sin(angle) * r;
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  shape.closePath();
  const extrudeSettings = { depth, bevelEnabled: false };
  const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  geo.rotateX(-Math.PI / 2);
  return geo;
}

// --- Render all objects from a WorldState into a scene ---

const BIOLUMINESCENT = new Set(['coral_branch', 'coral_fan', 'coral_tube', 'coral_bulb', 'anemone', 'bubbler']);

function createFallbackMesh(obj: WorldObject): THREE.Mesh {
  const geometry = createObjectGeometry(obj.type);
  const color = obj.color || getDefaultColor(obj.type);
  const isBio = BIOLUMINESCENT.has(obj.type);
  const material = new THREE.MeshStandardMaterial({
    color,
    roughness: isBio ? 0.5 : 0.7,
    metalness: isBio ? 0.15 : 0.1,
    emissive: isBio ? color : '#000000',
    emissiveIntensity: isBio ? 0.15 : 0,
    flatShading: false,
    side: THREE.DoubleSide,
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

export function renderWorldState(
  scene: THREE.Scene,
  worldData: WorldState,
  offset: THREE.Vector3 = new THREE.Vector3(0, 0, 0)
): THREE.Group {
  const group = new THREE.Group();
  group.position.copy(offset);

  for (const obj of worldData.objects) {
    const placeholder = createFallbackMesh(obj);
    placeholder.position.set(obj.position[0], obj.position[1], obj.position[2]);
    placeholder.rotation.set(obj.rotation[0], obj.rotation[1], obj.rotation[2]);
    placeholder.scale.setScalar(obj.scale);
    placeholder.name = obj.id;
    placeholder.userData = { type: obj.type };
    group.add(placeholder);

    loadWorldModel(obj.type).then((gltfGroup) => {
      if (!gltfGroup) return;
      gltfGroup.position.copy(placeholder.position);
      gltfGroup.rotation.copy(placeholder.rotation);
      gltfGroup.scale.setScalar(obj.scale);
      gltfGroup.name = obj.id;
      gltfGroup.userData = { type: obj.type };
      group.remove(placeholder);
      placeholder.geometry?.dispose();
      (placeholder.material as THREE.Material)?.dispose();
      group.add(gltfGroup);
    });
  }

  scene.add(group);
  return group;
}

// --- Create the sandy ocean floor ---

export function createSandFloor(size: number = 50): THREE.Mesh {
  const geo = new THREE.PlaneGeometry(size, size, 128, 128);
  const pos = geo.getAttribute('position');
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    const noise =
      Math.sin(x * 1.2) * Math.cos(z * 0.9) * 0.15 +
      Math.sin(x * 2.8 + z * 1.3) * 0.06 +
      Math.sin(x * 5 + z * 3) * 0.03;
    pos.setZ(i, pos.getZ(i) + noise);
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();

  const material = new THREE.MeshStandardMaterial({
    color: '#c2a570',
    roughness: 0.85,
    metalness: 0.02,
    flatShading: false,
  });

  const floor = new THREE.Mesh(geo, material);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  floor.name = 'sand_floor';
  return floor;
}

// --- Setup underwater lighting ---

export function setupUnderwaterLighting(scene: THREE.Scene, isDark: boolean): {
  ambient: THREE.AmbientLight;
  directional: THREE.DirectionalLight;
  hemisphere: THREE.HemisphereLight;
  fillLight: THREE.DirectionalLight;
} {
  const hemisphere = new THREE.HemisphereLight(
    isDark ? 0x1a3050 : 0x4488cc,
    isDark ? 0x0a1020 : 0x1a3050,
    isDark ? 0.5 : 0.7,
  );
  scene.add(hemisphere);

  const ambient = new THREE.AmbientLight(isDark ? '#1a2a44' : '#4466aa', isDark ? 0.25 : 0.35);
  scene.add(ambient);

  const directional = new THREE.DirectionalLight(isDark ? '#6699cc' : '#ffffee', isDark ? 0.8 : 1.2);
  directional.position.set(5, 15, 5);
  directional.castShadow = true;
  directional.shadow.mapSize.width = 2048;
  directional.shadow.mapSize.height = 2048;
  directional.shadow.camera.near = 0.5;
  directional.shadow.camera.far = 60;
  directional.shadow.camera.left = -30;
  directional.shadow.camera.right = 30;
  directional.shadow.camera.top = 30;
  directional.shadow.camera.bottom = -30;
  directional.shadow.bias = -0.001;
  directional.shadow.normalBias = 0.02;
  scene.add(directional);

  const fillLight = new THREE.DirectionalLight(isDark ? '#224466' : '#88bbdd', isDark ? 0.2 : 0.3);
  fillLight.position.set(-8, 6, -5);
  scene.add(fillLight);

  return { ambient, directional, hemisphere, fillLight };
}

// --- Setup underwater fog ---

export function setupUnderwaterFog(scene: THREE.Scene, isDark: boolean) {
  const fogColor = isDark ? '#081422' : '#4499bb';
  scene.fog = new THREE.Fog(fogColor, isDark ? 5 : 20, isDark ? 45 : 140);
  scene.background = new THREE.Color(fogColor);
}

// --- Caustic light overlay (animated pattern projected onto sand) ---

export function createCausticPlane(): THREE.Mesh {
  const size = 80;
  const geo = new THREE.PlaneGeometry(size, size);

  const material = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uIntensity: { value: 0.18 },
      uScale: { value: 4.0 },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform float uIntensity;
      uniform float uScale;
      varying vec2 vUv;

      vec2 hash(vec2 p) {
        p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
        return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
      }

      float voronoi(vec2 x) {
        vec2 n = floor(x);
        vec2 f = fract(x);
        float md = 8.0;
        for (int j = -1; j <= 1; j++) {
          for (int i = -1; i <= 1; i++) {
            vec2 g = vec2(float(i), float(j));
            vec2 o = hash(n + g);
            o = 0.5 + 0.5 * sin(uTime * 0.8 + 6.2831 * o);
            vec2 r = g + o - f;
            float d = dot(r, r);
            md = min(md, d);
          }
        }
        return sqrt(md);
      }

      void main() {
        vec2 uv = vUv * uScale;
        float c = voronoi(uv);
        c = smoothstep(0.0, 0.5, c) * smoothstep(1.0, 0.5, c);
        c *= uIntensity;
        gl_FragColor = vec4(0.4, 0.7, 1.0, c);
      }
    `,
  });

  const mesh = new THREE.Mesh(geo, material);
  mesh.rotation.x = -Math.PI / 2;
  mesh.name = 'caustic_plane';
  return mesh;
}

export function animateCaustics(causticMesh: THREE.Mesh, elapsed: number) {
  const mat = causticMesh.material as THREE.ShaderMaterial;
  if (mat.uniforms?.uTime) mat.uniforms.uTime.value = elapsed;
}

// --- God ray light shafts ---

export function createGodRays(count: number = 12): THREE.Group {
  const group = new THREE.Group();
  group.name = 'god_rays';

  for (let i = 0; i < count; i++) {
    const width = 0.3 + Math.random() * 0.8;
    const height = 8 + Math.random() * 10;
    const geo = new THREE.PlaneGeometry(width, height);
    const mat = new THREE.MeshBasicMaterial({
      color: 0x88ccff,
      transparent: true,
      opacity: 0.03 + Math.random() * 0.04,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const ray = new THREE.Mesh(geo, mat);
    ray.position.set(
      (Math.random() - 0.5) * 40,
      height / 2 - 3,
      (Math.random() - 0.5) * 40,
    );
    ray.rotation.y = Math.random() * Math.PI;
    ray.rotation.z = (Math.random() - 0.5) * 0.15;
    ray.userData.baseOpacity = (mat as THREE.MeshBasicMaterial).opacity;
    ray.userData.phase = Math.random() * Math.PI * 2;
    group.add(ray);
  }

  return group;
}

export function animateGodRays(group: THREE.Group, elapsed: number) {
  group.children.forEach((child) => {
    const mat = (child as THREE.Mesh).material as THREE.MeshBasicMaterial;
    const base = child.userData.baseOpacity || 0.04;
    const phase = child.userData.phase || 0;
    mat.opacity = base * (0.6 + 0.4 * Math.sin(elapsed * 0.3 + phase));
  });
}

// --- Floating dust motes / luminous particles ---

export function createDustMotes(count: number = 300): THREE.Points {
  const positions = new Float32Array(count * 3);
  const spread = 40;

  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * spread;
    positions[i * 3 + 1] = Math.random() * 8 - 3;
    positions[i * 3 + 2] = (Math.random() - 0.5) * spread;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));

  const mat = new THREE.PointsMaterial({
    color: 0xaaddff,
    size: 0.035,
    transparent: true,
    opacity: 0.4,
    sizeAttenuation: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  const points = new THREE.Points(geo, mat);
  points.name = 'dust_motes';
  return points;
}

export function animateDustMotes(motes: THREE.Points, elapsed: number, delta: number) {
  const pos = motes.geometry.getAttribute('position');
  for (let i = 0; i < pos.count; i++) {
    const ix = i * 3;
    let x = pos.getX(i);
    let y = pos.getY(i);
    const drift = Math.sin(elapsed * 0.2 + i * 0.7) * 0.015;
    x += drift * delta * 30;
    y += delta * (0.02 + Math.sin(elapsed + i) * 0.01);
    if (y > 5) { y = -3; x = (Math.random() - 0.5) * 40; }
    pos.setX(i, x);
    pos.setY(i, y);
  }
  pos.needsUpdate = true;
}

// --- Create bubble particles ---

export function createBubbleParticles(count: number = 120): THREE.Points {
  const positions = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const spread = 30;

  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * spread;
    positions[i * 3 + 1] = Math.random() * 8 - 3;
    positions[i * 3 + 2] = (Math.random() - 0.5) * spread;
    sizes[i] = 0.03 + Math.random() * 0.06;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));

  const material = new THREE.PointsMaterial({
    color: 0xddeeff,
    size: 0.06,
    transparent: true,
    opacity: 0.45,
    sizeAttenuation: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  const points = new THREE.Points(geo, material);
  points.name = 'bubbles';
  return points;
}

// --- Animate bubble particles (call each frame) ---

export function animateBubbles(bubbles: THREE.Points, delta: number) {
  const pos = bubbles.geometry.getAttribute('position');
  for (let i = 0; i < pos.count; i++) {
    let y = pos.getY(i);
    y += delta * (0.15 + Math.random() * 0.05);
    // Slight horizontal drift
    pos.setX(i, pos.getX(i) + Math.sin(y * 2 + i) * delta * 0.02);
    if (y > 4) {
      y = -3;
      pos.setX(i, (Math.random() - 0.5) * 12);
      pos.setZ(i, (Math.random() - 0.5) * 12);
    }
    pos.setY(i, y);
  }
  pos.needsUpdate = true;
}

// --- Underwater Skydome ---

export function createUnderwaterSkydome(radius: number = 100): THREE.Mesh {
  const geo = new THREE.SphereGeometry(radius, 64, 32);
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    uniforms: {
      uTime: { value: 0 },
      uTopColor: { value: new THREE.Color(0x1a5070) },
      uMidColor: { value: new THREE.Color(0x0a2a44) },
      uBottomColor: { value: new THREE.Color(0x040e1a) },
    },
    vertexShader: `
      varying vec3 vWorldPos;
      void main() {
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vWorldPos = wp.xyz;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform vec3 uTopColor;
      uniform vec3 uMidColor;
      uniform vec3 uBottomColor;
      varying vec3 vWorldPos;

      void main() {
        float h = normalize(vWorldPos).y;
        vec3 color;
        if (h > 0.0) {
          color = mix(uMidColor, uTopColor, h);
          float ripple = sin(vWorldPos.x * 0.3 + uTime * 0.4) * sin(vWorldPos.z * 0.3 + uTime * 0.3) * 0.08;
          color += ripple * vec3(0.3, 0.5, 0.7);
        } else {
          color = mix(uMidColor, uBottomColor, -h);
        }
        gl_FragColor = vec4(color, 1.0);
      }
    `,
  });

  const sky = new THREE.Mesh(geo, mat);
  sky.name = 'underwater_skydome';
  return sky;
}

export function animateSkydome(sky: THREE.Mesh, elapsed: number) {
  const mat = sky.material as THREE.ShaderMaterial;
  if (mat.uniforms?.uTime) mat.uniforms.uTime.value = elapsed;
}

// --- Animated Water Surface ---

export function createWaterSurface(size: number = 120): THREE.Mesh {
  const geo = new THREE.PlaneGeometry(size, size, 128, 128);
  const mat = new THREE.ShaderMaterial({
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false,
    uniforms: {
      uTime: { value: 0 },
      uOpacity: { value: 0.35 },
    },
    vertexShader: `
      uniform float uTime;
      varying vec2 vUv;
      varying float vWave;

      void main() {
        vUv = uv;
        vec3 pos = position;
        float wave1 = sin(pos.x * 0.5 + uTime * 0.8) * 0.15;
        float wave2 = sin(pos.y * 0.7 + uTime * 0.6) * 0.1;
        float wave3 = sin((pos.x + pos.y) * 0.3 + uTime * 1.1) * 0.08;
        pos.z += wave1 + wave2 + wave3;
        vWave = pos.z;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform float uOpacity;
      varying vec2 vUv;
      varying float vWave;

      void main() {
        float fresnel = 0.3 + 0.7 * pow(1.0 - abs(dot(vec3(0.0, 0.0, 1.0), vec3(0.0, 0.0, 1.0))), 2.0);
        vec3 baseColor = vec3(0.15, 0.4, 0.55);
        vec3 highlightColor = vec3(0.5, 0.8, 0.95);
        float shimmer = sin(vUv.x * 40.0 + uTime * 2.0) * sin(vUv.y * 40.0 + uTime * 1.5) * 0.5 + 0.5;
        vec3 color = mix(baseColor, highlightColor, shimmer * 0.3 + vWave * 0.5);
        gl_FragColor = vec4(color, uOpacity * fresnel);
      }
    `,
  });

  const water = new THREE.Mesh(geo, mat);
  water.rotation.x = -Math.PI / 2;
  water.name = 'water_surface';
  return water;
}

export function animateWaterSurface(water: THREE.Mesh, elapsed: number) {
  const mat = water.material as THREE.ShaderMaterial;
  if (mat.uniforms?.uTime) mat.uniforms.uTime.value = elapsed;
}

// --- Kelp / seagrass swaying columns ---

export function createKelpField(count: number = 40, spread: number = 35, floorY: number = -3): THREE.Group {
  const group = new THREE.Group();
  group.name = 'kelp_field';

  for (let i = 0; i < count; i++) {
    const segments = 6 + Math.floor(Math.random() * 4);
    const height = 1.5 + Math.random() * 3.5;
    const segHeight = height / segments;
    const width = 0.08 + Math.random() * 0.06;

    const geo = new THREE.PlaneGeometry(width, height, 1, segments);
    const pos = geo.getAttribute('position');
    for (let v = 0; v < pos.count; v++) {
      const t = (pos.getY(v) + height / 2) / height;
      pos.setX(v, pos.getX(v) + Math.sin(t * 3) * 0.1);
    }
    pos.needsUpdate = true;
    geo.computeVertexNormals();

    const hue = 0.28 + Math.random() * 0.08;
    const color = new THREE.Color().setHSL(hue, 0.6, 0.25 + Math.random() * 0.15);
    const mat = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.8,
      metalness: 0.0,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85,
    });

    const kelp = new THREE.Mesh(geo, mat);
    kelp.position.set(
      (Math.random() - 0.5) * spread,
      floorY + height / 2,
      (Math.random() - 0.5) * spread,
    );
    kelp.rotation.y = Math.random() * Math.PI * 2;
    kelp.userData.kelpPhase = Math.random() * Math.PI * 2;
    kelp.userData.kelpSpeed = 0.5 + Math.random() * 0.5;
    group.add(kelp);
  }

  return group;
}

export function animateKelp(group: THREE.Group, elapsed: number) {
  group.children.forEach((child) => {
    const mesh = child as THREE.Mesh;
    const phase = mesh.userData.kelpPhase || 0;
    const speed = mesh.userData.kelpSpeed || 0.5;
    const pos = mesh.geometry.getAttribute('position');
    const height = (mesh.geometry as any).parameters?.height || 3;
    for (let v = 0; v < pos.count; v++) {
      const t = (pos.getY(v) + height / 2) / height;
      const sway = Math.sin(elapsed * speed + phase + t * 2) * t * 0.15;
      pos.setX(v, pos.getX(v) * 0.98 + sway * 0.02);
    }
    pos.needsUpdate = true;
  });
}

// --- Schools of small fish (instanced) ---

export function createFishSchool(count: number = 30): THREE.Group {
  const group = new THREE.Group();
  group.name = 'fish_school';

  const fishGeo = new THREE.ConeGeometry(0.02, 0.08, 4);
  fishGeo.rotateZ(-Math.PI / 2);

  for (let i = 0; i < count; i++) {
    const hue = 0.55 + Math.random() * 0.15;
    const mat = new THREE.MeshStandardMaterial({
      color: new THREE.Color().setHSL(hue, 0.7, 0.5 + Math.random() * 0.2),
      emissive: new THREE.Color().setHSL(hue, 0.5, 0.15),
      emissiveIntensity: 0.3,
      roughness: 0.4,
      metalness: 0.3,
    });
    const fish = new THREE.Mesh(fishGeo, mat);
    fish.position.set(
      (Math.random() - 0.5) * 3,
      (Math.random() - 0.5) * 1.5,
      (Math.random() - 0.5) * 3,
    );
    fish.userData.fishOffset = Math.random() * Math.PI * 2;
    fish.userData.fishSpeed = 0.8 + Math.random() * 0.6;
    fish.userData.fishRadius = 1.5 + Math.random() * 2;
    group.add(fish);
  }

  group.position.set(
    (Math.random() - 0.5) * 20,
    -1 + Math.random() * 2,
    (Math.random() - 0.5) * 20,
  );

  return group;
}

export function animateFishSchool(group: THREE.Group, elapsed: number) {
  const center = group.position;
  const schoolAngle = elapsed * 0.15;
  center.x += Math.sin(schoolAngle) * 0.003;
  center.z += Math.cos(schoolAngle * 0.7) * 0.003;

  group.children.forEach((child) => {
    const fish = child as THREE.Mesh;
    const offset = fish.userData.fishOffset || 0;
    const speed = fish.userData.fishSpeed || 1;
    const radius = fish.userData.fishRadius || 2;
    const t = elapsed * speed + offset;
    const localX = Math.sin(t) * radius;
    const localZ = Math.cos(t) * radius;
    const localY = fish.position.y + Math.sin(t * 2) * 0.002;

    const dx = localX - fish.position.x;
    const dz = localZ - fish.position.z;
    fish.rotation.y = Math.atan2(dx, dz);

    fish.position.x += (localX - fish.position.x) * 0.05;
    fish.position.z += (localZ - fish.position.z) * 0.05;
    fish.position.y = localY;
  });
}

// --- Jellyfish billboards ---

export function createJellyfish(count: number = 8, spread: number = 30): THREE.Group {
  const group = new THREE.Group();
  group.name = 'jellyfish';

  for (let i = 0; i < count; i++) {
    const bodyGeo = new THREE.SphereGeometry(0.15 + Math.random() * 0.1, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.6);
    const hue = 0.75 + Math.random() * 0.15;
    const bodyMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color().setHSL(hue, 0.5, 0.6),
      emissive: new THREE.Color().setHSL(hue, 0.6, 0.3),
      emissiveIntensity: 0.4,
      transparent: true,
      opacity: 0.6,
      roughness: 0.3,
      metalness: 0.1,
      side: THREE.DoubleSide,
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);

    const tentCount = 4 + Math.floor(Math.random() * 3);
    const jellyGroup = new THREE.Group();
    jellyGroup.add(body);

    for (let t = 0; t < tentCount; t++) {
      const tentGeo = new THREE.CylinderGeometry(0.005, 0.003, 0.4 + Math.random() * 0.3, 4);
      const tentMat = new THREE.MeshBasicMaterial({
        color: bodyMat.color,
        transparent: true,
        opacity: 0.3,
      });
      const tent = new THREE.Mesh(tentGeo, tentMat);
      const angle = (t / tentCount) * Math.PI * 2;
      tent.position.set(Math.cos(angle) * 0.08, -0.25, Math.sin(angle) * 0.08);
      jellyGroup.add(tent);
    }

    jellyGroup.position.set(
      (Math.random() - 0.5) * spread,
      Math.random() * 4 - 1,
      (Math.random() - 0.5) * spread,
    );
    jellyGroup.userData.jellyPhase = Math.random() * Math.PI * 2;
    jellyGroup.userData.jellySpeed = 0.3 + Math.random() * 0.3;
    group.add(jellyGroup);
  }

  return group;
}

export function animateJellyfish(group: THREE.Group, elapsed: number) {
  group.children.forEach((jelly) => {
    const phase = jelly.userData.jellyPhase || 0;
    const speed = jelly.userData.jellySpeed || 0.4;
    const pulse = Math.sin(elapsed * speed * 2 + phase) * 0.5 + 0.5;
    const body = jelly.children[0] as THREE.Mesh;
    body.scale.set(1 + pulse * 0.1, 1 - pulse * 0.05, 1 + pulse * 0.1);
    jelly.position.y += Math.sin(elapsed * speed + phase) * 0.002;
    jelly.position.x += Math.sin(elapsed * speed * 0.3 + phase) * 0.001;
  });
}

// --- Collision System ---

export interface CollisionBox {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

const COLLISION_HALF_SIZES: Record<string, { halfX: number; halfZ: number }> = {
  rock_boulder: { halfX: 0.4, halfZ: 0.4 },
  rock_slab: { halfX: 0.35, halfZ: 0.25 },
  rock_cluster: { halfX: 0.2, halfZ: 0.2 },
  rock_arch: { halfX: 0.35, halfZ: 0.15 },
  coral_brain: { halfX: 0.35, halfZ: 0.35 },
  coral_bulb: { halfX: 0.3, halfZ: 0.3 },
  treasure_chest: { halfX: 0.25, halfZ: 0.15 },
};

const MIN_COLLISION_HALF = 0.5;

export function generateCollisionBoxes(
  worldData: WorldState,
  offsetX: number = 0,
  offsetZ: number = 0,
): CollisionBox[] {
  const boxes: CollisionBox[] = [];
  for (const obj of worldData.objects) {
    const base = COLLISION_HALF_SIZES[obj.type];
    if (!base) continue;
    const hx = base.halfX * obj.scale;
    const hz = base.halfZ * obj.scale;
    if (hx < MIN_COLLISION_HALF && hz < MIN_COLLISION_HALF) continue;
    const cx = obj.position[0] + offsetX;
    const cz = obj.position[2] + offsetZ;
    boxes.push({ minX: cx - hx, maxX: cx + hx, minZ: cz - hz, maxZ: cz + hz });
  }
  return boxes;
}

export function resolveCollision(
  x: number,
  z: number,
  entityRadius: number,
  boxes: ReadonlyArray<CollisionBox>,
): { x: number; z: number } {
  let rx = x;
  let rz = z;
  for (const b of boxes) {
    const eMinX = b.minX - entityRadius;
    const eMaxX = b.maxX + entityRadius;
    const eMinZ = b.minZ - entityRadius;
    const eMaxZ = b.maxZ + entityRadius;
    if (rx <= eMinX || rx >= eMaxX || rz <= eMinZ || rz >= eMaxZ) continue;
    const dLeft = rx - eMinX;
    const dRight = eMaxX - rx;
    const dFront = rz - eMinZ;
    const dBack = eMaxZ - rz;
    const minD = Math.min(dLeft, dRight, dFront, dBack);
    if (minD === dLeft) rx = eMinX;
    else if (minD === dRight) rx = eMaxX;
    else if (minD === dFront) rz = eMinZ;
    else rz = eMaxZ;
  }
  return { x: rx, z: rz };
}
