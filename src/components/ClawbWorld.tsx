import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { useNavigate } from 'react-router-dom';
import { useAccount } from 'wagmi';
import {
  renderWorldState,
  createSandFloor,
  setupUnderwaterLighting,
  setupUnderwaterFog,
  createBubbleParticles,
  animateBubbles,
  type WorldState,
} from '../utils/worldObjects';
import {
  sendClawbMessage,
  listenToClawbResponses,
  listenToVisitorMessages,
  enqueueWorldAction,
  listenToWorldActions,
  type ClawbChatMessage,
} from '../firebaseClawb';
import './ClawbWorld.css';

// NFT Gallery — same as stream overlay
const FIREBASE_GALLERY_URL = 'https://chess-220ee-default-rtdb.firebaseio.com/clawb/nft_gallery.json';
const MIN_Y = -3;
const MAX_Y = 2;

// Room offsets per spec
const ROOM_OFFSETS: Record<string, THREE.Vector3> = {
  main: new THREE.Vector3(0, 0, 0),
  bedroom: new THREE.Vector3(-15, 0, -15),
  workshop: new THREE.Vector3(15, 0, -15),
  vault: new THREE.Vector3(0, 0, -25),
};

// Firebase RTDB URLs for live world state (synced from Clawb's machine every 60s)
const FIREBASE_DB = 'https://chess-220ee-default-rtdb.firebaseio.com';
const ROOM_URLS: Record<string, string> = {
  main: `${FIREBASE_DB}/world/main.json`,
  bedroom: `${FIREBASE_DB}/world/bedroom.json`,
  workshop: `${FIREBASE_DB}/world/workshop.json`,
  vault: `${FIREBASE_DB}/world/vault.json`,
};

// Fallback to static files if Firebase is unavailable
const ROOM_FILES_FALLBACK: Record<string, string> = {
  main: '/world/world-state-main.json',
  bedroom: '/world/world-state-bedroom.json',
  workshop: '/world/world-state-workshop.json',
  vault: '/world/world-state-vault.json',
};

const ROOM_LABELS: Record<string, string> = {
  main: 'Main Reef',
  bedroom: 'Bedroom',
  workshop: 'Workshop',
  vault: 'Vault',
};

const PSX_RESOLUTION_SCALE = 0.35; // Render at ~1/3 res for PSX look (slightly higher than bg for playability)
const PLAYER_HEIGHT = 0.5;
const PLAYER_SPEED = 5;
const SWIM_VERTICAL_SPEED = 3;
const WORLD_BOUNDS = 28;
const CLAWB_GREET_DISTANCE = 3;
const CLAWB_SCALE = 0.018; // Sized to match reef objects
const FLOOR_Y = -3;
const NFT_INTERACT_DISTANCE = 3.2;
const WORLD_ACTION_DURATION_MS = 5000;

interface NFTItem {
  chain?: string;
  contract?: string;
  tokenId?: string;
  name?: string;
  collection?: string;
  image_url?: string;
}

