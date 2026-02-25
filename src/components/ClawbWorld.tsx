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
  generateCollisionBoxes,
  resolveCollision,
  type WorldState,
  type CollisionBox,
} from '../utils/worldObjects';
import {
  sendClawbMessage,
  listenToClawbResponses,
  listenToVisitorMessages,
  enqueueWorldAction,
  listenToWorldActions,
  listenToWorldPlayers,
  upsertWorldPresence,
  removeWorldPresence,
  registerWorldPresenceDisconnectCleanup,
  type ClawbChatMessage,
  type WorldPlayerPresence,
} from '../firebaseClawb';
import './ClawbWorld.css';
import LinuxNavBar from './LinuxNavBar';

// NFT Gallery — same as stream overlay
const FIREBASE_GALLERY_URL = 'https://chess-220ee-default-rtdb.firebaseio.com/clawb/nft_gallery.json';
const FIREBASE_LEADERBOARD_URL = 'https://chess-220ee-default-rtdb.firebaseio.com/leaderboard.json';
const FIREBASE_PROFILES_URL = 'https://chess-220ee-default-rtdb.firebaseio.com/profiles.json?shallow=true';
const FIREBASE_BOUNTIES_URL = 'https://chess-220ee-default-rtdb.firebaseio.com/bounties.json';
const LEADERBOARD_REFRESH_MS = 30_000;
const LEADERBOARD_CANVAS_W = 1024;
const LEADERBOARD_CANVAS_H = 1536;
const MIN_Y = -3;
const MAX_Y = 2;

// Room offsets per spec
const ROOM_OFFSETS: Record<string, THREE.Vector3> = {
  main: new THREE.Vector3(0, 0, 0),
  bedroom: new THREE.Vector3(-15, 0, -15),
  workshop: new THREE.Vector3(15, 0, -15),
  vault: new THREE.Vector3(0, 0, -25),
  leaderboard: new THREE.Vector3(20, 0, 5),
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
  leaderboard: 'Leaderboard',
};

const PSX_RESOLUTION_SCALE = 0.35; // Render at ~1/3 res for PSX look (slightly higher than bg for playability)
const PLAYER_HEIGHT = 0.5;
const PLAYER_SPEED = 5;
const PLAYER_ACCEL_DAMP = 11;
const PLAYER_DECEL_DAMP = 14;
const SWIM_VERTICAL_SPEED = 3;
const WORLD_BOUNDS = 28;
const CLAWB_COLLISION_RADIUS = 0.35;
const PLAYER_COLLISION_RADIUS = 0.3;
const GRAVITY_LERP_RATE = 0.12;
const CLAWB_GREET_DISTANCE = 3;
const CLAWB_SCALE = 0.018; // Sized to match reef objects
const FLOOR_Y = -3;
const NFT_INTERACT_DISTANCE = 3.2;
const WORLD_ACTION_DURATION_MS = 5000;
const DIRECTIONAL_ACTION_DURATION_MS = 2800;
const LOOK_FOCUS_DURATION_MS = 60_000;
const CLAWB_PATROL_SPEED = 1.2;
const CLAWB_PATROL_PAUSE_MS = 1200;
const ROOM_TRANSITION_DURATION_MS = 4200;
const CLAWB_STEP_SPEED = 0.9;
const CLAWB_SWIM_STEP_SPEED = 1.3;
const CLAWB_COMMAND_ACCEL_DAMP = 10;
const CLAWB_COMMAND_DECEL_DAMP = 7;
const CLAWB_COMMAND_TURN_DAMP = 12;
const STREAM_CAMERA_DEFAULT_DISTANCE = 3.2;
const STREAM_CAMERA_MIN_DISTANCE = 0.45;
const STREAM_CAMERA_MAX_DISTANCE = 18.0;
const STREAM_CAMERA_ZOOM_STEP = 0.38;
const STREAM_CAMERA_NEAR_FOV = 108; // close-up fish-eye feel
const STREAM_CAMERA_FAR_FOV = 42; // distant "security camera" feel
const STREAM_CAMERA_NEAR_Y = 0.78; // eye-level closeup
const STREAM_CAMERA_FAR_Y = 10.5; // overhead security-cam height
const STREAM_CAMERA_NEAR_Z_SCALE = 1.0; // keep true distance at close range
const STREAM_CAMERA_FAR_Z_SCALE = 0.32; // pull toward top-down at far range
const STREAM_CAMERA_POSITION_DAMP = 8;
const STREAM_CAMERA_LOOK_DAMP = 10;
const WORLD_MULTIPLAYER_ENABLED = import.meta.env.VITE_WORLD_MULTIPLAYER_ENABLED === 'true';
type ClawbModelKey = 'idle' | 'walk' | 'swim' | 'hi' | 'dance' | 'flip' | 'die';
const CLAWB_MODEL_URLS: Record<ClawbModelKey, string> = {
  idle: '/assets/lawbidle.fbx',
  walk: '/assets/lawbWalk.fbx',
  swim: '/assets/lawbswim.fbx',
  hi: '/assets/lawbhi.fbx',
  dance: '/assets/lawbdance1.fbx',
  flip: '/assets/lawbflip.fbx',
  die: '/assets/lawbdeath.fbx',
};
const CLAWB_MODEL_FALLBACKS: Record<ClawbModelKey, string[]> = {
  idle: ['/assets/lawbWalk.fbx'],
  walk: ['/assets/lawbidle.fbx'],
  swim: ['/assets/lawbWalk.fbx'],
  hi: ['/assets/lawbdance3.fbx', '/assets/lawbidle.fbx'],
  dance: ['/assets/lawbidle.fbx'],
  flip: ['/assets/lawbidle.fbx'],
  die: ['/assets/lawbidle.fbx'],
};
const PATROL_POINTS = [
  new THREE.Vector3(-2.6, FLOOR_Y, -1.4),
  new THREE.Vector3(-0.8, FLOOR_Y, 1.0),
  new THREE.Vector3(1.9, FLOOR_Y, 0.5),
  new THREE.Vector3(2.7, FLOOR_Y, -1.8),
  new THREE.Vector3(0.2, FLOOR_Y, -2.4),
];
const ROOM_ACTION_TO_KEY: Record<string, keyof typeof ROOM_OFFSETS> = {
  room_main: 'main',
  room_bedroom: 'bedroom',
  room_workshop: 'workshop',
  room_vault: 'vault',
  room_leaderboard: 'leaderboard',
};
const LOOPABLE_ACTIONS = new Set(['idle', 'walk', 'dance', 'flip', 'die', 'swim', 'hi', 'wave', 'spin', 'jump']);
const PRESENCE_WRITE_INTERVAL_MS = 250;

interface NFTItem {
  chain?: string;
  contract?: string;
  tokenId?: string;
  name?: string;
  collection?: string;
  image_url?: string;
  description?: string;
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
  const clawbPosRef = useRef(PATROL_POINTS[0].clone());
  const patrolAnchorRef = useRef(ROOM_OFFSETS.main.clone());
  const clawbPatrolPointIdxRef = useRef(1);
  const clawbPatrolPauseUntilRef = useRef(0);
  const roomTransitionRef = useRef<{
    active: boolean;
    startedAt: number;
    durationMs: number;
    from: THREE.Vector3;
    to: THREE.Vector3;
  }>({
    active: false,
    startedAt: 0,
    durationMs: ROOM_TRANSITION_DURATION_MS,
    from: PATROL_POINTS[0].clone(),
    to: PATROL_POINTS[0].clone(),
  });
  const lightsRef = useRef<{ ambient: THREE.AmbientLight; directional: THREE.DirectionalLight } | null>(null);
  const collisionBoxesRef = useRef<CollisionBox[]>([]);

  // Movement keys state
  const keysRef = useRef<Record<string, boolean>>({});
  const velocityRef = useRef(new THREE.Vector3());
  const clawbCommandVelocityRef = useRef(new THREE.Vector3());

  // UI state
  const [isLocked, setIsLocked] = useState(false);
  const [currentRoom, setCurrentRoom] = useState('Main Reef');
  const [clawbGreeting, setClawbGreeting] = useState<string | null>(null);
  const [showChatPanel, setShowChatPanel] = useState(false);
  const [chatMessages, setChatMessages] = useState<ClawbChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [selectedNft, setSelectedNft] = useState<NFTItem | null>(null);
  const [isMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth <= 768);
  const [isStreamMode] = useState(() => {
    if (typeof window === 'undefined') return false;
    return new URLSearchParams(window.location.search).get('stream') === '1';
  });

