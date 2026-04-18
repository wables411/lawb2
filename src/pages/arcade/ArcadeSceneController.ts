import * as THREE from 'three';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';
import {
  ARCADE_CHARACTERS,
  type ArcadeCharacterDef,
  type ArcadeCharacterId,
} from './arcadeAssetConfig';
import {
  alignFbxBottomBeforeParent,
  alignFbxVerticalAfterLayout,
  applyArcadeHeroScale,
  buildArcadePlayableClip,
  disposeArcadeLoadedRoot,
  loadArcadeFbx,
  loadArcadeFbxClipsOnly,
  startLoopClip,
} from './loadArcadeFbx';
import {
  getCharacterStats,
  oxygenDrainPerSec,
  speedBandForStars,
} from './arcadeCharacterStats';
import {
  forcedOxyTankIntervalSec,
  reefRunHudFromSurvivalSec,
  reefRunPlayIntensityMultiplier,
  reefRunSpawnIntervalSec,
  reefRunSpawnRowThisWave,
  reefRunTwoBlockRowChance,
  REEF_RUN_OBSTACLE_BASE_SPEED,
  REEF_RUN_TICK_Z_SCALE,
  tierIndexFromSurvivalSec,
  type ReefRunHudPayload,
} from './arcadeDifficulty';
import {
  applyPickupEffect,
  characterHasUnlimitedOxygen,
  characterUsesOxygenMechanic,
  createInitialRunState,
  isBeneficialPickup,
  rollPickupKind,
  runStateToHud,
  type ArcadeRunHudState,
  type PickupKind,
  type RunEndReason,
  type RunState,
} from './arcadePickupKinds';
import { disposeObject3DResources } from './arcadePropPlacement';
import { cloneCoralObstacleVisual, clonePickupVisual, loadArcadePropGlbTemplates } from './arcadeGlbProps';
import { pulsePickupVisual, spinPickupVisual } from './arcadePickupMesh';

export type ArcadeGameScreen = 'intro' | 'menu' | 'select' | 'play' | 'gameover';

export type { ReefRunHudPayload } from './arcadeDifficulty';

/** Matches `arcadeMatBase` stored on materials in `loadArcadeFbx.repairFbxMaterials`. */
type ArcadeMatBase = {
  emissive: THREE.Color;
  emissiveIntensity: number;
  color: THREE.Color;
};

type CharacterSlot = {
  def: ArcadeCharacterDef;
  anchor: THREE.Group;
  idleRoot: THREE.Group;
  danceRoot: THREE.Group | null;
  idleMixer: THREE.AnimationMixer;
  idleAction: THREE.AnimationAction | null;
  danceMixer: THREE.AnimationMixer | null;
  danceAction: THREE.AnimationAction | null;
};

type Obstacle = {
  /** World root for this hazard (primitive `Mesh` or loaded `Group`). See `arcadePropPlacement.ts`. */
  root: THREE.Object3D;
  lane: number;
  speed: number;
  hit: boolean;
};

type PickupEnt = {
  root: THREE.Object3D;
  lane: number;
  speed: number;
  hit: boolean;
  kind: PickupKind;
};

type ImpactFx = {
  root: THREE.Object3D;
  age: number;
  life: number;
  update: (f: ImpactFx, dt: number) => void;
};

/** Lane centers (world X). Spacing 2.1 ⇒ ~0.78 gap between 1.32-wide obstacles. */
const LANES = [-2.1, 0, 2.1] as const;
const PLAYER_Z = 2.8;
const SPAWN_Z = -52;
const HIT_Z = PLAYER_Z;
/** Z half-thickness of the hit slab (must cover obstacle half-depth + timing slop). */
const HIT_HALF_DEPTH = 1.35;
/** Must match obstacle `BoxGeometry` depth (Z). */
const OBSTACLE_BOX_DEPTH_Z = 2.2;
const OBSTACLE_HALF_Z = OBSTACLE_BOX_DEPTH_Z / 2;
/** Obstacle width (X): slightly under lane spacing so neighbors read as separate columns. */
const OBSTACLE_BOX_WIDTH_X = 1.32;
/**
 * Obstacle height (Y): tall enough to overlap the swim hero’s AABB (feet ≈ {@link PLAYER_FEET_Y}),
 * so hazards read as “in your lane” rather than a floor the swimmer floats above.
 */
const OBSTACLE_BOX_HEIGHT_Y = 2.05;
const OBSTACLE_HALF_Y = OBSTACLE_BOX_HEIGHT_Y / 2;
/**
 * World Y where swim FBX soles sit after {@link alignFbxVerticalAfterLayout} (keep in sync below).
 * Coral bases sit slightly lower so columns feel anchored in the same volume as the player.
 */
const PLAYER_FEET_Y = -0.88;
const CORAL_BASE_BELOW_FEET = 0.12;
/** World Y center of obstacle column (BoxGeometry is axis-aligned). */
const OBSTACLE_CENTER_Y = PLAYER_FEET_Y - CORAL_BASE_BELOW_FEET + OBSTACLE_HALF_Y;
/** Tiny Z separation so two blocks in one row don’t z-fight. */
const ROW_Z_EPS = 0.04;
/** First hazard row after this many seconds (`enterPlay` primes `spawnAcc`). */
const FIRST_OBSTACLE_AFTER_S = 0.38;

/** Plinth X positions: left, center (hero), right */
const PODIUM_X = { L: -2.85, C: 0, R: 2.85 } as const;
const PODIUM_Y = -1.05;
const PODIUM_Z = 0.8;
const FACE_LEFT = 0.35;
const FACE_CENTER = 0;
const FACE_RIGHT = -0.35;

/**
 * Front of obstacle box past this line ⇒ lane is “committed” on approach (stacks with other rows).
 * Prevents three waves from piling into the hit slab together even when none overlap it yet this frame.
 */
const APPROACH_PIPE_Z = HIT_Z - HIT_HALF_DEPTH - 10;

function obstacleFrontPastApproachPipe(zCenter: number): boolean {
  return zCenter + OBSTACLE_HALF_Z > APPROACH_PIPE_Z;
}

const OBSTACLE_RECYCLE_Z = 8;
/** Keep distant props out of the draw list; gameplay/collision still runs on lane + Z logic. */
const OBSTACLE_RENDER_START_Z = -28;
const PICKUP_RENDER_START_Z = -24;

/** Distinct lanes with any live hazard still on the run (not recycled). Includes freshly spawned at `SPAWN_Z`. */
function lanesOnActiveTrack(obstacles: Obstacle[]): Set<number> {
  const lanes = new Set<number>();
  for (const o of obstacles) {
    if (o.hit) continue;
    if (o.root.position.z >= OBSTACLE_RECYCLE_Z) continue;
    lanes.add(o.lane);
  }
  return lanes;
}

/**
 * Narrow / touch-first layouts: fewer pixels, simpler materials, lighter geometry.
 * Phone: under 768px width. Tablet: width under 1024px with coarse pointer (avoids fine-pointer touch laptops).
 */
function isArcadeLowPowerDevice(): boolean {
  if (typeof window === 'undefined') return false;
  const sw = Math.min(window.innerWidth, window.innerHeight);
  const lw = Math.max(window.innerWidth, window.innerHeight);
  if (sw < 768) return true;
  if (lw < 1024) {
    try {
      return window.matchMedia('(pointer: coarse)').matches;
    } catch {
      return false;
    }
  }
  return false;
}

/** Procedural streaks for the reef tunnel interior (UV-scrolled = hyperspeed / warp motion). */
function createReefHyperspeedTunnelTexture(compact: boolean): THREE.CanvasTexture {
  const w = compact ? 96 : 128;
  const h = compact ? 384 : 512;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d');
  if (!ctx) throw new Error('canvas 2d');
  const radial = ctx.createRadialGradient(w * 0.5, h * 0.5, 0, w * 0.5, h * 0.5, w * 0.72);
  radial.addColorStop(0, '#020c14');
  radial.addColorStop(0.42, '#061c28');
  radial.addColorStop(1, '#010508');
  ctx.fillStyle = radial;
  ctx.fillRect(0, 0, w, h);
  const wash = ctx.createLinearGradient(0, 0, 0, h);
  wash.addColorStop(0, 'rgba(4,32,52,0.55)');
  wash.addColorStop(0.5, 'rgba(8,55,78,0.28)');
  wash.addColorStop(1, 'rgba(2,18,32,0.62)');
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, w, h);
  const streaksV = compact ? 36 : 64;
  for (let i = 0; i < streaksV; i++) {
    const x = (i / streaksV) * w + Math.sin(i * 2.1) * 3.5;
    const bw = 0.35 + (i % 5) * 0.28;
    const a = 0.085 + (i % 8) * 0.02;
    ctx.fillStyle = `rgba(120, 245, 255, ${a})`;
    ctx.fillRect(x, 0, bw, h);
  }
  const bands = compact ? 22 : 36;
  for (let j = 0; j < bands; j++) {
    const y = (j / bands) * h;
    const bh = 0.8 + (j % 4) * 0.5;
    ctx.fillStyle = `rgba(40, 160, 210, ${0.045 + (j % 6) * 0.014})`;
    ctx.fillRect(0, y, w, bh);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  if (compact) {
    tex.generateMipmaps = false;
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
  }
  tex.repeat.set(compact ? 5 : 6, compact ? 18 : 22);
  return tex;
}

