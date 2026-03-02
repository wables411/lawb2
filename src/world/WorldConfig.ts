import * as THREE from 'three';

/** True when world is served from localhost (OBS stream). No Firebase room/leaderboard/gallery/bounties — local files only. */
export function isLocalWorldOnly(): boolean {
  if (typeof window === 'undefined') return false;
  const h = (window.location?.hostname || '').toLowerCase();
  return h === 'localhost' || h === '127.0.0.1';
}

// Firebase URLs
export const FIREBASE_DB = 'https://chess-220ee-default-rtdb.firebaseio.com';
export const FIREBASE_GALLERY_URL = `${FIREBASE_DB}/clawb/nft_gallery.json`;
export const FIREBASE_LEADERBOARD_URL = `${FIREBASE_DB}/leaderboard.json`;
export const FIREBASE_PROFILES_URL = `${FIREBASE_DB}/profiles.json?shallow=true`;
export const FIREBASE_BOUNTIES_URL = `${FIREBASE_DB}/bounties.json`;

export const ROOM_URLS: Record<string, string> = {
  main: `${FIREBASE_DB}/world/main.json`,
  bedroom: `${FIREBASE_DB}/world/bedroom.json`,
  workshop: `${FIREBASE_DB}/world/workshop.json`,
  vault: `${FIREBASE_DB}/world/vault.json`,
};

export const ROOM_FILES_FALLBACK: Record<string, string> = {
  main: '/world/world-state-main.json',
  bedroom: '/world/world-state-bedroom.json',
  workshop: '/world/world-state-workshop.json',
  vault: '/world/world-state-vault.json',
};

export const ROOM_LABELS: Record<string, string> = {
  main: 'Main Reef',
  bedroom: 'Bedroom',
  workshop: 'Workshop',
  vault: 'Vault',
  leaderboard: 'Leaderboard',
};

// Biome zones
export const ROOM_OFFSETS: Record<string, THREE.Vector3> = {
  main: new THREE.Vector3(0, 0, 0),
  bedroom: new THREE.Vector3(-35, 0, -30),
  workshop: new THREE.Vector3(35, 0, -30),
  vault: new THREE.Vector3(0, 0, -55),
  leaderboard: new THREE.Vector3(45, 0, 10),
};

export const BOUNTY_SHOWCASE_ANCHOR = new THREE.Vector3(-25, -1.95, 25);

// Rendering
export const RESOLUTION_SCALE = 1.0;
export const LEADERBOARD_REFRESH_MS = 30_000;
export const LEADERBOARD_CANVAS_W = 1536;
export const LEADERBOARD_CANVAS_H = 1024;

// Player
export const MIN_Y = -3;
export const MAX_Y = 2;
export const PLAYER_HEIGHT = 0.5;
export const PLAYER_SPEED = 5;
export const PLAYER_ACCEL_DAMP = 11;
export const PLAYER_DECEL_DAMP = 14;
export const SWIM_VERTICAL_SPEED = 3;
export const WORLD_BOUNDS = 95;
export const PLAYER_COLLISION_RADIUS = 0.3;
export const GRAVITY_LERP_RATE = 0.12;
export const FLOOR_Y = -3;
export const NFT_INTERACT_DISTANCE = 3.2;

// Clawb NPC
export const CLAWB_COLLISION_RADIUS = 0.35;
export const CLAWB_GREET_DISTANCE = 3;
export const CLAWB_SCALE = 0.018;
export const CLAWB_Y_OFFSET = 0.32;
export const CLAWB_PATROL_SPEED = 1.2;
export const CLAWB_PATROL_PAUSE_MIN_MS = 400;
export const CLAWB_PATROL_PAUSE_MAX_MS = 800;
export const CLAWB_STEP_SPEED = 0.9;
export const CLAWB_SWIM_STEP_SPEED = 1.3;
export const CLAWB_COMMAND_ACCEL_DAMP = 10;
export const CLAWB_COMMAND_DECEL_DAMP = 7;
export const CLAWB_COMMAND_TURN_DAMP = 12;
export const CLAWB_HARD_STOP_THRESHOLD = 0.02;

// World actions
export const WORLD_ACTION_DURATION_MS = 5000;
export const DIRECTIONAL_ACTION_DURATION_MS = 2800;
export const LOOK_FOCUS_DURATION_MS = 60_000;
export const LEADERBOARD_AUTO_RETURN_MS = 90_000;
export const ROOM_TRANSITION_DURATION_MS = 4200;

