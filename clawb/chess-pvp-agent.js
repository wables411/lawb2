/**
 * chess-pvp-agent.js — Clawb's on-chain PVP chess agent
 *
 * Watches Firebase for open PVP games, evaluates whether to join,
 * joins on-chain with Clawb's wallet, then plays moves via Stockfish.
 * Observes the board and commentates in game chat (mid-game + end-game).
 *
 * SAFETY: Conservative defaults. Max wager limits enforced. Base chain only.
 *
 * Run standalone: node chess-pvp-agent.js
 */

import { ethers } from 'ethers';
import { Chess } from 'chess.js';
import OpenAI from 'openai';
import {
  onOpenPvpGames,
  updateGame,
  postGameChatMessage,
  updateClawbActivity,
  db,
} from './lawb-firebase.js';

// --- Config ---
const CLAWB_WALLET = '0x5bBA58218914F2e9b6b5434e0306fa2c6CA0E429';
const CHESS_CONTRACT_BASE = '0x06b6aAe693cf1Af27d5a5df0d0AC88aF3faC9E11';
const BASE_CHAIN_ID = 8453;
const STOCKFISH_API = process.env.STOCKFISH_API_URL || 'https://chess.lawb.xyz/api/stockfish';

// Safety limits
const MAX_CONCURRENT_GAMES = 1;        // Only 1 game at a time
const ONLY_BASE_CHAIN = true;          // Only join games on Base
// Join only if wager <= 50% of Clawb's balance for the match's token

// 60-minute per-move timeout (matches frontend)
const GAME_TIMEOUT_MS = 60 * 60 * 1000;

// --- Contract ABI (minimal for joinGame, endGame + reading) ---
const CHESS_ABI = [
  'function joinGame(bytes6 inviteCode) payable',
  'function endGame(bytes6 inviteCode, address winner)',
  'function games(bytes6) view returns (address player1, address player2, bool isActive, address winner, bytes6 inviteCode, uint256 wagerAmount, address wagerToken, uint8 wagerType, uint256 player1TokenId, uint256 player2TokenId)',
  'function playerToGame(address) view returns (bytes6)',
];

const ERC20_ABI = [
  'function approve(address spender, uint256 amount) returns (bool)',
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function allowance(address owner, address spender) view returns (uint256)',
];

// Convert Firebase invite_code (string or 0x hex) to bytes6 for contract calls
function inviteCodeToBytes6(inviteCode) {
  const raw = (inviteCode || '').toString();
  if (raw.startsWith('0x') && raw.length === 14) return raw;
  const bytes = ethers.hexlify(ethers.toUtf8Bytes(raw.slice(0, 6)));
  return bytes.padEnd(14, '0');
}

// --- Commentary (optional: same voice as vs_clawb watcher) ---
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
let openrouter = null;
if (OPENROUTER_API_KEY) {
  openrouter = new OpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: OPENROUTER_API_KEY,
    defaultHeaders: {
      'HTTP-Referer': 'https://lawb.xyz',
      'X-Title': 'Clawb Agent',
    },
  });
}
const CHESS_COMMENTARY_MODEL = process.env.CLAWB_CHESS_MODEL || 'anthropic/claude-3.5-haiku';

const CHESS_SYSTEM = `You are Clawb, a lobster playing chess. Brief, warm, slightly cocky.
You're playing as red or blue in a PVP wager game. Generate a 1-sentence comment about the game.
No emojis. No exclamation marks on every sentence. Your catchphrase: "there is no meme i lawb you."

Examples:
- "nice fork. the ocean teaches patience."
- "you took my bishop. bold."
- "the position opens up. i see things you don't."
- "gg. the lawb endures."
- "careful where you step. the board remembers."`;

// Per-game commentary state: end-game posted, last move timestamp we commented on, comment count (for throttle)
const pvpCommentedEndGame = new Set();
const pvpLastCommentedMove = new Map(); // inviteCode -> last_move_timestamp
const pvpCommentCount = new Map();       // inviteCode -> number of mid-game comments we've done
const PVP_COMMENT_EVERY_N_MOVES = 3;     // comment roughly every 3rd opponent move

async function generatePvpComment(situationPrompt) {
  if (!openrouter) return null;
  try {
    const response = await openrouter.chat.completions.create({
      model: CHESS_COMMENTARY_MODEL,
      max_tokens: 100,
      messages: [
        { role: 'system', content: CHESS_SYSTEM },
        { role: 'user', content: situationPrompt },
      ],
    });
    return response.choices?.[0]?.message?.content?.trim() || null;
  } catch (err) {
    console.error('[PVP] Commentary OpenRouter error:', err.message);
    return null;
  }
}

