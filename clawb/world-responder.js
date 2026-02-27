/**
 * world-responder.js — world command consumer
 *
 * Converts inbound world commands into canonical world actions
 * so all world clients animate from the same event shape.
 */

import { db } from './lawb-firebase.js';

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
};

const DEDUPE_WINDOW_MS = Number(process.env.CLAWB_WORLD_DEDUPE_MS || 1200);
const MANUAL_OVERRIDE_MS = Number(process.env.CLAWB_WORLD_MANUAL_OVERRIDE_MS || 12_000);
const LOOP_OVERRIDE_MS = Number(process.env.CLAWB_WORLD_LOOP_OVERRIDE_MS || 20 * 60_000);
const ACTION_EXPIRES_MS = Number(process.env.CLAWB_WORLD_ACTION_EXPIRES_MS || 30_000);

const recentCommandKeys = new Map();
const arbiterState = {
  manualOverrideUntil: 0,
  loopOverrideUntil: 0,
  diagnostics: {
    duplicateDropped: 0,
    autonomySuppressed: 0,
    malformedDropped: 0,
  },
};

const worldControlRef = db.ref('clawb/world/control');

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

async function publishControlState(reason) {
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
  const ref = db.ref('clawb/world/actions').push();
  await ref.set(payload);
}

export async function startWorldResponder() {
  console.log('[World] Starting world responder...');

  db.ref('clawb/world/commands')
    .orderByChild('timestamp')
    .on('child_added', async (snapshot) => {
      const command = { id: snapshot.key, ...snapshot.val() };
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

        const stateChanged = touchArbiterWindows(canonical);
        if (stateChanged) {
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
    });

  console.log('[World] Listening for world commands.');
}
