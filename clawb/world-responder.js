/**
 * world-responder.js — world command consumer
 *
 * Converts inbound world commands into canonical world actions
 * so all world clients animate from the same event shape.
 * In local-stream mode: commands come via WebSocket bridge, no Firebase.
 */

import { db } from './lawb-firebase.js';
import { broadcastWorldAction, onLocalCommand } from './world-ws-bridge.js';

const LOCAL_STREAM = String(process.env.CLAWB_LOCAL_STREAM || '0').toLowerCase() === '1' ||
  process.argv.includes('--local-stream');

const ROOM_TO_ACTION = {
  main: 'room_main',
  bedroom: 'room_bedroom',
  workshop: 'room_workshop',
  vault: 'room_vault',
  leaderboard: 'room_leaderboard',
};

const ACTION_ALIASES = {
  day: 'day',
  night: 'night',
  storm: 'storm',
  abyss: 'abyss',
  idle: 'idle',
  walk: 'walk',
  hi: 'hi',
  dance: 'dance',
  flip: 'flip',
  die: 'die',
  swim: 'swim',
  left: 'left',
  right: 'right',
  back: 'back',
  forward: 'forward',
  swim_left: 'swim_left',
  swim_right: 'swim_right',
  swim_forward: 'swim_forward',
  swim_back: 'swim_back',
  wave: 'wave',
  spin: 'spin',
  jump: 'jump',
  zoom_in: 'zoom_in',
  zoom_out: 'zoom_out',
  bounty_showcase: 'bounty_showcase',
  sunburst: 'sunburst',
  bait: 'bait',
  pulse: 'pulse',
  predator_frenzy: 'predator_frenzy',
  sonar_ping: 'sonar_ping',
  titan_ping: 'titan_ping',
  cam_follow: 'cam_follow',
  cam_orbit: 'cam_orbit',
  cam_wide: 'cam_wide',
  cam_cinematic: 'cam_cinematic',
  current_storm: 'current_storm',
  current_calm: 'current_calm',
  current_normal: 'current_normal',
  focus_bounties: 'focus_bounties',
  focus_leaderboard: 'focus_leaderboard',
  focus_nfts: 'focus_nfts',
  focus_rooms: 'focus_rooms',
};

const DEDUPE_WINDOW_MS = Number(process.env.CLAWB_WORLD_DEDUPE_MS || 1200);
const MANUAL_OVERRIDE_MS = Number(process.env.CLAWB_WORLD_MANUAL_OVERRIDE_MS || 12_000);
const LOOP_OVERRIDE_MS = Number(process.env.CLAWB_WORLD_LOOP_OVERRIDE_MS || 20 * 60_000);
const ACTION_EXPIRES_MS = Number(process.env.CLAWB_WORLD_ACTION_EXPIRES_MS || 30_000);
const CLAWB_WORLD_RET_KEYFRAME_MOVE_GAP_MS = Number(process.env.CLAWB_WORLD_RET_KEYFRAME_MOVE_GAP_MS || 1400);
const CLAWB_WORLD_RET_KEYFRAME_ROOM_GAP_MS = Number(process.env.CLAWB_WORLD_RET_KEYFRAME_ROOM_GAP_MS || 4000);
const CLAWB_WORLD_RET_KEYFRAME_LOOK_GAP_MS = Number(process.env.CLAWB_WORLD_RET_KEYFRAME_LOOK_GAP_MS || 2600);

const recentCommandKeys = new Map();
const lastAcceptedByBucket = {
  move: 0,
  room: 0,
  look: 0,
};
const arbiterState = {
  manualOverrideUntil: 0,
  loopOverrideUntil: 0,
  diagnostics: {
    duplicateDropped: 0,
    cadenceDropped: 0,
    autonomySuppressed: 0,
    malformedDropped: 0,
  },
};

const worldControlRef = db ? db.ref('clawb/world/control') : null;

function nowMs() {
  return Date.now();
}

function isManualSource(source) {
  const s = String(source || '').toLowerCase();
  return s === 'retake' || s === 'world' || s === 'viewer';
}

function commandPriority(source) {
  return source === 'autonomy' ? 1 : 2;
}