  const galleryGroupRef = useRef<THREE.Group | null>(null);
  const galleryNftTargetsRef = useRef<Array<{ index: number; nft: NFTItem; focus: THREE.Vector3; camera: THREE.Vector3 }>>([]);
  const pendingLookNftIndexRef = useRef<number | null>(null);
  const leaderboardGroupRef = useRef<THREE.Group | null>(null);
  const leaderboardTextureRef = useRef<THREE.CanvasTexture | null>(null);
  const leaderboardCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const leaderboardLastRefreshRef = useRef<number>(0);
  const leaderboardRenderFnRef = useRef<(() => void) | null>(null);
  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseRef = useRef(new THREE.Vector2());
  const processedActionIdsRef = useRef<Set<string>>(new Set());
  const worldActionRef = useRef<{ type: string; until: number }>({ type: 'patrol', until: 0 });
  const loopedActionRef = useRef<string | null>(null);
  const lookTargetRef = useRef<{ until: number; focus: THREE.Vector3; camera: THREE.Vector3; clawbTarget: THREE.Vector3 } | null>(null);
  const streamCameraLookRef = useRef(new THREE.Vector3(0, FLOOR_Y + 0.75, 0));
  const streamCameraDistanceRef = useRef(STREAM_CAMERA_DEFAULT_DISTANCE);
  const clawbActionTRef = useRef(0);
  const remotePlayersRef = useRef<Map<string, THREE.Group>>(new Map());
  const remoteTargetsRef = useRef<Map<string, WorldPlayerPresence>>(new Map());
  const remoteMixersRef = useRef<Map<string, THREE.AnimationMixer>>(new Map());
  const clawbModelKeyRef = useRef<ClawbModelKey>('idle');
  const clawbModelSwapStateRef = useRef<{ inFlight: boolean; pending: ClawbModelKey | null }>({
    inFlight: false,
    pending: null,
  });
  const requestClawbModelRef = useRef<(key: ClawbModelKey) => void>(() => {});
  const presenceLastWriteAtRef = useRef(0);
  const localRoomRef = useRef('Main Reef');

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
    const walkDirectionMatch = /^!walk\s+(left|right|forward|back)\b/.exec(t);
    if (walkDirectionMatch) return walkDirectionMatch[1];
    const swimDirectionMatch = /^!swim\s+(left|right|forward|back)\b/.exec(t);
    if (swimDirectionMatch) return `swim_${swimDirectionMatch[1]}`;
    const loopMatch = /^!loop\s+([a-z0-9_]+)\b/.exec(t);
    if (loopMatch && LOOPABLE_ACTIONS.has(loopMatch[1])) return `loop_${loopMatch[1]}`;
    if (/(^|\s)!zoom\s+in\b/.test(t) || /(^|\s)!zoomin\b/.test(t)) return 'zoom_in';
    if (/(^|\s)!zoom\s+out\b/.test(t) || /(^|\s)!zoomout\b/.test(t)) return 'zoom_out';
    if (/(^|\s)!look\s+\d+\b/.test(t)) return 'look_nft';
    if (/(^|\s)!garden\b/.test(t)) return 'room_workshop';
    if (/(^|\s)!gallery\b/.test(t)) return 'room_bedroom';
    if (/(^|\s)!bedroom\b/.test(t)) return 'room_bedroom';
    if (/(^|\s)!workshop\b/.test(t)) return 'room_workshop';
    if (/(^|\s)!vault\b/.test(t)) return 'room_vault';
    if (/(^|\s)!leaderboard\b/.test(t)) return 'room_leaderboard';
    if (/(^|\s)!main\b/.test(t)) return 'room_main';
    if (/(^|\s)!day\b/.test(t)) return 'day';
    if (/(^|\s)!night\b/.test(t)) return 'night';
    if (/(^|\s)!left\b/.test(t)) return 'left';
    if (/(^|\s)!right\b/.test(t)) return 'right';
    if (/(^|\s)!forward\b/.test(t)) return 'forward';
    if (/(^|\s)!back\b/.test(t)) return 'back';
    if (/(^|\s)!dance\b|\bdance\b/.test(t)) return 'dance';
    if (/(^|\s)!flip\b|\bflip\b/.test(t)) return 'flip';
    if (/(^|\s)!die\b|\bdie\b/.test(t)) return 'die';
    if (/(^|\s)!swim\b|\bswim\b/.test(t)) return 'swim';
    if (/(^|\s)!hi\b/.test(t)) return 'hi';
    if (/(^|\s)!wave\b|\bwave\b/.test(t)) return 'wave';
    if (/(^|\s)!spin\b|\bspin\b/.test(t)) return 'spin';
    if (/(^|\s)!jump\b|\bjump\b/.test(t)) return 'jump';
    if (/(^|\s)!walk\b/.test(t)) return 'walk';
    if (/(^|\s)!idle\b/.test(t)) return 'idle';
    return null;
  }, []);

  const getPatrolTarget = useCallback((idx: number): THREE.Vector3 => {
    return PATROL_POINTS[idx % PATROL_POINTS.length].clone().add(patrolAnchorRef.current);
  }, []);

  const queueRoomTransition = useCallback((roomKey: keyof typeof ROOM_OFFSETS) => {
    const now = Date.now();
    const from = clawbPosRef.current.clone();
    const nextAnchor = ROOM_OFFSETS[roomKey].clone();
    const to = PATROL_POINTS[0].clone().add(nextAnchor);
    patrolAnchorRef.current = nextAnchor;
    clawbPatrolPointIdxRef.current = 1;
    clawbPatrolPauseUntilRef.current = now;
    roomTransitionRef.current = {
      active: true,
      startedAt: now,
      durationMs: ROOM_TRANSITION_DURATION_MS,
      from,
      to,
    };
    worldActionRef.current = { type: 'swim', until: now + ROOM_TRANSITION_DURATION_MS };
    clawbActionTRef.current = 0;
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

  const triggerWorldAction = useCallback((action: string, payload?: { targetNftIndex?: number; loop?: unknown; direction?: unknown; source?: unknown }) => {
    const loopRequested = payload?.loop === true;
    if (loopedActionRef.current && payload?.source === 'autonomy') return;
    const scene = sceneRef.current;
    const lights = lightsRef.current;
    if (scene && lights && (action === 'day' || action === 'night')) {
      loopedActionRef.current = null;
      const isNight = action === 'night';
      setupUnderwaterFog(scene, isNight);
      lights.ambient.color.set(isNight ? '#1a2a44' : '#4466aa');
      lights.ambient.intensity = isNight ? 0.4 : 0.6;
      lights.directional.color.set(isNight ? '#88aacc' : '#ffffee');
      lights.directional.intensity = isNight ? 0.5 : 0.8;
      worldActionRef.current = { type: 'patrol', until: 0 };
      return;
    }
    const roomKey = ROOM_ACTION_TO_KEY[action];
    if (roomKey) {
      loopedActionRef.current = null;
      requestClawbModelRef.current('walk');
      queueRoomTransition(roomKey);
      return;
    }
    if (action === 'zoom_in' || action === 'zoom_out') {
      const delta = action === 'zoom_in' ? -STREAM_CAMERA_ZOOM_STEP : STREAM_CAMERA_ZOOM_STEP;
      const next = streamCameraDistanceRef.current + delta;
      streamCameraDistanceRef.current = Math.max(
        STREAM_CAMERA_MIN_DISTANCE,
        Math.min(STREAM_CAMERA_MAX_DISTANCE, next)
      );
      return;
    }
    if (action === 'idle') {
      requestClawbModelRef.current('idle');
      if (loopRequested) {
        loopedActionRef.current = 'idle';
        worldActionRef.current = { type: 'idle', until: Number.POSITIVE_INFINITY };
      } else {
        loopedActionRef.current = null;
        worldActionRef.current = { type: 'patrol', until: 0 };
      }
      clawbActionTRef.current = 0;
      return;
    }
    if (action === 'walk') {
      requestClawbModelRef.current('walk');
      if (loopRequested) {
        loopedActionRef.current = 'walk';
        worldActionRef.current = { type: 'walk', until: Number.POSITIVE_INFINITY };
      } else {
        loopedActionRef.current = null;
        worldActionRef.current = { type: 'walk', until: Date.now() + DIRECTIONAL_ACTION_DURATION_MS };
      }
      clawbActionTRef.current = 0;
      return;
    }
    if (action === 'look_nft') {
      loopedActionRef.current = null;
      requestClawbModelRef.current('walk');
      const idx = Number(payload?.targetNftIndex || 0);
      if (Number.isFinite(idx) && idx >= 1) {
        const targets = [...galleryNftTargetsRef.current].sort((a, b) => a.index - b.index);
        const target =
          targets.find((t) => t.index === idx) ||
          (targets.length ? targets[Math.max(0, Math.min(targets.length - 1, Math.floor(idx) - 1))] : null);
        if (target) {
          queueRoomTransition('bedroom');
          setSelectedNft(target.nft);
          const now = Date.now();
          const clawbTarget = target.focus.clone().add(new THREE.Vector3(0, -0.2, 1.0));
          lookTargetRef.current = {
            until: now + LOOK_FOCUS_DURATION_MS,
            focus: target.focus.clone(),
            camera: target.camera.clone(),
            clawbTarget,
          };
          worldActionRef.current = { type: 'look_swim', until: now + LOOK_FOCUS_DURATION_MS };
          clawbActionTRef.current = 0;
          pendingLookNftIndexRef.current = null;
        } else {
          // Gallery panels are not ready yet; apply when build finishes.
          pendingLookNftIndexRef.current = Math.floor(idx);
          queueRoomTransition('bedroom');
        }
      }
      return;
    }
    if (action === 'left' || action === 'right' || action === 'forward' || action === 'back') {
      requestClawbModelRef.current('walk');
    }
    if (action === 'swim' || action === 'swim_left' || action === 'swim_right' || action === 'swim_forward' || action === 'swim_back') {
      requestClawbModelRef.current('swim');
    }
    if (action === 'hi') requestClawbModelRef.current('hi');
    if (action === 'dance') requestClawbModelRef.current('dance');
    if (action === 'flip') requestClawbModelRef.current('flip');
    if (action === 'die') requestClawbModelRef.current('die');
    if (action === 'wave' || action === 'spin' || action === 'jump') {
      requestClawbModelRef.current('walk');
    }
    if (loopRequested && LOOPABLE_ACTIONS.has(action)) {
      loopedActionRef.current = action;
      worldActionRef.current = { type: action, until: Number.POSITIVE_INFINITY };
    } else {
      loopedActionRef.current = null;
      const isDirectional =
        action === 'left' ||
        action === 'right' ||
        action === 'forward' ||
        action === 'back' ||
        action === 'swim_left' ||
        action === 'swim_right' ||
        action === 'swim_forward' ||
        action === 'swim_back';
      worldActionRef.current = {
        type: action,
        until: Date.now() + (isDirectional ? DIRECTIONAL_ACTION_DURATION_MS : WORLD_ACTION_DURATION_MS),
      };
    }
    clawbActionTRef.current = 0;
  }, [queueRoomTransition]);

  const applyBlueTint = useCallback((object: THREE.Group) => {
    object.traverse((child: THREE.Object3D) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        mesh.material = mats.map((m) => {
          const clone = m.clone() as THREE.MeshStandardMaterial;
          if (clone.color) clone.color.set('#66aaff');
          if ('emissive' in clone && clone.emissive) clone.emissive.set('#0b1d33');
          return clone;
        });
      }
    });
  }, []);

  const getPlayableClip = useCallback((clip: THREE.AnimationClip): THREE.AnimationClip => {
    const filtered = clip.clone();
    filtered.tracks = filtered.tracks.filter((t) => !t.name.toLowerCase().includes('.position'));
    if (filtered.tracks.length > 0) {
      filtered.resetDuration();
      return filtered;
    }
    // Some FBX files only expose root-position animation. Keep original to avoid T-pose.
    return clip.clone();
  }, []);

  const ensureRemotePlayer = useCallback(async (wallet: string, scene: THREE.Scene): Promise<THREE.Group> => {
    const existing = remotePlayersRef.current.get(wallet);
    if (existing) return existing;

    const loader = new FBXLoader();
    const model = await new Promise<THREE.Group>((resolve, reject) => {
      loader.load('/assets/lawbWalk.fbx', resolve, undefined, reject);
    });
    model.scale.setScalar(CLAWB_SCALE);
    model.position.set(0, FLOOR_Y, 0);
    applyBlueTint(model);
    scene.add(model);
    remotePlayersRef.current.set(wallet, model);

    if (model.animations?.length > 0) {
      const mixer = new THREE.AnimationMixer(model);
      const clip = getPlayableClip(model.animations[0]);
      mixer.clipAction(clip).play();
      remoteMixersRef.current.set(wallet, mixer);
    }

    return model;
  }, [applyBlueTint, getPlayableClip]);

  // Animation loop
  const animate = useCallback(() => {
    if (!rendererRef.current || !sceneRef.current || !cameraRef.current) return;

    const delta = Math.min(clockRef.current.getDelta(), 1 / 20);
    const camera = cameraRef.current;

    // Player movement
    if (!isStreamMode && (controlsRef.current?.isLocked || isMobile)) {
      const velocity = velocityRef.current;
      const direction = new THREE.Vector3();
      const keys = keysRef.current;

      // Desktop WASD
      const forward = (keys['w'] || keys['arrowup'] ? 1 : 0) - (keys['s'] || keys['arrowdown'] ? 1 : 0);
      const strafe = (keys['d'] || keys['arrowright'] ? 1 : 0) - (keys['a'] || keys['arrowleft'] ? 1 : 0);

      // Swim up/down (Space = up, Shift = down, or mobile buttons)
      const swimUp = keys[' '] || mobileSwimYRef.current === 1 ? 1 : 0;
      const swimDown = keys['shift'] || mobileSwimYRef.current === -1 ? 1 : 0;
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

      // Apply movement relative to camera facing with acceleration/deceleration damping.
      const hasMoveInput = direction.lengthSq() > 0.0001;
      const targetVelocityX = direction.x * PLAYER_SPEED;
      const targetVelocityZ = direction.z * PLAYER_SPEED;
      const moveDamp = hasMoveInput ? PLAYER_ACCEL_DAMP : PLAYER_DECEL_DAMP;
      velocity.x = THREE.MathUtils.damp(velocity.x, targetVelocityX, moveDamp, delta);
      velocity.z = THREE.MathUtils.damp(velocity.z, targetVelocityZ, moveDamp, delta);
      velocity.y = THREE.MathUtils.damp(velocity.y, (swimUp - swimDown) * SWIM_VERTICAL_SPEED, moveDamp, delta);

      if (controlsRef.current) {
        controlsRef.current.moveRight(velocity.x * delta);
        controlsRef.current.moveForward(-velocity.z * delta);
      }

      // Swim up/down
      camera.position.y += velocity.y * delta;

      // Clamp to world bounds
      camera.position.x = Math.max(-WORLD_BOUNDS, Math.min(WORLD_BOUNDS, camera.position.x));
      camera.position.z = Math.max(-WORLD_BOUNDS - 10, Math.min(WORLD_BOUNDS, camera.position.z));
      // Clamp vertical (swim range)
      camera.position.y = Math.max(MIN_Y + PLAYER_HEIGHT, Math.min(MAX_Y, camera.position.y));

      // Collision with world objects
      const resolved = resolveCollision(
        camera.position.x,
        camera.position.z,
        PLAYER_COLLISION_RADIUS,
        collisionBoxesRef.current,
      );
      camera.position.x = resolved.x;
      camera.position.z = resolved.z;
    }

    // Update room name (every frame)
    const roomName = getRoomName(camera.position);
    setCurrentRoom(roomName);
    localRoomRef.current = roomName;

    // Animate bubbles
    if (bubblesRef.current) {
      animateBubbles(bubblesRef.current, delta);
    }

    // Animate remote players + sync local presence
    if (WORLD_MULTIPLAYER_ENABLED && sceneRef.current) {
      for (const mixer of remoteMixersRef.current.values()) {
        mixer.update(delta);
      }

      for (const [wallet, target] of remoteTargetsRef.current.entries()) {
        const model = remotePlayersRef.current.get(wallet);
        if (!model) continue;
        const targetPos = new THREE.Vector3(target.x, target.y, target.z);
        model.position.lerp(targetPos, Math.min(1, delta * 6));
        model.rotation.y = target.rotationY;
      }
    }

    if (
      WORLD_MULTIPLAYER_ENABLED &&
      address &&
      Date.now() - presenceLastWriteAtRef.current > PRESENCE_WRITE_INTERVAL_MS
    ) {
      presenceLastWriteAtRef.current = Date.now();
      upsertWorldPresence(address, {
        room: localRoomRef.current,
        x: camera.position.x,
        y: camera.position.y - PLAYER_HEIGHT,
        z: camera.position.z,
        rotationY: camera.rotation.y,
      }).catch(() => {
        // non-blocking
      });
    }

    // Animate Clawb NPC (patrol + synchronized world actions)
    if (clawbRef.current && clawbMixerRef.current) {
      const activeAction =
        loopedActionRef.current || (Date.now() < worldActionRef.current.until ? worldActionRef.current.type : 'patrol');
      // Keep animation mixer running in stream mode so idle/walk clips don't lock into bind pose.
      clawbMixerRef.current.update(delta);
      clawbActionTRef.current += delta;
      const t = clawbActionTRef.current;

      if (activeAction === 'patrol') {
        clawbCommandVelocityRef.current.x = THREE.MathUtils.damp(
          clawbCommandVelocityRef.current.x,
          0,
          CLAWB_COMMAND_DECEL_DAMP,
          delta
        );
        clawbCommandVelocityRef.current.z = THREE.MathUtils.damp(
          clawbCommandVelocityRef.current.z,
          0,
          CLAWB_COMMAND_DECEL_DAMP,
          delta
        );
        requestClawbModelRef.current(isStreamMode ? 'idle' : 'walk');
        if (isStreamMode) {
          clawbRef.current.position.x = clawbPosRef.current.x;
          clawbRef.current.position.z = clawbPosRef.current.z;
          clawbRef.current.position.y = FLOOR_Y;
          // In stream mode, keep current location so movement commands persist.
          const dx = camera.position.x - clawbRef.current.position.x;
          clawbRef.current.rotation.y = Math.atan2(dx, 1);
          clawbRef.current.rotation.x = THREE.MathUtils.lerp(clawbRef.current.rotation.x, 0, 0.2);
          clawbRef.current.rotation.z = THREE.MathUtils.lerp(clawbRef.current.rotation.z, 0, 0.2);
        } else {
        const now = Date.now();
        if (now >= clawbPatrolPauseUntilRef.current) {
          const target = getPatrolTarget(clawbPatrolPointIdxRef.current);
          const toTarget = new THREE.Vector3().subVectors(target, clawbPosRef.current);
          const dist = toTarget.length();
          if (dist < 0.18) {
            clawbPatrolPointIdxRef.current = (clawbPatrolPointIdxRef.current + 1) % PATROL_POINTS.length;
            clawbPatrolPauseUntilRef.current = now + CLAWB_PATROL_PAUSE_MS;
          } else {
            toTarget.normalize();
            clawbPosRef.current.x += toTarget.x * CLAWB_PATROL_SPEED * delta;
            clawbPosRef.current.z += toTarget.z * CLAWB_PATROL_SPEED * delta;
            const pr = resolveCollision(
              clawbPosRef.current.x,
              clawbPosRef.current.z,
              CLAWB_COLLISION_RADIUS,
              collisionBoxesRef.current,
            );
            clawbPosRef.current.x = pr.x;
            clawbPosRef.current.z = pr.z;
            clawbRef.current.rotation.y = Math.atan2(toTarget.x, toTarget.z);
          }
        }
        clawbRef.current.position.x = clawbPosRef.current.x;
        clawbRef.current.position.z = clawbPosRef.current.z;
        clawbRef.current.position.y =
          Date.now() < clawbPatrolPauseUntilRef.current
            ? FLOOR_Y + Math.abs(Math.sin(t * 3.2)) * 0.08
            : FLOOR_Y;
        clawbRef.current.rotation.x = THREE.MathUtils.lerp(clawbRef.current.rotation.x, 0, 0.14);
        clawbRef.current.rotation.z = THREE.MathUtils.lerp(clawbRef.current.rotation.z, 0, 0.14);
        }
      } else {
        if (roomTransitionRef.current.active) {
          const elapsed = Date.now() - roomTransitionRef.current.startedAt;
          const progress = Math.min(1, elapsed / roomTransitionRef.current.durationMs);
          const eased = progress < 0.5
            ? 2 * progress * progress
            : 1 - Math.pow(-2 * progress + 2, 2) / 2;
          clawbPosRef.current.lerpVectors(roomTransitionRef.current.from, roomTransitionRef.current.to, eased);
          if (progress >= 1) {
            roomTransitionRef.current.active = false;
            clawbPatrolPauseUntilRef.current = Date.now() + 400;
          }
        }
        clawbRef.current.position.x = clawbPosRef.current.x;
        clawbRef.current.position.z = clawbPosRef.current.z;
        let desiredDirection: THREE.Vector3 | null = null;
        let desiredSpeed = 0;
        let swimMode = false;
        const commandVelocity = clawbCommandVelocityRef.current;
        if (activeAction === 'look_swim') {
          requestClawbModelRef.current('walk');
          const lookTarget = lookTargetRef.current;
          if (lookTarget) {
            const desired = lookTarget.clawbTarget;
            clawbPosRef.current.lerp(desired, 0.06);
            clawbRef.current.position.x = clawbPosRef.current.x;
            clawbRef.current.position.z = clawbPosRef.current.z;
            clawbRef.current.position.y = FLOOR_Y;
            const dir = new THREE.Vector3().subVectors(lookTarget.focus, clawbRef.current.position);
            const targetYaw = Math.atan2(dir.x, dir.z);
            clawbRef.current.rotation.y = THREE.MathUtils.damp(
              clawbRef.current.rotation.y,
              targetYaw,
              CLAWB_COMMAND_TURN_DAMP,
              delta
            );
          }
        } else if (activeAction === 'walk' || activeAction === 'forward') {
          desiredDirection = new THREE.Vector3(0, 0, -1);
          desiredSpeed = CLAWB_STEP_SPEED;
        } else if (activeAction === 'back') {
          desiredDirection = new THREE.Vector3(0, 0, 1);
          desiredSpeed = CLAWB_STEP_SPEED;
        } else if (activeAction === 'left') {
          desiredDirection = new THREE.Vector3(-1, 0, 0);
          desiredSpeed = CLAWB_STEP_SPEED;
        } else if (activeAction === 'right') {
          desiredDirection = new THREE.Vector3(1, 0, 0);
          desiredSpeed = CLAWB_STEP_SPEED;
        } else if (activeAction === 'swim' || activeAction === 'swim_forward') {
          desiredDirection = new THREE.Vector3(0, 0, -1);
          desiredSpeed = CLAWB_SWIM_STEP_SPEED;
          swimMode = true;
        } else if (activeAction === 'swim_back') {
          desiredDirection = new THREE.Vector3(0, 0, 1);
          desiredSpeed = CLAWB_SWIM_STEP_SPEED;
          swimMode = true;
        } else if (activeAction === 'swim_left') {
          desiredDirection = new THREE.Vector3(-1, 0, 0);
          desiredSpeed = CLAWB_SWIM_STEP_SPEED;
          swimMode = true;
        } else if (activeAction === 'swim_right') {
          desiredDirection = new THREE.Vector3(1, 0, 0);
          desiredSpeed = CLAWB_SWIM_STEP_SPEED;
          swimMode = true;
        } else if (activeAction === 'hi') {
          clawbRef.current.position.y = FLOOR_Y + Math.abs(Math.sin(t * 4.2)) * 0.05;
          clawbRef.current.rotation.y += Math.sin(t * 4.2) * 0.006;
        }

        if (desiredDirection) {
          const targetVelocity = desiredDirection.normalize().multiplyScalar(desiredSpeed);
          commandVelocity.x = THREE.MathUtils.damp(commandVelocity.x, targetVelocity.x, CLAWB_COMMAND_ACCEL_DAMP, delta);
          commandVelocity.z = THREE.MathUtils.damp(commandVelocity.z, targetVelocity.z, CLAWB_COMMAND_ACCEL_DAMP, delta);
        } else {
          commandVelocity.x = THREE.MathUtils.damp(commandVelocity.x, 0, CLAWB_COMMAND_DECEL_DAMP, delta);
          commandVelocity.z = THREE.MathUtils.damp(commandVelocity.z, 0, CLAWB_COMMAND_DECEL_DAMP, delta);
        }

        if (Math.abs(commandVelocity.x) > 0.0001 || Math.abs(commandVelocity.z) > 0.0001) {
          clawbPosRef.current.x += commandVelocity.x * delta;
          clawbPosRef.current.z += commandVelocity.z * delta;
          const targetYaw = Math.atan2(commandVelocity.x, commandVelocity.z);
          clawbRef.current.rotation.y = THREE.MathUtils.damp(
            clawbRef.current.rotation.y,
            targetYaw,
            CLAWB_COMMAND_TURN_DAMP,
            delta
          );
        }

        clawbPosRef.current.x = THREE.MathUtils.clamp(clawbPosRef.current.x, -WORLD_BOUNDS + 1.2, WORLD_BOUNDS - 1.2);
        clawbPosRef.current.z = THREE.MathUtils.clamp(clawbPosRef.current.z, -WORLD_BOUNDS - 8.5, WORLD_BOUNDS - 1.2);

        if (!roomTransitionRef.current.active) {
          const cr = resolveCollision(
            clawbPosRef.current.x,
            clawbPosRef.current.z,
            CLAWB_COLLISION_RADIUS,
            collisionBoxesRef.current,
          );
          clawbPosRef.current.x = cr.x;
          clawbPosRef.current.z = cr.z;
        }

        clawbRef.current.position.x = clawbPosRef.current.x;
        clawbRef.current.position.z = clawbPosRef.current.z;
        if (swimMode) {
          clawbRef.current.position.y = FLOOR_Y + 0.2 + Math.sin(t * 3.2) * 0.08;
        } else {
          clawbRef.current.position.y = THREE.MathUtils.lerp(
            clawbRef.current.position.y, FLOOR_Y, GRAVITY_LERP_RATE
          );
        }
      }

      const isSwimAction = typeof activeAction === 'string' && activeAction.startsWith('swim');
      if (isStreamMode && activeAction !== 'die' && !isSwimAction) {
        clawbRef.current.position.y = FLOOR_Y;
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

    // Dedicated stream camera: keep Clawb centered/visible in OBS.
    if (isStreamMode && clawbRef.current) {
      const smoothCameraPosition = (target: THREE.Vector3) => {
        camera.position.x = THREE.MathUtils.damp(camera.position.x, target.x, STREAM_CAMERA_POSITION_DAMP, delta);
        camera.position.y = THREE.MathUtils.damp(camera.position.y, target.y, STREAM_CAMERA_POSITION_DAMP, delta);
        camera.position.z = THREE.MathUtils.damp(camera.position.z, target.z, STREAM_CAMERA_POSITION_DAMP, delta);
      };
      const smoothLookAt = (target: THREE.Vector3) => {
        streamCameraLookRef.current.x = THREE.MathUtils.damp(
          streamCameraLookRef.current.x,
          target.x,
          STREAM_CAMERA_LOOK_DAMP,
          delta
        );
        streamCameraLookRef.current.y = THREE.MathUtils.damp(
          streamCameraLookRef.current.y,
          target.y,
          STREAM_CAMERA_LOOK_DAMP,
          delta
        );
        streamCameraLookRef.current.z = THREE.MathUtils.damp(
          streamCameraLookRef.current.z,
          target.z,
          STREAM_CAMERA_LOOK_DAMP,
          delta
        );
        camera.lookAt(streamCameraLookRef.current.x, streamCameraLookRef.current.y, streamCameraLookRef.current.z);
      };
      const lookTarget = lookTargetRef.current;
      if (lookTarget && Date.now() < lookTarget.until) {
        smoothCameraPosition(lookTarget.camera);
        smoothLookAt(lookTarget.focus);
        const fov = THREE.MathUtils.lerp(camera.fov, 58, 0.12);
        if (Math.abs(fov - camera.fov) > 0.01) {
          camera.fov = fov;
          camera.updateProjectionMatrix();
        }
      } else if (roomName === 'Leaderboard') {
        if (lookTargetRef.current) setSelectedNft(null);
        lookTargetRef.current = null;
        // Fixed leaderboard framing for stream readability.
        // Lifted slightly to avoid bottom HUD overlays obscuring text.
        const lbOff = ROOM_OFFSETS.leaderboard;
        const bbCenter = new THREE.Vector3(lbOff.x - 2.6, lbOff.y + 3.0, lbOff.z - 6.4);
        // Camera sits in front of the board with a slight top-down tilt.
        const camDesired = new THREE.Vector3(lbOff.x - 2.6, lbOff.y + 4.6, lbOff.z + 4.0);
        smoothCameraPosition(camDesired);
        smoothLookAt(bbCenter);
        const fov = THREE.MathUtils.lerp(camera.fov, 36, 0.1);
        if (Math.abs(fov - camera.fov) > 0.01) {
          camera.fov = fov;
          camera.updateProjectionMatrix();
        }
      } else {
        if (lookTargetRef.current) {
          setSelectedNft(null);
        }
        lookTargetRef.current = null;
        const focus = clawbRef.current.position.clone();
        const zoomT = THREE.MathUtils.clamp(
          (streamCameraDistanceRef.current - STREAM_CAMERA_MIN_DISTANCE) /
            Math.max(0.001, STREAM_CAMERA_MAX_DISTANCE - STREAM_CAMERA_MIN_DISTANCE),
          0,
          1
        );
        const yOffset = THREE.MathUtils.lerp(STREAM_CAMERA_NEAR_Y, STREAM_CAMERA_FAR_Y, zoomT);
        const zScale = THREE.MathUtils.lerp(STREAM_CAMERA_NEAR_Z_SCALE, STREAM_CAMERA_FAR_Z_SCALE, zoomT);
        const zOffset = streamCameraDistanceRef.current * zScale;
        const desired = focus.clone().add(new THREE.Vector3(0, yOffset, zOffset));
        smoothCameraPosition(desired);
        smoothLookAt(focus.clone().add(new THREE.Vector3(0, 0.72, 0)));
        const targetFov = THREE.MathUtils.lerp(STREAM_CAMERA_NEAR_FOV, STREAM_CAMERA_FAR_FOV, zoomT);
        const fov = THREE.MathUtils.lerp(camera.fov, targetFov, 0.12);
        if (Math.abs(fov - camera.fov) > 0.01) {
          camera.fov = fov;
          camera.updateProjectionMatrix();
        }
      }
    }

    // NFT gallery visibility — bedroom only
    if (galleryGroupRef.current) {
      galleryGroupRef.current.visible = roomName === 'Bedroom';
    }

    // Leaderboard visibility + neon pulse animation
    if (leaderboardGroupRef.current) {
      const lbVisible = roomName === 'Leaderboard';
      leaderboardGroupRef.current.visible = lbVisible;
      if (lbVisible) {
        const pulse = 0.5 + 0.5 * Math.sin(Date.now() / 400);
        leaderboardGroupRef.current.children.forEach((child) => {
          if (child instanceof THREE.PointLight) {
            child.intensity = 1.0 + pulse * 0.8;
          }
        });
        // Re-render canvas for animated elements (throttled to ~2fps for perf)
        if (Date.now() - leaderboardLastRefreshRef.current > 500) {
          if (leaderboardRenderFnRef.current) leaderboardRenderFnRef.current();
          if (leaderboardTextureRef.current) leaderboardTextureRef.current.needsUpdate = true;
          leaderboardLastRefreshRef.current = Date.now();
        }
      }
    }

    rendererRef.current.render(sceneRef.current, cameraRef.current);
    frameIdRef.current = requestAnimationFrame(animate);
  }, [getPatrolTarget, getRoomName, getGreeting, isMobile, isStreamMode]);

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
    lightsRef.current = setupUnderwaterLighting(scene, true);

    // Camera
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 200);
    camera.position.set(0, FLOOR_Y + PLAYER_HEIGHT, 5);
    if (isStreamMode) {
      camera.position.set(0, FLOOR_Y + 1.45, 2.8);
      camera.lookAt(0, FLOOR_Y + 0.75, 0);
      streamCameraLookRef.current.set(0, FLOOR_Y + 0.75, 0);
    }
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
    const addRoomCollision = (data: WorldState, offset: THREE.Vector3) => {
      const boxes = generateCollisionBoxes(data, offset.x, offset.z);
      collisionBoxesRef.current = [...collisionBoxesRef.current, ...boxes];
    };
    for (const [roomName, firebaseUrl] of Object.entries(ROOM_URLS)) {
      const offset = ROOM_OFFSETS[roomName];
      fetch(firebaseUrl)
        .then((res) => res.json())
        .then((data: WorldState) => {
          if (data && data.objects) {
            renderWorldState(scene, data, offset);
            addRoomCollision(data, offset);
          } else {
            throw new Error('Invalid Firebase response');
          }
        })
        .catch(() => {
          const fallback = ROOM_FILES_FALLBACK[roomName];
          if (fallback) {
            fetch(fallback)
              .then((res) => res.json())
              .then((data: WorldState) => {
                renderWorldState(scene, data, offset);
                addRoomCollision(data, offset);
              })
              .catch((err) => console.warn(`[ClawbWorld] Failed to load ${roomName}:`, err));
          }
        });
    }

    // Load Clawb NPC
    const loader = new FBXLoader();
    const loadClawbModel = (url: string) =>
      new Promise<THREE.Group>((resolve, reject) => loader.load(url, resolve, undefined, reject));

    const prepareClawbModel = (object: THREE.Group) => {
        object.scale.setScalar(CLAWB_SCALE);
        object.position.copy(clawbPosRef.current); // Feet on the sand
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
    };

    const applyClawbModel = (object: THREE.Group, key: ClawbModelKey) => {
        prepareClawbModel(object);
        const prev = clawbRef.current;
        const prevPos = prev?.position.clone();
        const prevRotY = prev?.rotation.y;
        if (prev && prevPos) object.position.copy(prevPos);
        if (prevRotY !== undefined) object.rotation.y = prevRotY;
        if (prev) scene.remove(prev);
        clawbMixerRef.current?.stopAllAction();
        clawbMixerRef.current = null;
        scene.add(object);
        clawbRef.current = object;
        clawbModelKeyRef.current = key;
        if (object.animations?.length > 0) {
          const mixer = new THREE.AnimationMixer(object);
          const clip = getPlayableClip(object.animations[0]);
          mixer.clipAction(clip).play();
          clawbMixerRef.current = mixer;
        }
    };

    const requestClawbModel = (key: ClawbModelKey) => {
      if (!sceneRef.current) return;
      if (clawbModelKeyRef.current === key && clawbRef.current) return;
      if (clawbModelSwapStateRef.current.inFlight) {
        clawbModelSwapStateRef.current.pending = key;
        return;
      }
      clawbModelSwapStateRef.current.inFlight = true;
      const candidateUrls = [CLAWB_MODEL_URLS[key], ...CLAWB_MODEL_FALLBACKS[key]];
      const loadWithFallback = async () => {
        let lastErr: unknown = null;
        for (const url of candidateUrls) {
          try {
            const obj = await loadClawbModel(url);
            applyClawbModel(obj, key);
            return;
          } catch (err) {
            lastErr = err;
          }
        }
        throw lastErr;
      };
      void loadWithFallback()
        .catch((err) => console.warn(`[ClawbWorld] Failed to load Clawb model "${key}" from all candidates:`, err))
        .finally(() => {
          clawbModelSwapStateRef.current.inFlight = false;
          const pending = clawbModelSwapStateRef.current.pending;
          clawbModelSwapStateRef.current.pending = null;
          if (pending && pending !== clawbModelKeyRef.current) {
            requestClawbModel(pending);
          }
        });
    };
    requestClawbModelRef.current = requestClawbModel;
    requestClawbModel('idle');

    // Listen to other players in world
    const unsubPlayers = WORLD_MULTIPLAYER_ENABLED
      ? listenToWorldPlayers((players) => {
          const mine = (address || '').toLowerCase();
          const now = Date.now();
          const seen = new Set<string>();

          for (const p of players) {
            if (!p?.wallet) continue;
            if (p.wallet === mine) continue;
            if (now - (p.updatedAt || 0) > 20_000) continue; // stale presence
            seen.add(p.wallet);
            remoteTargetsRef.current.set(p.wallet, p);
            ensureRemotePlayer(p.wallet, scene).catch(() => {
              // non-blocking
            });
          }

          // Cleanup players that disappeared
          for (const [wallet, model] of remotePlayersRef.current.entries()) {
            if (!seen.has(wallet)) {
              scene.remove(model);
              remotePlayersRef.current.delete(wallet);
              remoteTargetsRef.current.delete(wallet);
              const mixer = remoteMixersRef.current.get(wallet);
              if (mixer) {
                mixer.stopAllAction();
                remoteMixersRef.current.delete(wallet);
              }
            }
          }
        })
      : () => {};

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

    const addNftPanel = async (nft: NFTItem, index: number, x: number, y: number, z: number) => {
      const frame = new THREE.Mesh(new THREE.PlaneGeometry(frameSize + 0.1, frameSize + 0.1), frameMat);
      frame.position.set(x, y, z);
      frame.userData.nft = nft;
      frame.userData.nftIndex = index;
      galleryGroup.add(frame);

      const bg = new THREE.Mesh(new THREE.PlaneGeometry(frameSize, frameSize), bgMat);
      bg.position.set(x, y, z + 0.02);
      bg.userData.nft = nft;
      bg.userData.nftIndex = index;
      galleryGroup.add(bg);

      const tex = await loadTextureWithFallback(nft);
      const imgMat = new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide });
      const imgPlane = new THREE.Mesh(new THREE.PlaneGeometry(frameSize, frameSize), imgMat);
      imgPlane.position.set(x, y, z + 0.04);
      imgPlane.userData.nft = nft;
      imgPlane.userData.nftIndex = index;
      galleryGroup.add(imgPlane);

      const spot = new THREE.PointLight(0xeeeeff, 0.3, 2.5);
      spot.position.set(x, y + 0.7, -2.8);
      galleryGroup.add(spot);

      const focus = new THREE.Vector3(x, y, z + 0.04).add(BEDROOM_OFFSET);
      const cameraPos = new THREE.Vector3(x, y + 0.05, z + 1.5).add(BEDROOM_OFFSET);
      galleryNftTargetsRef.current.push({ index, nft, focus, camera: cameraPos });
    };

    const buildGallery = async (nfts: NFTItem[]) => {
      galleryNftTargetsRef.current = [];
      const cols = 5;
      const rows = Math.ceil(nfts.length / cols);
      const spacingX = 1.3;
      const spacingY = 1.1;
      const startX = -((cols - 1) * spacingX) / 2;
      const bottomRowY = -0.6;

      addGalleryWalls(galleryGroup, rows);

      const tasks: Array<Promise<void>> = [];
      nfts.forEach((nft, i) => {
        const index = i + 1;
        const col = i % cols;
        const row = Math.floor(i / cols);
        const x = startX + col * spacingX;
        const y = bottomRowY + row * spacingY;
        const z = -3.46;
        tasks.push(addNftPanel(nft, index, x, y, z));
      });
      await Promise.all(tasks);

      // If a !look command came in before gallery targets were ready, apply it now.
      const pending = pendingLookNftIndexRef.current;
      if (pending != null) {
        triggerWorldAction('look_nft', { targetNftIndex: pending });
      }
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

    // ---------------------------------------------------------------
    // 3D Leaderboard Billboard — Vegas-style scoreboard
    // ---------------------------------------------------------------
    const LB_OFFSET = ROOM_OFFSETS.leaderboard;
    const lbGroup = new THREE.Group();
    lbGroup.position.copy(LB_OFFSET);
    lbGroup.visible = false;
    scene.add(lbGroup);
    leaderboardGroupRef.current = lbGroup;

    // Billboard canvas for dynamic text rendering
    const lbCanvas = document.createElement('canvas');
    lbCanvas.width = LEADERBOARD_CANVAS_W;
    lbCanvas.height = LEADERBOARD_CANVAS_H;
    leaderboardCanvasRef.current = lbCanvas;

    // Draw immediate "loading" content so texture is never blank
    const lbCtxInit = lbCanvas.getContext('2d');
    if (lbCtxInit) {
      const bg = lbCtxInit.createLinearGradient(0, 0, 0, LEADERBOARD_CANVAS_H);
      bg.addColorStop(0, '#0a0e1a');
      bg.addColorStop(1, '#060a12');
      lbCtxInit.fillStyle = bg;
      lbCtxInit.fillRect(0, 0, LEADERBOARD_CANVAS_W, LEADERBOARD_CANVAS_H);
      lbCtxInit.fillStyle = '#ff2266';
      lbCtxInit.font = 'bold 52px monospace';
      lbCtxInit.textAlign = 'center';
      lbCtxInit.fillText('LAWB LEADERBOARD', LEADERBOARD_CANVAS_W / 2, 72);
      lbCtxInit.fillStyle = '#6688aa';
      lbCtxInit.font = '28px monospace';
      lbCtxInit.fillText('loading...', LEADERBOARD_CANVAS_W / 2, LEADERBOARD_CANVAS_H / 2);
    }

    const lbTexture = new THREE.CanvasTexture(lbCanvas);
    lbTexture.minFilter = THREE.NearestFilter;
    lbTexture.magFilter = THREE.NearestFilter;
    lbTexture.colorSpace = THREE.SRGBColorSpace;
    leaderboardTextureRef.current = lbTexture;

    // Billboard centered on Clawb's arrival axis for stream camera framing.
    // Clawb arrives at PATROL_POINTS[0] relative to room = (-2.6, FLOOR_Y, -1.4).
    // Billboard placed directly in front at Z-5.4 so camera (behind Clawb) sees it.
    const bbX = -2.6;
    const bbZ = -6.4;
    const boardW = 7.5;
    const boardH = 10.0;
    const bbY = boardH / 2 - 2.5;
    const boardMat = new THREE.MeshBasicMaterial({ map: lbTexture, side: THREE.DoubleSide });
    const boardMesh = new THREE.Mesh(new THREE.PlaneGeometry(boardW, boardH), boardMat);
    boardMesh.position.set(bbX, bbY, bbZ);
    lbGroup.add(boardMesh);

    // Neon frame around the billboard
    const frameBorder = 0.14;
    const neonColor = 0xff2266;
    const neonMat = new THREE.MeshBasicMaterial({ color: neonColor });
    const topBar = new THREE.Mesh(new THREE.BoxGeometry(boardW + frameBorder * 2, frameBorder, 0.08), neonMat);
    topBar.position.set(bbX, bbY + boardH / 2 + frameBorder / 2, bbZ + 0.02);
    lbGroup.add(topBar);
    const botBar = new THREE.Mesh(new THREE.BoxGeometry(boardW + frameBorder * 2, frameBorder, 0.08), neonMat);
    botBar.position.set(bbX, bbY - boardH / 2 - frameBorder / 2, bbZ + 0.02);
    lbGroup.add(botBar);
    const leftBar = new THREE.Mesh(new THREE.BoxGeometry(frameBorder, boardH + frameBorder * 2, 0.08), neonMat);
    leftBar.position.set(bbX - boardW / 2 - frameBorder / 2, bbY, bbZ + 0.02);
    lbGroup.add(leftBar);
    const rightBar = new THREE.Mesh(new THREE.BoxGeometry(frameBorder, boardH + frameBorder * 2, 0.08), neonMat);
    rightBar.position.set(bbX + boardW / 2 + frameBorder / 2, bbY, bbZ + 0.02);
    lbGroup.add(rightBar);

    // Neon glow lights flanking the billboard
    const neonGlow1 = new THREE.PointLight(0xff2266, 2.0, 10);
    neonGlow1.position.set(bbX - 4.5, 2.0, bbZ + 2);
    lbGroup.add(neonGlow1);
    const neonGlow2 = new THREE.PointLight(0x2266ff, 2.0, 10);
    neonGlow2.position.set(bbX + 4.5, 2.0, bbZ + 2);
    lbGroup.add(neonGlow2);
    const topGlow = new THREE.PointLight(0xffaa00, 1.2, 8);
    topGlow.position.set(bbX, boardH - 1.0, bbZ + 2);
    lbGroup.add(topGlow);

    // Decorative pillars (Vegas-style)
    const pillarMat = new THREE.MeshPhongMaterial({ color: 0x334466, emissive: 0x0a1020, flatShading: true });
    for (const xSide of [-1, 1]) {
      const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.24, boardH + 1.5, 6), pillarMat);
      pillar.position.set(bbX + xSide * (boardW / 2 + 0.5), bbY - 0.5, bbZ);
      lbGroup.add(pillar);
    }

    // Floor accent — glowing strip
    const stripMat = new THREE.MeshBasicMaterial({ color: 0xff2266, transparent: true, opacity: 0.4 });
    const strip = new THREE.Mesh(new THREE.PlaneGeometry(boardW + 2, 0.4), stripMat);
    strip.rotation.x = -Math.PI / 2;
    strip.position.set(bbX, FLOOR_Y + 0.01, bbZ + 2);
    lbGroup.add(strip);

    // Back wall behind billboard
    const lbWallMat = new THREE.MeshPhongMaterial({ color: 0x1a2a3a, emissive: 0x050a14, flatShading: true, side: THREE.DoubleSide });
    const lbBackWall = new THREE.Mesh(new THREE.PlaneGeometry(12, boardH + 3), lbWallMat);
    lbBackWall.position.set(bbX, bbY, bbZ - 0.3);
    lbGroup.add(lbBackWall);

    // Render leaderboard data onto the canvas
    const renderLeaderboardCanvas = (
      entries: Array<{ username: string; points: number; wins: number; points_breakdown?: Record<string, number> }>,
      displayNames: Record<string, string>,
      bounties: Array<{ title: string; description: string; status: string; prize?: { amount?: number; token?: string } }>,
    ) => {
      const ctx = lbCanvas.getContext('2d');
      if (!ctx) return;
      const W = LEADERBOARD_CANVAS_W;
      const H = LEADERBOARD_CANVAS_H;
      const now = Date.now();

      // Background — deep ocean gradient
      const bg = ctx.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, '#0a0e1a');
      bg.addColorStop(0.28, '#131f36');
      bg.addColorStop(1, '#060a12');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      // Retro starfield + scanline overlay for 90s arcade/PSX feel
      ctx.fillStyle = 'rgba(132, 188, 255, 0.55)';
      for (let i = 0; i < 70; i++) {
        const sx = ((i * 179) + Math.floor(now / 35)) % W;
        const sy = ((i * 263) + Math.floor(now / 60)) % Math.floor(H * 0.58);
        ctx.fillRect(sx, sy, 2, 2);
      }
      ctx.fillStyle = 'rgba(0,0,0,0.12)';
      for (let y = 0; y < H; y += 4) {
        ctx.fillRect(0, y, W, 2);
      }

      // Faux horizon grid
      const horizonY = Math.floor(H * 0.64);
      ctx.strokeStyle = 'rgba(46,140,255,0.18)';
      ctx.lineWidth = 1;
      for (let gy = horizonY; gy < H; gy += 24) {
        ctx.beginPath();
        ctx.moveTo(0, gy);
        ctx.lineTo(W, gy);
        ctx.stroke();
      }
      for (let gx = 0; gx < W; gx += 42) {
        const t = (gx - W / 2) / (W / 2);
        const topX = W / 2 + t * 80;
        ctx.beginPath();
        ctx.moveTo(topX, horizonY);
        ctx.lineTo(gx, H);
        ctx.stroke();
      }

      // Animated neon border pulse
      const pulse = 0.5 + 0.5 * Math.sin(now / 400);
      const borderAlpha = 0.4 + 0.6 * pulse;
      ctx.strokeStyle = `rgba(255,34,102,${borderAlpha.toFixed(2)})`;
      ctx.lineWidth = 6;
      ctx.strokeRect(8, 8, W - 16, H - 16);
      ctx.strokeStyle = `rgba(34,102,255,${(0.3 + 0.3 * pulse).toFixed(2)})`;
      ctx.lineWidth = 2;
      ctx.strokeRect(14, 14, W - 28, H - 28);

      // Title + arcade tape
      ctx.fillStyle = 'rgba(16,26,44,0.9)';
      ctx.fillRect(26, 20, W - 52, 96);
      ctx.fillStyle = '#ff2266';
      ctx.font = 'bold 52px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('LAWB LEADERBOARD', W / 2, 72);

      // Subtitle with glow
      ctx.fillStyle = `rgba(255,170,0,${(0.6 + 0.4 * pulse).toFixed(2)})`;
      ctx.font = '22px monospace';
      ctx.fillText('90s arcade standings // insert coin // reef mode', W / 2, 104);

      ctx.textAlign = 'left';
      ctx.fillStyle = '#73ffbf';
      ctx.font = 'bold 18px monospace';
      ctx.fillText('P1 READY', 40, 46);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#ff73e4';
      ctx.fillText('HI-SCORE', W - 40, 46);

      // Divider
      ctx.strokeStyle = '#ff226644';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(40, 120);
      ctx.lineTo(W - 40, 120);
      ctx.stroke();

      // Stream-readable layout: page through leaderboard + bounties
      const rowHeight = 92;
      const startY = 240;
      const rowsPerPage = 8;
      const activeBounties = bounties.filter((b) => b.status === 'active');
      const leaderboardPageCount = Math.max(1, Math.ceil(Math.max(1, entries.length) / rowsPerPage));
      const totalPages = leaderboardPageCount + 1; // final page is bounties
      const pageEveryMs = 8_000;
      const page = Math.floor(now / pageEveryMs) % totalPages;
      const showBounties = page === totalPages - 1;

      // Column headers
      ctx.textAlign = 'left';
      ctx.fillStyle = '#89a7c5';
      ctx.font = 'bold 30px monospace';
      if (!showBounties) {
        ctx.fillText('#', 46, 182);
        ctx.fillText('PLAYER', 128, 182);
        ctx.textAlign = 'right';
        ctx.fillText('PTS', W - 52, 182);
      } else {
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffaa00';
        ctx.font = 'bold 44px monospace';
        ctx.fillText('ACTIVE BOUNTIES', W / 2, 186);
      }

      // Divider under headers
      ctx.strokeStyle = '#334466';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(40, 198);
      ctx.lineTo(W - 40, 198);
      ctx.stroke();

      if (!showBounties) {
        const startIndex = page * rowsPerPage;
        const pageEntries = entries.slice(startIndex, startIndex + rowsPerPage);
        for (let i = 0; i < pageEntries.length; i++) {
          const e = pageEntries[i];
          const rank = startIndex + i + 1;
          const y = startY + i * rowHeight;

          if (rank === 1) ctx.fillStyle = 'rgba(255,215,0,0.10)';
          else if (rank === 2) ctx.fillStyle = 'rgba(192,192,192,0.08)';
          else if (rank === 3) ctx.fillStyle = 'rgba(205,127,50,0.08)';
          else ctx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0)';
          ctx.fillRect(36, y - 56, W - 72, rowHeight - 10);

          ctx.textAlign = 'left';
          const rankColors = ['#ffd700', '#c0c0c0', '#cd7f32'];
          ctx.fillStyle = rank <= 3 ? rankColors[rank - 1] : '#9cb2c8';
          ctx.font = rank <= 3 ? 'bold 42px monospace' : 'bold 34px monospace';
          ctx.fillText(`${rank}`, 48, y);

          const wallet = e.username || '';
          const name = displayNames[wallet.toLowerCase()] || (wallet.length > 14 ? `${wallet.slice(0, 6)}..${wallet.slice(-4)}` : wallet);
          ctx.fillStyle = '#e8f0ff';
          ctx.font = 'bold 34px monospace';
          ctx.fillText(name.slice(0, 16), 132, y);

          ctx.textAlign = 'right';
          ctx.fillStyle = rank <= 3 ? '#ff5a98' : '#f5a4c4';
          ctx.font = rank <= 3 ? 'bold 44px monospace' : 'bold 36px monospace';
          ctx.fillText(`${e.points || 0}`, W - 52, y);
        }

        if (entries.length === 0) {
          ctx.textAlign = 'center';
          ctx.fillStyle = '#8ca5bf';
          ctx.font = 'bold 40px monospace';
          ctx.fillText('NO PLAYERS YET', W / 2, startY + 40);
          ctx.font = '30px monospace';
          ctx.fillText('play chess or join retake.tv/clawb', W / 2, startY + 96);
        }
      } else {
        const bountyStartY = 280;
        if (activeBounties.length > 0) {
          activeBounties.slice(0, 6).forEach((b, i) => {
            const by = bountyStartY + i * 180;
            const bPulse = 0.5 + 0.5 * Math.sin((now + i * 500) / 600);
            ctx.fillStyle = `rgba(255,${Math.floor(120 + 80 * bPulse)},0,0.95)`;
            ctx.font = 'bold 34px monospace';
            ctx.textAlign = 'left';
            ctx.fillText(`• ${String(b.title || '').slice(0, 26)}`, 54, by);

            const prize = b.prize?.amount ? `${b.prize.amount.toLocaleString()} $${(b.prize.token || 'CLAWB').toUpperCase()}` : '';
            const sub = `${String(b.description || '').slice(0, 54)}${prize ? `  → ${prize}` : ''}`;
            ctx.fillStyle = '#a8bed2';
            ctx.font = '28px monospace';
            ctx.fillText(sub, 84, by + 50);
          });
        } else {
          ctx.textAlign = 'center';
          ctx.fillStyle = '#6f8497';
          ctx.font = 'bold 38px monospace';
          ctx.fillText('NO ACTIVE BOUNTIES', W / 2, bountyStartY + 40);
        }
      }

      // Footer + page indicator
      ctx.textAlign = 'center';
      ctx.fillStyle = '#7d93a8';
      ctx.font = 'bold 22px monospace';
      ctx.fillText(`PAGE ${page + 1}/${totalPages}  ·  rotates every ${pageEveryMs / 1000}s`, W / 2, H - 68);
      ctx.fillStyle = '#334455';
      ctx.font = '20px monospace';
      ctx.fillText('lawb.xyz/chess  ·  retake.tv/clawb  ·  !link <wallet> to earn', W / 2, H - 32);

      // Mark texture dirty
      lbTexture.needsUpdate = true;
    };

    // Fetch and render leaderboard data
    const refreshLeaderboard = () => {
      const fetchLeaderboard = fetch(FIREBASE_LEADERBOARD_URL)
        .then((r) => r.json())
        .then((data) => {
          if (!data) return [];
          return Object.values(data) as Array<{ username: string; points: number; wins: number; points_breakdown?: Record<string, number> }>;
        })
        .catch(() => [] as Array<{ username: string; points: number; wins: number }>);

      const fetchNames = fetch(`${FIREBASE_DB}/profiles.json?shallow=false`)
        .then((r) => r.json())
        .then((data) => {
          if (!data) return {};
          const names: Record<string, string> = {};
          for (const [wallet, profile] of Object.entries(data as Record<string, { username?: string }>)) {
            if (profile?.username) names[wallet.toLowerCase()] = profile.username;
          }
          return names;
        })
        .catch(() => ({}) as Record<string, string>);

      const fetchBounties = fetch(FIREBASE_BOUNTIES_URL)
        .then((r) => r.json())
        .then((data) => {
          if (!data) return [];
          return Object.values(data) as Array<{ title: string; description: string; status: string; prize?: { amount?: number; token?: string } }>;
        })
        .catch(() => [] as Array<{ title: string; description: string; status: string }>);

      Promise.all([fetchLeaderboard, fetchNames, fetchBounties]).then(([entries, names, bounties]) => {
        entries.sort((a, b) => (b.points || 0) - (a.points || 0));
        renderLeaderboardCanvas(entries, names, bounties);
        leaderboardRenderFnRef.current = () => renderLeaderboardCanvas(entries, names, bounties);
      });
    };

    refreshLeaderboard();
    const lbRefreshInterval = setInterval(refreshLeaderboard, LEADERBOARD_REFRESH_MS);

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

    // Gallery wall collision boxes (bedroom, relative to BEDROOM_OFFSET)
    const bx = BEDROOM_OFFSET.x;
    const bz = BEDROOM_OFFSET.z;
    collisionBoxesRef.current = [
      ...collisionBoxesRef.current,
      { minX: bx - 4, maxX: bx + 4, minZ: bz - 3.7, maxZ: bz - 3.3 },   // back wall
      { minX: bx - 4.2, maxX: bx - 3.8, minZ: bz - 3.5, maxZ: bz + 2.5 }, // left wall
      { minX: bx + 3.8, maxX: bx + 4.2, minZ: bz - 3.5, maxZ: bz + 2.5 }, // right wall
    ];

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
      clearInterval(lbRefreshInterval);
      unsubPlayers();
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('resize', handleResize);
      if (frameIdRef.current !== null) cancelAnimationFrame(frameIdRef.current);
      requestClawbModelRef.current = () => {};
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

      if (WORLD_MULTIPLAYER_ENABLED && address) {
        removeWorldPresence(address).catch(() => {
          // non-blocking
        });
      }
    };
  }, [address, createNftPlaceholderTexture, getGreeting, normalizeIpfsUrl, tryInspectNftInFront, animate, ensureRemotePlayer, isStreamMode]); // eslint-disable-line react-hooks/exhaustive-deps

  // Ensure stale sessions are removed if tab/browser disconnects.
  useEffect(() => {
    if (!WORLD_MULTIPLAYER_ENABLED || !address) return;
    registerWorldPresenceDisconnectCleanup(address).catch(() => {
      // non-blocking
    });
    return () => {
      removeWorldPresence(address).catch(() => {
        // non-blocking
      });
    };
  }, [address]);

  // Click to lock pointer OR click Clawb to chat (desktop)
  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isStreamMode) return;
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
  }, [isMobile, isStreamMode]);

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
    let initialSnapshotHandled = false;
    const ACTION_FRESHNESS_MS = 8_000;
    const unsub = listenToWorldActions((actions) => {
      if (!actions.length) return;
      const now = Date.now();
      for (const a of actions) {
        if (processedActionIdsRef.current.has(a.id)) continue;
        processedActionIdsRef.current.add(a.id);
        if (!initialSnapshotHandled) {
          // On first snapshot, only process actions from the last few seconds
          const age = now - (a.timestamp || 0);
          if (age > ACTION_FRESHNESS_MS) continue;
        }
        triggerWorldAction(a.action, a);
      }
      initialSnapshotHandled = true;
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
      const parsedAction = parseWorldActionFromText(msg);
      if (parsedAction) {
        if (parsedAction.startsWith('loop_')) {
          const loopAction = parsedAction.replace(/^loop_/, '');
          await enqueueWorldAction(loopAction, address || 'anonymous', 'world', {
            loop: true,
            command: `!loop ${loopAction}`,
          });
        } else {
          await enqueueWorldAction(parsedAction, address || 'anonymous', 'world');
        }
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
      {isStreamMode && <div className="clawb-world-crt-overlay" aria-hidden="true" />}

      {/* HUD */}
      {!isStreamMode && (
        <div className="clawb-world-hud">
          <div className="clawb-world-room-label">{currentRoom}</div>
          <div className="clawb-world-controls-hint">
            {!isLocked && !isMobile && (
              <div className="clawb-world-click-prompt">Click to look around · WASD move · Space/Shift swim · Press E to inspect NFT in front · Click Clawb or press E near him to chat</div>
            )}
          </div>
        </div>
      )}

      {/* Top-right buttons */}
      {!isStreamMode && (
        <div className="clawb-world-top-buttons">
          <button
            className="clawb-world-btn"
            onClick={() => navigate('/')}
            type="button"
          >
            Back to Desktop
          </button>
        </div>
      )}

      {/* Clawb greeting bubble */}
      {!isStreamMode && clawbGreeting && !showChatPanel && (
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
      {!isStreamMode && showChatPanel && (
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
              placeholder="Try !day, !night, !scene bedroom, !build coral..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              maxLength={300}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSendChat(); } }}
            />
            <button type="button" className="clawb-world-chat-send" onClick={handleSendChat}>Send</button>
          </div>
        </div>
      )}

      {/* Mobile joystick */}
      {!isStreamMode && isMobile && (
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

      {/* Global bottom navbar (includes now-playing music controls) */}
      {!isStreamMode && <LinuxNavBar />}
    </div>
  );
};

export default ClawbWorld;