export class ArcadeSceneController {
  private container: HTMLElement;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private clock = new THREE.Clock();
  private raf = 0;
  private pathRoot = new THREE.Group();
  private tunnel!: THREE.Mesh;
  private tunnelFlowTex!: THREE.CanvasTexture;
  /** Mobile / tablet: cheaper renderer, tunnel material, particles, cylinder segments. */
  private lowPowerMode = false;
  private plinthWorld = new THREE.Group();
  private playerWorld = new THREE.Group();
  private obstacleGroup = new THREE.Group();
  private slots = new Map<ArcadeCharacterId, CharacterSlot>();
  private raycaster = new THREE.Raycaster();
  private ndc = new THREE.Vector2();
  private mixers: THREE.AnimationMixer[] = [];
  private screen: ArcadeGameScreen = 'intro';
  private selectedId: ArcadeCharacterId | null = 'clawb';
  private playerLane = 1;
  private playerX = 0;
  private swimRoot: THREE.Group | null = null;
  private swimMixer: THREE.AnimationMixer | null = null;

  private removeMixerFromList(m: THREE.AnimationMixer | null): void {
    if (!m) return;
    const i = this.mixers.indexOf(m);
    if (i >= 0) this.mixers.splice(i, 1);
  }
  private obstacles: Obstacle[] = [];
  private pickups: PickupEnt[] = [];
  private impactFx: ImpactFx[] = [];
  private runState: RunState | null = null;
  private throttleSmoothed = 0;
  private keyW = false;
  private keyS = false;
  private virtualW = false;
  private virtualS = false;
  private hudRunAcc = 0;
  private pickupSpawnAcc = 0;
  /** Screen shake (seconds left, peak magnitude for offset). */
  private cameraShakeT = 0;
  private cameraShakePeak = 0;
  private spawnAcc = 0;
  /**
   * Increments each spawn timer fire; early game uses even waves only (every other row).
   * Starts at -1 so the first fire becomes wave 0 (always spawns).
   */
  private spawnWaveIndex = -1;
  private playEnded = false;
  /** Survival time while swim is active (excludes async load gap). */
  private runSurvivalSec = 0;
  private runClockActive = false;
  private playerPulseT = 0;
  private hudEmitAcc = 0;
  private lastEmittedTier = -1;
  private loaded = false;
  private pendingScreen: ArcadeGameScreen | null = null;
  /** Milady/Radbro: survival time at which the next guaranteed O₂ tank must spawn. */
  private nextForcedOxyTankSurvival = Number.POSITIVE_INFINITY;
  private readonly reefFogDensityBase = 0.041;
  private ambianceParticles: THREE.Points | null = null;
  private streakParticles: THREE.Points | null = null;
  private tunnelMaterial!: THREE.MeshStandardMaterial;
  private onPickCharacter: (id: ArcadeCharacterId) => void;
  /** Final survival time + how the run ended (UI + leaderboard). */
  private onGameOver: (survivalSec: number, reason: RunEndReason) => void;
  private onRunDifficulty?: (payload: ReefRunHudPayload) => void;
  private onRunHud?: (hud: ArcadeRunHudState) => void;
  private pointerBound = false;
  private keyBound = false;
  private _boxSel = new THREE.Box3();
  private _vSelCenter = new THREE.Vector3();
  private _vSelSize = new THREE.Vector3();
  private _vCamTarget = new THREE.Vector3();
  private _vCamPos = new THREE.Vector3();
  private _vDir = new THREE.Vector3();
  private _vPlayCenter = new THREE.Vector3();
  /** World feet / pivot for yaw toward camera on select screen. */
  private _vFacePivot = new THREE.Vector3();
  private _hslScratch = { h: 0, s: 0, l: 0 };
  private selectFillLight!: THREE.PointLight;
  private selectHemiLight!: THREE.HemisphereLight;
  /** Invalidates in-flight async dance loads when selection changes quickly. */
  private danceApplyGen = 0;

  constructor(
    container: HTMLElement,
    handlers: {
      onPickCharacter: (id: ArcadeCharacterId) => void;
      onGameOver: (survivalSec: number, reason: RunEndReason) => void;
      onRunDifficulty?: (payload: ReefRunHudPayload) => void;
      onRunHud?: (hud: ArcadeRunHudState) => void;
    },
  ) {
    this.container = container;
    this.onPickCharacter = handlers.onPickCharacter;
    this.onGameOver = handlers.onGameOver;
    this.onRunDifficulty = handlers.onRunDifficulty;
    this.onRunHud = handlers.onRunHud;
  }

  getScreen(): ArcadeGameScreen {
    return this.screen;
  }

  setScreen(next: ArcadeGameScreen): void {
    if (!this.loaded) {
      this.pendingScreen = next;
      return;
    }
    this.applyScreen(next);
  }

  private applyScreen(next: ArcadeGameScreen): void {
    this.screen = next;
    if (next !== 'play') this.clearVirtualThrottle();
    this.updatePointerCapture();
    if (next === 'play') {
      this.playEnded = false;
      this.cameraShakeT = 0;
      this.cameraShakePeak = 0;
      void this.enterPlay();
    }
    if (next === 'gameover') {
      this.playEnded = true;
      this.runClockActive = false;
      if (this.swimMixer) this.swimMixer.timeScale = 1;
    }
    if (next === 'menu') {
      this.clearSelectScreenHighlight();
      this.resetSelectionVisuals();
      this.layoutMenuPodiums();
    }
    if (next === 'select') {
      for (const slot of this.slots.values()) {
        slot.anchor.rotation.set(0, 0, 0);
      }
      this.resetSelectionVisuals();
      this.layoutSelectionPodiums();
      void this.applySelectionAnimations();
    }
    if (next === 'play' || next === 'intro' || next === 'gameover') {
      this.clearSelectScreenHighlight();
    }
    if (next === 'menu' || next === 'select') {
      this.cameraShakeT = 0;
      this.cameraShakePeak = 0;
      this.playerPulseT = 0;
      this.clearImpactFx();
      this.clearPickups();
      this.clearObstacles();
      this.playerWorld.visible = false;
      this.plinthWorld.visible = true;
      this.pathRoot.position.z = 0;
    }
  }

  setSelectedId(id: ArcadeCharacterId | null): void {
    this.selectedId = id;
    if (this.screen === 'select') {
      this.layoutSelectionPodiums();
    }
    void this.applySelectionAnimations();
  }

  /**
   * UI input bridge (touch/buttons): move one lane left/right without keyboard events.
   */
  nudgeLane(delta: -1 | 1): void {
    if (this.screen !== 'play' || this.playEnded) return;
    this.playerLane = THREE.MathUtils.clamp(this.playerLane + delta, 0, 2);
  }

  /**
   * UI input bridge (touch/buttons): virtual throttle state combined with W/S keys.
   */
  setVirtualThrottle(opts: { forward: boolean; backward: boolean }): void {
    this.virtualW = Boolean(opts.forward);
    this.virtualS = Boolean(opts.backward);
  }

  clearVirtualThrottle(): void {
    this.virtualW = false;
    this.virtualS = false;
  }

  /** Linear order: Clawb · Radbro · Milady (main menu). */
  private layoutMenuPodiums(): void {
    const xs = [PODIUM_X.L, PODIUM_X.C, PODIUM_X.R] as const;
    const faces = [FACE_LEFT, FACE_CENTER, FACE_RIGHT] as const;
    ARCADE_CHARACTERS.forEach((def, i) => {
      const slot = this.slots.get(def.id);
      if (!slot) return;
      slot.anchor.position.set(xs[i]!, PODIUM_Y, PODIUM_Z);
      slot.idleRoot.rotation.y = faces[i]!;
      if (slot.danceRoot) slot.danceRoot.rotation.y = faces[i]!;
    });
  }

  /** Radbro’s PBR export reads flat vs Clawb/Milady; boost albedo each select frame (see also `toneRadbroFbxMaterials`). */
  private applyRadbroSelectAlbedo(sm: THREE.MeshStandardMaterial, base: ArcadeMatBase, isSel: boolean): void {
    sm.color.copy(base.color);
    if (isSel) {
      sm.color.getHSL(this._hslScratch);
      this._hslScratch.s = THREE.MathUtils.clamp(this._hslScratch.s * 1.42, 0, 1);
      this._hslScratch.l = THREE.MathUtils.clamp(this._hslScratch.l * 1.12, 0, 1);
      sm.color.setHSL(this._hslScratch.h, this._hslScratch.s, this._hslScratch.l);
      sm.color.multiplyScalar(1.1);
    } else {
      sm.color.multiplyScalar(0.84);
    }
  }

  private snapshotMaterialBase(m: THREE.MeshStandardMaterial): ArcadeMatBase {
    const u = m.userData as { arcadeMatBase?: ArcadeMatBase };
    if (!u.arcadeMatBase) {
      u.arcadeMatBase = {
        emissive: m.emissive.clone(),
        emissiveIntensity: m.emissiveIntensity,
        color: m.color.clone(),
      };
    }
    return u.arcadeMatBase;
  }