/** For autonomy routines in local mode: check if manual/loop control is active */
export function isAutonomySuppressedForLocal() {
  const now = nowMs();
  const effectiveUntil = Math.max(arbiterState.manualOverrideUntil, arbiterState.loopOverrideUntil);
  return now < effectiveUntil;
}

async function publishControlState(reason) {
  if (!worldControlRef) return;
  await worldControlRef.set({
    manualOverrideUntil: arbiterState.manualOverrideUntil,
    loopOverrideUntil: arbiterState.loopOverrideUntil,
    autonomySuppressedUntil: Math.max(arbiterState.manualOverrideUntil, arbiterState.loopOverrideUntil),
    reason,
    updatedAt: nowMs(),
  });
}

function dedupeKey(canonical) {
  return [
    canonical.source || 'unknown',
    canonical.action || 'unknown',
    canonical.targetRoom || '',
    canonical.targetNftIndex || '',
    canonical.loop ? 'loop' : 'once',
  ].join('|');
}

function shouldDropAsDuplicate(canonical) {
  const now = nowMs();
  const key = dedupeKey(canonical);
  const last = recentCommandKeys.get(key) || 0;
  if (now - last < DEDUPE_WINDOW_MS) {
    arbiterState.diagnostics.duplicateDropped += 1;
    return true;
  }
  recentCommandKeys.set(key, now);
  if (recentCommandKeys.size > 500) {
    const entries = Array.from(recentCommandKeys.entries()).slice(-200);
    recentCommandKeys.clear();
    for (const [k, v] of entries) recentCommandKeys.set(k, v);
  }
  return false;
}

function shouldSuppressAutonomy(canonical) {
  if (canonical.source !== 'autonomy') return false;
  const now = nowMs();
  return now < Math.max(arbiterState.manualOverrideUntil, arbiterState.loopOverrideUntil);
}

function getCanonicalBucket(canonical) {
  const action = String(canonical?.action || '');
  if (action === 'look_nft') return 'look';
  if (action.startsWith('room_')) return 'room';
  if (
    action === 'walk' ||
    action === 'swim' ||
    action.startsWith('swim_') ||
    action === 'left' ||
    action === 'right' ||
    action === 'forward' ||
    action === 'back' ||
    action === 'wave' ||
    action === 'spin' ||
    action === 'jump' ||
    action === 'flip' ||
    action === 'hi' ||
    action === 'idle' ||
    action === 'dance' ||
    action === 'die'
  ) {
    return 'move';
  }
  return null;
}

function getCanonicalBucketGapMs(bucket) {
  if (bucket === 'move') return CLAWB_WORLD_RET_KEYFRAME_MOVE_GAP_MS;
  if (bucket === 'room') return CLAWB_WORLD_RET_KEYFRAME_ROOM_GAP_MS;
  if (bucket === 'look') return CLAWB_WORLD_RET_KEYFRAME_LOOK_GAP_MS;
  return 0;
}

function shouldDropByCadence(canonical) {
  if (!isManualSource(canonical.source)) return false;
  if (canonical.loop === true) return false;
  const bucket = getCanonicalBucket(canonical);
  if (!bucket) return false;
  const gapMs = getCanonicalBucketGapMs(bucket);
  if (gapMs <= 0) return false;
  const now = nowMs();
  const last = Number(lastAcceptedByBucket[bucket] || 0);
  if (now - last < gapMs) {
    arbiterState.diagnostics.cadenceDropped += 1;
    return true;
  }
  lastAcceptedByBucket[bucket] = now;
  return false;
}

function touchArbiterWindows(canonical) {
  const now = nowMs();
  if (isManualSource(canonical.source)) {
    arbiterState.manualOverrideUntil = Math.max(arbiterState.manualOverrideUntil, now + MANUAL_OVERRIDE_MS);
    if (canonical.loop === true) {
      arbiterState.loopOverrideUntil = Math.max(arbiterState.loopOverrideUntil, now + LOOP_OVERRIDE_MS);
    } else {
      // Any manual non-loop command interrupts prior loop suppression.
      arbiterState.loopOverrideUntil = 0;
    }
    return true;
  }
  return false;
}

function isCanonicalValid(canonical) {
  if (!canonical || typeof canonical.action !== 'string' || !canonical.action.trim()) return false;
  if (!Number.isFinite(Number(canonical.timestamp))) return false;
  return true;
}