// --- State ---
let activeGames = 0;
let provider = null;
let wallet = null;
let chessContract = null;

// --- Initialize wallet ---
function initWallet() {
  const privateKey = process.env.CLAWB_PRIVATE_KEY;
  if (!privateKey) {
    console.error('[PVP] CLAWB_PRIVATE_KEY not set. PVP agent disabled.');
    return false;
  }

  const rpcUrl = process.env.BASE_RPC_URL || 'https://mainnet.base.org';
  provider = new ethers.JsonRpcProvider(rpcUrl);
  wallet = new ethers.Wallet(privateKey, provider);
  chessContract = new ethers.Contract(CHESS_CONTRACT_BASE, CHESS_ABI, wallet);

  console.log(`[PVP] Wallet: ${wallet.address}`);
  if (wallet.address.toLowerCase() !== CLAWB_WALLET.toLowerCase()) {
    console.error('[PVP] WARNING: Wallet address does not match CLAWB_WALLET!');
    console.error(`[PVP] Expected: ${CLAWB_WALLET}`);
    console.error(`[PVP] Got:      ${wallet.address}`);
  }
  return true;
}

// Use full token address for contract calls (Firebase may have bet_token as symbol or truncated)
function getWagerTokenAddress(game) {
  const addr = game.bet_token_address || game.bet_token;
  if (!addr) return ethers.ZeroAddress;
  const s = String(addr).trim();
  if (s === '0x0000000000000000000000000000000000000000') return ethers.ZeroAddress;
  if (/^0x[0-9a-fA-F]{40}$/.test(s)) return s;
  return null; // not a valid full address (truncated or symbol)
}

// --- Evaluate whether to join a game ---
async function shouldJoinGame(game) {
  // Only Base chain
  if (ONLY_BASE_CHAIN && game.chain && game.chain !== 'base') {
    console.log(`[PVP] Skipping ${game.id}: not Base chain (${game.chain})`);
    return false;
  }

  // Don't exceed concurrent game limit
  if (activeGames >= MAX_CONCURRENT_GAMES) {
    console.log(`[PVP] Skipping ${game.id}: already in ${activeGames} game(s)`);
    return false;
  }

  // Don't join our own games
  if (game.blue_player?.toLowerCase() === CLAWB_WALLET.toLowerCase()) {
    return false;
  }

  const wagerAmount = BigInt(game.bet_amount || 0);
  const wagerToken = getWagerTokenAddress(game);
  if (wagerToken === null) {
    console.log(`[PVP] Skipping ${game.id}: invalid or truncated token address (use bet_token_address)`);
    return false;
  }
  const isNativeETH = wagerToken === ethers.ZeroAddress || wagerToken === '0x0000000000000000000000000000000000000000';

  try {
    let balance;
    if (isNativeETH) {
      balance = await provider.getBalance(wallet.address);
      const gasBuffer = ethers.parseEther('0.001');
      if (balance < wagerAmount + gasBuffer) {
        console.log(`[PVP] Skipping ${game.id}: insufficient ETH (need wager + gas)`);
        return false;
      }
    } else {
      const token = new ethers.Contract(wagerToken, ERC20_ABI, wallet);
      balance = await token.balanceOf(wallet.address);
      if (balance < wagerAmount) {
        console.log(`[PVP] Skipping ${game.id}: insufficient token balance`);
        return false;
      }
    }

    const maxWagerAllowed = balance / 2n; // 50% of balance
    if (wagerAmount > maxWagerAllowed) {
      console.log(`[PVP] Skipping ${game.id}: wager exceeds 50% of Clawb's balance for this token`);
      return false;
    }
  } catch (err) {
    console.error(`[PVP] Balance check failed for ${game.id}:`, err.message);
    return false;
  }

  return true;
}

// --- End game on-chain (e.g. when opponent times out) ---
async function endGameOnChain(inviteCode, winnerAddress) {
  try {
    const inviteBytes = inviteCodeToBytes6(inviteCode);
    const tx = await chessContract.endGame(inviteBytes, winnerAddress);
    console.log(`[PVP] endGame TX sent: ${tx.hash}`);
    await tx.wait();
    console.log(`[PVP] endGame confirmed for ${inviteCode}, winner: ${winnerAddress}`);
    return true;
  } catch (err) {
    console.error(`[PVP] endGame failed for ${inviteCode}:`, err.message);
    return false;
  }
}

