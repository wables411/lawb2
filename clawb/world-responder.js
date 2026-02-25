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
};

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
    .startAt(Date.now())
    .on('child_added', async (snapshot) => {
      const command = { id: snapshot.key, ...snapshot.val() };
      try {
        const canonical = normalizeCommand(command);
        if (!canonical) return;
        await publishWorldAction(canonical);
        console.log(`[World] command ${canonical.command || canonical.action} -> ${canonical.action}`);
      } catch (err) {
        console.error('[World] Failed to process command:', err.message);
      }
    });

  console.log('[World] Listening for world commands.');
}
