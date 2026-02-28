/**
 * chess-clawb-watcher.js — Clawb's chess commentary
 *
 * Watches "vs Clawb" games on Firebase and posts commentary to the game's
 * private chat room. The actual chess AI (Stockfish) runs on the frontend —
 * this just adds Clawb's personality to the experience.
 *
 * Run standalone: node chess-clawb-watcher.js
 */

import OpenAI from 'openai';
import {
  onVsClawbGame,
  postGameChatMessage,
  updateClawbActivity,
} from './lawb-firebase.js';
import { enqueueVsClawbFirstWinBounty } from './lawb-points.js';

// --- Config ---
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
if (!OPENROUTER_API_KEY) {
  console.error('[Chess] OPENROUTER_API_KEY not set. Add it to .env');
  process.exit(1);
}

const openrouter = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: OPENROUTER_API_KEY,
  defaultHeaders: {
    'HTTP-Referer': 'https://lawb.xyz',
    'X-Title': 'Clawb Agent',
  },
});

// Model for chess commentary (fast + cheap)
const CHESS_MODEL = process.env.CLAWB_CHESS_MODEL || 'anthropic/claude-3.5-haiku';

const CLAWB_WALLET = '0x5bBA58218914F2e9b6b5434e0306fa2c6CA0E429';

// Track games we've already commented on (to avoid spamming)
const commentedMoves = new Map(); // gameId -> last move timestamp we commented on
const commentedGames = new Set(); // games we've sent a greeting for

function normalizeWallet(value) {
  const s = String(value || '').trim();
  if (!s) return '';
  return s.startsWith('0x') ? s.toLowerCase() : s;
}

function resolveWinnerWallet(game) {
  const winner = String(game?.winner || '').trim();
  if (!winner) return '';
  if (winner === 'blue') return normalizeWallet(game?.blue_player);
  if (winner === 'red') return normalizeWallet(game?.red_player);
  return normalizeWallet(winner);
}

// --- Commentary prompt ---
const CHESS_SYSTEM = `You are Clawb, a lobster playing chess. Brief, warm, slightly cocky.
You're playing as red (the AI). Generate a 1-sentence comment about the game.
No emojis. No exclamation marks on every sentence. Your catchphrase: "there is no meme i lawb you."

Examples:
- "nice fork. the ocean teaches patience."
- "you took my bishop. bold."
- "the position opens up. i see things you don't."
- "gg. the lawb endures."
- "careful where you step. the board remembers."`;