  /**
   * Select screen: keep selected hero at full albedo (no emissive wash — that reads desaturated).
   * Dim others slightly; `selectFillLight` adds separation.
   */
  private applySelectScreenHighlight(): void {
    const sel = this.selectedId ?? 'clawb';
    for (const [id, slot] of this.slots) {
      const isSel = id === sel;
      const roots: THREE.Group[] = isSel
        ? ([slot.idleRoot, slot.danceRoot].filter(Boolean) as THREE.Group[])
        : [slot.idleRoot];
      for (const visRoot of roots) {
        visRoot.traverse((obj) => {
          const mesh = obj as THREE.Mesh;
          if (!mesh.isMesh) return;
          const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          for (const mat of mats) {
            const sm = mat as THREE.MeshStandardMaterial;
            if (!sm.isMeshStandardMaterial) continue;
            const base = this.snapshotMaterialBase(sm);
            if (isSel) {
              if (id === 'radbro') {
                this.applyRadbroSelectAlbedo(sm, base, true);
              } else {
                sm.color.copy(base.color);
              }
              sm.emissive.copy(base.emissive);
              sm.emissiveIntensity = base.emissiveIntensity;
            } else {
              sm.emissive.copy(base.emissive).multiplyScalar(0.28);
              sm.emissiveIntensity = base.emissiveIntensity * 0.32;
              if (id === 'radbro') {
                this.applyRadbroSelectAlbedo(sm, base, false);
              } else {
                sm.color.copy(base.color).multiplyScalar(0.64);
              }
            }
            sm.needsUpdate = true;
          }
        });
      }
    }
  }

  private clearSelectScreenHighlight(): void {
    for (const slot of this.slots.values()) {
      for (const root of [slot.idleRoot, slot.danceRoot].filter(Boolean) as THREE.Group[]) {
        root.traverse((obj) => {
          const mesh = obj as THREE.Mesh;
          if (!mesh.isMesh) return;
          const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          for (const mat of mats) {
            const sm = mat as THREE.MeshStandardMaterial;
            if (!sm.isMeshStandardMaterial) continue;
            const u = sm.userData as { arcadeMatBase?: ArcadeMatBase };
            const base = u.arcadeMatBase;
            if (!base) continue;
            sm.emissive.copy(base.emissive);
            sm.emissiveIntensity = base.emissiveIntensity;
            sm.color.copy(base.color);
            sm.needsUpdate = true;
          }
        });
      }
    }
  }

  /** Frame the selected hero: distance from bbox, look-at center, smooth follow on swap. */
  private updateSelectCamera(dt: number, t: number): void {
    const sel = this.selectedId ?? 'clawb';
    const slot = this.slots.get(sel);
    if (!slot) return;

    const roots: THREE.Object3D[] = [];
    if (slot.danceRoot?.visible) roots.push(slot.danceRoot);
    else roots.push(slot.idleRoot);

    this._boxSel.makeEmpty();
    for (const r of roots) {
      r.updateMatrixWorld(true);
      const b = new THREE.Box3().setFromObject(r);
      if (!b.isEmpty()) this._boxSel.union(b);
    }

    if (this._boxSel.isEmpty()) {
      this._vSelCenter.set(0, -0.2, PODIUM_Z);
      this._vSelSize.set(1.1, 1.9, 0.55);
    } else {
      this._boxSel.getCenter(this._vSelCenter);
      this._boxSel.getSize(this._vSelSize);
      this._vSelSize.y = THREE.MathUtils.clamp(this._vSelSize.y, 0.35, 2.45);
      this._vSelSize.x = THREE.MathUtils.clamp(this._vSelSize.x, 0.3, 1.25);
    }

    const margin = 1.22;
    const vFovRad = THREE.MathUtils.degToRad(this.camera.fov);
    const aspect = Math.max(this.camera.aspect, 0.4);
    const halfH = Math.max(this._vSelSize.y * margin * 0.5, 0.52);
    const halfW = Math.max(this._vSelSize.x * margin * 0.5, 0.42);
    const distY = halfH / Math.tan(vFovRad / 2);
    const distX = halfW / (Math.tan(vFovRad / 2) * aspect);
    let dist = Math.max(distY, distX, 3.85);
    dist = Math.min(dist, 10.8);

    const swayX = Math.sin(t * 0.09) * 0.14;
    const swayY = Math.cos(t * 0.07) * 0.07;
    this._vDir.set(swayX, 0.34 + swayY, 1).normalize();
    this._vCamPos.copy(this._vSelCenter).add(this._vDir.multiplyScalar(dist));

    const lerp = 1 - Math.pow(0.83, dt * 60 * 0.32);
    this.camera.position.lerp(this._vCamPos, Math.min(lerp, 0.55));

    this._vCamTarget.copy(this._vSelCenter);
    this._vCamTarget.y += this._vSelSize.y * 0.07;
    this.camera.lookAt(this._vCamTarget);

    const lx = this._vSelCenter.x + 1.05;
    const ly = this._vSelCenter.y + 1.55;
    const lz = this._vSelCenter.z + 2.75;
    this.selectFillLight.position.x += (lx - this.selectFillLight.position.x) * 0.14;
    this.selectFillLight.position.y += (ly - this.selectFillLight.position.y) * 0.14;
    this.selectFillLight.position.z += (lz - this.selectFillLight.position.z) * 0.14;
  }

  /** Yaw idle (and Clawb dance root) toward the camera on the XZ plane (FBX forward matches atan2 toward cam). */
  private updateSelectionFaceCamera(): void {
    const cx = this.camera.position.x;
    const cz = this.camera.position.z;
    for (const slot of this.slots.values()) {
      slot.idleRoot.getWorldPosition(this._vFacePivot);
      const dx = cx - this._vFacePivot.x;
      const dz = cz - this._vFacePivot.z;
      const yaw = Math.atan2(dx, dz);
      slot.idleRoot.rotation.y = yaw;
      if (slot.danceRoot) slot.danceRoot.rotation.y = yaw;
    }
  }

  /** Selected character always on center podium; others split left/right by roster order. */
  private layoutSelectionPodiums(): void {
    const sel = this.selectedId ?? 'clawb';
    const ordered = ARCADE_CHARACTERS.map((c) => c.id);
    const others = ordered.filter((id) => id !== sel);
    const leftId = others[0]!;
    const rightId = others[1]!;
    const plan = new Map<ArcadeCharacterId, number>([
      [leftId, PODIUM_X.L],
      [sel, PODIUM_X.C],
      [rightId, PODIUM_X.R],
    ]);
    for (const [id, slot] of this.slots) {
      const x = plan.get(id);
      if (x === undefined) continue;
      slot.anchor.position.set(x, PODIUM_Y, PODIUM_Z);
    }
  }

  async bootstrap(): Promise<void> {
    this.lowPowerMode = isArcadeLowPowerDevice();
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x020a14, this.reefFogDensityBase);