function normalizeCommand(command) {
  const rawType = String(command?.type || '').toLowerCase().trim();
  const rawRoom = String(command?.targetRoom || '').toLowerCase().trim();
  const rawAction = String(command?.action || '').toLowerCase().trim();
  const rawDirection = String(command?.direction || '').toLowerCase().trim();
  const loop = command?.loop === true;
  const by = command.viewer || command.by || 'anon';
  const source = command.source || 'world';
  const timestamp = Number(command.timestamp) || Date.now();

  if (rawType === 'room' && ROOM_TO_ACTION[rawRoom]) {
    return {
      action: ROOM_TO_ACTION[rawRoom],
      by,
      source,
      command: command.command || '',
      targetRoom: rawRoom,
      timestamp,
    };
  }

  if (rawType === 'action' && ACTION_ALIASES[rawAction]) {
    return {
      action: ACTION_ALIASES[rawAction],
      ...(rawDirection ? { direction: rawDirection } : {}),
      loop,
      by,
      source,
      command: command.command || '',
      timestamp,
    };
  }

  if (rawType === 'look') {
    const targetNftIndex = Number(command.targetNftIndex);
    if (Number.isFinite(targetNftIndex) && targetNftIndex >= 1) {
      return {
        action: 'look_nft',
        by,
        source,
        command: command.command || '',
        targetNftIndex: Math.floor(targetNftIndex),
        // Looking at NFTs only makes sense in the gallery room.
        targetRoom: 'bedroom',
        timestamp,
      };
    }
  }

  return null;
}

async function publishWorldAction(payload) {
  if (LOCAL_STREAM || !db) {
    const id = `local_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    broadcastWorldAction({ id, ...payload });
    return;
  }
  const ref = db.ref('clawb/world/actions').push();
  const id = ref.key;
  await ref.set(payload);
  broadcastWorldAction({ id, ...payload });
}

async function processCommand(command) {
  try {
    const canonical = normalizeCommand(command);
    if (!canonical) return;
    if (!isCanonicalValid(canonical)) {
      arbiterState.diagnostics.malformedDropped += 1;
      return;
    }
    if (shouldDropAsDuplicate(canonical)) {
      console.log(`[World] duplicate dropped: ${canonical.action} (${canonical.source})`);
      return;
    }
    if (shouldSuppressAutonomy(canonical)) {
      arbiterState.diagnostics.autonomySuppressed += 1;
      console.log(`[World] autonomy suppressed: ${canonical.action}`);
      return;
    }
    if (shouldDropByCadence(canonical)) {
      console.log(`[World] cadence dropped: ${canonical.action} (${canonical.source})`);
      return;
    }

    const stateChanged = touchArbiterWindows(canonical);
    if (stateChanged && worldControlRef) {
      await publishControlState(`manual:${canonical.action}`);
    }

    const ts = Number(canonical.timestamp) || nowMs();
    const expiresAt = ts + ACTION_EXPIRES_MS;
    await publishWorldAction({
      ...canonical,
      priority: commandPriority(canonical.source),
      intent_id: command.id,
      interrupt_policy: canonical.loop ? 'until_interrupted' : 'replace',
      expires_at: expiresAt,
    });
    console.log(`[World] command ${canonical.command || canonical.action} -> ${canonical.action}`, {
      source: canonical.source,
      priority: commandPriority(canonical.source),
    });
  } catch (err) {
    console.error('[World] Failed to process command:', err.message);
  }
}

export async function startWorldResponder() {
  console.log('[World] Starting world responder...');

  if (LOCAL_STREAM) {
    const unsub = onLocalCommand((command) => processCommand(command));
    console.log('[World] Listening for local commands (Firebase-free mode).');
    return unsub;
  }

  const startupCutoffTs = nowMs() - 15_000;
  console.log(`[World] command listener cutoff armed at ${startupCutoffTs}`);

  db.ref('clawb/world/commands')
    .orderByChild('timestamp')
    .startAt(startupCutoffTs)
    .on('child_added', async (snapshot) => {
      const command = { id: snapshot.key, ...snapshot.val() };
      await processCommand(command);
    });

  console.log('[World] Listening for world commands.');
}
