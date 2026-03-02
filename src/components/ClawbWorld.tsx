import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { useNavigate } from 'react-router-dom';
import { useAccount } from 'wagmi';
import {
  renderWorldState,
  setupUnderwaterFog,
  applyLOD,
  resolveCollision,
  generateCollisionBoxes,
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

// World modules
import {
  isLocalWorldOnly,
  LAZY_ROOM_LOADING,
  LOBBY_OFFSET,
  FIREBASE_GALLERY_URL,
  FIREBASE_LEADERBOARD_URL,
  FIREBASE_PROFILES_URL,
  FIREBASE_BOUNTIES_URL,
  LEADERBOARD_REFRESH_MS,
  LEADERBOARD_CANVAS_W,
  LEADERBOARD_CANVAS_H,
  MIN_Y,
  MAX_Y,
  ROOM_OFFSETS,
  BOUNTY_SHOWCASE_ANCHOR,
  ROOM_URLS,
  ROOM_FILES_FALLBACK,
  ROOM_LABELS,
  RESOLUTION_SCALE,
  PLAYER_HEIGHT,
  PLAYER_SPEED,
  PLAYER_ACCEL_DAMP,
  PLAYER_DECEL_DAMP,
  SWIM_VERTICAL_SPEED,
  WORLD_BOUNDS,
  CLAWB_COLLISION_RADIUS,
  PLAYER_COLLISION_RADIUS,
  GRAVITY_LERP_RATE,
  CLAWB_GREET_DISTANCE,
  CLAWB_SCALE,
  FLOOR_Y,
  NFT_INTERACT_DISTANCE,
  WORLD_ACTION_DURATION_MS,
  DIRECTIONAL_ACTION_DURATION_MS,
  LOOK_FOCUS_DURATION_MS,
  LEADERBOARD_AUTO_RETURN_MS,
  CLAWB_PATROL_SPEED,
  CLAWB_PATROL_PAUSE_MIN_MS,
  CLAWB_PATROL_PAUSE_MAX_MS,
  ROOM_TRANSITION_DURATION_MS,
  CLAWB_STEP_SPEED,
  CLAWB_SWIM_STEP_SPEED,
  CLAWB_COMMAND_ACCEL_DAMP,
  CLAWB_COMMAND_DECEL_DAMP,
  CLAWB_COMMAND_TURN_DAMP,
  CLAWB_HARD_STOP_THRESHOLD,
  STREAM_CAMERA_DEFAULT_DISTANCE,
  STREAM_CAMERA_MIN_DISTANCE,
  STREAM_CAMERA_MAX_DISTANCE,
  STREAM_CAMERA_ZOOM_STEP,
  STREAM_CAMERA_NEAR_FOV,
  STREAM_CAMERA_FAR_FOV,
  STREAM_CAMERA_NEAR_Y,
  STREAM_CAMERA_FAR_Y,
  STREAM_CAMERA_NEAR_Z_SCALE,
  STREAM_CAMERA_FAR_Z_SCALE,
  STREAM_CAMERA_POSITION_DAMP,
  STREAM_CAMERA_LOOK_DAMP,
  FIREBASE_DB,
  WORLD_MULTIPLAYER_ENABLED,
  PATROL_POINTS,
  ROOM_ACTION_TO_KEY,
  LOOPABLE_ACTIONS,
  DIRECTIONAL_ACTIONS,
  PRESENCE_WRITE_INTERVAL_MS,
  type ClawbModelKey,
} from '../world/WorldConfig';
import { createRoomContent, disposeRoomContent, type RoomContentRefs } from '../world/WorldRoomContent';
import { createWorldRenderer, resizeWorldRenderer } from '../world/WorldRenderer';
import { createEnvironment, updateEnvironment, type EnvironmentRefs } from '../world/WorldEnvironment';
import { smoothCameraPosition, smoothLookAt, updateStreamFollowCamera } from '../world/WorldCamera';
import { loadModel, prepareCharacterModel, loadClawbModelWithFallback, getPlayableClip, applyBlueTint, applyClawbGlow, pulseClawbGlow } from '../world/WorldCharacter';
import {
  loadLocalWorldFauna,
  updateLocalWorldFauna,
  disposeLocalWorldFauna,
  type LocalWorldFaunaRefs,
} from '../world/LocalWorldFauna';

interface NFTItem {
  chain?: string;
  contract?: string;
  tokenId?: string;
  name?: string;
  collection?: string;
  image_url?: string;
  description?: string;
}

type LeaderboardBounty = {
  title: string;
  description: string;
  status: string;
  prize?: {
    amount?: number;
    token?: string;
    token_id?: string | number;
    collection?: string;
    contract?: string;
    chain?: string;
  };
};

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
  const clawbPosRef = useRef(PATROL_POINTS[0].clone().add(LAZY_ROOM_LOADING ? LOBBY_OFFSET : ROOM_OFFSETS.main));
  const patrolAnchorRef = useRef((LAZY_ROOM_LOADING ? LOBBY_OFFSET : ROOM_OFFSETS.main).clone());
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
  const lightsRef = useRef<EnvironmentRefs['lights'] | null>(null);
  const composerRef = useRef<EffectComposer | null>(null);
  const envRef = useRef<EnvironmentRefs | null>(null);
  const localFaunaRef = useRef<LocalWorldFaunaRefs | null>(null);
  const elapsedRef = useRef(0);
  const collisionBoxesRef = useRef<CollisionBox[]>([]);

  // Movement keys state
  const keysRef = useRef<Record<string, boolean>>({});
  const velocityRef = useRef(new THREE.Vector3());
  const clawbCommandVelocityRef = useRef(new THREE.Vector3());

  // UI state
  const [isLocked, setIsLocked] = useState(false);
  const [currentRoom, setCurrentRoom] = useState(LAZY_ROOM_LOADING ? 'Lobby' : 'Main Reef');
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
  const leaderboardBountiesRef = useRef<LeaderboardBounty[]>([]);
  const bountyChestGroupRef = useRef<THREE.Group | null>(null);
  const bountyChestLidRef = useRef<THREE.Group | null>(null);
  const bountyScrollGroupRef = useRef<THREE.Group | null>(null);
  const bountyScrollRenderFnRef = useRef<(() => void) | null>(null);
  const bountyShowcaseRef = useRef<{ startedAt: number; until: number }>({ startedAt: 0, until: 0 });
  const leaderboardAutoReturnAtRef = useRef(0);
  const bountyShowcaseWasActiveRef = useRef(false);
  const bountyChestGlowRef = useRef<THREE.PointLight | null>(null);
  const bountyBubblePointsRef = useRef<THREE.Points | null>(null);
  const bountyBubbleVelRef = useRef<Float32Array | null>(null);
  const bountyBubbleMatRef = useRef<THREE.PointsMaterial | null>(null);
  const bountySparklePointsRef = useRef<THREE.Points | null>(null);
  const bountySparkleVelRef = useRef<Float32Array | null>(null);
  const bountySparkleMatRef = useRef<THREE.PointsMaterial | null>(null);
  const bountyGoldPointsRef = useRef<THREE.Points | null>(null);
  const bountyGoldVelRef = useRef<Float32Array | null>(null);
  const bountyGoldMatRef = useRef<THREE.PointsMaterial | null>(null);
  const bountyDisplayLastRenderAtRef = useRef(0);
  const bountyBurstStartedAtRef = useRef(0);
  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseRef = useRef(new THREE.Vector2());
  const processedActionIdsRef = useRef<Set<string>>(new Set());
  const worldActionRef = useRef<{ type: string; until: number }>({ type: 'patrol', until: 0 });
  const loopedActionRef = useRef<string | null>(null);
  const movementSourceRef = useRef<'room_transition' | 'explicit_command' | 'looped_command' | 'patrol'>('patrol');
  const lastAppliedActionRef = useRef<string>('patrol');
  const movementDiagnosticsRef = useRef({
    forcedVelocityResets: 0,
    hardStops: 0,
    malformedActionsDropped: 0,
    staleActionsDropped: 0,
    sourceSwitches: 0,
    lastLogAt: 0,
  });
  const lookTargetRef = useRef<{ until: number; focus: THREE.Vector3; camera: THREE.Vector3; clawbTarget: THREE.Vector3 } | null>(null);
  const streamCameraLookRef = useRef(new THREE.Vector3(0, FLOOR_Y + 0.75, 0));
  const streamCameraDistanceRef = useRef(STREAM_CAMERA_DEFAULT_DISTANCE);
  const streamCameraModeRef = useRef<'follow' | 'orbit' | 'wide' | 'cinematic'>('follow');
  const biomeModeRef = useRef<'day' | 'night' | 'storm' | 'abyss'>('day');
  const sunburstUntilRef = useRef(0);
  const baitUntilRef = useRef(0);
  const pulseUntilRef = useRef(0);
  const predatorFrenzyUntilRef = useRef(0);
  const sonarPulseUntilRef = useRef(0);
  const currentModeRef = useRef<'normal' | 'storm' | 'calm'>('normal');
  const clawbActionTRef = useRef(0);
  const remotePlayersRef = useRef<Map<string, THREE.Group>>(new Map());
  const remoteTargetsRef = useRef<Map<string, WorldPlayerPresence>>(new Map());
  const remoteMixersRef = useRef<Map<string, THREE.AnimationMixer>>(new Map());
  const lazyLoadedRoomRef = useRef<string | null>(null);
  const lazyRoomContentRef = useRef<RoomContentRefs | null>(null);
  const lazyRoomObjectsRef = useRef<THREE.Group | null>(null);
  const lazyLoadIdRef = useRef(0);
  const lazyRoomCollisionRef = useRef<CollisionBox[]>([]);
  const requestRoomWithLazyLoadRef = useRef<((roomKey: keyof typeof ROOM_OFFSETS) => void) | null>(null);
  const ensureGalleryBuiltRef = useRef<() => Promise<void>>(null);
  const ensureLeaderboardBuiltRef = useRef<() => void>(null);
  const galleryBuiltRef = useRef<{ built: boolean }>({ built: false });
  const leaderboardBuiltRef = useRef<{ built: boolean }>({ built: false });
  const lbRefreshIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const clawbModelKeyRef = useRef<ClawbModelKey>('idle');
  const clawbModelSwapStateRef = useRef<{ inFlight: boolean; pending: ClawbModelKey | null }>({
    inFlight: false,
    pending: null,
  });
  const lastModelRequestAtRef = useRef(0);
  const locomotionStateRef = useRef<'idle' | 'walk' | 'swim'>('idle');
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
      fallback.minFilter = THREE.LinearFilter;
      fallback.magFilter = THREE.LinearFilter;
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
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
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
    if (/(^|\s)!zoom\s*in\b/.test(t) || /(^|\s)!zoomin\b/.test(t)) return 'zoom_in';
    if (/(^|\s)!zoom\s*out\b/.test(t) || /(^|\s)!zoomout\b/.test(t)) return 'zoom_out';
    if (/^!zoom$/.test(t)) return 'zoom_in';
    if (/(^|\s)!cam(era)?\s+follow\b/.test(t)) return 'cam_follow';
    if (/(^|\s)!cam(era)?\s+orbit\b/.test(t)) return 'cam_orbit';
    if (/(^|\s)!cam(era)?\s+wide\b/.test(t)) return 'cam_wide';
    if (/(^|\s)!cam(era)?\s+cinematic\b/.test(t) || /(^|\s)!cinema\b/.test(t)) return 'cam_cinematic';
    if (/(^|\s)!bounty\b/.test(t) || /(^|\s)!bounties\b/.test(t)) return 'bounty_showcase';
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
    if (/(^|\s)!storm\b/.test(t)) return 'storm';
    if (/(^|\s)!abyss\b/.test(t)) return 'abyss';
    if (/(^|\s)!current\s+storm\b/.test(t) || /(^|\s)!stormcurrent\b/.test(t)) return 'current_storm';
    if (/(^|\s)!current\s+calm\b/.test(t) || /(^|\s)!current\s+smooth\b/.test(t) || /(^|\s)!calmcurrent\b/.test(t)) return 'current_calm';
    if (/(^|\s)!current\s+normal\b/.test(t) || /(^|\s)!current\s+reset\b/.test(t)) return 'current_normal';
    if (/(^|\s)!sunburst\b/.test(t)) return 'sunburst';
    if (/(^|\s)!bait\b/.test(t)) return 'bait';
    if (/(^|\s)!pulse\b/.test(t)) return 'pulse';
    if (/(^|\s)!frenzy\b/.test(t) || /(^|\s)!predator(s)?\b/.test(t)) return 'predator_frenzy';
    if (/(^|\s)!sonar\b/.test(t)) return 'sonar_ping';
    if (/(^|\s)!titan\b/.test(t) || /(^|\s)!sub(mersible)?\b/.test(t)) return 'titan_ping';
    if (/(^|\s)!focus\s+bounties\b/.test(t)) return 'focus_bounties';
    if (/(^|\s)!focus\s+leaderboard\b/.test(t)) return 'focus_leaderboard';
    if (/(^|\s)!focus\s+nfts\b/.test(t)) return 'focus_nfts';
    if (/(^|\s)!focus\s+rooms\b/.test(t)) return 'focus_rooms';
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

  const goToRoom = useCallback((roomKey: keyof typeof ROOM_OFFSETS) => {
    if (LAZY_ROOM_LOADING && requestRoomWithLazyLoadRef.current) {
      requestRoomWithLazyLoadRef.current(roomKey);
    } else {
      queueRoomTransition(roomKey);
    }
  }, [queueRoomTransition]);

  const resetClawbCommandVelocity = useCallback((reason: string) => {
    const v = clawbCommandVelocityRef.current;
    if (Math.abs(v.x) > 0.0001 || Math.abs(v.z) > 0.0001) {
      movementDiagnosticsRef.current.forcedVelocityResets += 1;
      if (Date.now() - movementDiagnosticsRef.current.lastLogAt > 7000) {
        movementDiagnosticsRef.current.lastLogAt = Date.now();
        console.log(`[ClawbWorld] velocity reset (${reason})`, {
          vx: Number(v.x.toFixed(3)),
          vz: Number(v.z.toFixed(3)),
        });
      }
    }
    v.set(0, 0, 0);
  }, []);

  const setWorldAction = useCallback((nextType: string, until: number, reason: string) => {
    const prevType = worldActionRef.current.type;
    if (prevType !== nextType) {
      const prevDirectional = DIRECTIONAL_ACTIONS.has(prevType);
      const nextDirectional = DIRECTIONAL_ACTIONS.has(nextType);
      if (prevDirectional && !nextDirectional) {
        resetClawbCommandVelocity(`action-switch:${prevType}->${nextType}:${reason}`);
      }
    }
    worldActionRef.current = { type: nextType, until };
  }, [resetClawbCommandVelocity]);

  const applyBiomePreset = useCallback((mode: 'day' | 'night' | 'storm' | 'abyss') => {
    const scene = sceneRef.current;
    const lights = lightsRef.current;
    if (!scene || !lights) return;
    biomeModeRef.current = mode;

    if (mode === 'day') {
      setupUnderwaterFog(scene, false);
      lights.ambient.color.set('#cceeff');
      lights.ambient.intensity = 1.2;
      lights.directional.color.set('#fffff0');
      lights.directional.intensity = 3.5;
      lights.hemisphere?.color.set(0xaaddff);
      lights.hemisphere?.groundColor.set(0x88bbcc);
      if (lights.hemisphere) lights.hemisphere.intensity = 1.5;
      lights.fillLight?.color.set('#ddeeff');
      if (lights.fillLight) lights.fillLight.intensity = 1.2;
      if (rendererRef.current) rendererRef.current.toneMappingExposure = 2.2;
      if (envRef.current && currentModeRef.current === 'normal') envRef.current.currentBoost = 1.0;
      if (envRef.current) envRef.current.bioluminescenceBoost = 0.45;
      return;
    }

    if (mode === 'night') {
      setupUnderwaterFog(scene, true);
      lights.ambient.color.set('#1a2a44');
      lights.ambient.intensity = 0.25;
      lights.directional.color.set('#6699cc');
      lights.directional.intensity = 0.8;
      lights.hemisphere?.color.set(0x1a3050);
      lights.hemisphere?.groundColor.set(0x0a1020);
      if (lights.hemisphere) lights.hemisphere.intensity = 0.5;
      lights.fillLight?.color.set('#224466');
      if (lights.fillLight) lights.fillLight.intensity = 0.2;
      if (rendererRef.current) rendererRef.current.toneMappingExposure = 1.1;
      if (envRef.current && currentModeRef.current === 'normal') envRef.current.currentBoost = 0.85;
      if (envRef.current) envRef.current.bioluminescenceBoost = 1.4;
      return;
    }

    if (mode === 'storm') {
      scene.fog = new THREE.Fog('#0b1b2e', 3, 30);
      scene.background = new THREE.Color('#0b1b2e');
      lights.ambient.color.set('#20314f');
      lights.ambient.intensity = 0.32;
      lights.directional.color.set('#9bc8ff');
      lights.directional.intensity = 1.7;
      lights.hemisphere?.color.set(0x2a4262);
      lights.hemisphere?.groundColor.set(0x081021);
      if (lights.hemisphere) lights.hemisphere.intensity = 0.6;
      lights.fillLight?.color.set('#3d6e9f');
      if (lights.fillLight) lights.fillLight.intensity = 0.45;
      if (rendererRef.current) rendererRef.current.toneMappingExposure = 1.45;
      if (envRef.current && currentModeRef.current === 'normal') envRef.current.currentBoost = 1.9;
      if (envRef.current) envRef.current.bioluminescenceBoost = 1.15;
      return;
    }

    // abyss
    scene.fog = new THREE.Fog('#030712', 2, 20);
    scene.background = new THREE.Color('#030712');
    lights.ambient.color.set('#0e1732');
    lights.ambient.intensity = 0.18;
    lights.directional.color.set('#335088');
    lights.directional.intensity = 0.48;
    lights.hemisphere?.color.set(0x11264a);
    lights.hemisphere?.groundColor.set(0x02060f);
    if (lights.hemisphere) lights.hemisphere.intensity = 0.35;
    lights.fillLight?.color.set('#122a55');
    if (lights.fillLight) lights.fillLight.intensity = 0.12;
    if (rendererRef.current) rendererRef.current.toneMappingExposure = 0.95;
    if (envRef.current && currentModeRef.current === 'normal') envRef.current.currentBoost = 1.35;
    if (envRef.current) envRef.current.bioluminescenceBoost = 1.9;
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
    const source = String(payload?.source || '').toLowerCase();
    const moveActions = new Set([
      'walk', 'swim', 'left', 'right', 'forward', 'back',
      'swim_left', 'swim_right', 'swim_forward', 'swim_back',
      'jump', 'flip', 'spin', 'dance', 'wave', 'hi', 'idle',
    ]);
    const activeType = worldActionRef.current.type;
    const activeUntil = worldActionRef.current.until;
    const protectedActive =
      activeType !== 'patrol' &&
      activeType !== 'look_swim' &&
      Number.isFinite(activeUntil) &&
      Date.now() < activeUntil;
    // Prevent rapid remote move-command overrides that make Clawb jitter.
    if (source === 'retake' && !loopRequested && moveActions.has(action) && protectedActive) {
      return;
    }
    if (action !== 'room_leaderboard') {
      leaderboardAutoReturnAtRef.current = 0;
    }
    const scene = sceneRef.current;
    const lights = lightsRef.current;
    if (scene && lights && (action === 'day' || action === 'night' || action === 'storm' || action === 'abyss')) {
      loopedActionRef.current = null;
      applyBiomePreset(action as 'day' | 'night' | 'storm' | 'abyss');
      setWorldAction('patrol', 0, 'day-night-toggle');
      return;
    }
    if (action === 'current_storm') {
      currentModeRef.current = 'storm';
      if (envRef.current) envRef.current.currentBoost = 2.4;
      return;
    }
    if (action === 'current_calm') {
      currentModeRef.current = 'calm';
      if (envRef.current) envRef.current.currentBoost = 0.55;
      return;
    }
    if (action === 'current_normal') {
      currentModeRef.current = 'normal';
      if (envRef.current) {
        const biome = biomeModeRef.current;
        envRef.current.currentBoost =
          biome === 'day' ? 1.0 : biome === 'night' ? 0.85 : biome === 'storm' ? 1.9 : 1.35;
      }
      return;
    }
    if (action === 'sunburst') {
      sunburstUntilRef.current = Date.now() + 9000;
      return;
    }
    if (action === 'bait') {
      baitUntilRef.current = Date.now() + 9000;
      return;
    }
    if (action === 'pulse') {
      pulseUntilRef.current = Date.now() + 9000;
      return;
    }
    if (action === 'predator_frenzy') {
      predatorFrenzyUntilRef.current = Date.now() + 12000;
      if (envRef.current) {
        envRef.current.predatorFrenzyBoost = Math.max(envRef.current.predatorFrenzyBoost, 1.7);
      }
      return;
    }
    if (action === 'sonar_ping') {
      sonarPulseUntilRef.current = Date.now() + 14000;
      if (envRef.current) {
        envRef.current.sonarPulseBoost = Math.max(envRef.current.sonarPulseBoost, 2.2);
        envRef.current.predatorFrenzyBoost = Math.max(envRef.current.predatorFrenzyBoost, 0.45);
      }
      return;
    }
    if (action === 'titan_ping') {
      sonarPulseUntilRef.current = Date.now() + 12000;
      if (envRef.current) {
        envRef.current.sonarPulseBoost = Math.max(envRef.current.sonarPulseBoost, 1.8);
        envRef.current.predatorFrenzyBoost = Math.max(envRef.current.predatorFrenzyBoost, 0.6);
        if (envRef.current.titanSubmersible) {
          envRef.current.titanSubmersible.userData.commandPulseUntil = Date.now() + 14000;
        }
      }
      return;
    }
    const roomKey = ROOM_ACTION_TO_KEY[action];
    if (roomKey) {
      const manualRoomRequest = source !== 'autonomy' && source !== 'idle_behavior';
      if (roomKey === 'leaderboard' && !manualRoomRequest) return;
      loopedActionRef.current = null;
      requestClawbModelRef.current('walk');
      if (LAZY_ROOM_LOADING && requestRoomWithLazyLoadRef.current) {
        requestRoomWithLazyLoadRef.current(roomKey);
      } else {
        queueRoomTransition(roomKey);
      }
      leaderboardAutoReturnAtRef.current =
        roomKey === 'leaderboard' ? Date.now() + LEADERBOARD_AUTO_RETURN_MS : 0;
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
    if (action === 'cam_follow' || action === 'cam_orbit' || action === 'cam_wide' || action === 'cam_cinematic') {
      const nextMode =
        action === 'cam_follow'
          ? 'follow'
          : action === 'cam_orbit'
            ? 'orbit'
            : action === 'cam_wide'
              ? 'wide'
              : 'cinematic';
      streamCameraModeRef.current = nextMode;
      return;
    }
    if (action === 'bounty_showcase') {
      loopedActionRef.current = null;
      requestClawbModelRef.current('swim');
      const now = Date.now();
      bountyShowcaseRef.current = { startedAt: now, until: now + 18_000 };
      bountyBurstStartedAtRef.current = now;
      setWorldAction('bounty_showcase', now + 18_000, 'bounty-showcase');
      return;
    }
    if (action === 'focus_bounties') {
      const now = Date.now();
      loopedActionRef.current = null;
      requestClawbModelRef.current('swim');
      bountyShowcaseRef.current = { startedAt: now, until: now + 18_000 };
      bountyBurstStartedAtRef.current = now;
      setWorldAction('bounty_showcase', now + 18_000, 'focus-bounties');
      return;
    }
    if (action === 'focus_leaderboard') {
      loopedActionRef.current = null;
      requestClawbModelRef.current('walk');
      queueRoomTransition('leaderboard');
      leaderboardAutoReturnAtRef.current = Date.now() + LEADERBOARD_AUTO_RETURN_MS;
      return;
    }
    if (action === 'focus_nfts') {
      loopedActionRef.current = null;
      requestClawbModelRef.current('walk');
      const targets = [...galleryNftTargetsRef.current].sort((a, b) => a.index - b.index);
      if (targets.length) {
        const target = targets[0];
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
        setWorldAction('look_swim', now + LOOK_FOCUS_DURATION_MS, 'focus-nfts');
      } else {
        queueRoomTransition('bedroom');
      }
      return;
    }
    if (action === 'focus_rooms') {
      loopedActionRef.current = null;
      requestClawbModelRef.current('walk');
      queueRoomTransition('main');
      setWorldAction('swim', Date.now() + ROOM_TRANSITION_DURATION_MS, 'focus-rooms');
      return;
    }
    if (action === 'idle') {
      requestClawbModelRef.current('idle');
      if (loopRequested) {
        loopedActionRef.current = 'idle';
        setWorldAction('idle', Number.POSITIVE_INFINITY, 'loop-idle');
      } else {
        loopedActionRef.current = null;
        setWorldAction('patrol', 0, 'idle-exit');
      }
      clawbActionTRef.current = 0;
      return;
    }
    if (action === 'walk') {
      requestClawbModelRef.current('walk');
      if (loopRequested) {
        loopedActionRef.current = 'walk';
        setWorldAction('walk', Number.POSITIVE_INFINITY, 'loop-walk');
      } else {
        loopedActionRef.current = null;
        setWorldAction('walk', Date.now() + DIRECTIONAL_ACTION_DURATION_MS, 'walk-command');
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
          setWorldAction('look_swim', now + LOOK_FOCUS_DURATION_MS, 'look-nft');
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
      setWorldAction(action, Number.POSITIVE_INFINITY, 'loop-action');
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
      setWorldAction(
        action,
        Date.now() + (isDirectional ? DIRECTIONAL_ACTION_DURATION_MS : WORLD_ACTION_DURATION_MS),
        'timed-action'
      );
    }
    clawbActionTRef.current = 0;
  }, [applyBiomePreset, queueRoomTransition, setWorldAction]);

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

    let model: THREE.Group;
    try {
      model = await loadModel('/models/clawb_walk.glb');
    } catch {
      model = await loadModel('/assets/lawbWalk.fbx');
    }
    model.scale.setScalar(CLAWB_SCALE);
    model.position.set(0, FLOOR_Y, 0);
    model.traverse((child: THREE.Object3D) => {
      if ((child as THREE.Mesh).isMesh) {
        (child as THREE.Mesh).castShadow = true;
        (child as THREE.Mesh).receiveShadow = true;
      }
    });
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
    const roomName =
      LAZY_ROOM_LOADING && !lazyLoadedRoomRef.current && !roomTransitionRef.current.active
        ? 'Lobby'
        : getRoomName(camera.position);
    setCurrentRoom(roomName);
    localRoomRef.current = roomName;
    if (
      roomName === 'Leaderboard' &&
      leaderboardAutoReturnAtRef.current > 0 &&
      Date.now() >= leaderboardAutoReturnAtRef.current &&
      !roomTransitionRef.current.active
    ) {
      leaderboardAutoReturnAtRef.current = 0;
      goToRoom('main');
      setWorldAction('swim', Date.now() + ROOM_TRANSITION_DURATION_MS, 'leaderboard-auto-return');
    }

    // Animate environment (bubbles, caustics, god rays, dust, sky, water, kelp, fish, jellyfish, fog)
    elapsedRef.current += delta;
    const scene = sceneRef.current;
    if (envRef.current) {
      updateEnvironment(envRef.current, scene, camera, elapsedRef.current, delta);
    }
    updateLocalWorldFauna(
      localFaunaRef.current,
      elapsedRef.current,
      delta,
      camera.position,
      envRef.current?.currentVector,
      envRef.current?.currentStrength ?? 0,
    );
    // Keep selected biome visual mode persistent; environment update blends fog by camera.
    applyBiomePreset(biomeModeRef.current);

    const nowFx = Date.now();
    const sunburstActive = nowFx < sunburstUntilRef.current;
    const baitActive = nowFx < baitUntilRef.current;
    const pulseActive = nowFx < pulseUntilRef.current;
    const frenzyActive = nowFx < predatorFrenzyUntilRef.current;
    const sonarActive = nowFx < sonarPulseUntilRef.current;

    if (frenzyActive && envRef.current) {
      envRef.current.predatorFrenzyBoost = Math.max(envRef.current.predatorFrenzyBoost, 1.65);
    }
    if (sonarActive && envRef.current) {
      envRef.current.sonarPulseBoost = Math.max(envRef.current.sonarPulseBoost, 1.25);
    }

    if (envRef.current?.godRays) {
      const raysScale = sunburstActive
        ? 1 + 0.12 * Math.sin(elapsedRef.current * 8)
        : 1;
      envRef.current.godRays.scale.set(raysScale, raysScale, raysScale);
    }

    if (clawbRef.current) {
      if (pulseActive) {
        const pulse = 1 + 0.05 * Math.sin(elapsedRef.current * 12);
        clawbRef.current.scale.setScalar(CLAWB_SCALE * pulse);
      } else {
        clawbRef.current.scale.setScalar(CLAWB_SCALE);
      }
    }

    if (baitActive && envRef.current?.fishSchools?.length && clawbRef.current) {
      const targetCenter = clawbRef.current.position;
      const schools = envRef.current.fishSchools;
      schools.forEach((school, idx) => {
        const a = elapsedRef.current * 0.9 + idx * 1.6;
        const ring = 1.8 + idx * 0.35;
        const target = new THREE.Vector3(
          targetCenter.x + Math.cos(a) * ring,
          FLOOR_Y + 0.8 + (idx % 3) * 0.3,
          targetCenter.z + Math.sin(a) * ring,
        );
        const species = String(school.userData?.species || '');
          const lerpRate = species === 'predator' ? (frenzyActive ? 2.1 : 1.15) : (frenzyActive ? 3.2 : 2.4);
        school.position.lerp(target, Math.min(1, delta * lerpRate));
      });

      // Predator schools occasionally break formation and chase nearest prey school.
      const predators = schools.filter((s) => String(s.userData?.species || '') === 'predator');
      const prey = schools.filter((s) => String(s.userData?.species || '') !== 'predator');
      predators.forEach((pred) => {
        let nearest: THREE.Group | null = null;
        let best = Number.POSITIVE_INFINITY;
        prey.forEach((candidate) => {
          const d = pred.position.distanceToSquared(candidate.position);
          if (d < best) {
            best = d;
            nearest = candidate;
          }
        });
        if (nearest) {
          const chaseTarget = (nearest as THREE.Group).position.clone().add(new THREE.Vector3(0, 0.2, 0));
          pred.position.lerp(chaseTarget, Math.min(1, delta * 0.9));
          // Prey recoils to create visible hunt/survival moments.
          const away = (nearest as THREE.Group).position.clone().sub(pred.position);
          if (away.lengthSq() > 0.0001) {
            const flee = away.normalize().multiplyScalar(delta * 1.8);
            (nearest as THREE.Group).position.add(flee);
          }
        }
      });
    }

    if (clawbRef.current) {
      pulseClawbGlow(clawbRef.current, elapsedRef.current);
    }

    // LOD — fade distant world objects
    scene.children.forEach((child) => {
      if (child instanceof THREE.Group && child.name !== 'god_rays' && child.name !== 'kelp_field' && child.name !== 'jellyfish') {
        child.children.forEach((obj) => {
          if (obj.userData?.type) applyLOD(obj, camera.position);
        });
      }
    });

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
      !isLocalWorldOnly() &&
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
      const prevX = clawbRef.current.position.x;
      const prevZ = clawbRef.current.position.z;
      const now = Date.now();
      const explicitActive = now < worldActionRef.current.until && worldActionRef.current.type !== 'patrol';
      const loopActive = Boolean(loopedActionRef.current);
      const movementSource: 'room_transition' | 'explicit_command' | 'looped_command' | 'patrol' =
        roomTransitionRef.current.active
          ? 'room_transition'
          : explicitActive
            ? 'explicit_command'
            : loopActive
              ? 'looped_command'
              : 'patrol';
      if (movementSourceRef.current !== movementSource) {
        movementDiagnosticsRef.current.sourceSwitches += 1;
        movementSourceRef.current = movementSource;
      }
      const activeAction =
        movementSource === 'room_transition'
          ? 'swim'
          : movementSource === 'explicit_command'
            ? worldActionRef.current.type
            : movementSource === 'looped_command'
              ? (loopedActionRef.current as string)
              : 'patrol';
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
        if (now >= clawbPatrolPauseUntilRef.current) {
          const target = getPatrolTarget(clawbPatrolPointIdxRef.current);
          const toTarget = new THREE.Vector3().subVectors(target, clawbPosRef.current);
          const dist = toTarget.length();
          if (dist < 0.18) {
            clawbPatrolPointIdxRef.current = (clawbPatrolPointIdxRef.current + 1) % PATROL_POINTS.length;
            const pauseMs =
              CLAWB_PATROL_PAUSE_MIN_MS +
              Math.random() * (CLAWB_PATROL_PAUSE_MAX_MS - CLAWB_PATROL_PAUSE_MIN_MS);
            clawbPatrolPauseUntilRef.current = now + pauseMs;
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
        const isPaused = Date.now() < clawbPatrolPauseUntilRef.current;
        clawbRef.current.position.y = isPaused
          ? FLOOR_Y + Math.abs(Math.sin(t * 3.2)) * 0.08
          : FLOOR_Y;
        if (isPaused) {
          const nextTarget = getPatrolTarget(clawbPatrolPointIdxRef.current);
          const toNext = new THREE.Vector3().subVectors(nextTarget, clawbPosRef.current);
          if (toNext.length() > 0.01) {
            const targetYaw = Math.atan2(toNext.x, toNext.z);
            clawbRef.current.rotation.y = THREE.MathUtils.damp(
              clawbRef.current.rotation.y,
              targetYaw,
              4,
              delta
            );
          }
        }
        clawbRef.current.rotation.x = THREE.MathUtils.lerp(clawbRef.current.rotation.x, 0, 0.14);
        clawbRef.current.rotation.z = THREE.MathUtils.lerp(clawbRef.current.rotation.z, 0, 0.14);
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
        let forceSwimVisual = roomTransitionRef.current.active;
        const commandVelocity = clawbCommandVelocityRef.current;
        if (activeAction === 'look_swim') {
          forceSwimVisual = true;
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

        // If movement speed is high, force swim animation so we never get standing/glide visuals.
        const horizontalSpeed = Math.hypot(commandVelocity.x, commandVelocity.z);
        const fastTraveling = horizontalSpeed > CLAWB_STEP_SPEED * 0.9;
        if (fastTraveling) {
          forceSwimVisual = true;
        }
        if (swimMode || forceSwimVisual) swimMode = true;

        if (
          movementSource === 'patrol' &&
          Math.abs(commandVelocity.x) + Math.abs(commandVelocity.z) < CLAWB_HARD_STOP_THRESHOLD
        ) {
          if (Math.abs(commandVelocity.x) > 0.0001 || Math.abs(commandVelocity.z) > 0.0001) {
            movementDiagnosticsRef.current.hardStops += 1;
          }
          commandVelocity.set(0, 0, 0);
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
      const frameSpeed = delta > 0
        ? Math.hypot(clawbRef.current.position.x - prevX, clawbRef.current.position.z - prevZ) / delta
        : 0;
      const emoteModelByAction: Partial<Record<string, ClawbModelKey>> = {
        die: 'die',
        dance: 'dance',
        flip: 'flip',
        hi: 'hi',
        wave: 'hi',
        jump: 'hi',
        spin: 'dance',
      };
      const emoteModel = emoteModelByAction[activeAction];
      if (emoteModel) {
        requestClawbModelRef.current(emoteModel);
      } else {
        const enterWalk = 0.14;
        const enterSwim = CLAWB_SWIM_STEP_SPEED * 0.82;
        const exitSwim = CLAWB_SWIM_STEP_SPEED * 0.62;
        const exitWalk = 0.08;
        const cur = locomotionStateRef.current;
        let next = cur;
        if (isSwimAction || frameSpeed >= enterSwim) next = 'swim';
        else if (cur === 'swim' && frameSpeed > exitSwim) next = 'swim';
        else if (frameSpeed >= enterWalk) next = 'walk';
        else if (cur === 'walk' && frameSpeed > exitWalk) next = 'walk';
        else next = 'idle';
        locomotionStateRef.current = next;
        requestClawbModelRef.current(next);
      }
      if (isStreamMode && activeAction !== 'die' && !isSwimAction && !roomTransitionRef.current.active) {
        clawbRef.current.position.y = FLOOR_Y;
      }

      if (lastAppliedActionRef.current !== activeAction) {
        const prev = lastAppliedActionRef.current;
        if (DIRECTIONAL_ACTIONS.has(prev) && !DIRECTIONAL_ACTIONS.has(activeAction)) {
          resetClawbCommandVelocity(`active-action-switch:${prev}->${activeAction}`);
        }
        lastAppliedActionRef.current = activeAction;
      }

      if (Date.now() - movementDiagnosticsRef.current.lastLogAt > 15000) {
        movementDiagnosticsRef.current.lastLogAt = Date.now();
        console.log('[ClawbWorld] motor diagnostics', {
          source: movementSourceRef.current,
          forcedVelocityResets: movementDiagnosticsRef.current.forcedVelocityResets,
          hardStops: movementDiagnosticsRef.current.hardStops,
          sourceSwitches: movementDiagnosticsRef.current.sourceSwitches,
          malformedActionsDropped: movementDiagnosticsRef.current.malformedActionsDropped,
          staleActionsDropped: movementDiagnosticsRef.current.staleActionsDropped,
        });
      }

      // Proximity greeting
      const dist = camera.position.distanceTo(clawbRef.current.position);
      if (dist < CLAWB_GREET_DISTANCE) {
        setClawbGreeting(getGreeting());
      } else {
        setClawbGreeting(null);
      }

      // Face camera behavior:
      // - Stream mode: face camera when idle (from command) or doing non-swim actions, but NOT during patrol
      //   (patrol pause was causing a rigid swim→stare→swim loop that looked bad).
      // - Non-stream mode: only face player while mostly stationary in patrol.
      const shouldFaceCamera = isStreamMode
        ? activeAction !== 'die' &&
          activeAction !== 'patrol' &&
          !isSwimAction &&
          !DIRECTIONAL_ACTIONS.has(activeAction) &&
          !roomTransitionRef.current.active
        : activeAction === 'patrol' && frameSpeed < 0.05;
      if (shouldFaceCamera) {
        const dx = camera.position.x - clawbRef.current.position.x;
        const targetYaw = Math.atan2(dx, 1);
        clawbRef.current.rotation.y = THREE.MathUtils.damp(clawbRef.current.rotation.y, targetYaw, 6, delta);
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
      const now = Date.now();
      const showcaseActive = now < bountyShowcaseRef.current.until;
      const lookTarget = lookTargetRef.current;
      if (showcaseActive && bountyScrollGroupRef.current) {
        // Drone shot: strict overhead camera for readable, always-visible bounty board.
        const boardPos = bountyScrollGroupRef.current.getWorldPosition(new THREE.Vector3());
        const camDesired = boardPos.clone().add(new THREE.Vector3(0, 11.6, 0.04));
        const lookAt = boardPos.clone().add(new THREE.Vector3(0, -0.5, 0));
        camera.position.x = THREE.MathUtils.damp(camera.position.x, camDesired.x, 2.8, delta);
        camera.position.y = THREE.MathUtils.damp(camera.position.y, camDesired.y, 2.8, delta);
        camera.position.z = THREE.MathUtils.damp(camera.position.z, camDesired.z, 2.8, delta);
        streamCameraLookRef.current.x = THREE.MathUtils.damp(streamCameraLookRef.current.x, lookAt.x, 3.0, delta);
        streamCameraLookRef.current.y = THREE.MathUtils.damp(streamCameraLookRef.current.y, lookAt.y, 3.0, delta);
        streamCameraLookRef.current.z = THREE.MathUtils.damp(streamCameraLookRef.current.z, lookAt.z, 3.0, delta);
        camera.lookAt(streamCameraLookRef.current.x, streamCameraLookRef.current.y, streamCameraLookRef.current.z);
        const fov = THREE.MathUtils.lerp(camera.fov, 50, 0.12);
        if (Math.abs(fov - camera.fov) > 0.01) {
          camera.fov = fov;
          camera.updateProjectionMatrix();
        }
      } else if (lookTarget && now < lookTarget.until) {
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
        const bbCenter = new THREE.Vector3(lbOff.x - 2.6, lbOff.y + 1.9, lbOff.z - 6.4);
        // Camera sits in front of the board with a slight top-down tilt.
        const camDesired = new THREE.Vector3(lbOff.x - 2.6, lbOff.y + 5.2, lbOff.z + 5.2);
        smoothCameraPosition(camDesired);
        smoothLookAt(bbCenter);
        const fov = THREE.MathUtils.lerp(camera.fov, 34, 0.1);
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
        const camMode = streamCameraModeRef.current;
        const zoomT = THREE.MathUtils.clamp(
          (streamCameraDistanceRef.current - STREAM_CAMERA_MIN_DISTANCE) /
            Math.max(0.001, STREAM_CAMERA_MAX_DISTANCE - STREAM_CAMERA_MIN_DISTANCE),
          0,
          1
        );
        let desired: THREE.Vector3;
        let lookFocus = focus.clone().add(new THREE.Vector3(0, 0.72, 0));
        let targetFov = THREE.MathUtils.lerp(STREAM_CAMERA_NEAR_FOV, STREAM_CAMERA_FAR_FOV, zoomT);
        const yOffset = THREE.MathUtils.lerp(STREAM_CAMERA_NEAR_Y, STREAM_CAMERA_FAR_Y, zoomT);
        const zScale = THREE.MathUtils.lerp(STREAM_CAMERA_NEAR_Z_SCALE, STREAM_CAMERA_FAR_Z_SCALE, zoomT);
        const zOffset = streamCameraDistanceRef.current * zScale;

        if (camMode === 'orbit') {
          const a = elapsedRef.current * 0.22;
          const r = streamCameraDistanceRef.current * 0.95;
          desired = focus.clone().add(new THREE.Vector3(Math.cos(a) * r * 0.55, yOffset + 0.45, Math.sin(a) * r * 0.55));
          lookFocus = focus.clone().add(new THREE.Vector3(0, 0.9, 0));
          targetFov = THREE.MathUtils.lerp(52, 64, zoomT);
        } else if (camMode === 'wide') {
          desired = focus.clone().add(new THREE.Vector3(0, yOffset + 1.2, zOffset + 2.8));
          lookFocus = focus.clone().add(new THREE.Vector3(0, 0.65, 0));
          targetFov = THREE.MathUtils.lerp(62, 72, zoomT);
        } else if (camMode === 'cinematic') {
          const sway = Math.sin(elapsedRef.current * 0.6) * 1.45;
          const dolly = Math.cos(elapsedRef.current * 0.33) * 1.2;
          desired = focus.clone().add(new THREE.Vector3(sway, yOffset + 0.35, zOffset + dolly));
          lookFocus = focus.clone().add(new THREE.Vector3(Math.sin(elapsedRef.current * 0.4) * 0.45, 0.78, 0));
          targetFov = THREE.MathUtils.lerp(50, 60, zoomT);
        } else {
          desired = focus.clone().add(new THREE.Vector3(0, yOffset, zOffset));
        }

        smoothCameraPosition(desired);
        smoothLookAt(lookFocus);
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

    // Treasure chest bounty showcase animation.
    if (bountyChestLidRef.current && bountyScrollGroupRef.current && bountyChestGroupRef.current) {
      const active = Date.now() < bountyShowcaseRef.current.until;
      const tNow = Date.now() / 1000;
      const bountyList = leaderboardBountiesRef.current;
      const sortedBounties = [...bountyList].sort((a, b) => {
        const score = (status: string) => (status === 'active' ? 0 : status === 'claimed' ? 1 : 2);
        return score(String(a.status || '')) - score(String(b.status || ''));
      });
      const currentBounty = sortedBounties.length
        ? sortedBounties[Math.floor(Date.now() / 5000) % sortedBounties.length]
        : null;
      const clawbGoldMode = String(currentBounty?.prize?.token || '').toUpperCase() === 'CLAWB';
      if (active && !bountyShowcaseWasActiveRef.current) {
        bountyBurstStartedAtRef.current = Date.now();
        const bubblePoints = bountyBubblePointsRef.current;
        const bubbleVel = bountyBubbleVelRef.current;
        const sparklePoints = bountySparklePointsRef.current;
        const sparkleVel = bountySparkleVelRef.current;
        if (bubblePoints && bubbleVel) {
          const pos = bubblePoints.geometry.attributes.position.array as Float32Array;
          for (let i = 0; i < pos.length; i += 3) {
            const ang = Math.random() * Math.PI * 2;
            const radius = 0.06 + Math.random() * 0.16;
            pos[i] = Math.cos(ang) * radius;
            pos[i + 1] = (Math.random() - 0.5) * 0.08;
            pos[i + 2] = Math.sin(ang) * radius * 0.7;
            bubbleVel[i] = (Math.random() - 0.5) * 0.35;
            bubbleVel[i + 1] = 0.38 + Math.random() * 0.58;
            bubbleVel[i + 2] = (Math.random() - 0.5) * 0.32;
          }
          bubblePoints.geometry.attributes.position.needsUpdate = true;
          bubblePoints.visible = true;
        }
        if (sparklePoints && sparkleVel) {
          const pos = sparklePoints.geometry.attributes.position.array as Float32Array;
          for (let i = 0; i < pos.length; i += 3) {
            const ang = Math.random() * Math.PI * 2;
            const radius = Math.random() * 0.08;
            pos[i] = Math.cos(ang) * radius;
            pos[i + 1] = (Math.random() - 0.5) * 0.06;
            pos[i + 2] = Math.sin(ang) * radius;
            sparkleVel[i] = (Math.random() - 0.5) * 1.1;
            sparkleVel[i + 1] = 0.6 + Math.random() * 1.0;
            sparkleVel[i + 2] = (Math.random() - 0.5) * 1.1;
          }
          sparklePoints.geometry.attributes.position.needsUpdate = true;
          sparklePoints.visible = true;
        }
      }
      bountyShowcaseWasActiveRef.current = active;
      const lidTarget = active ? -1.12 : 0;
      bountyChestLidRef.current.rotation.x = THREE.MathUtils.damp(
        bountyChestLidRef.current.rotation.x,
        lidTarget,
        7.5,
        delta
      );
      const liftTarget = active ? 1.06 : 0.24;
      bountyScrollGroupRef.current.position.y = THREE.MathUtils.damp(
        bountyScrollGroupRef.current.position.y,
        liftTarget,
        active ? 6.2 : 8.5,
        delta
      );
      const scaleTarget = active ? 1 : 0.8;
      const nextScale = THREE.MathUtils.damp(
        bountyScrollGroupRef.current.scale.x,
        scaleTarget,
        active ? 6.2 : 8.5,
        delta
      );
      bountyScrollGroupRef.current.scale.setScalar(nextScale);
      // Orbiting hologram motion for command orb card.
      bountyScrollGroupRef.current.rotation.y = active ? Math.sin(tNow * 1.3) * 0.12 : 0;
      bountyScrollGroupRef.current.rotation.z = active ? Math.sin(tNow * 2.1) * 0.025 : 0;
      bountyScrollGroupRef.current.position.x = 0;
      bountyScrollGroupRef.current.visible = active || bountyScrollGroupRef.current.position.y > 0.28;
      // Chest bob and slight yaw wobble.
      bountyChestGroupRef.current.position.y = (FLOOR_Y + 0.02) + (active ? Math.sin(tNow * 2.2) * 0.04 : 0);
      bountyChestGroupRef.current.rotation.y = active ? Math.sin(tNow * 1.7) * 0.05 : 0;
      if (bountyChestGlowRef.current) {
        bountyChestGlowRef.current.intensity = active ? 1.2 + Math.sin(tNow * 4.0) * 0.35 : 0.55;
        bountyChestGlowRef.current.color.set(clawbGoldMode ? 0xffd05f : 0x7ce4ff);
      }

      if (active && bountyScrollRenderFnRef.current && Date.now() - bountyDisplayLastRenderAtRef.current > 280) {
        bountyDisplayLastRenderAtRef.current = Date.now();
        bountyScrollRenderFnRef.current();
      }

      const burstElapsed = Date.now() - bountyBurstStartedAtRef.current;
      const bubblesActive = burstElapsed >= 0 && burstElapsed < 2400;
      const sparklesActive = burstElapsed >= 0 && burstElapsed < 1200;
      const bubblePoints = bountyBubblePointsRef.current;
      const bubbleVel = bountyBubbleVelRef.current;
      const bubbleMat = bountyBubbleMatRef.current;
      if (bubblePoints && bubbleVel && bubbleMat) {
        if (bubblesActive) {
          const pos = bubblePoints.geometry.attributes.position.array as Float32Array;
          for (let i = 0; i < pos.length; i += 3) {
            bubbleVel[i + 1] += 0.18 * delta;
            pos[i] += bubbleVel[i] * delta;
            pos[i + 1] += bubbleVel[i + 1] * delta;
            pos[i + 2] += bubbleVel[i + 2] * delta;
          }
          bubblePoints.geometry.attributes.position.needsUpdate = true;
          bubbleMat.opacity = Math.max(0, 0.9 * (1 - burstElapsed / 2400));
          bubblePoints.visible = true;
        } else {
          bubbleMat.opacity = 0;
          bubblePoints.visible = false;
        }
      }
      const sparklePoints = bountySparklePointsRef.current;
      const sparkleVel = bountySparkleVelRef.current;
      const sparkleMat = bountySparkleMatRef.current;
      if (sparklePoints && sparkleVel && sparkleMat) {
        if (sparklesActive) {
          const pos = sparklePoints.geometry.attributes.position.array as Float32Array;
          for (let i = 0; i < pos.length; i += 3) {
            sparkleVel[i + 1] -= 0.75 * delta;
            pos[i] += sparkleVel[i] * delta;
            pos[i + 1] += sparkleVel[i + 1] * delta;
            pos[i + 2] += sparkleVel[i + 2] * delta;
          }
          sparklePoints.rotation.y += delta * 1.8;
          sparklePoints.geometry.attributes.position.needsUpdate = true;
          sparkleMat.opacity = Math.max(0, 1.0 * (1 - burstElapsed / 1200));
          sparklePoints.visible = true;
        } else {
          sparkleMat.opacity = 0;
          sparklePoints.visible = false;
        }
      }

      const goldPoints = bountyGoldPointsRef.current;
      const goldVel = bountyGoldVelRef.current;
      const goldMat = bountyGoldMatRef.current;
      if (goldPoints && goldVel && goldMat) {
        if (active && clawbGoldMode) {
          const pos = goldPoints.geometry.attributes.position.array as Float32Array;
          if (!goldPoints.visible) {
            for (let i = 0; i < pos.length; i += 3) {
              const ang = Math.random() * Math.PI * 2;
              const r = 0.08 + Math.random() * 0.45;
              pos[i] = Math.cos(ang) * r;
              pos[i + 1] = Math.random() * 0.2;
              pos[i + 2] = Math.sin(ang) * r;
              goldVel[i] = (Math.random() - 0.5) * 0.35;
              goldVel[i + 1] = 0.9 + Math.random() * 1.1;
              goldVel[i + 2] = (Math.random() - 0.5) * 0.35;
            }
            goldPoints.geometry.attributes.position.needsUpdate = true;
          }
          for (let i = 0; i < pos.length; i += 3) {
            goldVel[i + 1] -= 1.8 * delta;
            pos[i] += goldVel[i] * delta;
            pos[i + 1] += goldVel[i + 1] * delta;
            pos[i + 2] += goldVel[i + 2] * delta;
            if (pos[i + 1] < -0.12) {
              pos[i + 1] = 0.2 + Math.random() * 0.5;
              goldVel[i + 1] = 0.9 + Math.random() * 1.0;
            }
          }
          goldPoints.rotation.y += delta * 1.4;
          goldPoints.geometry.attributes.position.needsUpdate = true;
          goldMat.opacity = 0.9;
          goldPoints.visible = true;
        } else {
          goldMat.opacity = 0;
          goldPoints.visible = false;
        }
      }
    }

    if (composerRef.current) {
      composerRef.current.render();
    } else {
      rendererRef.current.render(sceneRef.current, cameraRef.current);
    }
    frameIdRef.current = requestAnimationFrame(animate);
  }, [getPatrolTarget, getRoomName, getGreeting, isMobile, isStreamMode, goToRoom, queueRoomTransition, resetClawbCommandVelocity, setWorldAction]);

  // Init scene
  useEffect(() => {
    if (!containerRef.current || !canvasRef.current) return;

    const width = window.innerWidth;
    const height = window.innerHeight;

    // Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 300);
    camera.position.set(0, FLOOR_Y + PLAYER_HEIGHT, 5);
    if (isStreamMode) {
      const camParam = new URLSearchParams(window.location.search).get('cam')?.toLowerCase();
      if (camParam === 'orbit') streamCameraModeRef.current = 'orbit';
      else if (camParam === 'wide') streamCameraModeRef.current = 'wide';
      else if (camParam === 'cinematic') streamCameraModeRef.current = 'cinematic';
      else streamCameraModeRef.current = 'follow';
      camera.position.set(0, FLOOR_Y + 1.45, 2.8);
      camera.lookAt(0, FLOOR_Y + 0.75, 0);
      streamCameraLookRef.current.set(0, FLOOR_Y + 0.75, 0);
    }
    cameraRef.current = camera;

    // Renderer + post-processing
    const { renderer, composer } = createWorldRenderer(canvasRef.current, width, height, scene, camera);
    rendererRef.current = renderer;
    composerRef.current = composer;

    // Controls
    const controls = new PointerLockControls(camera, canvasRef.current);
    controlsRef.current = controls;

    controls.addEventListener('lock', () => setIsLocked(true));
    controls.addEventListener('unlock', () => setIsLocked(false));

    // Environment (floor, sky, water, particles, lighting, fog)
    const env = createEnvironment(scene, isStreamMode);
    envRef.current = env;
    lightsRef.current = env.lights;
    if (isLocalWorldOnly() && !LAZY_ROOM_LOADING) {
      void loadLocalWorldFauna(scene).then((refs) => {
        localFaunaRef.current = refs;
      });
    }

    // Load all rooms (Firebase first, fallback to static files)
    const addRoomCollision = (data: WorldState, offset: THREE.Vector3) => {
      const boxes = generateCollisionBoxes(data, offset.x, offset.z);
      collisionBoxesRef.current = [...collisionBoxesRef.current, ...boxes];
    };
    const getStreamPrunedRoomData = (roomName: string, data: WorldState): WorldState => {
      // Bedroom (gallery): always remove anemone and bubbler — they render as pink bubble-like shapes.
      if (roomName === 'bedroom') {
        const excludeTypes = new Set(['anemone', 'bubbler']);
        const filtered = data.objects.filter((obj) => !excludeTypes.has(String(obj.type || '').toLowerCase()));
        if (filtered.length === data.objects.length) return data;
        return { ...data, objectCount: filtered.length, objects: filtered };
      }
      if (!isStreamMode) return data;
      // Main: clear procedural corals/rocks from center lane (same as before).
      if (roomName !== 'main') return data;
      const clearTypes = new Set([
        'coral_branch',
        'coral_brain',
        'coral_fan',
        'coral_tube',
        'coral_bulb',
        'rock_boulder',
        'rock_slab',
        'rock_cluster',
        'rock_arch',
        'seagrass',
        'anemone',
        'shell',
        'starfish',
        'bubbler',
      ]);
      const filtered = data.objects.filter((obj) => {
        if (!clearTypes.has(obj.type)) return true;
        const x = obj.position[0];
        const z = obj.position[2];
        const inCenterRadius = x * x + z * z < 12 * 12;
        const inForwardLane = Math.abs(x) < 8 && z > -22 && z < 12;
        return !(inCenterRadius || inForwardLane);
      });
      if (filtered.length === data.objects.length) return data;
      return {
        ...data,
        objectCount: filtered.length,
        objects: filtered,
      };
    };
    const useLocalOnly = isLocalWorldOnly();
    if (!LAZY_ROOM_LOADING) {
      for (const roomName of Object.keys(ROOM_URLS)) {
        const offset = ROOM_OFFSETS[roomName];
        const url = useLocalOnly ? ROOM_FILES_FALLBACK[roomName] : ROOM_URLS[roomName];
        if (!url) continue;
        fetch(url)
          .then((res) => res.json())
          .then((data: WorldState) => {
            if (data && data.objects) {
              const roomData = getStreamPrunedRoomData(roomName, data);
              renderWorldState(scene, roomData, offset);
              addRoomCollision(roomData, offset);
            } else {
              throw new Error('Invalid room data');
            }
          })
          .catch((err) => console.warn(`[ClawbWorld] Failed to load ${roomName}:`, err));
      }
    }

    if (LAZY_ROOM_LOADING) {
      requestRoomWithLazyLoadRef.current = (roomKey: keyof typeof ROOM_OFFSETS) => {
        if (roomKey === 'leaderboard') {
          ensureLeaderboardBuiltRef.current?.();
          queueRoomTransition('leaderboard');
          return;
        }
        if (!ROOM_URLS[roomKey] && !ROOM_FILES_FALLBACK[roomKey]) return;

        lazyLoadIdRef.current += 1;
        const myLoadId = lazyLoadIdRef.current;

        const unloadCurrent = () => {
          const prevObj = lazyRoomObjectsRef.current;
          if (prevObj && prevObj.parent) {
            prevObj.parent.remove(prevObj);
            prevObj.traverse((c) => {
              if ((c as THREE.Mesh).isMesh) {
                const m = c as THREE.Mesh;
                m.geometry?.dispose();
                const mat = m.material;
                if (mat) {
                  if (Array.isArray(mat)) mat.forEach((x) => x.dispose());
                  else mat.dispose();
                }
              }
            });
            lazyRoomObjectsRef.current = null;
          }
          const prev = lazyRoomContentRef.current;
          if (prev) {
            disposeRoomContent(prev);
            lazyRoomContentRef.current = null;
          }
          collisionBoxesRef.current = collisionBoxesRef.current.filter((b) => !lazyRoomCollisionRef.current.includes(b));
          lazyRoomCollisionRef.current = [];
          if (envRef.current) envRef.current.roomContentRefs = null;
          lazyLoadedRoomRef.current = null;
        };

        patrolAnchorRef.current = LOBBY_OFFSET.clone();
        clawbPosRef.current = PATROL_POINTS[0].clone().add(LOBBY_OFFSET);
        setCurrentRoom('Lobby');
        unloadCurrent();

        const url = isLocalWorldOnly() ? ROOM_FILES_FALLBACK[roomKey] : ROOM_URLS[roomKey];
        if (!url) return;

        fetch(url)
          .then((res) => res.json())
          .then((data: WorldState) => {
            if (myLoadId !== lazyLoadIdRef.current) return;
            if (!data?.objects) throw new Error('Invalid room data');
            const roomData = getStreamPrunedRoomData(roomKey, data);
            const roomObjGroup = renderWorldState(scene, roomData, ROOM_OFFSETS[roomKey]);
            lazyRoomObjectsRef.current = roomObjGroup;
            const boxes = generateCollisionBoxes(roomData, ROOM_OFFSETS[roomKey].x, ROOM_OFFSETS[roomKey].z);
            if (myLoadId !== lazyLoadIdRef.current) return;
            collisionBoxesRef.current = [...collisionBoxesRef.current, ...boxes];
            lazyRoomCollisionRef.current = boxes;
            const roomContent = createRoomContent(scene, roomKey, isStreamMode);
            if (myLoadId !== lazyLoadIdRef.current) {
              disposeRoomContent(roomContent);
              return;
            }
            lazyRoomContentRef.current = roomContent;
            lazyLoadedRoomRef.current = roomKey;
            if (envRef.current) envRef.current.roomContentRefs = roomContent;
            setCurrentRoom(ROOM_LABELS[roomKey] ?? roomKey);
            if (roomKey === 'bedroom') {
              ensureGalleryBuiltRef.current?.().then(() => queueRoomTransition(roomKey));
            } else {
              queueRoomTransition(roomKey);
            }
          })
          .catch((err) => {
            if (myLoadId === lazyLoadIdRef.current) console.warn(`[ClawbWorld] Failed to load ${roomKey}:`, err);
          });
      };
    }

    // Load Clawb NPC
    const applyClawbModel = (object: THREE.Group, key: ClawbModelKey) => {
        prepareCharacterModel(object, clawbPosRef.current);
        applyClawbGlow(object);
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
      const now = performance.now();
      if (now - lastModelRequestAtRef.current < 120) {
        clawbModelSwapStateRef.current.pending = key;
        return;
      }
      if (clawbModelSwapStateRef.current.inFlight) {
        clawbModelSwapStateRef.current.pending = key;
        return;
      }
      lastModelRequestAtRef.current = now;
      clawbModelSwapStateRef.current.inFlight = true;
      void loadClawbModelWithFallback(key)
        .then((obj) => applyClawbModel(obj, key))
        .catch((err) => console.warn(`[ClawbWorld] Failed to load Clawb model "${key}":`, err))
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

    // Listen to other players in world (skip when local-only OBS — no multiplayer)
    const unsubPlayers = WORLD_MULTIPLAYER_ENABLED && !isLocalWorldOnly()
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
      { chain: 'ethereum', contract: '0x0ef7bA09C38624b8E9cc4985790a2f5dBFc1dC42', tokenId: '158', name: 'Lawbster #158', collection: 'lawbsters', image_url: 'https://nft-cdn.alchemy.com/eth-mainnet/8232eea91264b8dc42579c195d115ced' },
      { chain: 'ethereum', contract: '0x0ef7bA09C38624b8E9cc4985790a2f5dBFc1dC42', tokenId: '177', name: 'Lawbster #177', collection: 'lawbsters', image_url: 'https://nft-cdn.alchemy.com/eth-mainnet/81c0b08343ea49978e1f0ce6f14716a1' },
      { chain: 'ethereum', contract: '0x2d278e95b2fC67D4b27a276807e24E479D9707F6', tokenId: '34', name: 'Pixelawbster #34', collection: 'Pixelawbsters', image_url: 'https://nft-cdn.alchemy.com/eth-mainnet/e70c864ca87991d2fb111d51bfea14a5' },
      { chain: 'ethereum', contract: '0xd7922cD333da5ab3758C95f774B092A7B13a5449', tokenId: '269', name: 'LAWBSTARZ #269', collection: 'LAWBSTARZ', image_url: 'https://nft-cdn.alchemy.com/eth-mainnet/8626a53fdce3a6768484a71e83382d34' },
      { chain: 'ethereum', contract: '0xd7922cD333da5ab3758C95f774B092A7B13a5449', tokenId: '584', name: 'LAWBSTARZ #584', collection: 'LAWBSTARZ', image_url: 'https://nft-cdn.alchemy.com/eth-mainnet/a30f949561b9c961e97bb1010070c184' },
      { chain: 'base', contract: '0x13c33121f8a73e22ac6aa4a135132f5ac7f221b2', tokenId: '45', name: 'Lawbster #45', collection: 'ascii Lawbsters', image_url: 'https://cloudflare-ipfs.com/ipfs/bafybeihxfyltqaawyqfdh442hzh6cdwms7nbodtk7qkfilgkftmd52xz3e/45.png' },
    ];

    const texLoader = new THREE.TextureLoader();
    const texLoaderNoCors = new THREE.TextureLoader(); // Some NFT CDNs block CORS; try without first
    texLoader.setCrossOrigin('anonymous');
    const frameMat = new THREE.MeshPhongMaterial({ color: 0xccaa33, shininess: 20, side: THREE.DoubleSide });
    const bgMat = new THREE.MeshBasicMaterial({ color: 0x1a2a3a, side: THREE.DoubleSide });
    const frameSize = 0.65;

    const loadTextureWithFallback = async (nft: NFTItem): Promise<THREE.Texture> => {
      const urls = normalizeIpfsUrl(nft.image_url || '');
      if (!urls.length) return createNftPlaceholderTexture(nft, 'no image url');
      for (const url of urls) {
        for (const loader of [texLoaderNoCors, texLoader]) {
          try {
            const tex = await new Promise<THREE.Texture>((resolve, reject) => {
              loader.load(url, resolve, undefined, reject);
            });
            tex.minFilter = THREE.LinearFilter;
            tex.magFilter = THREE.LinearFilter;
            tex.colorSpace = THREE.SRGBColorSpace;
            return tex;
          } catch {
            // try next loader or gateway
          }
        }
      }
      return createNftPlaceholderTexture(nft, 'image unavailable');
    };

    const addGalleryWalls = (gallery: THREE.Group, rows: number) => {
      const wallHeight = Math.max(4, rows * 1.1 + 2);
      const wallColor = texLoader.load('/world-assets/polyhaven/rocks_ground_04_diff_2k.png');
      const wallNormal = texLoader.load('/world-assets/polyhaven/rocks_ground_04_nor_gl_2k.png');
      const wallRough = texLoader.load('/world-assets/polyhaven/rocks_ground_04_rough_2k.png');
      [wallColor, wallNormal, wallRough].forEach((tex) => {
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(3, Math.max(2, wallHeight / 2.2));
      });
      wallColor.colorSpace = THREE.SRGBColorSpace;

      const wallMat = new THREE.MeshStandardMaterial({
        color: 0x5d7f95,
        emissive: 0x0f1e2b,
        emissiveIntensity: 0.2,
        map: wallColor,
        normalMap: wallNormal,
        roughnessMap: wallRough,
        normalScale: new THREE.Vector2(0.8, 0.8),
        roughness: 0.82,
        metalness: 0.06,
        side: THREE.DoubleSide,
      });

      // No coral clumps on walls — they were rendering as flat pink bubble shapes.

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

    // Gallery: Firebase is source of truth (Clawb syncs there). Local file only as fallback when Firebase fails.
    const fetchGalleryNfts = async (): Promise<NFTItem[]> => {
      try {
        const firebaseRes = await fetch(FIREBASE_GALLERY_URL);
        if (firebaseRes.ok) {
          const data = await firebaseRes.json();
          if (data?.nfts?.length) return data.nfts;
        }
        // Firebase failed or empty — try local file when on localhost (offline/air-gapped)
        if (isLocalWorldOnly()) {
          const localRes = await fetch('/local-world-assets/gallery.json');
          if (localRes.ok) {
            const localData = await localRes.json();
            if (localData?.nfts?.length) return localData.nfts;
          }
        }
        return NFT_FALLBACK;
      } catch (err) {
        console.warn('[ClawbWorld] Gallery fetch error:', err);
        return NFT_FALLBACK;
      }
    };

    const addGalleryCollisionBoxes = () => {
      const bx = BEDROOM_OFFSET.x;
      const bz = BEDROOM_OFFSET.z;
      collisionBoxesRef.current = [
        ...collisionBoxesRef.current,
        { minX: bx - 4, maxX: bx + 4, minZ: bz - 3.7, maxZ: bz - 3.3 },   // back wall
        { minX: bx - 4.2, maxX: bx - 3.8, minZ: bz - 3.5, maxZ: bz + 2.5 }, // left wall
        { minX: bx + 3.8, maxX: bx + 4.2, minZ: bz - 3.5, maxZ: bz + 2.5 }, // right wall
      ];
    };

    if (LAZY_ROOM_LOADING) {
      (ensureGalleryBuiltRef as React.MutableRefObject<(() => Promise<void>) | null>).current = async () => {
        if (galleryBuiltRef.current.built) return;
        galleryBuiltRef.current.built = true;
        try {
          const nfts = await fetchGalleryNfts();
          await buildGallery(nfts);
        } catch {
          console.warn('[ClawbWorld] Gallery fetch failed, using fallback');
          await buildGallery(NFT_FALLBACK);
        }
        addGalleryCollisionBoxes();
        const pending = pendingLookNftIndexRef.current;
        if (pending != null) triggerWorldAction('look_nft', { targetNftIndex: pending });
      };
    } else {
      fetchGalleryNfts()
        .then((nfts) => buildGallery(nfts))
        .then(() => addGalleryCollisionBoxes())
        .catch(async () => {
          console.warn('[ClawbWorld] Gallery fetch failed, using fallback');
          await buildGallery(NFT_FALLBACK);
          addGalleryCollisionBoxes();
        });
    }

    // ---------------------------------------------------------------
    // 3D Leaderboard Billboard — Vegas-style scoreboard
    // ---------------------------------------------------------------
    const LB_OFFSET = ROOM_OFFSETS.leaderboard;
    const lbGroup = new THREE.Group();
    lbGroup.position.copy(LB_OFFSET);
    lbGroup.visible = false;
    scene.add(lbGroup);
    leaderboardGroupRef.current = lbGroup;

    const buildLeaderboardAndBounty = () => {
      if (leaderboardBuiltRef.current.built) return;
      leaderboardBuiltRef.current.built = true;

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
    lbTexture.minFilter = THREE.LinearFilter;
    lbTexture.magFilter = THREE.LinearFilter;
    lbTexture.colorSpace = THREE.SRGBColorSpace;
    leaderboardTextureRef.current = lbTexture;

    // Billboard centered on Clawb's arrival axis for stream camera framing.
    // Clawb arrives at PATROL_POINTS[0] relative to room = (-2.6, FLOOR_Y, -1.4).
    // Billboard placed directly in front at Z-5.4 so camera (behind Clawb) sees it.
    const bbX = -2.6;
    const bbZ = -6.4;
    const boardW = 11.2;
    const boardH = 6.6;
    const bbY = boardH / 2 - 1.8;
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

    // Seafloor bounty board for drone view: giant readable text made of ocean motifs.
    const boardCanvas = document.createElement('canvas');
    boardCanvas.width = 2200;
    boardCanvas.height = 2200;
    const boardTexture = new THREE.CanvasTexture(boardCanvas);
    boardTexture.minFilter = THREE.LinearFilter;
    boardTexture.magFilter = THREE.LinearFilter;
    boardTexture.colorSpace = THREE.SRGBColorSpace;
    const boardGroup = new THREE.Group();
    boardGroup.position.copy(BOUNTY_SHOWCASE_ANCHOR);
    boardGroup.visible = true;
    scene.add(boardGroup);
    bountyScrollGroupRef.current = boardGroup;

    const boardPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(11.8, 11.8),
      new THREE.MeshBasicMaterial({
        map: boardTexture,
        transparent: true,
        alphaTest: 0.06,
        side: THREE.DoubleSide,
      })
    );
    boardPlane.rotation.x = -Math.PI / 2;
    boardPlane.position.set(0, 0.02, 0);
    boardGroup.add(boardPlane);

    // One-shot board VFX systems (triggered when showcase starts).
    const bubbleCount = 44;
    const bubbleGeom = new THREE.BufferGeometry();
    const bubblePositions = new Float32Array(bubbleCount * 3);
    const bubbleVel = new Float32Array(bubbleCount * 3);
    bubbleGeom.setAttribute('position', new THREE.BufferAttribute(bubblePositions, 3));
    const bubbleMat = new THREE.PointsMaterial({
      color: 0x9fe8ff,
      size: 0.085,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const bubblePoints = new THREE.Points(bubbleGeom, bubbleMat);
    bubblePoints.position.set(0, 0.94, 0.06);
    bubblePoints.visible = false;
    boardGroup.add(bubblePoints);
    bountyBubblePointsRef.current = bubblePoints;
    bountyBubbleVelRef.current = bubbleVel;
    bountyBubbleMatRef.current = bubbleMat;

    const sparkleCount = 36;
    const sparkleGeom = new THREE.BufferGeometry();
    const sparklePositions = new Float32Array(sparkleCount * 3);
    const sparkleVel = new Float32Array(sparkleCount * 3);
    sparkleGeom.setAttribute('position', new THREE.BufferAttribute(sparklePositions, 3));
    const sparkleMat = new THREE.PointsMaterial({
      color: 0xffe18a,
      size: 0.11,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const sparklePoints = new THREE.Points(sparkleGeom, sparkleMat);
    sparklePoints.position.set(0, 1.02, 0.06);
    sparklePoints.visible = false;
    boardGroup.add(sparklePoints);
    bountySparklePointsRef.current = sparklePoints;
    bountySparkleVelRef.current = sparkleVel;
    bountySparkleMatRef.current = sparkleMat;

    const renderBountyDisplay = (bounties: LeaderboardBounty[]) => {
      const ctx = boardCanvas.getContext('2d');
      if (!ctx) return;
      const W = boardCanvas.width;
      const H = boardCanvas.height;
      const now = Date.now();
      const bg = ctx.createRadialGradient(W / 2, H / 2, 240, W / 2, H / 2, W * 0.62);
      bg.addColorStop(0, '#102f40');
      bg.addColorStop(1, '#06131d');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = '#65d9ff';
      ctx.lineWidth = 20;
      ctx.strokeRect(20, 20, W - 40, H - 40);

      // Decorative motifs: kelp, starfish, shell arcs.
      ctx.strokeStyle = '#4fd6a8';
      ctx.lineWidth = 12;
      for (let i = 0; i < 6; i++) {
        const x = 170 + i * 340;
        ctx.beginPath();
        ctx.moveTo(x, H - 150);
        ctx.bezierCurveTo(x - 22, H - 480, x + 18, H - 760, x - 10, H - 1080);
        ctx.stroke();
      }
      ctx.fillStyle = 'rgba(114,237,255,0.95)';
      for (let i = 0; i < 7; i++) {
        const sx = 220 + i * 300;
        const sy = 220 + (i % 2) * 80;
        ctx.save();
        ctx.translate(sx, sy);
        ctx.rotate((now / 2200) + i * 0.4);
        for (let a = 0; a < 5; a++) {
          ctx.rotate((Math.PI * 2) / 5);
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(0, 48);
          ctx.lineTo(16, 18);
          ctx.closePath();
          ctx.fill();
        }
        ctx.restore();
      }
      ctx.strokeStyle = '#e2c178';
      ctx.lineWidth = 10;
      for (let i = 0; i < 5; i++) {
        const cx = 220 + i * 430;
        ctx.beginPath();
        ctx.arc(cx, H - 240, 120, Math.PI, Math.PI * 1.9);
        ctx.stroke();
      }

      const sorted = [...bounties].sort((a, b) => {
        const score = (status: string) => (status === 'active' ? 0 : status === 'claimed' ? 1 : 2);
        return score(String(a.status || '')) - score(String(b.status || ''));
      });

      ctx.fillStyle = '#9be8ff';
      ctx.textAlign = 'center';
      ctx.font = 'bold 146px monospace';
      ctx.fillText('LAWB BOUNTIES', W / 2, 208);
      ctx.fillStyle = '#d8c66b';
      ctx.font = 'bold 54px monospace';
      ctx.fillText('ALL ACTIVE BOUNTIES', W / 2, 286);

      if (!sorted.length) {
        ctx.fillStyle = '#9be8ff';
        ctx.font = 'bold 122px monospace';
        ctx.fillText('NO ACTIVE BOUNTIES', W / 2, H / 2);
      } else {
        const panelX = 72;
        const panelY = 350;
        const panelW = W - 144;
        const panelH = H - 430;
        ctx.fillStyle = 'rgba(9,23,40,0.92)';
        ctx.fillRect(panelX, panelY, panelW, panelH);
        ctx.strokeStyle = '#61d8ff';
        ctx.lineWidth = 8;
        ctx.strokeRect(panelX, panelY, panelW, panelH);

        const rowH = Math.max(138, Math.floor((panelH - 40) / Math.max(sorted.length, 1)));
        const maxRows = Math.floor((panelH - 40) / rowH);
        const visible = sorted.slice(0, maxRows);
        ctx.textAlign = 'left';

        visible.forEach((bounty, index) => {
          const status = String(bounty.status || 'active').toUpperCase();
          const isClawbToken = String(bounty.prize?.token || '').toUpperCase() === 'CLAWB';
          const isNft = Boolean(bounty.prize?.token_id || bounty.prize?.collection);
          let prizeText = 'REWARD PENDING';
          if (bounty.prize?.amount && bounty.prize?.token) {
            prizeText = `${Number(bounty.prize.amount).toLocaleString()} $${String(bounty.prize.token).toUpperCase()}`;
          } else if (bounty.prize?.token_id) {
            prizeText = `${String(bounty.prize.collection || 'NFT')} #${bounty.prize.token_id}`;
          } else if (bounty.prize?.collection) {
            prizeText = String(bounty.prize.collection);
          }
          const y = panelY + 38 + index * rowH;
          const statusColor = status === 'ACTIVE' ? '#7cf4ff' : status === 'CLAIMED' ? '#ffcf4a' : '#9bb5d4';
          ctx.fillStyle = statusColor;
          ctx.font = 'bold 42px monospace';
          ctx.fillText(`[${status}]`, panelX + 34, y + 44);
          ctx.fillStyle = '#d9ecff';
          ctx.font = 'bold 54px monospace';
          ctx.fillText(String(bounty.title || '').slice(0, 38), panelX + 310, y + 44);
          ctx.fillStyle = isClawbToken ? '#ffdf70' : isNft ? '#7cf4ff' : '#cfe3ff';
          ctx.font = 'bold 44px monospace';
          ctx.fillText(prizeText.slice(0, 56), panelX + 310, y + 98);
          if (index < visible.length - 1) {
            ctx.strokeStyle = 'rgba(121,177,220,0.5)';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(panelX + 28, y + rowH - 8);
            ctx.lineTo(panelX + panelW - 28, y + rowH - 8);
            ctx.stroke();
          }
        });
      }
      boardTexture.needsUpdate = true;
    };
    bountyScrollRenderFnRef.current = () => renderBountyDisplay(leaderboardBountiesRef.current);
    renderBountyDisplay([]);

    // Gold coin-like particle shower for $CLAWB bounties.
    const goldCount = 64;
    const goldGeom = new THREE.BufferGeometry();
    const goldPos = new Float32Array(goldCount * 3);
    const goldVel = new Float32Array(goldCount * 3);
    goldGeom.setAttribute('position', new THREE.BufferAttribute(goldPos, 3));
    const goldMat = new THREE.PointsMaterial({
      color: 0xffcf4a,
      size: 0.09,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const goldPoints = new THREE.Points(goldGeom, goldMat);
    goldPoints.position.set(0, 0.5, 0);
    goldPoints.visible = false;
    boardGroup.add(goldPoints);
    bountyGoldPointsRef.current = goldPoints;
    bountyGoldVelRef.current = goldVel;
    bountyGoldMatRef.current = goldMat;

    // Render leaderboard data onto the canvas
    const renderLeaderboardCanvas = (
      entries: Array<{ username: string; points: number; wins: number; points_breakdown?: Record<string, number> }>,
      displayNames: Record<string, string>,
      _bounties: LeaderboardBounty[],
    ) => {
      const ctx = lbCanvas.getContext('2d');
      if (!ctx) return;
      const W = LEADERBOARD_CANVAS_W;
      const H = LEADERBOARD_CANVAS_H;
      const now = Date.now();

      // Background — neon ocean gradient (Dreamcast/PS2 + Vegas billboard)
      const bg = ctx.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, '#080b18');
      bg.addColorStop(0.24, '#162451');
      bg.addColorStop(0.55, '#29124a');
      bg.addColorStop(1, '#060913');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      // Retro starfield + scanline overlay
      ctx.fillStyle = 'rgba(132, 188, 255, 0.5)';
      for (let i = 0; i < 70; i++) {
        const sx = ((i * 179) + Math.floor(now / 35)) % W;
        const sy = ((i * 263) + Math.floor(now / 60)) % Math.floor(H * 0.58);
        ctx.fillRect(sx, sy, 2, 2);
      }
      ctx.fillStyle = 'rgba(0,0,0,0.12)';
      for (let y = 0; y < H; y += 4) {
        ctx.fillRect(0, y, W, 2);
      }

      // Diagonal neon streaks for a street-race billboard feel.
      ctx.save();
      ctx.globalAlpha = 0.12;
      for (let i = -4; i < 16; i++) {
        const x = (i * 180) + ((now / 14) % 180);
        const grad = ctx.createLinearGradient(x, 0, x + 90, H);
        grad.addColorStop(0, '#00c7ff');
        grad.addColorStop(0.5, '#ff2b9a');
        grad.addColorStop(1, '#ffd447');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x + 70, 0);
        ctx.lineTo(x + 290, H);
        ctx.lineTo(x + 220, H);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();

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
      const borderAlpha = 0.45 + 0.55 * pulse;
      ctx.strokeStyle = `rgba(255,43,154,${borderAlpha.toFixed(2)})`;
      ctx.lineWidth = 6;
      ctx.strokeRect(8, 8, W - 16, H - 16);
      ctx.strokeStyle = `rgba(0,199,255,${(0.3 + 0.35 * pulse).toFixed(2)})`;
      ctx.lineWidth = 2;
      ctx.strokeRect(14, 14, W - 28, H - 28);

      // Title tape
      ctx.fillStyle = 'rgba(14,20,38,0.9)';
      ctx.fillRect(26, 20, W - 52, 96);
      ctx.fillStyle = '#ff2b9a';
      ctx.font = 'bold 52px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('LAWB LEADERBOARD', W / 2, 72);

      // Subtitle with glow
      ctx.fillStyle = `rgba(0,231,255,${(0.62 + 0.38 * pulse).toFixed(2)})`;
      ctx.font = '22px monospace';
      ctx.fillText('LIVE STANDINGS // POINTS', W / 2, 104);

      ctx.textAlign = 'left';
      ctx.fillStyle = '#ffe66d';
      ctx.font = 'bold 18px monospace';
      ctx.fillText('LIVE BOARD', 40, 46);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#7de7ff';
      ctx.fillText('TOP SCORE', W - 40, 46);

      // Divider
      ctx.strokeStyle = '#ff2b9a55';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(40, 120);
      ctx.lineTo(W - 40, 120);
      ctx.stroke();

      // Stream-readable layout: horizontal arcade board with fewer, larger rows
      const rowHeight = 120;
      const startY = 250;
      const rowsPerPage = 5;
      const leaderboardPageCount = Math.max(1, Math.ceil(Math.max(1, entries.length) / rowsPerPage));
      const totalPages = leaderboardPageCount;
      const pageEveryMs = 9_000;
      const page = Math.floor(now / pageEveryMs) % totalPages;

      // Column headers
      ctx.textAlign = 'left';
      ctx.fillStyle = '#8fb6dd';
      ctx.font = 'bold 30px monospace';
      ctx.fillText('#', 74, 182);
      ctx.fillText('PLAYER', 186, 182);
      ctx.textAlign = 'right';
      ctx.fillText('PTS', W - 74, 182);

      // Divider under headers
      ctx.strokeStyle = '#2e4f7f';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(40, 198);
      ctx.lineTo(W - 40, 198);
      ctx.stroke();

      const startIndex = page * rowsPerPage;
      const pageEntries = entries.slice(startIndex, startIndex + rowsPerPage);
      for (let i = 0; i < pageEntries.length; i++) {
        const e = pageEntries[i];
        const rank = startIndex + i + 1;
        const y = startY + i * rowHeight;

        if (rank === 1) ctx.fillStyle = 'rgba(255,212,71,0.14)';
        else if (rank === 2) ctx.fillStyle = 'rgba(125,231,255,0.11)';
        else if (rank === 3) ctx.fillStyle = 'rgba(255,110,180,0.11)';
        else ctx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0)';
        ctx.fillRect(54, y - 72, W - 108, rowHeight - 14);

        ctx.textAlign = 'left';
        const rankColors = ['#ffd447', '#7de7ff', '#ff6eb4'];
        ctx.fillStyle = rank <= 3 ? rankColors[rank - 1] : '#9cb2c8';
        ctx.font = rank <= 3 ? 'bold 50px monospace' : 'bold 40px monospace';
        ctx.fillText(`${rank}`, 76, y);

        const wallet = e.username || '';
        const name = displayNames[wallet.toLowerCase()] || (wallet.length > 16 ? `${wallet.slice(0, 6)}..${wallet.slice(-4)}` : wallet);
        ctx.fillStyle = '#f2f6ff';
        ctx.font = 'bold 42px monospace';
        ctx.fillText(name.slice(0, 20), 190, y);

        ctx.textAlign = 'right';
        ctx.fillStyle = rank <= 3 ? '#ff3aa8' : '#f5a4c4';
        ctx.font = rank <= 3 ? 'bold 52px monospace' : 'bold 44px monospace';
        ctx.fillText(`${e.points || 0}`, W - 76, y);
      }

      if (entries.length === 0) {
        ctx.textAlign = 'center';
        ctx.fillStyle = '#8ca5bf';
        ctx.font = 'bold 40px monospace';
        ctx.fillText('NO PLAYERS YET', W / 2, startY + 40);
        ctx.font = '30px monospace';
        ctx.fillText('play chess or join retake.tv/clawb', W / 2, startY + 96);
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

    // Fetch and render leaderboard data (skip Firebase when local-only OBS)
    const refreshLeaderboard = () => {
      if (isLocalWorldOnly()) {
        renderLeaderboardCanvas([], {}, []);
        leaderboardRenderFnRef.current = () => renderLeaderboardCanvas([], {}, []);
        return;
      }
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
          return Object.values(data) as LeaderboardBounty[];
        })
        .catch(() => [] as LeaderboardBounty[]);

      Promise.all([fetchLeaderboard, fetchNames, fetchBounties]).then(([entries, names, bounties]) => {
        entries.sort((a, b) => (b.points || 0) - (a.points || 0));
        leaderboardBountiesRef.current = bounties;
        renderLeaderboardCanvas(entries, names, bounties);
        if (bountyScrollRenderFnRef.current) bountyScrollRenderFnRef.current();
        leaderboardRenderFnRef.current = () => renderLeaderboardCanvas(entries, names, bounties);
      });
    };

    refreshLeaderboard();
    lbRefreshIntervalRef.current = setInterval(refreshLeaderboard, LEADERBOARD_REFRESH_MS);
    };

    if (!LAZY_ROOM_LOADING) {
      buildLeaderboardAndBounty();
    } else {
      (ensureLeaderboardBuiltRef as React.MutableRefObject<(() => void) | null>).current = buildLeaderboardAndBounty;
    }

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

    // Gallery wall collision boxes added in buildGallery path (or ensureGalleryBuilt when lazy)

    // Keyboard input
    const onKeyDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      keysRef.current[k] = true;
      // G: debug — go to gallery when stream mode + localhost (for testing !gallery without Retake)
      if (k === 'g' && isStreamMode && isLocalWorldOnly()) {
        goToRoom('bedroom');
        return;
      }
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

    const handleResize = () => {
      if (composerRef.current) {
        resizeWorldRenderer(renderer, composerRef.current, camera, window.innerWidth, window.innerHeight);
      }
    };
    window.addEventListener('resize', handleResize);

    // Start render
    clockRef.current = new THREE.Clock();
    frameIdRef.current = requestAnimationFrame(animate);

    return () => {
      if (lbRefreshIntervalRef.current) {
        clearInterval(lbRefreshIntervalRef.current);
        lbRefreshIntervalRef.current = null;
      }
      unsubPlayers();
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('resize', handleResize);
      if (frameIdRef.current !== null) cancelAnimationFrame(frameIdRef.current);
      requestClawbModelRef.current = () => {};
      controls.dispose();
      if (composerRef.current) {
        composerRef.current.dispose();
        composerRef.current = null;
      }
      disposeLocalWorldFauna(scene, localFaunaRef.current);
      localFaunaRef.current = null;
      renderer.dispose();
      scene.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          mesh.geometry?.dispose();
          const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          mats.forEach((m) => m.dispose());
        }
      });

      if (WORLD_MULTIPLAYER_ENABLED && !isLocalWorldOnly() && address) {
        removeWorldPresence(address).catch(() => {
          // non-blocking
        });
      }
    };
  }, [address, createNftPlaceholderTexture, getGreeting, goToRoom, normalizeIpfsUrl, tryInspectNftInFront, animate, ensureRemotePlayer, isStreamMode]); // eslint-disable-line react-hooks/exhaustive-deps

  // Ensure stale sessions are removed if tab/browser disconnects.
  useEffect(() => {
    if (!WORLD_MULTIPLAYER_ENABLED || isLocalWorldOnly() || !address) return;
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

  // Chat: listen to messages when panel is open (skip when local-only OBS — no Firebase chat)
  const visitorMsgsRef = useRef<ClawbChatMessage[]>([]);
  const clawbMsgsRef = useRef<ClawbChatMessage[]>([]);
  useEffect(() => {
    if (!showChatPanel || isLocalWorldOnly()) return;
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
    const listenerStartedAt = Date.now();
    const ACTION_FRESHNESS_MS = 8_000;
    const ACTION_MAX_AGE_MS = 45_000;
    const unsub = listenToWorldActions((actions) => {
      if (!actions.length) return;
      const now = Date.now();
      for (const a of actions) {
        if (processedActionIdsRef.current.has(a.id)) continue;
        if (!a || typeof a.action !== 'string' || !a.action.trim()) {
          movementDiagnosticsRef.current.malformedActionsDropped += 1;
          continue;
        }
        if (typeof a.timestamp !== 'number' || !Number.isFinite(a.timestamp)) {
          movementDiagnosticsRef.current.malformedActionsDropped += 1;
          continue;
        }
        if (a.timestamp < listenerStartedAt - 1_000) {
          movementDiagnosticsRef.current.staleActionsDropped += 1;
          continue;
        }
        if (typeof (a as any).expires_at === 'number' && Number.isFinite((a as any).expires_at)) {
          if ((a as any).expires_at < now) {
            movementDiagnosticsRef.current.staleActionsDropped += 1;
            continue;
          }
        }
        if (now - a.timestamp > ACTION_MAX_AGE_MS) {
          movementDiagnosticsRef.current.staleActionsDropped += 1;
          continue;
        }
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
    if (isLocalWorldOnly()) return; // No Firebase chat when local OBS
    try {
      await sendClawbMessage(msg, address || 'anonymous', 'world');
      const parsedAction = parseWorldActionFromText(msg);
      if (parsedAction) {
        if (parsedAction.startsWith('loop_')) {
          const loopAction = parsedAction.replace(/^loop_/, '');
          await enqueueWorldAction(loopAction, address || 'anonymous', 'world', {
            loop: true,
            command: msg,
          });
        } else if (parsedAction === 'look_nft') {
          const lookMatch = /!look\s+(\d+)/i.exec(msg);
          await enqueueWorldAction(parsedAction, address || 'anonymous', 'world', {
            command: msg,
            ...(lookMatch ? { targetNftIndex: Number(lookMatch[1]) } : {}),
          });
        } else {
          await enqueueWorldAction(parsedAction, address || 'anonymous', 'world', {
            command: msg,
          });
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
      {/* CRT overlay removed — Kingdom Hearts style */}

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
              placeholder="Try !titan, !frenzy, !sonar, !day, !night, !current storm..."
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
