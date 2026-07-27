import * as THREE from 'three';
import {
  REEF_RUN_OBSTACLE_BASE_SPEED,
  REEF_RUN_TICK_Z_SCALE,
} from './arcadeDifficulty';
import { cloneCoralSceneryVisual, cloneSceneryPropVisual } from './arcadeGlbProps';

/**
 * Cosmetic reef dressing for the Reef Run play screen: sandy seabed, passing coral/rock/kelp
 * scenery outside the lanes, distant fish silhouettes and rising bubbles.
 *
 * PURE RENDER LAYER — never touches gameplay, collision, or the seeded gameplay RNG
 * (all randomness here is `Math.random`, same policy as particles/FX). Everything is
 * procedural or cloned from GLB templates that the game already downloads, so this adds
 * zero hosting/bandwidth cost.
 */

/** Matches the obstacle scroll: world units/sec toward the player at swimSpd = 1. */
const WORLD_UNITS_PER_SEC = REEF_RUN_OBSTACLE_BASE_SPEED * REEF_RUN_TICK_Z_SCALE;

/** Seabed sits just under the obstacle bases (box bottom ≈ -1.0). */
export const REEF_FLOOR_Y = -1.02;
const FLOOR_Y = REEF_FLOOR_Y;

/** Scenery props recycle inside this Z band (fog hides both ends). */
const PROP_Z_MIN = -64;
const PROP_Z_MAX = 16;
const PROP_Z_SPAN = PROP_Z_MAX - PROP_Z_MIN;

/** Lanes span ±2.76 at the outer obstacle edge; scenery stays clearly outside. */
const PROP_X_INNER = 4.2;
const PROP_X_OUTER = 7.4;

type SceneryProp = {
  root: THREE.Object3D;
  /** Re-seat (x, rotation, scale jitter) on the given coast when the prop recycles. */
  reseat: (side: 1 | -1) => void;
  /** Current coast; flipped on every recycle so z-neighbors keep alternating sides. */
  side: 1 | -1;
  /**
   * Recycle distance. Common props use PROP_Z_SPAN; showcase landmarks ride a much longer
   * loop so each one passes rarely instead of the same prop repeating every few seconds.
   */
  zSpan?: number;
};

/** Showcase landmarks recycle over this distance (~43s per lap at base speed). */
const SHOWCASE_Z_SPAN = 236;
/**
 * Fixed z gap between showcase slots. Everything scrolls at the same speed and recycles by
 * the same span, so this spacing (and the side alternation) is preserved forever — two
 * landmarks can never drift into each other.
 */
const SHOWCASE_SPACING = 25;

type Fish = {
  y: number;
  z: number;
  dir: 1 | -1;
  speed: number;
  phase: number;
  scale: number;
};

function randRange(a: number, b: number): number {
  return a + Math.random() * (b - a);
}

function randSide(): 1 | -1 {
  return Math.random() < 0.5 ? -1 : 1;
}