// --- Join a game on-chain ---
async function joinGameOnChain(game) {
  const inviteCode = game.invite_code || game.id;
  const wagerAmount = game.bet_amount || 0;
  const wagerToken = getWagerTokenAddress(game);
  if (wagerToken === null) {
    console.log(`[PVP] Cannot join ${inviteCode}: invalid or truncated token address`);
    return false;
  }
  const isNativeETH = wagerToken === ethers.ZeroAddress || wagerToken === '0x0000000000000000000000000000000000000000';

  console.log(`[PVP] Joining game ${inviteCode} (wager: ${wagerAmount}, token: ${wagerToken})`);

  try {
    // Approve ERC20 if needed
    if (!isNativeETH) {
      const token = new ethers.Contract(wagerToken, ERC20_ABI, wallet);
      const currentAllowance = await token.allowance(wallet.address, CHESS_CONTRACT_BASE);
      if (currentAllowance < BigInt(wagerAmount)) {
        console.log(`[PVP] Approving token spend...`);
        const approveTx = await token.approve(CHESS_CONTRACT_BASE, wagerAmount);
        await approveTx.wait();
        console.log(`[PVP] Token approved.`);
      }
    }

    const inviteBytes = inviteCodeToBytes6(inviteCode);
    const tx = await chessContract.joinGame(inviteBytes, {
      value: isNativeETH ? wagerAmount : 0,
    });
    console.log(`[PVP] Join TX sent: ${tx.hash}`);
    const receipt = await tx.wait();
    console.log(`[PVP] Joined game ${inviteCode}! Block: ${receipt.blockNumber}`);

    activeGames++;
    await updateClawbActivity('playing chess (pvp)');
    await postGameChatMessage(inviteCode, 'the lawbster has entered. there is no meme i lawb you.');

    // Start playing this game
    watchAndPlayGame(inviteCode);
    return true;
  } catch (err) {
    console.error(`[PVP] Failed to join game ${inviteCode}:`, err.message);
    return false;
  }
}