// Camera
export const STREAM_CAMERA_DEFAULT_DISTANCE = 3.2;
export const STREAM_CAMERA_MIN_DISTANCE = 0.45;
export const STREAM_CAMERA_MAX_DISTANCE = 18.0;
export const STREAM_CAMERA_ZOOM_STEP = 0.75;
export const STREAM_CAMERA_NEAR_FOV = 80;
export const STREAM_CAMERA_FAR_FOV = 38;
export const STREAM_CAMERA_NEAR_Y = 1.0;
export const STREAM_CAMERA_FAR_Y = 8.0;
export const STREAM_CAMERA_NEAR_Z_SCALE = 1.0;
export const STREAM_CAMERA_FAR_Z_SCALE = 0.35;
export const STREAM_CAMERA_POSITION_DAMP = 6;
export const STREAM_CAMERA_LOOK_DAMP = 8;

// Lobby + per-room loading (Clawb stays in minimal lobby until room is fully loaded)
// Default true on localhost so OBS/Retake always gets minimal lobby regardless of .env
export const LAZY_ROOM_LOADING =
  import.meta.env.VITE_LAZY_ROOM_LOADING === 'true' ||
  import.meta.env.VITE_LAZY_ROOM_LOADING === '1' ||
  (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'));

/** Lobby position: minimal shell, Clawb waits here until a room is requested and loaded. */
export const LOBBY_OFFSET = new THREE.Vector3(0, 0, 0);

// Multiplayer
export const WORLD_MULTIPLAYER_ENABLED = import.meta.env.VITE_WORLD_MULTIPLAYER_ENABLED === 'true';
export const PRESENCE_WRITE_INTERVAL_MS = 250;

// Patrol path — wider loop so Clawb swims 3–5 sec per leg instead of ~1 sec
export const PATROL_POINTS = [
  new THREE.Vector3(-4.2, FLOOR_Y, -2.2),
  new THREE.Vector3(-1.2, FLOOR_Y, 2.8),
  new THREE.Vector3(3.2, FLOOR_Y, 1.2),
  new THREE.Vector3(4.0, FLOOR_Y, -3.0),
  new THREE.Vector3(0.4, FLOOR_Y, -4.2),
  new THREE.Vector3(-2.8, FLOOR_Y, -3.4),
];

// Character models
export type ClawbModelKey = 'idle' | 'walk' | 'swim' | 'hi' | 'dance' | 'flip' | 'die';

export const CLAWB_MODEL_URLS: Record<ClawbModelKey, string> = {
  // Prefer known-present FBX assets to avoid missing-model stalls.
  idle: '/assets/lawbidle.fbx',
  walk: '/assets/lawbwalk.fbx',
  swim: '/assets/lawbswim.fbx',
  hi: '/assets/lawbhi.fbx',
  dance: '/assets/lawbdance1.fbx',
  flip: '/assets/lawbflip.fbx',
  die: '/assets/lawbdeath.fbx',
};

export const CLAWB_MODEL_FALLBACKS: Record<ClawbModelKey, string[]> = {
  idle: ['/assets/lawbidle.fbx', '/assets/lawbwalk.fbx', '/assets/lawbidle2.fbx'],
  walk: ['/assets/lawbwalk.fbx', '/assets/lawbswim.fbx', '/assets/lawbidle.fbx'],
  swim: ['/assets/lawbswim.fbx', '/assets/lawbwalk.fbx', '/assets/lawbidle.fbx'],
  hi: ['/assets/lawbhi.fbx', '/assets/lawbdance3.fbx', '/assets/lawbidle.fbx'],
  dance: ['/assets/lawbdance1.fbx', '/assets/lawbdance2.fbx', '/assets/lawbidle.fbx'],
  flip: ['/assets/lawbflip.fbx', '/assets/lawbdance3.fbx', '/assets/lawbidle.fbx'],
  die: ['/assets/lawbdeath.fbx', '/assets/lawbflip.fbx', '/assets/lawbidle.fbx'],
};

// Action sets
export const ROOM_ACTION_TO_KEY: Record<string, keyof typeof ROOM_OFFSETS> = {
  room_main: 'main',
  room_bedroom: 'bedroom',
  room_workshop: 'workshop',
  room_vault: 'vault',
  room_leaderboard: 'leaderboard',
};

export const LOOPABLE_ACTIONS = new Set([
  'idle', 'walk', 'dance', 'flip', 'die', 'swim', 'hi', 'wave', 'spin', 'jump',
]);

export const DIRECTIONAL_ACTIONS = new Set([
  'left', 'right', 'forward', 'back',
  'swim_left', 'swim_right', 'swim_forward', 'swim_back',
  'walk', 'swim', 'look_swim',
]);