/** Procedural sand: muted base + ripple bands + speckle, tiled along the run. */
function createSandTexture(): THREE.CanvasTexture {
  const N = 256;
  const c = document.createElement('canvas');
  c.width = N;
  c.height = N;
  const g = c.getContext('2d');
  if (g) {
    g.fillStyle = '#7a7257';
    g.fillRect(0, 0, N, N);
    // Soft ripple bands (roughly perpendicular to travel).
    for (let i = 0; i < 26; i++) {
      const y = (i / 26) * N + randRange(-4, 4);
      const amp = randRange(3, 9);
      g.strokeStyle = `rgba(255, 244, 214, ${randRange(0.05, 0.13)})`;
      g.lineWidth = randRange(1.5, 3.5);
      g.beginPath();
      for (let x = 0; x <= N; x += 8) {
        const yy = y + Math.sin((x / N) * Math.PI * randRange(3, 5) + i) * amp;
        if (x === 0) g.moveTo(x, yy);
        else g.lineTo(x, yy);
      }
      g.stroke();
    }
    // Speckle: shell fragments and dark grains.
    for (let i = 0; i < 420; i++) {
      const dark = Math.random() < 0.6;
      g.fillStyle = dark
        ? `rgba(40, 44, 38, ${randRange(0.1, 0.3)})`
        : `rgba(240, 232, 200, ${randRange(0.12, 0.3)})`;
      const r = randRange(0.5, 1.6);
      g.beginPath();
      g.arc(Math.random() * N, Math.random() * N, r, 0, Math.PI * 2);
      g.fill();
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

/** One tapering kelp blade with transparent edges (shared by every kelp plane). */
function createKelpTexture(): THREE.CanvasTexture {
  const W = 64;
  const H = 256;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const g = c.getContext('2d');
  if (g) {
    const grad = g.createLinearGradient(0, H, 0, 0);
    grad.addColorStop(0, '#173f2e');
    grad.addColorStop(0.6, '#2c7350');
    grad.addColorStop(1, '#3f9c66');
    g.fillStyle = grad;
    // Wavy blade: wide at the base (bottom), tapering to the tip (top).
    g.beginPath();
    g.moveTo(W * 0.5 - W * 0.3, H);
    for (let i = 0; i <= 20; i++) {
      const f = i / 20;
      const y = H - f * H;
      const half = W * (0.3 - f * 0.24);
      const sway = Math.sin(f * Math.PI * 3) * W * 0.12 * f;
      g.lineTo(W * 0.5 + sway - half, y);
    }
    for (let i = 20; i >= 0; i--) {
      const f = i / 20;
      const y = H - f * H;
      const half = W * (0.3 - f * 0.24);
      const sway = Math.sin(f * Math.PI * 3) * W * 0.12 * f;
      g.lineTo(W * 0.5 + sway + half, y);
    }
    g.closePath();
    g.fill();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** Flat 3-triangle fish silhouette in the XY plane, nose toward +X. */
function createFishGeometry(): THREE.BufferGeometry {
  const geo = new THREE.BufferGeometry();
  // prettier-ignore
  const verts = new Float32Array([
    // body diamond
    0.55, 0, 0,   0.05, 0.18, 0,   -0.35, 0, 0,
    0.55, 0, 0,   -0.35, 0, 0,     0.05, -0.18, 0,
    // tail fin
    -0.35, 0, 0,  -0.6, 0.16, 0,   -0.6, -0.16, 0,
  ]);
  geo.setAttribute('position', new THREE.BufferAttribute(verts, 3));
  return geo;
}

export class ReefSceneryLayer {
  readonly group = new THREE.Group();

  private readonly props: SceneryProp[] = [];
  private readonly kelpPlanes: THREE.Mesh[] = [];
  private readonly fishes: Fish[] = [];
  private fishMesh: THREE.InstancedMesh | null = null;
  private readonly fishDummy = new THREE.Object3D();

  /** Next showcase slot on the long loop (GLB landmarks + character statues share it). */
  private showcaseIndex = 0;

  private seabedTex: THREE.CanvasTexture | null = null;
  private kelpTex: THREE.CanvasTexture | null = null;
  private bubbles: THREE.Points | null = null;
  private bubbleSpeeds: Float32Array | null = null;

  /** Everything created here (not GLB-template clones) for disposal. */
  private readonly ownedGeos: THREE.BufferGeometry[] = [];
  private readonly ownedMats: THREE.Material[] = [];

  constructor(lowPower: boolean) {
    this.buildSeabed(lowPower);
    this.buildProps(lowPower);
    this.buildFish(lowPower);
    if (!lowPower) this.buildBubbles();
    this.group.visible = false;
  }

  private buildSeabed(lowPower: boolean): void {
    const LEN = 150;
    this.seabedTex = createSandTexture();
    this.seabedTex.repeat.set(4, Math.round(LEN / 11));
    const geo = new THREE.PlaneGeometry(46, LEN, 1, 1);
    const mat = new THREE.MeshStandardMaterial({
      map: this.seabedTex,
      roughness: 0.96,
      metalness: 0,
    });
    const floor = new THREE.Mesh(geo, mat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, FLOOR_Y, -45);
    this.ownedGeos.push(geo);
    this.ownedMats.push(mat);
    this.group.add(floor);
    if (lowPower) this.seabedTex.repeat.set(3, 10);
  }

  private buildProps(lowPower: boolean): void {
    const counts = lowPower
      ? { coral: 3, rock: 1, kelp: 1, seagrass: 2, reefRock: 2 }
      : { coral: 6, rock: 2, kelp: 2, seagrass: 4, reefRock: 4 };

    const rockGeo = new THREE.DodecahedronGeometry(0.5, 0);
    const rockMat = new THREE.MeshStandardMaterial({
      color: 0x3c525c,
      roughness: 0.92,
      flatShading: true,
    });
    this.ownedGeos.push(rockGeo);
    this.ownedMats.push(rockMat);

    this.kelpTex = createKelpTexture();
    const kelpGeo = new THREE.PlaneGeometry(0.6, 3.2);
    kelpGeo.translate(0, 1.6, 0); // pivot at the base so sway rotates from the sand
    const kelpMat = new THREE.MeshLambertMaterial({
      map: this.kelpTex,
      transparent: true,
      alphaTest: 0.28,
      side: THREE.DoubleSide,
    });
    this.ownedGeos.push(kelpGeo);
    this.ownedMats.push(kelpMat);

    const totalProps =
      counts.coral + counts.rock + counts.kelp + counts.seagrass + counts.reefRock;
    const addProp = (root: THREE.Object3D, reseat: (side: 1 | -1) => void) => {
      // Alternate coasts by slot: adjacent-z props start on opposite sides, and the flip on
      // every recycle keeps that alternation for the life of the run.
      const side: 1 | -1 = this.props.length % 2 === 0 ? 1 : -1;
      reseat(side);
      // Spread initial Z through the whole band so the reef starts populated.
      root.position.z = PROP_Z_MIN + (this.props.length / totalProps) * PROP_Z_SPAN;
      this.group.add(root);
      this.props.push({ root, reseat, side });
    };

    /** Clone a Meshy scenery GLB, seat its base just under the sand, add to the recycle pool. */
    const addGlbProp = (
      kind: Parameters<typeof cloneSceneryPropVisual>[0],
      extent: number,
      sink: number,
      xInner = PROP_X_INNER,
      xOuter = PROP_X_OUTER,
      zSpan?: number,
    ): boolean => {
      const clone = cloneSceneryPropVisual(kind, extent);
      if (!clone) return false;
      const holder = new THREE.Group();
      holder.add(clone);
      const half = new THREE.Box3().setFromObject(clone).getSize(new THREE.Vector3()).y / 2;
      clone.position.y = half - sink;
      const entryReseat = (side: 1 | -1) => {
        holder.position.x = side * randRange(xInner, xOuter);
        holder.position.y = FLOOR_Y;
        holder.rotation.y = Math.random() * Math.PI * 2;
        holder.scale.setScalar(randRange(0.85, 1.15));
      };
      if (zSpan) {
        this.addShowcaseEntry(holder, entryReseat, zSpan);
      } else {
        addProp(holder, entryReseat);
      }
      return true;
    };

    for (let i = 0; i < counts.coral; i++) {
      const extent = randRange(0.9, 1.8);
      const coral = cloneCoralSceneryVisual(extent);
      if (!coral) continue;
      const holder = new THREE.Group();
      holder.add(coral);
      // fit centers the bbox at the clone's origin; lift so the base touches the sand.
      const half = new THREE.Box3().setFromObject(coral).getSize(new THREE.Vector3()).y / 2;
      coral.position.y = half - 0.08; // sink slightly so it reads planted
      addProp(holder, (side) => {
        holder.position.x = side * randRange(PROP_X_INNER, PROP_X_OUTER);
        holder.position.y = FLOOR_Y;
        holder.rotation.y = Math.random() * Math.PI * 2;
        const s = randRange(0.85, 1.15);
        holder.scale.setScalar(s);
      });
    }

    for (let i = 0; i < counts.rock; i++) {
      const holder = new THREE.Group();
      const n = 1 + (Math.random() < 0.5 ? 1 : 0);
      for (let k = 0; k < n; k++) {
        const rock = new THREE.Mesh(rockGeo, rockMat);
        rock.position.set(k * randRange(0.5, 0.9), 0, k * randRange(-0.4, 0.4));
        rock.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
        rock.scale.set(randRange(0.7, 1.9), randRange(0.5, 1.3), randRange(0.7, 1.9));
        // Seat by the real rotated/scaled bounds: lowest vertex sinks just under the sand.
        rock.updateMatrixWorld(true);
        const bb = new THREE.Box3().setFromObject(rock);
        rock.position.y = -bb.min.y - 0.12;
        holder.add(rock);
      }
      addProp(holder, (side) => {
        holder.position.x = side * randRange(PROP_X_INNER, PROP_X_OUTER);
        holder.position.y = FLOOR_Y;
        holder.rotation.y = Math.random() * Math.PI * 2;
      });
    }

    for (let i = 0; i < counts.kelp; i++) {
      const holder = new THREE.Group();
      const strands = 3;
      for (let k = 0; k < strands; k++) {
        const blade = new THREE.Mesh(kelpGeo, kelpMat);
        blade.position.set(randRange(-0.5, 0.5), 0, randRange(-0.5, 0.5));
        blade.rotation.y = Math.random() * Math.PI;
        blade.scale.setScalar(randRange(0.6, 1.15));
        blade.userData.swayPhase = Math.random() * Math.PI * 2;
        blade.userData.swayAmp = randRange(0.07, 0.14);
        this.kelpPlanes.push(blade);
        holder.add(blade);
      }
      addProp(holder, (side) => {
        holder.position.x = side * randRange(PROP_X_INNER, PROP_X_OUTER);
        holder.position.y = FLOOR_Y;
      });
    }

    // Meshy-generated dressing (each GLB is 80-250 KB, loaded once with the other templates).
    for (let i = 0; i < counts.seagrass; i++) addGlbProp('seagrass', randRange(1.4, 2.2), 0.12);
    for (let i = 0; i < counts.reefRock; i++) addGlbProp('reefRock', randRange(1.0, 2.0), 0.2);

    // Showcase landmarks: one of each on the long recycle loop — a slow parade of different
    // monuments swimming by instead of the same prop every few seconds. Remilia-detail set:
    // sunken anime statue head, torii gate, ruined columns, arcade cabinet, treasure, wrecks.
    const showcases: Array<[Parameters<typeof cloneSceneryPropVisual>[0], number, number]> = lowPower
      ? [
          ['statueHead', randRange(2.4, 2.9), 0.5],
          ['toriiGate', randRange(3.0, 3.6), 0.25],
          ['treasureChest', randRange(1.2, 1.5), 0.15],
        ]
      : [
          ['shipwreck', randRange(4.2, 5.0), 0.55],
          ['anchor', randRange(1.8, 2.3), 0.18],
          ['statueHead', randRange(2.6, 3.2), 0.5],
          ['toriiGate', randRange(3.4, 4.0), 0.25],
          ['ruinColumns', randRange(2.6, 3.2), 0.35],
          ['arcadeCabinet', randRange(1.7, 2.0), 0.2],
          ['treasureChest', randRange(1.2, 1.5), 0.15],
        ];
    for (const [kind, extent, sink] of showcases) {
      addGlbProp(kind, extent, sink, 5.0, 8.2, SHOWCASE_Z_SPAN);
    }
  }

  private buildFish(lowPower: boolean): void {
    const n = lowPower ? 10 : 24;
    const geo = createFishGeometry();
    const mat = new THREE.MeshBasicMaterial({
      color: 0x9fd4e6,
      transparent: true,
      opacity: 0.58,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    this.ownedGeos.push(geo);
    this.ownedMats.push(mat);
    this.fishMesh = new THREE.InstancedMesh(geo, mat, n);
    this.fishMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    for (let i = 0; i < n; i++) {
      this.fishes.push({
        y: randRange(-1.2, 4.4),
        z: randRange(-58, -26),
        dir: randSide(),
        speed: randRange(1.4, 3.2),
        phase: Math.random() * 36,
        scale: randRange(0.5, 1.05),
      });
    }
    this.group.add(this.fishMesh);
  }

  private buildBubbles(): void {
    const n = 80;
    const pos = new Float32Array(n * 3);
    this.bubbleSpeeds = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      pos[i * 3] = randSide() * randRange(2.8, 8);
      pos[i * 3 + 1] = randRange(FLOOR_Y, 6);
      pos[i * 3 + 2] = randRange(-46, 4);
      this.bubbleSpeeds[i] = randRange(0.5, 1.3);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({
      color: 0xd8f2fc,
      size: 0.055,
      transparent: true,
      opacity: 0.5,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    });
    this.ownedGeos.push(geo);
    this.ownedMats.push(mat);
    this.bubbles = new THREE.Points(geo, mat);
    this.group.add(this.bubbles);
  }

  /**
   * Register a showcase landmark on the long loop at the next fixed z slot. Slots are
   * SHOWCASE_SPACING apart with alternating starting coasts, so landmarks can never spawn
   * on top of each other — and since every prop scrolls at the same speed and recycles by
   * the same span, that separation holds forever.
   */
  private addShowcaseEntry(
    holder: THREE.Object3D,
    reseat: (side: 1 | -1) => void,
    zSpan: number,
  ): void {
    const slot = this.showcaseIndex++;
    const side: 1 | -1 = slot % 2 === 0 ? 1 : -1;
    reseat(side);
    holder.position.z = PROP_Z_MAX - 12 - slot * SHOWCASE_SPACING - randRange(0, 6);
    this.group.add(holder);
    this.props.push({ root: holder, reseat, side, zSpan });
  }

  /**
   * Add a stone-statue showpiece cloned from an already-loaded character rig. The geometry is
   * SHARED with the live character (never disposed here); pass its stone material once via
   * `ownedMat` so it is released on dispose.
   */
  addStatue(statue: THREE.Object3D, ownedMat: THREE.Material | null): void {
    if (ownedMat) this.ownedMats.push(ownedMat);
    const holder = new THREE.Group();
    holder.add(statue);
    statue.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(statue);
    if (!box.isEmpty()) {
      const c = box.getCenter(new THREE.Vector3());
      const half = box.getSize(new THREE.Vector3()).y / 2;
      statue.position.sub(c); // center on the holder origin...
      statue.position.y += half - 0.35; // ...then seat the base just under the sand
    }
    const tiltZ = (Math.random() - 0.5) * 0.24; // sunken monuments list a little
    this.addShowcaseEntry(
      holder,
      (side) => {
        holder.position.x = side * randRange(5.0, 7.6);
        holder.position.y = FLOOR_Y;
        holder.rotation.set(0, Math.random() * Math.PI * 2, tiltZ);
        holder.scale.setScalar(randRange(1.35, 1.7)); // larger than life
      },
      SHOWCASE_Z_SPAN,
    );
  }

  /**
   * Advance the dressing. `running` = mid-run (scroll at world speed × swimSpd);
   * otherwise (game over screen) the reef drifts almost imperceptibly, matching the
   * frozen hazards.
   */
  update(dt: number, t: number, running: boolean, swimSpd: number): void {
    const zVel = running ? WORLD_UNITS_PER_SEC * swimSpd : 0.12;

    // Seabed: scroll the texture instead of moving the plane (seamless).
    if (this.seabedTex) {
      const repeatZ = this.seabedTex.repeat.y;
      // Plane is rotated flat (-X), so texture +v points toward world -Z; increasing the
      // offset shifts the pattern toward +Z = toward the player, matching the obstacles.
      this.seabedTex.offset.y = THREE.MathUtils.euclideanModulo(
        this.seabedTex.offset.y + (zVel * dt * repeatZ) / 150,
        1,
      );
    }

    for (const p of this.props) {
      p.root.position.z += zVel * dt;
      if (p.root.position.z > PROP_Z_MAX) {
        p.root.position.z -= p.zSpan ?? PROP_Z_SPAN;
        p.side = (p.side === 1 ? -1 : 1) as 1 | -1;
        p.reseat(p.side);
      }
    }

    for (const blade of this.kelpPlanes) {
      const ph = blade.userData.swayPhase as number;
      const amp = blade.userData.swayAmp as number;
      blade.rotation.z = Math.sin(t * 1.1 + ph) * amp;
    }

    if (this.fishMesh) {
      for (let i = 0; i < this.fishes.length; i++) {
        const f = this.fishes[i]!;
        const travel = (t * f.speed + f.phase) % 36;
        const x = (travel - 18) * f.dir;
        const y = f.y + Math.sin(t * 0.8 + f.phase) * 0.35;
        this.fishDummy.position.set(x, y, f.z);
        this.fishDummy.rotation.set(0, 0, Math.sin(t * 2.2 + f.phase) * 0.08);
        this.fishDummy.scale.set(f.scale * f.dir, f.scale, f.scale);
        this.fishDummy.updateMatrix();
        this.fishMesh.setMatrixAt(i, this.fishDummy.matrix);
      }
      this.fishMesh.instanceMatrix.needsUpdate = true;
    }

    if (this.bubbles && this.bubbleSpeeds) {
      const attr = this.bubbles.geometry.getAttribute('position') as THREE.BufferAttribute;
      const arr = attr.array as Float32Array;
      for (let i = 0; i < this.bubbleSpeeds.length; i++) {
        let y = arr[i * 3 + 1]! + this.bubbleSpeeds[i]! * dt;
        if (y > 6.2) y = FLOOR_Y;
        arr[i * 3 + 1] = y;
        arr[i * 3] = arr[i * 3]! + Math.sin(t * 1.6 + i) * dt * 0.08;
        arr[i * 3 + 2] = arr[i * 3 + 2]! + zVel * dt * 0.25;
        if (arr[i * 3 + 2]! > 6) arr[i * 3 + 2] = -46;
      }
      attr.needsUpdate = true;
    }
  }

  setVisible(v: boolean): void {
    this.group.visible = v;
  }

  dispose(): void {
    // Coral clones share GLB template resources (flagged arcadeKeepSharedResources);
    // only resources created by this layer are disposed here.
    this.group.removeFromParent();
    for (const g of this.ownedGeos) g.dispose();
    for (const m of this.ownedMats) m.dispose();
    this.seabedTex?.dispose();
    this.kelpTex?.dispose();
    this.fishMesh?.dispose();
  }
}