// --- Play moves in an active PVP game ---
async function watchAndPlayGame(inviteCode) {
  const gameRef = db.ref(`chess_games/${inviteCode}`);

  const listener = gameRef.on('value', async (snapshot) => {
    const game = snapshot.val();
    if (!game) return;

    const clawbColor = game.red_player?.toLowerCase() === CLAWB_WALLET.toLowerCase() ? 'red' : 'blue';

    // Game over — comment then cleanup
    if (game.game_state === 'finished' || game.game_state === 'cancelled') {
      if (game.game_state === 'finished' && !pvpCommentedEndGame.has(inviteCode)) {
        pvpCommentedEndGame.add(inviteCode);
        const winner = game.winner;
        const endReason = game.end_reason || 'game over';
        let prompt;
        if (winner?.toLowerCase() === CLAWB_WALLET.toLowerCase()) {
          prompt = `You won the PVP chess game. ${endReason}. Brief victory comment.`;
        } else if (winner) {
          prompt = `You lost the PVP chess game. ${endReason}. Brief gracious loss comment.`;
        } else {
          prompt = `The PVP chess game ended in a draw. ${endReason}. Brief comment.`;
        }
        const comment = await generatePvpComment(prompt);
        if (comment) {
          await postGameChatMessage(inviteCode, comment);
          console.log(`[PVP] ${inviteCode} (end): "${comment}"`);
        }
      }
      gameRef.off('value', listener);
      activeGames = Math.max(0, activeGames - 1);
      await updateClawbActivity('idle');
      pvpLastCommentedMove.delete(inviteCode);
      pvpCommentCount.delete(inviteCode);
      console.log(`[PVP] Game ${inviteCode} ended: ${game.game_state}`);
      return;
    }

    // Opponent's turn: check 60-minute timeout (opponent didn't move in time → Clawb wins)
    if (game.current_player !== clawbColor) {
      const lastTs = game.last_move_timestamp;
      if (lastTs && (Date.now() - lastTs > GAME_TIMEOUT_MS)) {
        console.log(`[PVP] ${inviteCode}: Opponent timed out (60 min). Claiming win for Clawb.`);
        gameRef.off('value', listener);
        const ok = await endGameOnChain(inviteCode, CLAWB_WALLET);
        if (ok) {
          await updateGame(inviteCode, {
            game_state: 'finished',
            winner: CLAWB_WALLET,
            end_reason: 'Opponent timed out (60 min)',
          });
          await postGameChatMessage(inviteCode, 'the clock ran out. the lawb endures. there is no meme i lawb you.');
        }
        activeGames = Math.max(0, activeGames - 1);
        await updateClawbActivity('idle');
        pvpCommentedEndGame.add(inviteCode);
        pvpLastCommentedMove.delete(inviteCode);
        pvpCommentCount.delete(inviteCode);
        return;
      }
      return; // Opponent's turn, not timed out — wait for their move
    }

    // Clawb's turn — optionally comment on opponent's last move (throttled)
    const lastTs = game.last_move_timestamp;
    if (lastTs && openrouter) {
      const alreadyCommented = pvpLastCommentedMove.get(inviteCode) === lastTs;
      if (!alreadyCommented) {
        pvpLastCommentedMove.set(inviteCode, lastTs);
        const count = (pvpCommentCount.get(inviteCode) || 0) + 1;
        pvpCommentCount.set(inviteCode, count);
        if (count % PVP_COMMENT_EVERY_N_MOVES === 0) {
          const comment = await generatePvpComment(
            'Opponent just moved. It\'s your turn. Comment on the game state in 1 sentence.'
          );
          if (comment) {
            await postGameChatMessage(inviteCode, comment);
            console.log(`[PVP] ${inviteCode}: "${comment}"`);
          }
        }
      }
    }

    // Chess setup: see .cursor/rules/coding-conventions.md (creator=blue=first, joiner=red=second; red=uppercase, blue=lowercase). Clawb only joins → always red; only move red pieces.

    // Get the FEN and ask Stockfish for a move
    try {
      const board = game.board;
      if (!board || !board.positions) {
        console.error(`[PVP] ${inviteCode}: No board or positions`);
        return;
      }

      let fen = game.fen || boardPositionsToFEN(board.positions, clawbColor);
      if (!fen) {
        console.error(`[PVP] ${inviteCode}: Could not build FEN from positions (missing or invalid)`);
        return;
      }
      if (!game.fen) console.log(`[PVP] ${inviteCode}: Using FEN from board positions (none stored)`);

      console.log(`[PVP] ${inviteCode}: Clawb's turn. FEN: ${fen}`);
      const moveUCI = await getStockfishMove(fen);
      if (!moveUCI) {
        console.error(`[PVP] ${inviteCode}: No move from Stockfish`);
        return;
      }

      const validated = validateMove(fen, moveUCI);
      if (!validated) {
        console.error(`[PVP] ${inviteCode}: Could not validate move "${moveUCI}" (no fallback)`);
        return;
      }
      // Convert SAN squares to row/col (a1 = 7,0; h8 = 0,7)
      const fromCol = validated.from.charCodeAt(0) - 97;
      const fromRow = 8 - (parseInt(validated.from[1]));
      const toCol = validated.to.charCodeAt(0) - 97;
      const toRow = 8 - (parseInt(validated.to[1]));

      // Update the game in Firebase (frontend uses "row_col" keys, e.g. "0_0")
      const newPositions = { ...board.positions };
      const pieceKeyFrom = posKey(fromRow, fromCol);
      const pieceKeyTo = posKey(toRow, toCol);
      const piece = newPositions[pieceKeyFrom] ?? newPositions[`${fromRow},${fromCol}`];
      // Clawb is always red; red = uppercase. Never move a blue (lowercase) piece.
      if (piece && typeof piece === 'string' && piece.length === 1 && piece === piece.toLowerCase() && /[a-z]/.test(piece)) {
        console.error(`[PVP] ${inviteCode}: Refusing to move blue piece "${piece}" — Clawb only moves red (uppercase) pieces. FEN turn was wrong?`);
        return;
      }
      if (piece) {
        delete newPositions[pieceKeyFrom];
        delete newPositions[`${fromRow},${fromCol}`];
        // Handle pawn promotion (Stockfish uses UCI like g7g8q).
        if (validated.promotion) {
          const promoMap = { q: 'q', r: 'r', b: 'b', n: 'n' };
          const promo = promoMap[String(validated.promotion).toLowerCase()] || 'q';
          const promoPiece = clawbColor === 'red' ? promo.toUpperCase() : promo; // frontend: red=uppercase, blue=lowercase
          newPositions[pieceKeyTo] = promoPiece;
        } else {
          newPositions[pieceKeyTo] = piece;
        }
      }

      await updateGame(inviteCode, {
        board: { positions: newPositions, rows: 8, cols: 8 },
        current_player: clawbColor === 'red' ? 'blue' : 'red',
        last_move: { from: { row: fromRow, col: fromCol }, to: { row: toRow, col: toCol } },
        last_move_timestamp: Date.now(),
      });

      console.log(`[PVP] ${inviteCode}: Played ${validated.from}${validated.to}${validated.promotion ? validated.promotion : ''}`);
    } catch (err) {
      console.error(`[PVP] ${inviteCode}: Error making move:`, err.message);
    }
  });
}