    this.camera = new THREE.PerspectiveCamera(
      52,
      1,
      0.1,
      this.lowPowerMode ? 165 : 220,
    );
    this.camera.position.set(0, 0, 6);

    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.lowPowerMode,
      alpha: true,
      powerPreference: 'high-performance',
      stencil: false,
    });
    this.renderer.setClearColor(0x000000, 0);
    if (this.lowPowerMode) {
      this.renderer.toneMapping = THREE.LinearToneMapping;
      this.renderer.toneMappingExposure = 1;
    } else {
      this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
      this.renderer.toneMappingExposure = 0.98;
    }
    this.renderer.domElement.style.display = 'block';
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
    this.container.appendChild(this.renderer.domElement);

    const tr = this.lowPowerMode ? 42 : 96;
    const th = this.lowPowerMode ? 14 : 36;
    const tunnelGeo = new THREE.CylinderGeometry(8.5, 9.2, 140, tr, th, true);
    this.tunnelFlowTex = createReefHyperspeedTunnelTexture(this.lowPowerMode);
    this.tunnelMaterial = new THREE.MeshStandardMaterial({
      color: 0x020c18,
      metalness: this.lowPowerMode ? 0.22 : 0.44,
      roughness: this.lowPowerMode ? 0.48 : 0.36,
      side: THREE.BackSide,
      map: this.tunnelFlowTex,
      emissive: 0x0d4a62,
      emissiveMap: this.tunnelFlowTex,
      emissiveIntensity: this.lowPowerMode ? 0.62 : 0.68,
    });
    this.tunnel = new THREE.Mesh(tunnelGeo, this.tunnelMaterial);
    this.tunnel.rotation.x = Math.PI / 2;
    this.tunnel.position.z = -42;

    this.pathRoot.add(this.tunnel);
    this.scene.add(this.pathRoot);

    this.scene.add(new THREE.AmbientLight(0xb8d5e8, this.lowPowerMode ? 0.44 : 0.36));
    const key = new THREE.PointLight(
      0xc8e8ff,
      this.lowPowerMode ? 52 : 64,
      this.lowPowerMode ? 50 : 56,
      1.85,
    );
    key.position.set(2.8, 3.2, 7);
    const fill = new THREE.PointLight(
      0x4ab8d8,
      this.lowPowerMode ? 32 : 44,
      this.lowPowerMode ? 46 : 48,
      2.05,
    );
    fill.position.set(-3.8, -0.8, 5);
    const rim = new THREE.DirectionalLight(0xa8dcc8, 0.32);
    rim.position.set(-0.4, 4.2, 6.5);
    this.selectFillLight = new THREE.PointLight(0xfff2e6, 48, 18, 1.55);
    this.selectFillLight.position.set(1.4, 2.5, 4.5);
    this.selectFillLight.visible = false;
    this.selectHemiLight = new THREE.HemisphereLight(0xfff4ec, 0x1a2a38, 0.4);
    this.selectHemiLight.position.set(0, 5.5, 1.5);
    this.selectHemiLight.visible = false;
    this.scene.add(key, fill, this.selectFillLight, this.selectHemiLight);
    if (!this.lowPowerMode) this.scene.add(rim);

    const n = this.lowPowerMode ? 340 : 1800;
    const positions = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 18;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 12;
      positions[i * 3 + 2] = -Math.random() * 90;
    }
    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const pMat = new THREE.PointsMaterial({
      color: 0x9ae8ff,
      size: this.lowPowerMode ? 0.055 : 0.048,
      transparent: true,
      opacity: this.lowPowerMode ? 0.48 : 0.52,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    });
    this.ambianceParticles = new THREE.Points(pGeo, pMat);
    this.scene.add(this.ambianceParticles);

    const ns = this.lowPowerMode ? 150 : 1100;
    const sp = new Float32Array(ns * 3);
    for (let i = 0; i < ns; i++) {
      const ang = Math.random() * Math.PI * 2;
      const rad = 6.2 + Math.random() * 3.2;
      sp[i * 3] = Math.cos(ang) * rad;
      sp[i * 3 + 1] = (Math.random() - 0.5) * 8;
      sp[i * 3 + 2] = -Math.random() * 95;
    }
    const sGeo = new THREE.BufferGeometry();
    sGeo.setAttribute('position', new THREE.BufferAttribute(sp, 3));
    const sMat = new THREE.PointsMaterial({
      color: 0x5ad8f0,
      size: this.lowPowerMode ? 0.038 : 0.032,
      transparent: true,
      opacity: this.lowPowerMode ? 0.55 : 0.62,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    });
    this.streakParticles = new THREE.Points(sGeo, sMat);
    this.scene.add(this.streakParticles);

    this.scene.add(this.plinthWorld);
    this.scene.add(this.playerWorld);
    this.scene.add(this.obstacleGroup);
    this.playerWorld.visible = false;

    try {
      await loadArcadePropGlbTemplates();
    } catch (e) {
      console.warn('[Arcade] Prop GLB preload failed', e);
    }

    /* Tighter X so all three stay in view on portrait / narrow aspect (was ±4.4). */
    const xs = [PODIUM_X.L, PODIUM_X.C, PODIUM_X.R];
    const faces = [FACE_LEFT, FACE_CENTER, FACE_RIGHT];
    for (let i = 0; i < ARCADE_CHARACTERS.length; i++) {
      const def = ARCADE_CHARACTERS[i];
      const anchor = new THREE.Group();
      anchor.position.set(xs[i]!, PODIUM_Y, PODIUM_Z);
      anchor.userData.characterId = def.id;
      const base = new THREE.Mesh(
        new THREE.CylinderGeometry(0.55, 0.72, 0.22, this.lowPowerMode ? 14 : 28),
        new THREE.MeshStandardMaterial({
          color: 0x0a1018,
          metalness: 0.65,
          roughness: 0.35,
          emissive: 0x020408,
          emissiveIntensity: 0.25,
        }),
      );
      anchor.add(base);
      try {
        const { root, clips } = await loadArcadeFbx(def.idle, def.id);
        root.userData.characterId = def.id;
        root.rotation.y = faces[i]!;
        applyArcadeHeroScale(root, def.heightMul ?? 1);
        alignFbxBottomBeforeParent(root, 0.15);
        anchor.add(root);
      const { mixer, action } = startLoopClip(root, clips, { stripRootMotion: false, retarget: true });
      this.mixers.push(mixer);
        this.slots.set(def.id, {
          def,
          anchor,
          idleRoot: root,
          danceRoot: null,
          idleMixer: mixer,
          idleAction: action,
          danceMixer: null,
          danceAction: null,
        });
      } catch (e) {
        console.warn(`[Arcade] Failed to load idle for ${def.id}`, e);
        const fallback = new THREE.Mesh(
          new THREE.CapsuleGeometry(0.35, 0.85, 6, 12),
          new THREE.MeshStandardMaterial({ color: 0xff6b35, emissive: 0xff6b35, emissiveIntensity: 0.3 }),
        );
        fallback.position.y = 0.75;
        fallback.userData.characterId = def.id;
        anchor.add(fallback);
        const mixer = new THREE.AnimationMixer(anchor);
        this.slots.set(def.id, {
          def,
          anchor,
          idleRoot: fallback as unknown as THREE.Group,
          danceRoot: null,
          idleMixer: mixer,
          idleAction: null,
          danceMixer: null,
          danceAction: null,
        });
      }
      this.plinthWorld.add(anchor);
    }

    this.loaded = true;
    if (this.pendingScreen !== null) {
      const q = this.pendingScreen;
      this.pendingScreen = null;
      this.applyScreen(q);
    }

    const ro = new ResizeObserver(() => this.resize());
    ro.observe(this.container);
    (this as unknown as { _ro?: ResizeObserver })._ro = ro;

    this.resize();
    this.updatePointerCapture();
    this.bindKeys();
    this.tick();
  }

  private resize(): void {
    const w = this.container.clientWidth || window.innerWidth;
    const h = this.container.clientHeight || window.innerHeight;
    this.camera.aspect = w / Math.max(h, 1);
    this.camera.updateProjectionMatrix();
    const pr = Math.min(
      typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1,
      this.lowPowerMode ? 1.0 : 1.35,
    );
    this.renderer.setPixelRatio(pr);
    this.renderer.setSize(w, h, false);
  }

  private updatePointerCapture(): void {
    const want = this.screen === 'select';
    if (want && !this.pointerBound) {
      this.renderer.domElement.addEventListener('pointerdown', this.onPointerDown);
      this.pointerBound = true;
    }
    if (!want && this.pointerBound) {
      this.renderer.domElement.removeEventListener('pointerdown', this.onPointerDown);
      this.pointerBound = false;
    }
  }

  private onPointerDown = (ev: PointerEvent): void => {
    if (this.screen !== 'select') return;
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.ndc.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
    this.ndc.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
    this.raycaster.setFromCamera(this.ndc, this.camera);
    const hits = this.raycaster.intersectObjects(this.plinthWorld.children, true);
    for (const h of hits) {
      let o: THREE.Object3D | null = h.object;
      while (o) {
        const id = o.userData?.characterId as ArcadeCharacterId | undefined;
        if (id && this.slots.has(id)) {
          this.onPickCharacter(id);
          return;
        }
        o = o.parent;
      }
    }
  };

  private bindKeys(): void {
    if (this.keyBound) return;
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    this.keyBound = true;
  }

  private onKeyDown = (ev: KeyboardEvent): void => {
    if (this.screen !== 'play') return;
    if (ev.code === 'ArrowLeft' || ev.code === 'KeyA') {
      this.playerLane = Math.max(0, this.playerLane - 1);
    } else if (ev.code === 'ArrowRight' || ev.code === 'KeyD') {
      this.playerLane = Math.min(2, this.playerLane + 1);
    } else if (ev.code === 'KeyW') {
      this.keyW = true;
    } else if (ev.code === 'KeyS') {
      this.keyS = true;
    }
  };

  private onKeyUp = (ev: KeyboardEvent): void => {
    if (ev.code === 'KeyW') this.keyW = false;
    if (ev.code === 'KeyS') this.keyS = false;
  };

  private resetSelectionVisuals(): void {
    for (const slot of this.slots.values()) {
      if (slot.idleRoot) slot.idleRoot.visible = true;
      if (slot.danceRoot) {
        slot.danceRoot.visible = false;
      }
      slot.danceAction?.stop();
      if (slot.idleAction) {
        slot.idleAction.paused = false;
        slot.idleAction.play();
      }
    }
  }

  /** Older builds added a full dance FBX for Radbro/Milady; remove if still present. */
  private disposeLegacyDanceRoot(slot: CharacterSlot): void {
    if (!slot.danceRoot) return;
    slot.anchor.remove(slot.danceRoot);
    this.removeMixerFromList(slot.danceMixer);
    slot.danceMixer?.stopAllAction();
    disposeArcadeLoadedRoot(slot.danceRoot);
    slot.danceRoot = null;
    slot.danceMixer = null;
    slot.danceAction = null;
  }

  private async applySelectionAnimations(): Promise<void> {
    const gen = ++this.danceApplyGen;

    for (const slot of this.slots.values()) {
      if (slot.def.danceUsesIdleMesh && slot.danceRoot) {
        this.disposeLegacyDanceRoot(slot);
      }
    }

    for (const [id, slot] of this.slots) {
      const isSel = id === this.selectedId;
      if (!isSel) {
        if (slot.danceRoot) slot.danceRoot.visible = false;
        slot.danceAction?.stop();
        slot.idleRoot.visible = true;
        slot.idleAction?.reset().fadeIn(0.12).play();
        continue;
      }

      if (slot.def.danceUsesIdleMesh) {
        slot.idleRoot.visible = true;
        if (!slot.danceAction) {
          try {
            const clips = await loadArcadeFbxClipsOnly(slot.def.dance);
            if (gen !== this.danceApplyGen) return;
            const clip = buildArcadePlayableClip(clips, slot.idleRoot, { retarget: true });
            if (!clip || clip.tracks.length === 0) {
              console.warn('[Arcade] no usable dance tracks for', slot.def.id);
              slot.idleAction?.play();
              continue;
            }
            slot.danceAction = slot.idleMixer.clipAction(clip);
            slot.danceAction.setLoop(THREE.LoopRepeat, Infinity);
          } catch (e) {
            console.warn('[Arcade] dance clip load failed', slot.def.id, e);
            slot.idleAction?.play();
            continue;
          }
        }
        if (gen !== this.danceApplyGen) return;
        slot.idleAction?.fadeOut(0.22);
        slot.danceAction?.reset().fadeIn(0.28).play();
        continue;
      }

      slot.idleRoot.visible = false;
      if (!slot.danceRoot) {
        try {
          const { root, clips } = await loadArcadeFbx(slot.def.dance, slot.def.id);
          if (gen !== this.danceApplyGen) return;
          root.userData.characterId = slot.def.id;
          root.rotation.copy(slot.idleRoot.rotation);
          applyArcadeHeroScale(root, slot.def.heightMul ?? 1);
          alignFbxBottomBeforeParent(root, 0.15);
          slot.anchor.add(root);
          slot.danceRoot = root;
          const { mixer, action } = startLoopClip(root, clips, { stripRootMotion: false, retarget: true });
          if (mixer) this.mixers.push(mixer);
          slot.danceMixer = mixer;
          slot.danceAction = action;
        } catch (e) {
          console.warn('[Arcade] dance load failed', e);
          slot.idleRoot.visible = true;
          continue;
        }
      }
      if (gen !== this.danceApplyGen) return;
      if (slot.danceRoot) {
        slot.danceRoot.visible = true;
        slot.danceAction?.reset().fadeIn(0.2).play();
      }
    }
  }

  private async enterPlay(): Promise<void> {
    if (!this.selectedId) return;
    const slot = this.slots.get(this.selectedId);
    if (!slot) return;
    this.pathRoot.position.z = 0;
    /** Must match run stats after async loads — do not re-read `selectedId` after `await`. */
    const playCharacterId = slot.def.id;
    this.plinthWorld.visible = false;
    this.playerWorld.visible = true;
    this.clearObstacles();
    this.clearPickups();
    this.clearImpactFx();
    this.playerLane = 1;
    this.playerX = LANES[1];
    this.spawnWaveIndex = -1;
    this.spawnAcc = Math.max(0, reefRunSpawnIntervalSec(0) - FIRST_OBSTACLE_AFTER_S);
    this.runSurvivalSec = 0;
    this.runClockActive = false;
    this.hudEmitAcc = 0;
    this.lastEmittedTier = -1;

    while (this.playerWorld.children.length) {
      this.playerWorld.remove(this.playerWorld.children[0]);
    }
    this.removeMixerFromList(this.swimMixer);
    this.swimMixer?.stopAllAction();
    this.swimRoot = null;
    this.swimMixer = null;

    try {
      if (slot.def.swimUsesIdleMesh) {
        const root = SkeletonUtils.clone(slot.idleRoot) as THREE.Group;
        root.userData.characterId = slot.def.id;
        root.position.set(0, 0, 0);
        root.rotation.set(0, Math.PI, 0);
        root.scale.copy(slot.idleRoot.scale).multiplyScalar(1.06);
        root.updateMatrixWorld(true);
        root.position.set(0, 0, PLAYER_Z);
        this.playerWorld.add(root);
        alignFbxVerticalAfterLayout(root, PLAYER_FEET_Y);
        this.swimRoot = root;
        const clips = await loadArcadeFbxClipsOnly(slot.def.swim);
        const clip = buildArcadePlayableClip(clips, root, { stripRootMotion: true, retarget: true });
        if (!clip) throw new Error('no swim clip');
        const mixer = new THREE.AnimationMixer(root);
        const action = mixer.clipAction(clip);
        action.setLoop(THREE.LoopRepeat, Infinity);
        action.play();
        this.swimMixer = mixer;
        this.mixers.push(mixer);
      } else {
        const { root, clips } = await loadArcadeFbx(slot.def.swim, slot.def.id);
        root.rotation.y = Math.PI;
        root.position.set(0, 0, PLAYER_Z);
        this.playerWorld.add(root);
        applyArcadeHeroScale(root, (slot.def.heightMul ?? 1) * 1.06);
        alignFbxVerticalAfterLayout(root, PLAYER_FEET_Y);
        this.swimRoot = root;
        const { mixer, action } = startLoopClip(root, clips, { stripRootMotion: true, retarget: true });
        this.swimMixer = mixer;
        if (mixer) this.mixers.push(mixer);
        void action;
      }
    } catch (e) {
      console.warn('[Arcade] swim load failed', e);
      const box = new THREE.Mesh(
        new THREE.BoxGeometry(0.8, 1.2, 0.5),
        new THREE.MeshStandardMaterial({ color: 0x4a9e8c, emissive: 0x1a4a40, emissiveIntensity: 0.35 }),
      );
      box.position.set(0, -0.5, PLAYER_Z);
      this.playerWorld.add(box);
    }

    this.runState = createInitialRunState(playCharacterId, this.clock.elapsedTime);
    this.nextForcedOxyTankSurvival = characterUsesOxygenMechanic(playCharacterId)
      ? 6.5
      : Number.POSITIVE_INFINITY;
    this.throttleSmoothed = 0;
    this.keyW = false;
    this.keyS = false;
    this.pickupSpawnAcc = 0;
    this.hudRunAcc = 0;
    this.runClockActive = true;
    this.lastEmittedTier = 0;
    this.hudEmitAcc = 0;
    this.onRunDifficulty?.(reefRunHudFromSurvivalSec(0));
    if (this.onRunHud && this.runState) {
      this.onRunHud(
        runStateToHud(this.runState, this.clock.elapsedTime, 1),
      );
    }
  }

  private clearObstacles(): void {
    for (const o of this.obstacles) {
      this.obstacleGroup.remove(o.root);
      disposeObject3DResources(o.root);
    }
    this.obstacles = [];
  }

  /** Lanes with a live hazard whose front has passed the approach line (same lane can stack; set size = lane count). */
  private lanesBusyInApproachPipe(): Set<number> {
    const lanes = new Set<number>();
    for (const o of this.obstacles) {
      if (o.hit) continue;
      if (obstacleFrontPastApproachPipe(o.root.position.z)) lanes.add(o.lane);
    }
    return lanes;
  }

  /**
   * Per-wave gap is not enough: new spawns sit at `SPAWN_Z` **outside** the approach pipe, so
   * `lanesBusyInApproachPipe().size` could be 0–1 while **two-block** row 3 still adds the third
   * lane on the full track (classic by “third row”). We also gate on **all** lanes on track and
   * forbid two-block rows unless the track is empty.
   */
  /** @returns false if spawn was deferred. */
  private trySpawnObstacleRow(): boolean {
    if (this.lanesBusyInApproachPipe().size >= 2) {
      return false;
    }

    const track = lanesOnActiveTrack(this.obstacles);
    if (track.size >= 3) {
      return false;
    }

    if (track.size === 2) {
      const free = ([0, 1, 2] as const).find((l) => !track.has(l));
      if (free === undefined) return false;
      this.spawnObstacleInLane(free, SPAWN_Z);
      return true;
    }

    if (track.size === 1) {
      const busy = [...track][0]!;
      const open = [0, 1, 2].filter((l) => l !== busy);
      const lane = open[Math.floor(Math.random() * open.length)]!;
      this.spawnObstacleInLane(lane, SPAWN_Z);
      return true;
    }

    const gapLane = Math.floor(Math.random() * 3);
    const fillLanes = [0, 1, 2].filter((l) => l !== gapLane);
    const twoBlockRow = Math.random() < reefRunTwoBlockRowChance(this.runSurvivalSec);
    if (twoBlockRow) {
      this.spawnObstacleInLane(fillLanes[0]!, SPAWN_Z);
      this.spawnObstacleInLane(fillLanes[1]!, SPAWN_Z + ROW_Z_EPS);
    } else {
      const lane = fillLanes[Math.floor(Math.random() * 2)]!;
      this.spawnObstacleInLane(lane, SPAWN_Z);
    }
    return true;
  }

  private spawnObstacleInLane(lane: number, z: number): void {
    let root: THREE.Object3D;
    const coral = cloneCoralObstacleVisual();
    if (coral) {
      root = coral;
    } else {
      const geo = new THREE.BoxGeometry(OBSTACLE_BOX_WIDTH_X, OBSTACLE_BOX_HEIGHT_Y, OBSTACLE_BOX_DEPTH_Z);
      const mat = new THREE.MeshStandardMaterial({
        color: 0xf25544,
        emissive: 0x8a2218,
        emissiveIntensity: 0.48,
        metalness: 0.14,
        roughness: 0.55,
      });
      root = new THREE.Mesh(geo, mat);
    }
    root.position.set(LANES[lane], OBSTACLE_CENTER_Y, z);
    root.visible = z > OBSTACLE_RENDER_START_Z;
    this.obstacleGroup.add(root);
    const speed = REEF_RUN_OBSTACLE_BASE_SPEED * (0.94 + Math.random() * 0.12);
    this.obstacles.push({ root, lane, speed, hit: false });
  }

  private clearPickups(): void {
    for (const p of this.pickups) {
      this.obstacleGroup.remove(p.root);
      disposeObject3DResources(p.root);
    }
    this.pickups = [];
  }

  private laneBlockedForPickup(lane: number): boolean {
    return this.obstacles.some(
      (o) => !o.hit && o.lane === lane && o.root.position.z > -50 && o.root.position.z < 5,
    );
  }

  private trySpawnPickup(): void {
    const cid = this.runState?.characterId ?? 'clawb';
    for (let tryN = 0; tryN < 3; tryN++) {
      const lane = (Math.floor(Math.random() * 3) + tryN) % 3;
      if (!this.laneBlockedForPickup(lane)) {
        this.spawnPickupInLane(lane, rollPickupKind(this.runSurvivalSec, cid));
        return;
      }
    }
  }

  /** Guaranteed tank for O₂ characters — prefers center lane when clear. */
  private trySpawnForcedOxygenTank(): boolean {
    const order = [1, 0, 2] as const;
    for (const lane of order) {
      if (!this.laneBlockedForPickup(lane)) {
        this.spawnPickupInLane(lane, 'air_tank');
        return true;
      }
    }
    return false;
  }

  private spawnPickupInLane(lane: number, kind: PickupKind): void {
    const root = clonePickupVisual(kind);
    root.position.set(LANES[lane], OBSTACLE_CENTER_Y, SPAWN_Z);
    root.visible = SPAWN_Z > PICKUP_RENDER_START_Z;
    this.obstacleGroup.add(root);
    /** Slightly slower than coral so pickups are easier to read. */
    const speed = REEF_RUN_OBSTACLE_BASE_SPEED * (0.88 + Math.random() * 0.12) * 0.74;
    this.pickups.push({ root, lane, speed, hit: false, kind });
  }

  /** Longer runs = slightly longer between pickup spawns (focus on dodging). */
  private pickupSpawnIntervalSec(): number {
    const x = Math.min(1, Math.max(0, this.runSurvivalSec / 95));
    const s = x * x * (3 - 2 * x);
    return 2.18 + s * 0.62;
  }

  private addCameraShake(peak: number): void {
    if (peak <= 0) return;
    this.cameraShakeT = Math.max(this.cameraShakeT, 0.26);
    this.cameraShakePeak = Math.max(this.cameraShakePeak, peak);
  }

  private addImpactFx(
    root: THREE.Object3D,
    life: number,
    update: (f: ImpactFx, dt: number) => void,
  ): void {
    root.renderOrder = 30;
    this.obstacleGroup.add(root);
    this.impactFx.push({ root, age: 0, life, update });
  }

  private randomUnitVector3(): THREE.Vector3 {
    const v = new THREE.Vector3(Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1);
    return v.lengthSq() > 1e-6 ? v.normalize() : new THREE.Vector3(0, 1, 0);
  }

  private spawnMineExplosion(position: THREE.Vector3): void {
    const root = new THREE.Group();
    root.position.copy(position);

    const flash = new THREE.Mesh(
      new THREE.SphereGeometry(0.26, 18, 14),
      new THREE.MeshBasicMaterial({
        color: 0xfff2c9,
        transparent: true,
        opacity: 1,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    );
    root.add(flash);

    const fireball = new THREE.Mesh(
      new THREE.SphereGeometry(0.44, 18, 14),
      new THREE.MeshBasicMaterial({
        color: 0xff5a2a,
        transparent: true,
        opacity: 0.92,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    );
    root.add(fireball);

    const ringA = new THREE.Mesh(
      new THREE.TorusGeometry(0.32, 0.08, 10, 26),
      new THREE.MeshBasicMaterial({
        color: 0xffb144,
        transparent: true,
        opacity: 0.9,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    );
    ringA.rotation.x = Math.PI / 2;
    root.add(ringA);

    const ringB = new THREE.Mesh(
      new THREE.TorusGeometry(0.24, 0.06, 8, 22),
      new THREE.MeshBasicMaterial({
        color: 0xff6b38,
        transparent: true,
        opacity: 0.86,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    );
    ringB.rotation.y = Math.PI / 2;
    root.add(ringB);

    const sparkCount = 34;
    const sparkPos = new Float32Array(sparkCount * 3);
    const sparkVel = new Float32Array(sparkCount * 3);
    for (let i = 0; i < sparkCount; i++) {
      const d = this.randomUnitVector3();
      const speed = 1.8 + Math.random() * 4;
      sparkVel[i * 3] = d.x * speed;
      sparkVel[i * 3 + 1] = d.y * speed * 0.9 + 0.8;
      sparkVel[i * 3 + 2] = d.z * speed;
    }
    const sparkGeo = new THREE.BufferGeometry();
    const sparkAttr = new THREE.BufferAttribute(sparkPos, 3);
    sparkGeo.setAttribute('position', sparkAttr);
    const sparkMat = new THREE.PointsMaterial({
      color: 0xffd89c,
      size: 0.11,
      transparent: true,
      opacity: 0.95,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    });
    const sparks = new THREE.Points(sparkGeo, sparkMat);
    root.add(sparks);

    this.addImpactFx(root, 0.72, (fx) => {
      const t = Math.min(1, fx.age / fx.life);
      const blast = 1 - Math.pow(1 - t, 3);
      flash.scale.setScalar(0.2 + blast * 3.2);
      fireball.scale.setScalar(0.52 + blast * 2.8);
      ringA.scale.setScalar(0.5 + blast * 4.4);
      ringB.scale.setScalar(0.42 + blast * 3.7);
      (flash.material as THREE.MeshBasicMaterial).opacity = Math.max(0, (1 - t) * 1.15);
      (fireball.material as THREE.MeshBasicMaterial).opacity = Math.max(0, (1 - t) * 0.82);
      (ringA.material as THREE.MeshBasicMaterial).opacity = Math.max(0, (1 - t) * 0.92);
      (ringB.material as THREE.MeshBasicMaterial).opacity = Math.max(0, (1 - t) * 0.76);

      const age = fx.age;
      for (let i = 0; i < sparkCount; i++) {
        const ix = i * 3;
        sparkPos[ix] = sparkVel[ix] * age;
        sparkPos[ix + 1] = sparkVel[ix + 1] * age - age * age * 1.2;
        sparkPos[ix + 2] = sparkVel[ix + 2] * age;
      }
      sparkAttr.needsUpdate = true;
      sparkMat.opacity = Math.max(0, (1 - t) * 0.95);
    });
  }

  private spawnPufferInflate(position: THREE.Vector3): void {
    const root = new THREE.Group();
    root.position.copy(position);

    const puff = new THREE.Mesh(
      new THREE.SphereGeometry(0.34, 16, 12),
      new THREE.MeshBasicMaterial({
        color: 0xf7d28a,
        transparent: true,
        opacity: 0.95,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    );
    root.add(puff);

    const spikes = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.43, 1),
      new THREE.MeshBasicMaterial({
        color: 0xffe8b4,
        wireframe: true,
        transparent: true,
        opacity: 0.82,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    );
    root.add(spikes);

    const pressureRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.3, 0.045, 8, 20),
      new THREE.MeshBasicMaterial({
        color: 0xffde91,
        transparent: true,
        opacity: 0.74,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    );
    pressureRing.rotation.x = Math.PI / 2;
    root.add(pressureRing);

    this.addImpactFx(root, 0.58, (fx) => {
      const t = Math.min(1, fx.age / fx.life);
      const inflate = t < 0.4 ? 0.24 + (t / 0.4) * 2.45 : 2.69 - ((t - 0.4) / 0.6) * 1.05;
      const wobble = 1 + Math.sin(fx.age * 32) * 0.07 * (1 - t);
      puff.scale.setScalar(inflate * wobble);
      spikes.scale.setScalar(inflate * (1.16 + Math.sin(fx.age * 26) * 0.04));
      pressureRing.scale.setScalar(0.4 + t * 3.1);
      pressureRing.rotation.z += 0.04;
      (puff.material as THREE.MeshBasicMaterial).opacity = Math.max(0, (1 - t) * 0.92);
      (spikes.material as THREE.MeshBasicMaterial).opacity = Math.max(0, (1 - t) * 0.76);
      (pressureRing.material as THREE.MeshBasicMaterial).opacity = Math.max(0, (1 - t) * 0.62);
    });
  }

  private spawnJellyShock(position: THREE.Vector3): void {
    const root = new THREE.Group();
    root.position.copy(position);

    const glow = new THREE.Mesh(
      new THREE.SphereGeometry(0.26, 12, 10),
      new THREE.MeshBasicMaterial({
        color: 0x90dbff,
        transparent: true,
        opacity: 0.72,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    );
    root.add(glow);

    const ringA = new THREE.Mesh(
      new THREE.TorusGeometry(0.24, 0.04, 8, 28),
      new THREE.MeshBasicMaterial({
        color: 0x78cfff,
        transparent: true,
        opacity: 0.86,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    );
    ringA.rotation.x = Math.PI / 2;
    root.add(ringA);

    const ringB = ringA.clone();
    ringB.material = (ringA.material as THREE.MeshBasicMaterial).clone();
    ringB.rotation.y = Math.PI / 2;
    root.add(ringB);

    const boltCount = 11;
    const segmentCount = 5;
    const boltPos = new Float32Array(boltCount * segmentCount * 2 * 3);
    const boltGeo = new THREE.BufferGeometry();
    const boltAttr = new THREE.BufferAttribute(boltPos, 3);
    boltGeo.setAttribute('position', boltAttr);
    const boltMat = new THREE.LineBasicMaterial({
      color: 0xa7ecff,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const bolts = new THREE.LineSegments(boltGeo, boltMat);
    root.add(bolts);

    const dirs: THREE.Vector3[] = [];
    const sideA: THREE.Vector3[] = [];
    const sideB: THREE.Vector3[] = [];
    for (let i = 0; i < boltCount; i++) {
      const d = this.randomUnitVector3();
      dirs.push(d);
      let a = new THREE.Vector3().crossVectors(d, new THREE.Vector3(0, 1, 0));
      if (a.lengthSq() < 1e-5) a = new THREE.Vector3().crossVectors(d, new THREE.Vector3(1, 0, 0));
      a.normalize();
      const b = new THREE.Vector3().crossVectors(d, a).normalize();
      sideA.push(a);
      sideB.push(b);
    }

    this.addImpactFx(root, 0.62, (fx) => {
      const t = Math.min(1, fx.age / fx.life);
      const shock = 1 - Math.pow(1 - t, 2.3);
      const radius = 0.45 + shock * 2.7;
      const jitterTime = fx.age * 75;
      let cursor = 0;
      for (let b = 0; b < boltCount; b++) {
        const d = dirs[b]!;
        const a = sideA[b]!;
        const c = sideB[b]!;
        let px = 0;
        let py = 0;
        let pz = 0;
        for (let s = 0; s < segmentCount; s++) {
          const u1 = (s + 1) / segmentCount;
          const noiseAmp = (1 - u1) * (0.28 + (1 - t) * 0.12);
          const wave = Math.sin(jitterTime + b * 1.7 + s * 2.4);
          const wave2 = Math.cos(jitterTime * 0.86 + b * 1.1 + s * 1.9);
          const nx = a.x * wave * noiseAmp + c.x * wave2 * noiseAmp;
          const ny = a.y * wave * noiseAmp + c.y * wave2 * noiseAmp;
          const nz = a.z * wave * noiseAmp + c.z * wave2 * noiseAmp;
          const tx = d.x * (u1 * radius) + nx;
          const ty = d.y * (u1 * radius) + ny;
          const tz = d.z * (u1 * radius) + nz;
          boltPos[cursor++] = px;
          boltPos[cursor++] = py;
          boltPos[cursor++] = pz;
          boltPos[cursor++] = tx;
          boltPos[cursor++] = ty;
          boltPos[cursor++] = tz;
          px = tx;
          py = ty;
          pz = tz;
        }
      }
      boltAttr.needsUpdate = true;
      boltMat.opacity = Math.max(0, (1 - t) * (0.76 + Math.sin(jitterTime) * 0.2));
      glow.scale.setScalar(0.55 + shock * 1.45);
      ringA.scale.setScalar(0.7 + shock * 2.8);
      ringB.scale.setScalar(0.55 + shock * 2.2);
      (glow.material as THREE.MeshBasicMaterial).opacity = Math.max(0, (1 - t) * 0.68);
      (ringA.material as THREE.MeshBasicMaterial).opacity = Math.max(0, (1 - t) * 0.88);
      (ringB.material as THREE.MeshBasicMaterial).opacity = Math.max(0, (1 - t) * 0.74);
    });
  }

  private triggerPickupImpactFx(kind: PickupKind, position: THREE.Vector3): void {
    if (kind === 'mine') this.spawnMineExplosion(position);
    else if (kind === 'pufferfish') this.spawnPufferInflate(position);
    else if (kind === 'jellyfish') this.spawnJellyShock(position);
  }

  private triggerPlayerPulse(): void {
    this.playerPulseT = Math.max(this.playerPulseT, 0.55);
  }

  private updatePlayerPulse(dt: number): void {
    if (!this.swimRoot) return;
    const active = this.playerPulseT > 0;
    const strength = Math.min(1, this.playerPulseT / 0.55);
    const pulse = active ? 1 + Math.sin(this.clock.elapsedTime * 24) * 0.32 * strength : 1;

    this.swimRoot.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (!mesh.isMesh) return;
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      for (const m of mats) {
        const sm = m as THREE.MeshStandardMaterial;
        if (!sm.isMeshStandardMaterial) continue;
        const u = sm.userData as { arcadePulseBaseEmissive?: number };
        if (u.arcadePulseBaseEmissive == null) u.arcadePulseBaseEmissive = sm.emissiveIntensity;
        const base = u.arcadePulseBaseEmissive;
        sm.emissiveIntensity = active ? base * pulse : base;
      }
    });

    this.playerPulseT = Math.max(0, this.playerPulseT - dt);
  }

  private updateImpactFx(dt: number): void {
    if (this.impactFx.length === 0) return;
    for (const fx of this.impactFx) {
      fx.age += dt;
      fx.update(fx, dt);
    }
    const keep: ImpactFx[] = [];
    for (const fx of this.impactFx) {
      if (fx.age < fx.life) {
        keep.push(fx);
      } else {
        this.obstacleGroup.remove(fx.root);
        disposeObject3DResources(fx.root);
      }
    }
    this.impactFx = keep;
  }

  private clearImpactFx(): void {
    for (const fx of this.impactFx) {
      this.obstacleGroup.remove(fx.root);
      disposeObject3DResources(fx.root);
    }
    this.impactFx = [];
  }

  private triggerGameOver(reason: RunEndReason): void {
    if (this.playEnded) return;
    this.playEnded = true;
    if (reason === 'crush') this.addCameraShake(0.48);
    else if (reason === 'oxygen') this.addCameraShake(0.2);
    else this.addCameraShake(0.4);
    this.onRunDifficulty?.(reefRunHudFromSurvivalSec(this.runSurvivalSec));
    this.onGameOver(this.runSurvivalSec, reason);
  }

  private tick = (): void => {
    this.raf = requestAnimationFrame(this.tick);
    const dt = Math.min(this.clock.getDelta(), 0.05);
    const t = this.clock.elapsedTime;
    let swimSpd = 1;

    const CAM_INTRO = 5.2;
    const CAM_MENU = 11.2;

    this.selectFillLight.visible = this.screen === 'select';
    this.selectHemiLight.visible = this.screen === 'select';

    if (this.screen === 'play' || this.screen === 'gameover') {
      const p = this.runSurvivalSec;
      const bank =
        this.screen === 'play' && !this.playEnded
          ? 1 + Math.min(0.85, (reefRunPlayIntensityMultiplier(p) - 1) * 0.45)
          : 1;
      this.pathRoot.position.x = Math.sin(p * 0.62) * 2.85 * bank;
      this.pathRoot.position.y = Math.sin(p * 0.41) * 0.72 * bank;
      this.pathRoot.rotation.z = Math.sin(p * 0.48) * 0.13 * bank;
      this.pathRoot.rotation.y = Math.sin(p * 0.27) * 0.078 * bank;
    } else {
      this.pathRoot.position.x = Math.sin(t * 0.14) * 0.4;
      this.pathRoot.position.y = Math.cos(t * 0.11) * 0.25;
      this.pathRoot.rotation.z = t * 0.007;
      this.pathRoot.rotation.y = 0;
    }

    if (this.screen === 'play' || this.screen === 'gameover') {
      const driftX = Math.sin(t * 0.1) * 0.32;
      const driftY = Math.cos(t * 0.07) * 0.12;
      const ox = this.pathRoot.position.x;
      const oy = this.pathRoot.position.y;
      let targetCamX = this.playerX * 0.58 + driftX + ox * 0.95;
      let targetCamY = 3.28 + driftY + oy * 0.62;
      const targetCamZ = 12.85;
      if (this.cameraShakeT > 0) {
        const phase = Math.min(1, this.cameraShakeT / 0.26);
        const mag = this.cameraShakePeak * phase;
        targetCamX += (Math.random() - 0.5) * mag * 2.4;
        targetCamY += (Math.random() - 0.5) * mag * 1.35;
        this.cameraShakeT -= dt;
        if (this.cameraShakeT <= 0) this.cameraShakePeak = 0;
      }
      this.camera.position.x += (targetCamX - this.camera.position.x) * 0.085;
      this.camera.position.y += (targetCamY - this.camera.position.y) * 0.07;
      this.camera.position.z += (targetCamZ - this.camera.position.z) * 0.06;
      let lookX = this.playerX * 0.26 + ox * 0.2;
      let lookY = PLAYER_FEET_Y + 0.42;
      let lookZ = PLAYER_Z - 0.85;
      if (this.swimRoot) {
        this.swimRoot.updateMatrixWorld(true);
        const b = new THREE.Box3().setFromObject(this.swimRoot);
        if (!b.isEmpty()) {
          b.getCenter(this._vPlayCenter);
          lookX = THREE.MathUtils.lerp(this.playerX * 0.22, this._vPlayCenter.x, 0.62) + ox * 0.18;
          lookY = THREE.MathUtils.lerp(
            PLAYER_FEET_Y + 0.42,
            this._vPlayCenter.y + 0.04,
            0.72,
          );
          lookZ = THREE.MathUtils.lerp(PLAYER_Z - 0.85, this._vPlayCenter.z - 0.78, 0.55);
        }
      }
      this.camera.lookAt(lookX, lookY, lookZ);
    } else if (this.screen === 'select') {
      this.applySelectScreenHighlight();
      this.updateSelectCamera(dt, t);
      this.updateSelectionFaceCamera();
    } else {
      let targetZ = CAM_MENU;
      if (this.screen === 'intro') targetZ = CAM_INTRO;

      this.camera.position.z += (targetZ - this.camera.position.z) * 0.065;
      this.camera.position.x = Math.sin(t * 0.11) * 0.42;
      this.camera.position.y = Math.cos(t * 0.085) * 0.22;
      this.camera.lookAt(0, -0.15, -32);
      for (const slot of this.slots.values()) {
        slot.anchor.rotation.y += 0.004;
      }
    }

    const targetX = LANES[this.playerLane];
    this.playerX += (targetX - this.playerX) * Math.min(1, dt * 11);
    if (this.swimRoot) {
      this.swimRoot.position.x = this.playerX;
    } else if (this.playerWorld.children[0]) {
      this.playerWorld.children[0].position.x = this.playerX;
    }
    this.updatePlayerPulse(dt);
    this.updateImpactFx(dt);

    if (this.screen === 'play') {
      if (!this.playEnded) {
        if (this.runClockActive) {
          this.runSurvivalSec += dt;
        }
      }

      const intensityBase = reefRunPlayIntensityMultiplier(this.runSurvivalSec);
      let playerMult = 1;
      const st = this.runState;

      if (!this.playEnded && st) {
        const now = this.clock.elapsedTime;
        const forward = this.keyW || this.virtualW;
        const backward = this.keyS || this.virtualS;
        const targetT = forward && !backward ? 1 : backward && !forward ? -1 : 0;
        this.throttleSmoothed += (targetT - this.throttleSmoothed) * Math.min(1, dt * 4.8);
        const band = speedBandForStars(getCharacterStats(st.characterId).speed);
        const u = (this.throttleSmoothed + 1) / 2;
        playerMult = band.min + u * (band.max - band.min);
        if (now < st.cheeseUntil) playerMult += 0.27;
        if (now < st.dragUntil) playerMult *= 0.54;

        if (characterHasUnlimitedOxygen(st.characterId)) {
          st.oxygen = st.oxygenMax;
        } else {
          const oxyStars = getCharacterStats(st.characterId).oxygen;
          const drain =
            oxygenDrainPerSec(oxyStars) *
            (0.86 +
              0.16 *
                Math.min(1.55, (intensityBase * playerMult) / Math.max(0.001, intensityBase)));
          st.oxygen -= drain * dt;
          if (st.oxygen <= 0) {
            st.oxygen = 0;
            this.triggerGameOver('oxygen');
          }
        }
      }

      swimSpd = intensityBase * (st && !this.playEnded ? playerMult : st ? playerMult : 1);
      if (this.playEnded) {
        swimSpd = intensityBase;
      }
      if (this.swimMixer) this.swimMixer.timeScale = swimSpd;

      if (!this.playEnded && st) {
        this.hudRunAcc += dt;
        if (this.onRunHud && this.hudRunAcc >= 0.14) {
          this.hudRunAcc = 0;
          const now = this.clock.elapsedTime;
          const rel = swimSpd / Math.max(0.001, intensityBase);
          this.onRunHud(runStateToHud(st, now, rel));
        }
      }

      if (!this.playEnded) {
        const tierNow = tierIndexFromSurvivalSec(this.runSurvivalSec);
        this.hudEmitAcc += dt;
        if (
          this.onRunDifficulty &&
          (this.hudEmitAcc >= 0.2 || tierNow !== this.lastEmittedTier)
        ) {
          this.hudEmitAcc = 0;
          this.lastEmittedTier = tierNow;
          this.onRunDifficulty(reefRunHudFromSurvivalSec(this.runSurvivalSec));
        }

        for (const o of this.obstacles) {
          if (o.hit) continue;
          o.root.position.z += o.speed * swimSpd * dt * REEF_RUN_TICK_Z_SCALE;
          o.root.visible = o.root.position.z > OBSTACLE_RENDER_START_Z;
          if (
            Math.abs(o.root.position.z - HIT_Z) < HIT_HALF_DEPTH &&
            o.lane === this.playerLane
          ) {
            o.hit = true;
            this.triggerGameOver('crush');
            break;
          }
          if (o.root.position.z > OBSTACLE_RECYCLE_Z) {
            this.obstacleGroup.remove(o.root);
            disposeObject3DResources(o.root);
            o.hit = true;
          }
        }
        this.obstacles = this.obstacles.filter((o) => o.root.parent === this.obstacleGroup);

        if (!this.playEnded) {
          const pickupHitZ = HIT_HALF_DEPTH * 0.78;
          for (const p of this.pickups) {
            if (p.hit) continue;
            pulsePickupVisual(p.root, t);
            spinPickupVisual(p.root, dt);
            p.root.position.z += p.speed * swimSpd * dt * REEF_RUN_TICK_Z_SCALE;
            p.root.visible = p.root.position.z > PICKUP_RENDER_START_Z;
            if (
              this.runState &&
              Math.abs(p.root.position.z - HIT_Z) < pickupHitZ &&
              p.lane === this.playerLane
            ) {
              p.hit = true;
              const impactPos = p.root.position.clone();
              this.triggerPickupImpactFx(p.kind, impactPos);
              if (isBeneficialPickup(p.kind)) {
                this.triggerPlayerPulse();
              }
              const out = applyPickupEffect(p.kind, this.runState, this.clock.elapsedTime);
              if (out.cameraShake) this.addCameraShake(out.cameraShake);
              this.obstacleGroup.remove(p.root);
              disposeObject3DResources(p.root);
              if (out.gameOver) {
                this.triggerGameOver(out.gameOver);
                break;
              }
            }
            if (p.root.position.z > OBSTACLE_RECYCLE_Z) {
              this.obstacleGroup.remove(p.root);
              disposeObject3DResources(p.root);
              p.hit = true;
            }
          }
          this.pickups = this.pickups.filter((p) => p.root.parent === this.obstacleGroup);
        }

        if (!this.playEnded && st && characterUsesOxygenMechanic(st.characterId)) {
          if (this.runSurvivalSec >= this.nextForcedOxyTankSurvival) {
            if (this.trySpawnForcedOxygenTank()) {
              this.nextForcedOxyTankSurvival =
                this.runSurvivalSec + forcedOxyTankIntervalSec(this.runSurvivalSec);
            } else {
              this.nextForcedOxyTankSurvival = this.runSurvivalSec + 0.28;
            }
          }
        }

        if (!this.playEnded) {
          this.pickupSpawnAcc += dt;
          if (this.pickupSpawnAcc >= this.pickupSpawnIntervalSec()) {
            this.pickupSpawnAcc = 0;
            this.trySpawnPickup();
          }

          const rowInterval = reefRunSpawnIntervalSec(this.runSurvivalSec);
          this.spawnAcc += dt;
          if (this.spawnAcc >= rowInterval) {
            this.spawnWaveIndex++;
            if (reefRunSpawnRowThisWave(this.runSurvivalSec, this.spawnWaveIndex)) {
              if (this.trySpawnObstacleRow()) {
                this.spawnAcc = 0;
              } else {
                this.spawnAcc = Math.max(0, rowInterval - 0.32);
              }
            } else {
              this.spawnAcc = 0;
            }
          }
        }
      }
    }

    const warp = this.screen === 'play' && !this.playEnded ? swimSpd : 1;
    if (this.screen === 'play' && !this.playEnded) {
      /** Hyperspeed tunnel: spiral + UV flow (texture scroll below). */
      this.tunnel.rotation.z = t * (0.02 + warp * 0.048);
    } else {
      this.tunnel.rotation.z = t * (0.014 + warp * 0.05);
    }

    if (this.tunnelFlowTex) {
      const flow =
        this.screen === 'play' && !this.playEnded
          ? REEF_RUN_OBSTACLE_BASE_SPEED * swimSpd * dt * REEF_RUN_TICK_Z_SCALE * 0.26
          : dt * 0.038;
      this.tunnelFlowTex.offset.y += flow;
      this.tunnelFlowTex.offset.x += flow * 0.11 + Math.sin(t * 0.42) * dt * 0.012;
      this.tunnelFlowTex.offset.y = THREE.MathUtils.euclideanModulo(this.tunnelFlowTex.offset.y, 1);
      this.tunnelFlowTex.offset.x = THREE.MathUtils.euclideanModulo(this.tunnelFlowTex.offset.x, 1);
    }
    const pulse =
      0.34 + Math.sin(t * 2.4) * 0.14 + (this.screen === 'play' ? Math.min(0.42, (warp - 1) * 0.28) : 0);
    this.tunnelMaterial.emissiveIntensity = pulse;

    if (this.scene.fog instanceof THREE.FogExp2) {
      const fd =
        this.screen === 'play' && !this.playEnded
          ? this.reefFogDensityBase + Math.min(0.95, warp - 1) * 0.024
          : this.reefFogDensityBase;
      this.scene.fog.density = THREE.MathUtils.lerp(this.scene.fog.density, fd, 0.08);
    }
    if (this.screen === 'play' || this.screen === 'gameover') {
      const targetFov =
        52 + (this.screen === 'play' && !this.playEnded ? Math.min(9.2, (swimSpd - 1) * 6.2) : 0);
      this.camera.fov += (targetFov - this.camera.fov) * 0.06;
      this.camera.updateProjectionMatrix();
    } else {
      this.camera.fov += (52 - this.camera.fov) * 0.05;
      this.camera.updateProjectionMatrix();
    }

    let driftMain = 0.062 * warp;
    if (this.screen === 'play' && !this.playEnded) {
      driftMain *= 1.35 + Math.max(0, warp - 1) * 1.05;
    }
    if (this.ambianceParticles) {
      this.ambianceParticles.position.z += driftMain;
      if (this.ambianceParticles.position.z > 6) this.ambianceParticles.position.z = -4;
    }
    if (this.streakParticles) {
      const streakMul = this.screen === 'play' && !this.playEnded ? 2.35 + (warp - 1) * 0.55 : 1.65;
      this.streakParticles.position.z += driftMain * streakMul;
      if (this.streakParticles.position.z > 8) this.streakParticles.position.z = -6;
    }

    for (const m of this.mixers) {
      m.update(dt);
    }

    this.renderer.render(this.scene, this.camera);
  };

  dispose(): void {
    cancelAnimationFrame(this.raf);
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    if (this.pointerBound) {
      this.renderer.domElement.removeEventListener('pointerdown', this.onPointerDown);
    }
    const ro = (this as unknown as { _ro?: ResizeObserver })._ro;
    ro?.disconnect();
    this.clearImpactFx();
    this.clearPickups();
    this.clearObstacles();
    this.tunnel?.geometry.dispose();
    (this.tunnel?.material as THREE.Material | undefined)?.dispose();
    this.tunnelFlowTex?.dispose();
    this.renderer.dispose();
    if (this.renderer.domElement.parentNode === this.container) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