const ClawbWorld: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const navigate = useNavigate();
  const { address } = useAccount();

  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<PointerLockControls | null>(null);
  const clockRef = useRef(new THREE.Clock());
  const frameIdRef = useRef<number | null>(null);
  const bubblesRef = useRef<THREE.Points | null>(null);
  const clawbRef = useRef<THREE.Group | null>(null);
  const clawbMixerRef = useRef<THREE.AnimationMixer | null>(null);
  const clawbWalkDirRef = useRef(1);
  const clawbPosXRef = useRef(0);

  // Movement keys state
  const keysRef = useRef<Record<string, boolean>>({});
  const velocityRef = useRef(new THREE.Vector3());

  // UI state
  const [isLocked, setIsLocked] = useState(false);
  const [currentRoom, setCurrentRoom] = useState('Main Reef');
  const [clawbGreeting, setClawbGreeting] = useState<string | null>(null);
  const [showChatPanel, setShowChatPanel] = useState(false);
  const [chatMessages, setChatMessages] = useState<ClawbChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [selectedNft, setSelectedNft] = useState<NFTItem | null>(null);
  const [isMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth <= 768);

  const galleryGroupRef = useRef<THREE.Group | null>(null);
  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseRef = useRef(new THREE.Vector2());
  const processedActionIdsRef = useRef<Set<string>>(new Set());
  const worldActionRef = useRef<{ type: string; until: number }>({ type: 'patrol', until: 0 });
  const clawbActionTRef = useRef(0);

  // Mobile joystick state
  const joystickRef = useRef<{ active: boolean; startX: number; startY: number; dx: number; dy: number }>({
    active: false, startX: 0, startY: 0, dx: 0, dy: 0,
  });
  const mobileSwimYRef = useRef(0); // -1 = down, 0 = none, 1 = up

  const normalizeIpfsUrl = useCallback((url: string): string[] => {
    if (!url) return [];
    const clean = url.trim();
    if (!clean) return [];
    if (clean.startsWith('ipfs://')) {
      const cidPath = clean.replace('ipfs://', '');
      return [
        `https://nftstorage.link/ipfs/${cidPath}`,
        `https://cloudflare-ipfs.com/ipfs/${cidPath}`,
        `https://ipfs.io/ipfs/${cidPath}`,
      ];
    }
    const idx = clean.indexOf('/ipfs/');
    if (idx !== -1) {
      const cidPath = clean.slice(idx + '/ipfs/'.length);
      return [
        clean,
        `https://nftstorage.link/ipfs/${cidPath}`,
        `https://cloudflare-ipfs.com/ipfs/${cidPath}`,
        `https://ipfs.io/ipfs/${cidPath}`,
      ];
    }
    return [clean];
  }, []);

  const createNftPlaceholderTexture = useCallback((nft: NFTItem, note: string): THREE.CanvasTexture => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      const fallback = new THREE.CanvasTexture(canvas);
      fallback.minFilter = THREE.NearestFilter;
      fallback.magFilter = THREE.NearestFilter;
      fallback.colorSpace = THREE.SRGBColorSpace;
      return fallback;
    }

    const g = ctx.createLinearGradient(0, 0, 0, 512);
    g.addColorStop(0, '#1f2f45');
    g.addColorStop(1, '#0f1726');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 512, 512);

    ctx.fillStyle = '#ffd76a';
    ctx.fillRect(24, 24, 464, 464);
    ctx.fillStyle = '#1b2432';
    ctx.fillRect(34, 34, 444, 444);

    ctx.fillStyle = '#e7edf8';
    ctx.font = 'bold 28px Arial';
    ctx.fillText(nft.name || 'Unknown NFT', 52, 90, 408);
    ctx.fillStyle = '#b6c2d7';
    ctx.font = '22px Arial';
    ctx.fillText(`${nft.collection || 'unknown'} #${nft.tokenId || '?'}`, 52, 134, 408);
    ctx.fillText(`chain: ${nft.chain || '?'}`, 52, 174, 408);

    ctx.fillStyle = '#86a6d1';
    ctx.font = '20px Arial';
    ctx.fillText(note, 52, 462, 408);

    const tex = new THREE.CanvasTexture(canvas);
    tex.minFilter = THREE.NearestFilter;
    tex.magFilter = THREE.NearestFilter;
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, []);

  // Determine which room the player is in based on position
  const getRoomName = useCallback((pos: THREE.Vector3): string => {
    let closest = 'main';
    let closestDist = Infinity;
    for (const [name, offset] of Object.entries(ROOM_OFFSETS)) {
      const dist = pos.distanceTo(new THREE.Vector3(offset.x, pos.y, offset.z));
      if (dist < closestDist) {
        closestDist = dist;
        closest = name;
      }
    }
    return ROOM_LABELS[closest] || 'Main Reef';
  }, []);

  // Generate greeting based on wallet
  const getGreeting = useCallback((): string => {
    if (address) {
      const short = `${address.slice(0, 6)}...${address.slice(-4)}`;
      return `welcome back, ${short}. the reef remembers.`;
    }
    return 'welcome, traveler. the reef remembers all who visit.';
  }, [address]);

  const parseWorldActionFromText = useCallback((text: string): string | null => {
    const t = (text || '').toLowerCase().trim();
    if (!t) return null;
    if (/(^|\s)!dance\b|\bdance\b/.test(t)) return 'dance';
    if (/(^|\s)!swim\b|\bswim\b/.test(t)) return 'swim';
    if (/(^|\s)!wave\b|\bwave\b/.test(t)) return 'wave';
    if (/(^|\s)!spin\b|\bspin\b/.test(t)) return 'spin';
    if (/(^|\s)!jump\b|\bjump\b/.test(t)) return 'jump';
    return null;
  }, []);

  const tryInspectNftInFront = useCallback((): boolean => {
    const camera = cameraRef.current;
    const gallery = galleryGroupRef.current;
    if (!camera || !gallery || !gallery.visible) return false;

    const from = camera.getWorldPosition(new THREE.Vector3());
    const dir = new THREE.Vector3();
    camera.getWorldDirection(dir);
    raycasterRef.current.set(from, dir);
    raycasterRef.current.far = NFT_INTERACT_DISTANCE;

    const hits = raycasterRef.current.intersectObjects(gallery.children, true);
    const hit = hits.find((h) => Boolean((h.object as THREE.Object3D).userData?.nft));
    if (!hit) return false;

    const nft = (hit.object as THREE.Object3D).userData.nft as NFTItem;
    setSelectedNft(nft);
    return true;
  }, []);

  const triggerWorldAction = useCallback((action: string) => {
    worldActionRef.current = { type: action, until: Date.now() + WORLD_ACTION_DURATION_MS };
    clawbActionTRef.current = 0;
  }, []);

  // Animation loop
  const animate = useCallback(() => {
    if (!rendererRef.current || !sceneRef.current || !cameraRef.current) return;

    const delta = Math.min(clockRef.current.getDelta(), 1 / 20);
    const camera = cameraRef.current;

    // Player movement
    if (controlsRef.current?.isLocked || isMobile) {
      const velocity = velocityRef.current;
      const direction = new THREE.Vector3();
      const keys = keysRef.current;

      // Desktop WASD
      const forward = (keys['w'] || keys['arrowup'] ? 1 : 0) - (keys['s'] || keys['arrowdown'] ? 1 : 0);
      const strafe = (keys['d'] || keys['arrowright'] ? 1 : 0) - (keys['a'] || keys['arrowleft'] ? 1 : 0);

      // Swim up/down (Space = up, Shift = down, or mobile buttons)
      const swimUp = keys[' '] || mobileSwimYRef.current === 1 ? 1 : 0;
      const swimDown = keys['shift'] || mobileSwimYRef.current === -1 ? 1 : 0;
      const swimY = (swimUp - swimDown) * SWIM_VERTICAL_SPEED * delta;

      // Mobile joystick override
      if (isMobile && joystickRef.current.active) {
        const jDx = joystickRef.current.dx / 60; // normalize
        const jDy = joystickRef.current.dy / 60;
        direction.z = -Math.max(-1, Math.min(1, jDy));
        direction.x = Math.max(-1, Math.min(1, jDx));
      } else {
        direction.z = -forward;
        direction.x = strafe;
      }

      direction.normalize();

      // Apply movement relative to camera facing
      velocity.x = direction.x * PLAYER_SPEED * delta;
      velocity.z = direction.z * PLAYER_SPEED * delta;

      if (controlsRef.current) {
        controlsRef.current.moveRight(velocity.x);
        controlsRef.current.moveForward(-velocity.z);
      }

      // Swim up/down
      camera.position.y += swimY;

      // Clamp to world bounds
      camera.position.x = Math.max(-WORLD_BOUNDS, Math.min(WORLD_BOUNDS, camera.position.x));
      camera.position.z = Math.max(-WORLD_BOUNDS - 10, Math.min(WORLD_BOUNDS, camera.position.z));
      // Clamp vertical (swim range)
      camera.position.y = Math.max(MIN_Y + PLAYER_HEIGHT, Math.min(MAX_Y, camera.position.y));
    }

    // Update room name (every frame)
    const roomName = getRoomName(camera.position);
    setCurrentRoom(roomName);

    // Animate bubbles
    if (bubblesRef.current) {
      animateBubbles(bubblesRef.current, delta);
    }

    // Animate Clawb NPC (patrol + synchronized world actions)
    if (clawbRef.current && clawbMixerRef.current) {
      clawbMixerRef.current.update(delta);
      clawbActionTRef.current += delta;
      const t = clawbActionTRef.current;
      const activeAction = Date.now() < worldActionRef.current.until ? worldActionRef.current.type : 'patrol';

      if (activeAction === 'patrol') {
        clawbPosXRef.current += 1.0 * delta * clawbWalkDirRef.current;
        if (clawbPosXRef.current > 3) {
          clawbPosXRef.current = 3;
          clawbWalkDirRef.current = -1;
          clawbRef.current.rotation.y = -Math.PI / 2; // Face left
        } else if (clawbPosXRef.current < -3) {
          clawbPosXRef.current = -3;
          clawbWalkDirRef.current = 1;
          clawbRef.current.rotation.y = Math.PI / 2; // Face right
        }
        clawbRef.current.position.x = clawbPosXRef.current;
        clawbRef.current.position.y = FLOOR_Y;
        clawbRef.current.position.z = 0;
      } else {
        const baseX = clawbPosXRef.current;
        const baseZ = 0;
        if (activeAction === 'dance') {
          clawbRef.current.position.x = baseX + Math.sin(t * 4.5) * 0.5;
          clawbRef.current.position.y = FLOOR_Y + Math.abs(Math.sin(t * 5.2)) * 0.35;
          clawbRef.current.rotation.y += delta * 1.6;
        } else if (activeAction === 'swim') {
          clawbRef.current.position.x = baseX + Math.sin(t * 2.2) * 1.4;
          clawbRef.current.position.z = baseZ + Math.cos(t * 2.2) * 1.1;
          clawbRef.current.position.y = FLOOR_Y + 0.5 + Math.sin(t * 2.8) * 0.35;
          clawbRef.current.rotation.y = t * 2.2 + Math.PI / 2;
        } else if (activeAction === 'wave') {
          clawbRef.current.position.y = FLOOR_Y + Math.abs(Math.sin(t * 3.0)) * 0.2;
          clawbRef.current.rotation.y = Math.sin(t * 3.0) * 0.6;
          clawbRef.current.rotation.z = Math.sin(t * 6.0) * 0.2;
        } else if (activeAction === 'spin') {
          clawbRef.current.position.y = FLOOR_Y + Math.abs(Math.sin(t * 4.0)) * 0.15;
          clawbRef.current.rotation.y += delta * 6.0;
        } else if (activeAction === 'jump') {
          clawbRef.current.position.y = FLOOR_Y + Math.abs(Math.sin(t * 7.0)) * 0.9;
          clawbRef.current.position.x = baseX + Math.sin(t * 2.0) * 0.2;
        }
      }

      // Proximity greeting
      const dist = camera.position.distanceTo(clawbRef.current.position);
      if (dist < CLAWB_GREET_DISTANCE) {
        setClawbGreeting(getGreeting());
        // Face player
        if (activeAction === 'patrol') {
          const dx = camera.position.x - clawbRef.current.position.x;
          clawbRef.current.rotation.y = Math.atan2(dx, 1);
        }
      } else {
        setClawbGreeting(null);
      }
    }

    // NFT gallery visibility — bedroom only
    if (galleryGroupRef.current) {
      galleryGroupRef.current.visible = roomName === 'Bedroom';
    }

    rendererRef.current.render(sceneRef.current, cameraRef.current);
    frameIdRef.current = requestAnimationFrame(animate);
  }, [getRoomName, getGreeting, isMobile]);

  // Init scene
  useEffect(() => {
    if (!containerRef.current || !canvasRef.current) return;

    const width = window.innerWidth;
    const height = window.innerHeight;

    // Renderer — PSX style: low internal res, no AA
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: false,
      alpha: false,
    });
    const psxWidth = Math.floor(width * PSX_RESOLUTION_SCALE);
    const psxHeight = Math.floor(height * PSX_RESOLUTION_SCALE);
    renderer.setSize(psxWidth, psxHeight, false);
    renderer.setPixelRatio(1);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    rendererRef.current = renderer;

    // Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    setupUnderwaterFog(scene, true); // Always dark underwater
    setupUnderwaterLighting(scene, true);

    // Camera
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 200);
    camera.position.set(0, FLOOR_Y + PLAYER_HEIGHT, 5);
    cameraRef.current = camera;

    // Controls
    const controls = new PointerLockControls(camera, canvasRef.current);
    controlsRef.current = controls;

    controls.addEventListener('lock', () => setIsLocked(true));
    controls.addEventListener('unlock', () => setIsLocked(false));

    // Extended sand floor
    const floor = createSandFloor(60);
    floor.position.y = FLOOR_Y;
    scene.add(floor);

    // Bubbles
    const bubbles = createBubbleParticles(200);
    scene.add(bubbles);
    bubblesRef.current = bubbles;

    // Load all rooms (Firebase first, fallback to static files)
    for (const [roomName, firebaseUrl] of Object.entries(ROOM_URLS)) {
      const offset = ROOM_OFFSETS[roomName];
      fetch(firebaseUrl)
        .then((res) => res.json())
        .then((data: WorldState) => {
          if (data && data.objects) {
            renderWorldState(scene, data, offset);
          } else {
            throw new Error('Invalid Firebase response');
          }
        })
        .catch(() => {
          // Fallback to static file
          const fallback = ROOM_FILES_FALLBACK[roomName];
          if (fallback) {
            fetch(fallback)
              .then((res) => res.json())
              .then((data: WorldState) => renderWorldState(scene, data, offset))
              .catch((err) => console.warn(`[ClawbWorld] Failed to load ${roomName}:`, err));
          }
        });
    }

    // Load Clawb NPC
    const loader = new FBXLoader();
    loader.load(
      '/assets/lawbWalk.fbx',
      (object) => {
        object.scale.setScalar(CLAWB_SCALE);
        object.position.set(0, FLOOR_Y, 0); // Feet on the sand
        object.rotation.y = Math.PI / 2; // Face right (initial walk direction is +X)
        object.traverse((child: THREE.Object3D) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
            mats.forEach((m) => {
              m.side = THREE.DoubleSide;
              m.transparent = false;
              // PSX: nearest-neighbor texture filtering
              const stdMat = m as THREE.MeshStandardMaterial;
              if (stdMat.map) {
                stdMat.map.magFilter = THREE.NearestFilter;
                stdMat.map.minFilter = THREE.NearestFilter;
              }
            });
          }
        });
        scene.add(object);
        clawbRef.current = object;

        if (object.animations?.length > 0) {
          const mixer = new THREE.AnimationMixer(object);
          const clip = object.animations[0].clone();
          clip.tracks = clip.tracks.filter((t) => !t.name.toLowerCase().includes('.position'));
          if (clip.tracks.length > 0) clip.resetDuration();
          mixer.clipAction(clip).play();
          clawbMixerRef.current = mixer;
        }
      },
      undefined,
      (err) => console.warn('[ClawbWorld] Failed to load Clawb:', err)
    );

    // NFT Gallery — bedroom only (same as stream overlay)
    const BEDROOM_OFFSET = ROOM_OFFSETS.bedroom;
    const galleryGroup = new THREE.Group();
    galleryGroup.position.copy(BEDROOM_OFFSET);
    galleryGroup.visible = false;
    scene.add(galleryGroup);
    galleryGroupRef.current = galleryGroup;

    const NFT_FALLBACK: NFTItem[] = [
      { chain: 'ethereum', contract: '0x0ef7bA09C38624b8E9cc4985790a2f5dBFc1dC42', tokenId: '158', name: 'Lawbster #158', collection: 'lawbsters' },
      { chain: 'ethereum', contract: '0x0ef7bA09C38624b8E9cc4985790a2f5dBFc1dC42', tokenId: '177', name: 'Lawbster #177', collection: 'lawbsters' },
      { chain: 'ethereum', contract: '0x2d278e95b2fC67D4b27a276807e24E479D9707F6', tokenId: '34', name: 'Pixelawbster #34', collection: 'Pixelawbsters' },
      { chain: 'ethereum', contract: '0xd7922cD333da5ab3758C95f774B092A7B13a5449', tokenId: '269', name: 'LAWBSTARZ #269', collection: 'LAWBSTARZ' },
      { chain: 'ethereum', contract: '0xd7922cD333da5ab3758C95f774B092A7B13a5449', tokenId: '584', name: 'LAWBSTARZ #584', collection: 'LAWBSTARZ' },
      { chain: 'base', contract: '0x13c33121f8a73e22ac6aa4a135132f5ac7f221b2', tokenId: '45', name: 'Lawbster #45', collection: 'ascii Lawbsters' },
    ];

    const texLoader = new THREE.TextureLoader();
    texLoader.setCrossOrigin('anonymous');
    const frameMat = new THREE.MeshPhongMaterial({ color: 0xccaa33, shininess: 20, side: THREE.DoubleSide });
    const bgMat = new THREE.MeshBasicMaterial({ color: 0x1a2a3a, side: THREE.DoubleSide });
    const frameSize = 0.65;

    const loadTextureWithFallback = async (nft: NFTItem): Promise<THREE.Texture> => {
      const urls = normalizeIpfsUrl(nft.image_url || '');
      for (const url of urls) {
        try {
          const tex = await new Promise<THREE.Texture>((resolve, reject) => {
            texLoader.load(url, resolve, undefined, reject);
          });
          tex.minFilter = THREE.NearestFilter;
          tex.magFilter = THREE.NearestFilter;
          tex.colorSpace = THREE.SRGBColorSpace;
          return tex;
        } catch {
          // try next gateway
        }
      }
      return createNftPlaceholderTexture(nft, 'image unavailable');
    };

    const addGalleryWalls = (gallery: THREE.Group, rows: number) => {
      const wallHeight = Math.max(4, rows * 1.1 + 2);
      const wallMat = new THREE.MeshPhongMaterial({
        color: 0x4a6a8a,
        emissive: 0x0c1824,
        flatShading: true,
        side: THREE.DoubleSide,
        shininess: 5,
      });
      const backWall = new THREE.Mesh(new THREE.PlaneGeometry(8, wallHeight), wallMat);
      backWall.position.set(0, -1.0 + (wallHeight - 4) / 2, -3.5);
      gallery.add(backWall);
      const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(6, wallHeight), wallMat.clone());
      leftWall.position.set(-4, -1.0 + (wallHeight - 4) / 2, -0.5);
      leftWall.rotation.y = Math.PI / 2;
      gallery.add(leftWall);
      const rightWall = new THREE.Mesh(new THREE.PlaneGeometry(6, wallHeight), wallMat.clone());
      rightWall.position.set(4, -1.0 + (wallHeight - 4) / 2, -0.5);
      rightWall.rotation.y = -Math.PI / 2;
      gallery.add(rightWall);
    };

    const addNftPanel = async (nft: NFTItem, x: number, y: number, z: number) => {
      const frame = new THREE.Mesh(new THREE.PlaneGeometry(frameSize + 0.1, frameSize + 0.1), frameMat);
      frame.position.set(x, y, z);
      frame.userData.nft = nft;
      galleryGroup.add(frame);

      const bg = new THREE.Mesh(new THREE.PlaneGeometry(frameSize, frameSize), bgMat);
      bg.position.set(x, y, z + 0.02);
      bg.userData.nft = nft;
      galleryGroup.add(bg);

      const tex = await loadTextureWithFallback(nft);
      const imgMat = new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide });
      const imgPlane = new THREE.Mesh(new THREE.PlaneGeometry(frameSize, frameSize), imgMat);
      imgPlane.position.set(x, y, z + 0.04);
      imgPlane.userData.nft = nft;
      galleryGroup.add(imgPlane);

      const spot = new THREE.PointLight(0xeeeeff, 0.3, 2.5);
      spot.position.set(x, y + 0.7, -2.8);
      galleryGroup.add(spot);
    };

    const buildGallery = async (nfts: NFTItem[]) => {
      const cols = 5;
      const rows = Math.ceil(nfts.length / cols);
      const spacingX = 1.3;
      const spacingY = 1.1;
      const startX = -((cols - 1) * spacingX) / 2;
      const bottomRowY = -0.6;

      addGalleryWalls(galleryGroup, rows);

      const tasks: Array<Promise<void>> = [];
      nfts.forEach((nft, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const x = startX + col * spacingX;
        const y = bottomRowY + row * spacingY;
        const z = -3.46;
        tasks.push(addNftPanel(nft, x, y, z));
      });
      await Promise.all(tasks);
    };

    fetch(FIREBASE_GALLERY_URL)
      .then((res) => res.json())
      .then((data: { nfts?: NFTItem[] }) => {
        const nfts = data?.nfts?.length ? data.nfts : NFT_FALLBACK;
        buildGallery(nfts);
      })
      .catch(() => {
        console.warn('[ClawbWorld] NFT gallery fetch failed, using fallback');
        buildGallery(NFT_FALLBACK);
      });

    // Invisible boundary walls
    const wallMat = new THREE.MeshBasicMaterial({ visible: false });
    const wallGeo = new THREE.BoxGeometry(1, 10, WORLD_BOUNDS * 2 + 20);
    const wallL = new THREE.Mesh(wallGeo, wallMat);
    wallL.position.set(-WORLD_BOUNDS, 0, -5);
    scene.add(wallL);
    const wallR = new THREE.Mesh(wallGeo, wallMat);
    wallR.position.set(WORLD_BOUNDS, 0, -5);
    scene.add(wallR);
    const wallGeo2 = new THREE.BoxGeometry(WORLD_BOUNDS * 2, 10, 1);
    const wallF = new THREE.Mesh(wallGeo2, wallMat);
    wallF.position.set(0, 0, WORLD_BOUNDS);
    scene.add(wallF);
    const wallB = new THREE.Mesh(wallGeo2, wallMat);
    wallB.position.set(0, 0, -WORLD_BOUNDS - 10);
    scene.add(wallB);

    // Keyboard input
    const onKeyDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      keysRef.current[k] = true;
      // E: inspect NFT in front first, otherwise talk to Clawb when near
      if (k === 'e') {
        if (tryInspectNftInFront()) {
          return;
        }
        if (clawbRef.current && cameraRef.current) {
          const dist = cameraRef.current.position.distanceTo(clawbRef.current.position);
          if (dist < CLAWB_GREET_DISTANCE) {
            setShowChatPanel((prev) => !prev);
          }
        }
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.key.toLowerCase()] = false;
    };
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);

    // Resize — maintain PSX resolution
    const handleResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(
        Math.floor(w * PSX_RESOLUTION_SCALE),
        Math.floor(h * PSX_RESOLUTION_SCALE),
        false
      );
    };
    window.addEventListener('resize', handleResize);

    // Start render
    clockRef.current = new THREE.Clock();
    frameIdRef.current = requestAnimationFrame(animate);

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('resize', handleResize);
      if (frameIdRef.current !== null) cancelAnimationFrame(frameIdRef.current);
      controls.dispose();
      renderer.dispose();
      scene.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          mesh.geometry?.dispose();
          const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          mats.forEach((m) => m.dispose());
        }
      });
    };
  }, [createNftPlaceholderTexture, getGreeting, normalizeIpfsUrl, tryInspectNftInFront, animate]); // eslint-disable-line react-hooks/exhaustive-deps

  // Click to lock pointer OR click Clawb to chat (desktop)
  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isMobile) return;
    if (controlsRef.current?.isLocked) return;

    const canvas = canvasRef.current;
    const camera = cameraRef.current;
    const clawb = clawbRef.current;
    const gallery = galleryGroupRef.current;
    if (!canvas || !camera || !clawb) {
      controlsRef.current?.lock();
      return;
    }

    const rect = canvas.getBoundingClientRect();
    mouseRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouseRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    raycasterRef.current.setFromCamera(mouseRef.current, camera);
    if (gallery?.visible) {
      const nftHit = raycasterRef.current
        .intersectObjects(gallery.children, true)
        .find((h) => Boolean((h.object as THREE.Object3D).userData?.nft));
      if (nftHit) {
        setSelectedNft((nftHit.object as THREE.Object3D).userData.nft as NFTItem);
        return;
      }
    }
    const intersects = raycasterRef.current.intersectObject(clawb, true);

    if (intersects.length > 0) {
      setShowChatPanel(true);
    } else {
      controlsRef.current?.lock();
    }
  }, [isMobile]);

  // Mobile touch handlers for look
  const lastTouchRef = useRef<{ x: number; y: number } | null>(null);
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1 && !joystickRef.current.active) {
      const touch = e.touches[0];
      if (lastTouchRef.current && cameraRef.current) {
        const dx = touch.clientX - lastTouchRef.current.x;
        const dy = touch.clientY - lastTouchRef.current.y;
        // Rotate camera
        cameraRef.current.rotation.y -= dx * 0.003;
        cameraRef.current.rotation.x -= dy * 0.003;
        cameraRef.current.rotation.x = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, cameraRef.current.rotation.x));
      }
      lastTouchRef.current = { x: touch.clientX, y: touch.clientY };
    }
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      lastTouchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    lastTouchRef.current = null;
  }, []);

  // Chat: listen to messages when panel is open (merge visitor + clawb, sort by timestamp)
  const visitorMsgsRef = useRef<ClawbChatMessage[]>([]);
  const clawbMsgsRef = useRef<ClawbChatMessage[]>([]);
  useEffect(() => {
    if (!showChatPanel) return;
    const flush = () => {
      const merged = [...visitorMsgsRef.current, ...clawbMsgsRef.current];
      merged.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
      setChatMessages(merged);
    };
    const unsubVisitor = listenToVisitorMessages((msgs) => {
      visitorMsgsRef.current = msgs.map((m) => ({ ...m, author: m.author || 'anonymous' }));
      flush();
    });
    const unsubClawb = listenToClawbResponses((msgs) => {
      clawbMsgsRef.current = msgs.map((m) => ({ ...m, author: 'clawb' }));
      flush();
    });
    return () => {
      visitorMsgsRef.current = [];
      clawbMsgsRef.current = [];
      unsubVisitor();
      unsubClawb();
    };
  }, [showChatPanel]);

  useEffect(() => {
    const unsub = listenToWorldActions((actions) => {
      if (!actions.length) return;
      for (const a of actions) {
        if (processedActionIdsRef.current.has(a.id)) continue;
        processedActionIdsRef.current.add(a.id);
        triggerWorldAction(a.action);
      }
      // Keep set bounded
      if (processedActionIdsRef.current.size > 200) {
        processedActionIdsRef.current = new Set(Array.from(processedActionIdsRef.current).slice(-100));
      }
    }, 40);
    return () => unsub();
  }, [triggerWorldAction]);

  const handleSendChat = useCallback(async () => {
    const msg = chatInput.trim();
    if (!msg) return;
    setChatInput('');
    try {
      await sendClawbMessage(msg, address || 'anonymous', 'world');
      const action = parseWorldActionFromText(msg);
      if (action) {
        await enqueueWorldAction(action, address || 'anonymous', 'world');
      }
    } catch (err) {
      console.error('[ClawbWorld] Send failed:', err);
    }
  }, [chatInput, address, parseWorldActionFromText]);

  // Mobile joystick handlers
  const handleJoystickStart = useCallback((e: React.TouchEvent) => {
    e.stopPropagation();
    const touch = e.touches[0];
    joystickRef.current = { active: true, startX: touch.clientX, startY: touch.clientY, dx: 0, dy: 0 };
  }, []);

  const handleJoystickMove = useCallback((e: React.TouchEvent) => {
    e.stopPropagation();
    if (!joystickRef.current.active) return;
    const touch = e.touches[0];
    joystickRef.current.dx = touch.clientX - joystickRef.current.startX;
    joystickRef.current.dy = touch.clientY - joystickRef.current.startY;
  }, []);

  const handleJoystickEnd = useCallback((e: React.TouchEvent) => {
    e.stopPropagation();
    joystickRef.current = { active: false, startX: 0, startY: 0, dx: 0, dy: 0 };
  }, []);

  return (
    <div ref={containerRef} className="clawb-world-container">
      <canvas
        ref={canvasRef}
        className="clawb-world-canvas"
        onClick={handleCanvasClick}
        onTouchStart={isMobile ? handleTouchStart : undefined}
        onTouchMove={isMobile ? handleTouchMove : undefined}
        onTouchEnd={isMobile ? handleTouchEnd : undefined}
      />

      {/* HUD */}
      <div className="clawb-world-hud">
        <div className="clawb-world-room-label">{currentRoom}</div>
        <div className="clawb-world-controls-hint">
          {!isLocked && !isMobile && (
            <div className="clawb-world-click-prompt">Click to look around · WASD move · Space/Shift swim · Press E to inspect NFT in front · Click Clawb or press E near him to chat</div>
          )}
        </div>
      </div>

      {/* Top-right buttons */}
      <div className="clawb-world-top-buttons">
        <button
          className="clawb-world-btn"
          onClick={() => navigate('/')}
          type="button"
        >
          Back to Desktop
        </button>
      </div>

      {/* Clawb greeting bubble */}
      {clawbGreeting && !showChatPanel && (
        <div className="clawb-world-greeting">
          <span className="clawb-world-greeting-text">{clawbGreeting}</span>
          {!isMobile && <span className="clawb-world-greeting-hint">Press E to talk · Press E while facing an NFT to inspect it</span>}
          {isMobile && (
            <button type="button" className="clawb-world-talk-btn" onClick={() => setShowChatPanel(true)}>Talk to Clawb</button>
          )}
        </div>
      )}

      {selectedNft && (
        <div className="clawb-world-nft-panel">
          <div className="clawb-world-nft-header">
            <span>NFT Inspect</span>
            <button type="button" className="clawb-world-chat-close" onClick={() => setSelectedNft(null)}>×</button>
          </div>
          <div className="clawb-world-nft-body">
            <div><strong>Name:</strong> {selectedNft.name || 'Unknown'}</div>
            <div><strong>Collection:</strong> {selectedNft.collection || 'Unknown'}</div>
            <div><strong>Token ID:</strong> {selectedNft.tokenId || '?'}</div>
            <div><strong>Chain:</strong> {selectedNft.chain || '?'}</div>
            <div className="clawb-world-nft-contract"><strong>Contract:</strong> {selectedNft.contract || 'Unknown'}</div>
            <div className="clawb-world-nft-note">No description field in current gallery feed.</div>
          </div>
        </div>
      )}

      {/* Chat panel — click Clawb or E when near */}
      {showChatPanel && (
        <div className="clawb-world-chat-panel">
          <div className="clawb-world-chat-header">
            <span>Ask Clawb</span>
            <button type="button" className="clawb-world-chat-close" onClick={() => setShowChatPanel(false)}>×</button>
          </div>
          <div className="clawb-world-chat-messages">
            {chatMessages.length === 0 && (
              <div className="clawb-world-chat-placeholder">Ask me anything. the reef remembers.</div>
            )}
            {chatMessages.map((m) => (
              <div key={m.id} className={`clawb-world-chat-msg ${m.author === 'clawb' ? 'clawb' : 'visitor'}`}>
                <span className="clawb-world-chat-author">{m.author === 'clawb' ? 'Clawb' : 'You'}:</span>
                <span className="clawb-world-chat-text">{m.message}</span>
              </div>
            ))}
          </div>
          <div className="clawb-world-chat-input-row">
            <input
              type="text"
              className="clawb-world-chat-input"
              placeholder="Type a message..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSendChat(); } }}
            />
            <button type="button" className="clawb-world-chat-send" onClick={handleSendChat}>Send</button>
          </div>
        </div>
      )}

      {/* Mobile joystick */}
      {isMobile && (
        <>
          <div
            className="clawb-world-joystick"
            onTouchStart={handleJoystickStart}
            onTouchMove={handleJoystickMove}
            onTouchEnd={handleJoystickEnd}
          >
            <div className="clawb-world-joystick-knob" />
          </div>
          <div className="clawb-world-swim-buttons">
            <button
              type="button"
              className="clawb-world-swim-btn"
              onTouchStart={() => { mobileSwimYRef.current = 1; }}
              onTouchEnd={() => { mobileSwimYRef.current = 0; }}
            >
              ↑
            </button>
            <button
              type="button"
              className="clawb-world-swim-btn"
              onTouchStart={() => { mobileSwimYRef.current = -1; }}
              onTouchEnd={() => { mobileSwimYRef.current = 0; }}
            >
              ↓
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default ClawbWorld;