// --- Move validation (chess.js): returns valid { from, to } or null; fallback to first legal move ---
function validateMove(fen, moveUCI) {
  if (!fen || !moveUCI || typeof moveUCI !== 'string') return null;
  const uci = moveUCI.trim().toLowerCase();
  if (uci.length < 4) return null;
  try {
    const chess = new Chess(fen);
    const from = uci.slice(0, 2);
    const to = uci.slice(2, 4);
    const promotion = 'qnrb'.includes(uci[4]) ? uci[4] : undefined;
    const move = chess.move({ from, to, promotion });
    if (move) return { from: move.from, to: move.to, promotion: move.promotion };
    // Illegal: try first legal move as fallback
    const moves = chess.moves({ verbose: true });
    if (moves.length > 0) {
      const first = moves[0];
      console.warn(`[PVP] Stockfish move ${uci} illegal for FEN; using fallback ${first.from}${first.to}`);
      return { from: first.from, to: first.to, promotion: first.promotion };
    }
  } catch (err) {
    console.error('[PVP] validateMove error:', err.message);
  }
  return null;
}

// --- Stockfish helper ---
async function getStockfishMove(fen, movetime = 5000) {
  try {
    const res = await fetch(STOCKFISH_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fen, movetime }),
    });
    const data = await res.json();
    const move = data.bestmove ?? data.best_move ?? data.move ?? null;
    if (!move && res.ok) {
      console.error(`[PVP] Stockfish API returned no move. Response: ${JSON.stringify(data).slice(0, 200)}`);
    }
    return move || null;
  } catch (err) {
    console.error('[PVP] Stockfish API error:', err.message);
    return null;
  }
}

// Position key: frontend uses "row_col" (e.g. "0_0")
function posKey(row, col) {
  return `${row}_${col}`;
}

// --- FEN helper: reads Firebase positions (keys "row_col" or "row,col"), values "K"/"p" etc. ---
function normalizePositions(positions) {
  if (!positions || typeof positions !== 'object') return null;
  // Frontend sends { "0_0": "R", ... }. If Firebase has array of rows, convert to same shape.
  if (Array.isArray(positions) && positions.length === 8) {
    const out = {};
    for (let row = 0; row < 8; row++) {
      const r = positions[row];
      if (!Array.isArray(r) || r.length !== 8) return null;
      for (let col = 0; col < 8; col++) {
        if (r[col]) out[`${row}_${col}`] = r[col];
      }
    }
    return out;
  }
  return positions;
}

