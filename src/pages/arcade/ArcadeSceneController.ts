import * as THREE from 'three';
import {
  ARCADE_CHARACTERS,
  type ArcadeCharacterDef,
  type ArcadeCharacterId,
} from './arcadeAssetConfig';
import { loadArcadeFbx, startLoopClip } from './loadArcadeFbx';

export type ArcadeGameScreen = 'intro' | 'menu' | 'select' | 'play' | 'gameover';

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
  mesh: THREE.Mesh;
  lane: number;
  speed: number;
  hit: boolean;
};

const LANES = [-2.1, 0, 2.1];
const PLAYER_Z = 2.8;
const SPAWN_Z = -52;
const HIT_Z = PLAYER_Z;
const HIT_HALF_DEPTH = 1.35;

export class ArcadeSceneController {
  private container: HTMLElement;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private clock = new THREE.Clock();
  private raf = 0;
  private tunnel!: THREE.Mesh;
  private ringGroup!: THREE.Group;
  private plinthWorld = new THREE.Group();
  private playerWorld = new THREE.Group();
  private obstacleGroup = new THREE.Group();
  private slots = new Map<ArcadeCharacterId, CharacterSlot>();
  private raycaster = new THREE.Raycaster();
  private ndc = new THREE.Vector2();
  private mixers: THREE.AnimationMixer[] = [];
  private screen: ArcadeGameScreen = 'intro';
  private selectedId: ArcadeCharacterId | null = null;
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
  private spawnAcc = 0;
  private spawnInterval = 1.15;
  private baseScroll = 0.14;
  private playEnded = false;
  private loaded = false;
  private pendingScreen: ArcadeGameScreen | null = null;
  private onPickCharacter: (id: ArcadeCharacterId) => void;
  private onGameOver: () => void;
  private pointerBound = false;
  private keyBound = false;

  constructor(
    container: HTMLElement,
    handlers: {
      onPickCharacter: (id: ArcadeCharacterId) => void;
      onGameOver: () => void;
    },
  ) {
    this.container = container;
    this.onPickCharacter = handlers.onPickCharacter;
    this.onGameOver = handlers.onGameOver;
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
    this.updatePointerCapture();
    if (next === 'play') {
      this.playEnded = false;
      void this.enterPlay();
    }
    if (next === 'gameover') {
      this.playEnded = true;
    }
    if (next === 'menu') {
      this.resetSelectionVisuals();
    }
    if (next === 'select') {
      this.resetSelectionVisuals();
      void this.applySelectionAnimations();
    }
    if (next === 'menu' || next === 'select') {
      this.clearObstacles();
      this.playerWorld.visible = false;
      this.plinthWorld.visible = true;
    }
  }

  setSelectedId(id: ArcadeCharacterId | null): void {
    this.selectedId = id;
    void this.applySelectionAnimations();
  }

  async bootstrap(): Promise<void> {
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x020810, 0.038);

    this.camera = new THREE.PerspectiveCamera(52, 1, 0.1, 220);
    this.camera.position.set(0, 0, 6);

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.domElement.style.display = 'block';
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
    this.container.appendChild(this.renderer.domElement);

    const tunnelGeo = new THREE.CylinderGeometry(8.5, 9.2, 140, 72, 28, true);
    const tunnelMat = new THREE.MeshStandardMaterial({
      color: 0x082038,
      metalness: 0.25,
      roughness: 0.82,
      side: THREE.BackSide,
      emissive: 0x041424,
      emissiveIntensity: 0.55,
    });
    this.tunnel = new THREE.Mesh(tunnelGeo, tunnelMat);
    this.tunnel.rotation.x = Math.PI / 2;
    this.tunnel.position.z = -42;
    this.scene.add(this.tunnel);

    this.ringGroup = new THREE.Group();
    for (let i = 0; i < 28; i++) {
      const hue = 0.52 + (i % 7) * 0.018;
      const mat = new THREE.MeshBasicMaterial({
        color: new THREE.Color().setHSL(hue, 0.85, 0.58),
        transparent: true,
        opacity: 0.22 + (i % 4) * 0.06,
        depthWrite: false,
      });
      const mesh = new THREE.Mesh(new THREE.TorusGeometry(7.4 + (i % 5) * 0.08, 0.045, 8, 96), mat);
      mesh.position.z = -i * 3.2;
      mesh.rotation.x = Math.PI / 2;
      this.ringGroup.add(mesh);
    }
    this.scene.add(this.ringGroup);

