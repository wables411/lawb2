/**
 * index.js — Clawb Agent Main Entry Point
 *
 * Starts all Clawb services:
 * 1. Chat responder — answers visitor messages via Claude
 * 2. Chess watcher — posts commentary on vs Clawb games
 * 3. PVP agent — joins and plays on-chain wager games (optional)
 * 4. Status heartbeat — keeps Clawb's online status fresh
 *
 * Usage: node index.js [--no-pvp] [--chat-only]
 */

import { setClawbOnline, setClawbOffline, heartbeat } from './lawb-firebase.js';
import { startChatResponder } from './lawb-chat-responder.js';
import { startChessWatcher } from './chess-clawb-watcher.js';
import { startPvpAgent } from './chess-pvp-agent.js';

const args = process.argv.slice(2);
const noPvp = args.includes('--no-pvp');
const chatOnly = args.includes('--chat-only');

async function main() {
  console.log('');
  console.log('  🦞 Clawb Agent starting...');
  console.log('  ─────────────────────────');
  console.log('');

  const cleanups = [];

  try {
    // 1. Go online
    await setClawbOnline('idle');
    console.log('[Main] Clawb is online.');

    // 2. Start chat responder (always)
    const stopChat = await startChatResponder();
    cleanups.push(stopChat);

    // 3. Start chess watcher (unless chat-only)
    if (!chatOnly) {
      const stopChess = await startChessWatcher();
      cleanups.push(stopChess);
    }

    // 4. Start PVP agent (unless disabled)
    if (!noPvp && !chatOnly) {
      const stopPvp = await startPvpAgent();
      cleanups.push(stopPvp);
    } else {
      console.log('[Main] PVP agent disabled' + (noPvp ? ' (--no-pvp flag)' : ' (--chat-only flag)'));
    }

    // 5. Heartbeat every 30s
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
}

main().catch(async (err) => {
  console.error('[Main] Unhandled error:', err);
  await setClawbOffline();
  process.exit(1);
});