function boardPositionsToFEN(positions, currentColor) {
  const normalized = normalizePositions(positions);
  if (!normalized) return null;
  const board = Array(8).fill(null).map(() => Array(8).fill(null));

  for (const [key, piece] of Object.entries(normalized)) {
    if (piece === null || piece === undefined) continue;
    const parts = String(key).split(/[,_]/).map(Number);
    if (parts.length >= 2) {
      const [row, col] = parts;
      if (row >= 0 && row < 8 && col >= 0 && col < 8) {
        board[row][col] = piece;
      }
    }
  }

  const pieceToFen = {
    'white-king': 'K', 'white-queen': 'Q', 'white-rook': 'R', 'white-bishop': 'B', 'white-knight': 'N', 'white-pawn': 'P',
    'black-king': 'k', 'black-queen': 'q', 'black-rook': 'r', 'black-bishop': 'b', 'black-knight': 'n', 'black-pawn': 'p',
    'blue-king': 'K', 'blue-queen': 'Q', 'blue-rook': 'R', 'blue-bishop': 'B', 'blue-knight': 'N', 'blue-pawn': 'P',
    'red-king': 'k', 'red-queen': 'q', 'red-rook': 'r', 'red-bishop': 'b', 'red-knight': 'n', 'red-pawn': 'p',
  };

  let fen = '';
  for (let row = 0; row < 8; row++) {
    let empty = 0;
    for (let col = 0; col < 8; col++) {
      const p = board[row][col];
      if (!p) {
        empty++;
      } else {
        if (empty > 0) { fen += empty; empty = 0; }
        // Firebase/Frontend encoding: red = UPPERCASE (top), blue = lowercase (bottom).
        // Standard FEN encoding: white = UPPERCASE (bottom), black = lowercase (top).
        // Convert so Stockfish/chess.js get standard pawn direction:
        // - blue (lowercase in Firebase) -> white (UPPERCASE in FEN)
        // - red  (UPPERCASE in Firebase) -> black (lowercase in FEN)
        if (typeof p === 'string' && p.length === 1) {
          if (/[a-z]/.test(p)) fen += p.toUpperCase();
          else if (/[A-Z]/.test(p)) fen += p.toLowerCase();
          else fen += p;
        } else {
          fen += pieceToFen[p] || '?';
        }
      }
    }
    if (empty > 0) fen += empty;
    if (row < 7) fen += '/';
  }

  // After conversion above: blue = white, red = black.
  const turn = currentColor === 'blue' ? 'w' : 'b';
  fen += ` ${turn} KQkq - 0 1`;
  try {
    new Chess(fen);
    return fen;
  } catch {
    return null;
  }
}

// --- Game evaluator ---
async function handleOpenGame(game) {
  // Quick checks before full evaluation
  if (game.game_state !== 'waiting_for_join') return;
  if (!game.is_public) return; // Only join public games

  const shouldJoin = await shouldJoinGame(game);
  if (!shouldJoin) return;

  console.log(`[PVP] Evaluating game: ${game.id} (wager: ${game.bet_amount} ${game.bet_token})`);
  await joinGameOnChain(game);
}

// --- Main ---
export async function startPvpAgent() {
  if (!initWallet()) {
    console.log('[PVP] PVP agent not started (no wallet key).');
    return () => {};
  }

  console.log('[PVP] Starting Clawb PVP agent...');
  console.log(`[PVP] Max wager: 50% of balance per token`);
  console.log(`[PVP] Max concurrent games: ${MAX_CONCURRENT_GAMES}`);
  if (openrouter) {
    console.log('[PVP] Commentary enabled (mid-game + end-game in chat).');
  } else {
    console.log('[PVP] Commentary disabled (set OPENROUTER_API_KEY in .env to enable).');
  }

  const balance = await provider.getBalance(wallet.address);
  console.log(`[PVP] ETH balance: ${ethers.formatEther(balance)}`);

  const stopListening = onOpenPvpGames(handleOpenGame);
  console.log('[PVP] Watching for open PVP games.');

  // Resume any active games where Clawb is red (e.g. after agent restart mid-game)
  try {
    const gamesSnap = await db.ref('chess_games').once('value');
    if (gamesSnap.exists()) {
      const games = gamesSnap.val();
      let resumed = 0;
      for (const [inviteCode, game] of Object.entries(games)) {
        if (!game || game.game_state !== 'active') continue;
        const isClawbRed = game.red_player?.toLowerCase() === CLAWB_WALLET.toLowerCase();
        if (!isClawbRed) continue;
        if (activeGames >= MAX_CONCURRENT_GAMES) {
          console.log(`[PVP] Resume: already at max games (${MAX_CONCURRENT_GAMES}), skipping ${inviteCode}`);
          break;
        }
        activeGames++;
        watchAndPlayGame(inviteCode);
        resumed++;
        console.log(`[PVP] Resumed active game ${inviteCode} (Clawb is red).`);
      }
      if (resumed > 0) {
        await updateClawbActivity('playing chess (pvp)');
        console.log(`[PVP] Resumed ${resumed} active game(s).`);
      }
    }
  } catch (err) {
    console.error('[PVP] Resume active games check failed:', err.message);
  }

  return stopListening;
}

// Run standalone
if (process.argv[1] && process.argv[1].includes('chess-pvp-agent')) {
  startPvpAgent().catch(console.error);
  process.on('SIGINT', () => { console.log('\n[PVP] Shutting down...'); process.exit(0); });
}