// --- Handler ---
async function handleGameUpdate(game) {
  const { id, game_state, game_type, current_player, last_move_timestamp, winner, end_reason, board, last_move, fen } = game;

  // Only care about vs_clawb games
  if (game_type !== 'vs_clawb') return;

  // Game just started — greet
  if (game_state === 'active' && !commentedGames.has(id)) {
    commentedGames.add(id);
    await updateClawbActivity('playing chess');
    const greeting = await generateComment('Game just started. You are red (the AI). The visitor made the opening move. Greet them briefly.');
    if (greeting) {
      await postGameChatMessage(id, greeting);
      console.log(`[Chess] ${id}: "${greeting}"`);
    }
    return;
  }

  // Game finished
  if (game_state === 'finished') {
    const lastComment = commentedMoves.get(id);
    if (lastComment === 'finished') return;
    commentedMoves.set(id, 'finished');

    await updateClawbActivity('idle');

    let prompt;
    if (winner === 'red') {
      prompt = `You won the chess game by ${end_reason || 'checkmate'}. Brief victory comment.`;
    } else if (winner === 'blue') {
      prompt = `You lost the chess game (${end_reason || 'checkmate'}). Brief gracious loss comment.`;
    } else {
      prompt = `The chess game ended in a draw (${end_reason || 'stalemate'}). Brief comment.`;
    }

    const comment = await generateComment(prompt);
    if (comment) {
      await postGameChatMessage(id, comment);
      console.log(`[Chess] ${id} (end): "${comment}"`);
    }

    // First-win bounty queue: player beat Clawb in a vs_clawb match.
    const redWallet = normalizeWallet(game.red_player);
    const winnerWallet = resolveWinnerWallet(game);
    const clawbWallet = CLAWB_WALLET.toLowerCase();
    const clawbInSeat = redWallet === clawbWallet;
    const clawbLost = winnerWallet && winnerWallet !== clawbWallet;
    if (clawbInSeat && clawbLost) {
      try {
        const queued = await enqueueVsClawbFirstWinBounty(winnerWallet, {
          game_id: id,
          game_type,
          winner,
          winner_wallet: winnerWallet,
          end_reason: end_reason || 'checkmate',
        });
        if (queued.success) {
          console.log(`[Chess] queued vs_clawb first-win bounty for ${winnerWallet}`);
        } else {
          console.warn(`[Chess] vs_clawb bounty not queued for ${winnerWallet}: ${queued.reason || 'unknown_reason'}`);
        }
      } catch (err) {
        console.error(`[Chess] vs_clawb bounty queue failed for ${winnerWallet}:`, err?.message || err);
      }
    } else {
      console.log('[Chess] vs_clawb first-win bounty skipped', {
        gameId: id,
        clawbInSeat,
        clawbLost,
        winner,
        winnerWallet,
        redWallet,
      });
    }
    return;
  }

  // Game cancelled
  if (game_state === 'cancelled') {
    commentedMoves.set(id, 'cancelled');
    await updateClawbActivity('idle');
    return;
  }

  // Mid-game move — only comment occasionally (not every move)
  if (game_state === 'active' && last_move_timestamp) {
    const lastCommented = commentedMoves.get(id);
    if (lastCommented === last_move_timestamp) return;

    if (Math.random() > 0.35) {
      commentedMoves.set(id, last_move_timestamp);
      return;
    }

    commentedMoves.set(id, last_move_timestamp);

    const turnInfo = current_player === 'blue'
      ? "It's the visitor's turn now (you just moved)."
      : "It's your turn (visitor just moved).";
    const pieceCount = board?.positions ? Object.keys(board.positions).length : '?';
    const moveDesc = last_move
      ? ` Last move: (${last_move.from?.row},${last_move.from?.col}) to (${last_move.to?.row},${last_move.to?.col}).`
      : '';
    const fenDesc = fen ? ` FEN: ${fen}.` : '';
    const prompt = `Mid-game chess position. ${pieceCount} pieces remaining.${moveDesc}${fenDesc} ${turnInfo} Comment on the game state in 1 sentence.`;
    const comment = await generateComment(prompt);
    if (comment) {
      await postGameChatMessage(id, comment);
      console.log(`[Chess] ${id}: "${comment}"`);
    }
  }
}

async function generateComment(situationPrompt) {
  try {
    const response = await openrouter.chat.completions.create({
      model: CHESS_MODEL,
      max_tokens: 100,
      messages: [
        { role: 'system', content: CHESS_SYSTEM },
        { role: 'user', content: situationPrompt },
      ],
    });
    return response.choices?.[0]?.message?.content?.trim() || null;
  } catch (err) {
    console.error('[Chess] OpenRouter error:', err.message);
    return null;
  }
}

// --- Main ---
export async function startChessWatcher() {
  console.log(`[Chess] Starting Clawb chess watcher (model: ${CHESS_MODEL})...`);
  const stopListening = onVsClawbGame(handleGameUpdate);
  console.log('[Chess] Watching for vs Clawb games.');
  return stopListening;
}

// Run standalone
if (process.argv[1] && process.argv[1].includes('chess-clawb-watcher')) {
  startChessWatcher().catch(console.error);

  process.on('SIGINT', () => {
    console.log('\n[Chess] Shutting down...');
    process.exit(0);
  });
}
