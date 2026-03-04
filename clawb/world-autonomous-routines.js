/**
 * world-autonomous-routines.js
 *
 * Lightweight autonomous world behavior publisher.
 * Publishes commands into the existing Firebase world command path (or local inject when CLAWB_LOCAL_STREAM).
 */

import { db } from './lawb-firebase.js';
import { injectWorldCommand } from './world-ws-bridge.js';
import { isAutonomySuppressedForLocal } from './world-responder.js';

const LOCAL_STREAM = String(process.env.CLAWB_LOCAL_STREAM || '0').toLowerCase() === '1' ||
  process.argv.includes('--local-stream');
const AUTONOMY_ENABLED = String(process.env.CLAWB_WORLD_AUTONOMY_ENABLED || 'true').toLowerCase() !== 'false';
const BASE_INTERVAL_MS = Number(process.env.CLAWB_WORLD_AUTONOMY_INTERVAL_MS || 180_000);
const JITTER_MS = Number(process.env.CLAWB_WORLD_AUTONOMY_JITTER_MS || 45_000);
const MANUAL_COOLDOWN_FALLBACK_MS = Number(process.env.CLAWB_WORLD_MANUAL_COOLDOWN_FALLBACK_MS || 10_000);

const ROUTINES = [
  { command: '!swim forward', payload: { type: 'action', action: 'swim_forward', direction: 'forward' } },
  { command: '!swim left', payload: { type: 'action', action: 'swim_left', direction: 'left' } },
  { command: '!workshop', payload: { type: 'room', targetRoom: 'workshop' } },
  { command: '!hi', payload: { type: 'action', action: 'hi' } },
  { command: '!spin', payload: { type: 'action', action: 'spin' } },
  { command: '!main', payload: { type: 'room', targetRoom: 'main' } },
  { command: '!idle', payload: { type: 'action', action: 'idle' } },
];

function nextDelayMs() {
  const jitter = Math.floor(Math.random() * Math.max(1, JITTER_MS));
  return BASE_INTERVAL_MS + jitter;
}

async function publishRoutineStep(step) {
  const payload = {
    command: step.command,
    ...step.payload,
    source: 'autonomy',
    viewer: 'clawb',
    timestamp: Date.now(),
  };
  if (LOCAL_STREAM) {
    injectWorldCommand(payload);
    console.log(`[World Autonomy] injected ${step.command} (local)`);
    return;
  }
  const ref = db.ref('clawb/world/commands').push();
  await ref.set(payload);
  console.log(`[World Autonomy] published ${step.command}`);
}

async function isAutonomySuppressedNow() {
  if (LOCAL_STREAM) {
    return isAutonomySuppressedForLocal();
  }
  try {
    const snapshot = await db.ref('clawb/world/control').once('value');
    const control = snapshot.val() || {};
    const now = Date.now();
    const suppressedUntil = Number(control.autonomySuppressedUntil) || 0;
    const manualUntil = Number(control.manualOverrideUntil) || 0;
    const effectiveUntil = Math.max(suppressedUntil, manualUntil ? manualUntil + MANUAL_COOLDOWN_FALLBACK_MS : 0);
    return now < effectiveUntil;
  } catch (err) {
    console.warn(`[World Autonomy] control read failed: ${err.message}`);
    return false;
  }
}

export function startWorldAutonomousRoutines() {
  if (!AUTONOMY_ENABLED) {
    console.log('[World Autonomy] disabled via CLAWB_WORLD_AUTONOMY_ENABLED=false');
    return () => {};
  }

  let timer = null;
  let routinePos = 0;
  let stopped = false;

  const tick = async () => {
    if (stopped) return;
    const step = ROUTINES[routinePos % ROUTINES.length];
    routinePos += 1;
    try {
      if (await isAutonomySuppressedNow()) {
        console.log('[World Autonomy] suppressed (manual/loop control active)');
      } else {
      await publishRoutineStep(step);
      }
    } catch (err) {
      console.warn(`[World Autonomy] publish failed: ${err.message}`);
    } finally {
      if (!stopped) {
        timer = setTimeout(() => {
          tick().catch((err) => console.warn(`[World Autonomy] tick failed: ${err.message}`));
        }, nextDelayMs());
      }
    }
  };

  console.log('[World Autonomy] started');
  timer = setTimeout(() => {
    tick().catch((err) => console.warn(`[World Autonomy] initial tick failed: ${err.message}`));
  }, 20_000);

  return () => {
    stopped = true;
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    console.log('[World Autonomy] stopped');
  };
}

