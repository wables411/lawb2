/**
 * worldObjects.ts — Shared utility for rendering Clawb's World objects.
 * Used by both WorldBackground (desktop) and ClawbWorld (/world page).
 */
import * as THREE from 'three';

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

export function renderWorldState(
  scene: THREE.Scene,
  worldData: WorldState,
  offset: THREE.Vector3 = new THREE.Vector3(0, 0, 0)
): THREE.Group {
  const group = new THREE.Group();
  group.position.copy(offset);

  for (const obj of worldData.objects) {
    const geometry = createObjectGeometry(obj.type);
    const color = obj.color || getDefaultColor(obj.type);
    const material = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.7,
      metalness: 0.1,
      flatShading: true,
      side: THREE.DoubleSide,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(obj.position[0], obj.position[1], obj.position[2]);
    mesh.rotation.set(obj.rotation[0], obj.rotation[1], obj.rotation[2]);
    mesh.scale.setScalar(obj.scale);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.name = obj.id;
    mesh.userData = { type: obj.type };

    group.add(mesh);
  }

  scene.add(group);
  return group;
}

// --- Create the sandy ocean floor ---

export function createSandFloor(size: number = 50): THREE.Mesh {
  const geo = new THREE.PlaneGeometry(size, size, 64, 64);
  // Slight vertex displacement for organic sand feel
  const pos = geo.getAttribute('position');
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    // Gentle noise displacement
    const noise = Math.sin(x * 2.3) * Math.cos(z * 1.7) * 0.08 + Math.sin(x * 5 + z * 3) * 0.03;
    pos.setZ(i, pos.getZ(i) + noise); // Z is "up" before rotation
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();

  const material = new THREE.MeshStandardMaterial({
    color: '#c2a570',
    roughness: 0.9,
    metalness: 0.0,
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
} {
  const ambientColor = isDark ? '#1a2a44' : '#4466aa';
  const ambientIntensity = isDark ? 0.4 : 0.6;
  const ambient = new THREE.AmbientLight(ambientColor, ambientIntensity);
  scene.add(ambient);

  const dirColor = isDark ? '#88aacc' : '#ffffee';
  const dirIntensity = isDark ? 0.5 : 0.8;
  const directional = new THREE.DirectionalLight(dirColor, dirIntensity);
  directional.position.set(5, 10, 5);
  directional.castShadow = false; // Keep light for perf
  scene.add(directional);

  return { ambient, directional };
}

// --- Setup underwater fog ---

export function setupUnderwaterFog(scene: THREE.Scene, isDark: boolean) {
  const fogColor = isDark ? '#0a1628' : '#1a3a5c';
  scene.fog = new THREE.FogExp2(fogColor, 0.04);
  scene.background = new THREE.Color(fogColor);
}

// --- Create bubble particles ---

export function createBubbleParticles(count: number = 120): THREE.Points {
  const positions = new Float32Array(count * 3);
  const spread = 12;

  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * spread;
    positions[i * 3 + 1] = Math.random() * 6 - 3; // Y: from floor to above
    positions[i * 3 + 2] = (Math.random() - 0.5) * spread;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));

  const material = new THREE.PointsMaterial({
    color: '#ffffff',
    size: 0.04,
    transparent: true,
    opacity: 0.5,
    sizeAttenuation: true,
    depthWrite: false,
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