    this.scene.add(new THREE.AmbientLight(0x2a4a68, 0.45));
    const key = new THREE.PointLight(0x2ee6ff, 120, 45, 1.8);
    key.position.set(3.5, 2.5, 6);
    const fill = new THREE.PointLight(0xe040fb, 55, 38, 2);
    fill.position.set(-4, -1.5, 4);
    const rim = new THREE.DirectionalLight(0xa8f0ff, 0.35);
    rim.position.set(0, 2, 8);
    this.scene.add(key, fill, rim);

    const n = window.innerWidth < 768 ? 500 : 1400;
    const positions = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 18;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 12;
      positions[i * 3 + 2] = -Math.random() * 90;
    }
    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const pMat = new THREE.PointsMaterial({
      color: 0x7ee8ff,
      size: 0.055,
      transparent: true,
      opacity: 0.45,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    });
    const particles = new THREE.Points(pGeo, pMat);
    this.scene.add(particles);
    (this as unknown as { _particles?: THREE.Points })._particles = particles;

    this.scene.add(this.plinthWorld);
    this.scene.add(this.playerWorld);
    this.scene.add(this.obstacleGroup);
    this.playerWorld.visible = false;

    const offsets = [-4.4, 0, 4.4];
    for (let i = 0; i < ARCADE_CHARACTERS.length; i++) {
      const def = ARCADE_CHARACTERS[i];
      const anchor = new THREE.Group();
      anchor.position.set(offsets[i], -1.05, 0.8);
      anchor.userData.characterId = def.id;
      const base = new THREE.Mesh(
        new THREE.CylinderGeometry(0.55, 0.72, 0.22, 28),
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
        const { root, clips } = await loadArcadeFbx(def.idle);
        root.scale.setScalar(def.scale);
        root.position.y = 0.15;
        root.rotation.y = i === 1 ? 0 : i === 0 ? 0.35 : -0.35;
        anchor.add(root);
        const { mixer, action } = startLoopClip(root, clips);
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
    this.keyBound = true;
  }

  private onKeyDown = (ev: KeyboardEvent): void => {
    if (this.screen !== 'play') return;
    if (ev.code === 'ArrowLeft' || ev.code === 'KeyA') {
      this.playerLane = Math.max(0, this.playerLane - 1);
    } else if (ev.code === 'ArrowRight' || ev.code === 'KeyD') {
      this.playerLane = Math.min(2, this.playerLane + 1);
    }
  };

  private resetSelectionVisuals(): void {
    for (const slot of this.slots.values()) {
      if (slot.idleRoot) slot.idleRoot.visible = true;
      if (slot.danceRoot) {
        slot.danceRoot.visible = false;
        slot.danceAction?.stop();
      }
      if (slot.idleAction) {
        slot.idleAction.paused = false;
        slot.idleAction.play();
      }
    }
  }

  private async applySelectionAnimations(): Promise<void> {
    for (const [id, slot] of this.slots) {
      const isSel = id === this.selectedId;
      if (!isSel) {
        if (slot.danceRoot) slot.danceRoot.visible = false;
        slot.idleRoot.visible = true;
        slot.idleAction?.play();
        continue;
      }
      slot.idleRoot.visible = false;
      if (!slot.danceRoot) {
        try {
          const { root, clips } = await loadArcadeFbx(slot.def.dance);
          root.scale.setScalar(slot.def.scale);
          root.position.copy(slot.idleRoot.position);
          root.rotation.copy(slot.idleRoot.rotation);
          slot.anchor.add(root);
          slot.danceRoot = root;
          const { mixer, action } = startLoopClip(root, clips);
          if (mixer) this.mixers.push(mixer);
          slot.danceMixer = mixer;
          slot.danceAction = action;
        } catch (e) {
          console.warn('[Arcade] dance load failed', e);
          slot.idleRoot.visible = true;
          continue;
        }
      }
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
    this.plinthWorld.visible = false;
    this.playerWorld.visible = true;
    this.clearObstacles();
    this.playerLane = 1;
    this.playerX = LANES[1];
    this.spawnAcc = 0;

    while (this.playerWorld.children.length) {
      this.playerWorld.remove(this.playerWorld.children[0]);
    }
    this.removeMixerFromList(this.swimMixer);
    this.swimMixer?.stopAllAction();
    this.swimRoot = null;
    this.swimMixer = null;

    try {
      const { root, clips } = await loadArcadeFbx(slot.def.swim);
      root.scale.setScalar(slot.def.scale * 1.05);
      root.position.set(0, -0.85, PLAYER_Z);
      root.rotation.y = Math.PI;
      this.playerWorld.add(root);
      this.swimRoot = root;
      const { mixer, action } = startLoopClip(root, clips);
      this.swimMixer = mixer;
      if (mixer) this.mixers.push(mixer);
      void action;
    } catch (e) {
      console.warn('[Arcade] swim load failed', e);
      const box = new THREE.Mesh(
        new THREE.BoxGeometry(0.8, 1.2, 0.5),
        new THREE.MeshStandardMaterial({ color: 0x2ee6ff, emissive: 0x2ee6ff, emissiveIntensity: 0.4 }),
      );
      box.position.set(0, -0.5, PLAYER_Z);
      this.playerWorld.add(box);
    }
  }

  private clearObstacles(): void {
    for (const o of this.obstacles) {
      this.obstacleGroup.remove(o.mesh);
      o.mesh.geometry.dispose();
      (o.mesh.material as THREE.Material).dispose();
    }
    this.obstacles = [];
  }

  private spawnObstacle(): void {
    const lane = Math.floor(Math.random() * 3);
    const geo = new THREE.BoxGeometry(1.4, 1.4, 2.2);
    const mat = new THREE.MeshStandardMaterial({
      color: 0xff3355,
      emissive: 0xff2200,
      emissiveIntensity: 0.55,
      metalness: 0.3,
      roughness: 0.4,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(LANES[lane], -0.35, SPAWN_Z);
    this.obstacleGroup.add(mesh);
    this.obstacles.push({ mesh, lane, speed: this.baseScroll + Math.random() * 0.06, hit: false });
  }

  private tick = (): void => {
    this.raf = requestAnimationFrame(this.tick);
    const dt = Math.min(this.clock.getDelta(), 0.05);
    const t = this.clock.elapsedTime;

    const CAM_INTRO = 5.2;
    const CAM_MENU = 11.2;
    const CAM_SELECT = 9.2;
    const CAM_PLAY = 7.4;
    let targetZ = CAM_MENU;
    if (this.screen === 'intro') targetZ = CAM_INTRO;
    else if (this.screen === 'select') targetZ = CAM_SELECT;
    else if (this.screen === 'play' || this.screen === 'gameover') targetZ = CAM_PLAY;

    this.camera.position.z += (targetZ - this.camera.position.z) * 0.065;
    this.camera.position.x = Math.sin(t * 0.11) * 0.42;
    this.camera.position.y = Math.cos(t * 0.085) * 0.22;
    this.camera.lookAt(0, -0.15, -32);

    this.tunnel.rotation.z = t * 0.018;
    this.ringGroup.rotation.z = t * 0.06;
    this.ringGroup.children.forEach((mesh, i) => {
      if (mesh instanceof THREE.Mesh) mesh.rotation.z = t * (0.15 + (i % 5) * 0.02);
    });

    const particles = (this as unknown as { _particles?: THREE.Points })._particles;
    if (particles) {
      particles.position.z += 0.055;
      if (particles.position.z > 6) particles.position.z = -4;
    }

    for (const slot of this.slots.values()) {
      slot.anchor.rotation.y += 0.004;
    }

    const targetX = LANES[this.playerLane];
    this.playerX += (targetX - this.playerX) * Math.min(1, dt * 8);
    if (this.swimRoot) {
      this.swimRoot.position.x = this.playerX;
    } else if (this.playerWorld.children[0]) {
      this.playerWorld.children[0].position.x = this.playerX;
    }

    if (this.screen === 'play') {
      this.spawnAcc += dt;
      if (this.spawnAcc >= this.spawnInterval) {
        this.spawnAcc = 0;
        this.spawnObstacle();
      }
      for (const o of this.obstacles) {
        if (o.hit) continue;
        o.mesh.position.z += o.speed * dt * 60 * 0.18;
        if (
          !this.playEnded &&
          Math.abs(o.mesh.position.z - HIT_Z) < HIT_HALF_DEPTH &&
          o.lane === this.playerLane
        ) {
          o.hit = true;
          this.playEnded = true;
          this.onGameOver();
        }
        if (o.mesh.position.z > 8) {
          this.obstacleGroup.remove(o.mesh);
          o.mesh.geometry.dispose();
          (o.mesh.material as THREE.Material).dispose();
          o.hit = true;
        }
      }
      this.obstacles = this.obstacles.filter((o) => o.mesh.parent === this.obstacleGroup);
    }

    for (const m of this.mixers) {
      m.update(dt);
    }

    this.renderer.render(this.scene, this.camera);
  };

  dispose(): void {
    cancelAnimationFrame(this.raf);
    window.removeEventListener('keydown', this.onKeyDown);
    if (this.pointerBound) {
      this.renderer.domElement.removeEventListener('pointerdown', this.onPointerDown);
    }
    const ro = (this as unknown as { _ro?: ResizeObserver })._ro;
    ro?.disconnect();
    this.clearObstacles();
    this.renderer.dispose();
    if (this.renderer.domElement.parentNode === this.container) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
