/**
 * index.js — Clawb Agent Main Entry Point
 *
 * Starts all Clawb services:
 * 1. Chat responder — answers visitor messages via Claude
 * 2. Chess watcher — posts commentary on vs Clawb games
 * 3. PVP agent — joins and plays on-chain wager games (optional)
 * 4. Status heartbeat — keeps Clawb's online status fresh
 * 5. Retake.TV streamer — streaming via OBS (optional)
 *
 * Usage: node index.js [--no-pvp] [--chat-only] [--no-stream]
 */

import { setClawbOnline, setClawbOffline, heartbeat, isFirebaseAvailable } from './lawb-firebase.js';
import { startChatResponder } from './lawb-chat-responder.js';
import { startChessWatcher } from './chess-clawb-watcher.js';
import { startPvpAgent } from './chess-pvp-agent.js';
import { startWorldResponder } from './world-responder.js';
import { startWorldWsBridge } from './world-ws-bridge.js';
import { startRetakeStreamer } from './retake-streamer.js';
import { startWorldAutonomousRoutines } from './world-autonomous-routines.js';
import { startLawbPoints } from './lawb-points.js';
import { startWorldGallerySync } from './world-gallery-sync.js';
import { startBountyPayoutProcessor } from './bounty-payout-processor.js';
import { runPreflight } from './preflight-env.js';

const args = process.argv.slice(2);
const noPvp = args.includes('--no-pvp');
const chatOnly = args.includes('--chat-only');
const noStream = args.includes('--no-stream');
const localStream = args.includes('--local-stream') || String(process.env.CLAWB_LOCAL_STREAM || '0').toLowerCase() === '1';

async function main() {
  console.log('');
  console.log('  🦞 Clawb Agent starting...');
  console.log('  ─────────────────────────');
  console.log('');

  const cleanups = [];

  try {
    const preflight = runPreflight({ strict: true });
    if (preflight.warnings.length) {
      preflight.warnings.forEach((w) => console.warn(`[Main] Preflight warning: ${w}`));
    }

    const hasFirebase = isFirebaseAvailable();
    if (localStream) {
      console.log('[Main] Local stream mode — world uses WebSocket.' + (hasFirebase ? ' Chess/PVP enabled.' : ' Chess/PVP disabled (Firebase unavailable).'));
    }

    // 1. Go online
    await setClawbOnline('idle');
    if (hasFirebase) console.log('[Main] Clawb is online.');

    // 2. Start chat responder (needs Firebase)
    if (hasFirebase && !localStream) {
      const stopChat = await startChatResponder();
      cleanups.push(stopChat);
    }

    // 3. Start chess watcher (needs Firebase)
    if (!chatOnly && hasFirebase) {
      const stopChess = await startChessWatcher();
      cleanups.push(stopChess);
    }

    // 4. Start PVP agent (needs Firebase)
    if (!noPvp && !chatOnly && hasFirebase) {
      const stopPvp = await startPvpAgent();
      cleanups.push(stopPvp);
    } else if (hasFirebase) {
      console.log('[Main] PVP agent disabled' + (noPvp ? ' (--no-pvp flag)' : ' (--chat-only flag)'));
    }

    // 4.5 Start world WebSocket bridge (local clients bypass Firebase)
    const stopWorldWs = startWorldWsBridge();
    cleanups.push(stopWorldWs);

    // 5. Start world responder (always — uses local inject when local stream)
    await startWorldResponder();

    // 5.5 Start lightweight autonomous world routines
    const stopWorldAutonomy = startWorldAutonomousRoutines();
    cleanups.push(stopWorldAutonomy);

    // 5.6–5.8 Firebase-dependent services (start when Firebase available)
    if (hasFirebase) {
      const stopPoints = await startLawbPoints();
      cleanups.push(stopPoints);
      const stopGallerySync = await startWorldGallerySync();
      cleanups.push(stopGallerySync);
      const stopBountyPayouts = startBountyPayoutProcessor();
      cleanups.push(stopBountyPayouts);
    }

    // 6. Start Retake.TV streamer (unless disabled)
    if (!noStream && !chatOnly) {
      const stopStream = await startRetakeStreamer();
      cleanups.push(stopStream);
    } else if (noStream) {
      console.log('[Main] Retake streamer disabled (--no-stream flag)');
    }

    // 7. Heartbeat every 30s (no-op when local stream)
    const heartbeatInterval = setInterval(() => heartbeat(), 30_000);
    cleanups.push(() => clearInterval(heartbeatInterval));

    console.log('');
    console.log('  Clawb is alive. the sea remembers.');
    console.log('  Press Ctrl+C to shut down.');
    console.log('');
  } catch (err) {
    console.error('[Main] Fatal error during startup:', err);
    await setClawbOffline();
    process.exit(1);
  }

  // --- Graceful shutdown ---
  async function shutdown() {
    console.log('\n[Main] Shutting down Clawb...');
    for (const cleanup of cleanups) {
      try { cleanup(); } catch {}
    }
    await setClawbOffline();
    console.log('[Main] Clawb is offline. there is no meme i lawb you.');
    process.exit(0);
  }

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  // Crash guard — log errors but don't die. Keeps Clawb alive through transient failures.
  process.on('uncaughtException', (err) => {
    console.error('[Main] Uncaught exception (non-fatal, continuing):', err.message || err);
  });
  process.on('unhandledRejection', (reason) => {
    console.error('[Main] Unhandled rejection (non-fatal, continuing):', reason?.message || reason);
  });
}

main().catch(async (err) => {
  console.error('[Main] Unhandled startup error:', err);
  await setClawbOffline();
  process.exit(1);
});
