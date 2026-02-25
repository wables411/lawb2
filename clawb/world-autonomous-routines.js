day/**
 * world-autonomous-routines.js
 *
 * Lightweight autonomous world behavior publisher.
 * Publishes commands into the existing Firebase world command path so
 * Clawb appears active even without direct viewer input.
 */

import { db } from './lawb-firebase.js';

const AUTONOMY_ENABLED = String(process.env.CLAWB_WORLD_AUTONOMY_ENABLED || 'true').toLowerCase() !== 'false';
const BASE_INTERVAL_MS = Number(process.env.CLAWB_WORLD_AUTONOMY_INTERVAL_MS || 180_000);
const JITTER_MS = Number(process.env.CLAWB_WORLD_AUTONOMY_JITTER_MS || 45_000);

const ROUTINES = [
  { command: '!swim forward', payload: { type: 'action', action: 'swim_forward', direction: 'forward' } },
  { command: '!swim left', payload: { type: 'action', action: 'swim_left', direction: 'left' } },
  { command: '!look 1', payload: { type: 'look', targetNftIndex: 1 } },
  { command: '!workshop', payload: { type: 'room', targetRoom: 'workshop' } },
  { command: '!hi', payload: { type: 'action', action: 'hi' } },
  { command: '!leaderboard', payload: { type: 'room', targetRoom: 'leaderboard' } },
  { command: '!spin', payload: { type: 'action', action: 'spin' } },
  { command: '!main', payload: { type: 'room', targetRoom: 'main' } },
  { command: '!idle', payload: { type: 'action', action: 'idle' } },
];

function nextDelayMs() {
  const jitter = Math.floor(Math.random() * Math.max(1, JITTER_MS));
  return BASE_INTERVAL_MS + jitter;
}

async function publishRoutineStep(step) {
  const ref = db.ref('clawb/world/commands').push();
  await ref.set({
    command: step.command,
    ...step.payload,
    source: 'autonomy',
    viewer: 'clawb',
    timestamp: Date.now(),
  });
  console.log(`[World Autonomy] published ${step.command}`);
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
      await publishRoutineStep(step);
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

