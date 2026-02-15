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

// Safety limits — adjust these as you get comfortable
const MAX_WAGER_ETH = 0.001;           // Max ETH per game
const MAX_WAGER_ERC20 = 10_000_000;    // Max ERC20 (raw, check decimals)
const MAX_CONCURRENT_GAMES = 1;        // Only 1 game at a time
const ONLY_BASE_CHAIN = true;          // Only join games on Base

// --- Contract ABI (minimal for joinGame + reading) ---
const CHESS_ABI = [
  'function joinGame(bytes6 inviteCode) payable',
  'function games(bytes6) view returns (address player1, address player2, bool isActive, address winner, bytes6 inviteCode, uint256 wagerAmount, address wagerToken, uint8 wagerType, uint256 player1TokenId, uint256 player2TokenId)',
  'function playerToGame(address) view returns (bytes6)',
];

const ERC20_ABI = [
  'function approve(address spender, uint256 amount) returns (bool)',
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function allowance(address owner, address spender) view returns (uint256)',
];

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

  // Check wager limits
  const wagerAmount = game.bet_amount || 0;
  const wagerToken = game.bet_token || ethers.ZeroAddress;
  const isNativeETH = wagerToken === ethers.ZeroAddress || wagerToken === '0x0000000000000000000000000000000000000000';

  if (isNativeETH) {
    const wagerEth = parseFloat(ethers.formatEther(wagerAmount.toString()));
    if (wagerEth > MAX_WAGER_ETH) {
      console.log(`[PVP] Skipping ${game.id}: wager ${wagerEth} ETH exceeds limit ${MAX_WAGER_ETH}`);
      return false;
    }
  } else {
    if (BigInt(wagerAmount) > BigInt(MAX_WAGER_ERC20)) {
      console.log(`[PVP] Skipping ${game.id}: wager exceeds ERC20 limit`);
      return false;
    }
  }

  // Check if we can afford it
  try {
    if (isNativeETH) {
      const balance = await provider.getBalance(wallet.address);
      const needed = BigInt(wagerAmount) + ethers.parseEther('0.001'); // buffer for gas
      if (balance < needed) {
        console.log(`[PVP] Skipping ${game.id}: insufficient ETH balance`);
        return false;
      }
    } else {
      const token = new ethers.Contract(wagerToken, ERC20_ABI, wallet);
      const balance = await token.balanceOf(wallet.address);
      if (balance < BigInt(wagerAmount)) {
        console.log(`[PVP] Skipping ${game.id}: insufficient token balance`);
        return false;
      }
    }
  } catch (err) {
    console.error(`[PVP] Balance check failed for ${game.id}:`, err.message);
    return false;
  }

  return true;
}

// --- Join a game on-chain ---
async function joinGameOnChain(game) {
  const inviteCode = game.invite_code || game.id;
  const wagerAmount = game.bet_amount || 0;
  const wagerToken = game.bet_token || ethers.ZeroAddress;
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

    // Convert invite code to bytes6
    const inviteBytes = ethers.hexlify(ethers.toUtf8Bytes(inviteCode.slice(0, 6)));
    const padded = inviteBytes.padEnd(14, '0'); // bytes6 = 12 hex chars + 0x prefix

    const tx = await chessContract.joinGame(padded, {
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

    // Is it Clawb's turn?
    if (game.current_player !== clawbColor) return;

    // Opponent just moved — optionally comment (throttled)
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

    // Get the FEN and ask Stockfish for a move
    try {
      const board = game.board;
      if (!board || !board.positions) return;

      // We need the FEN — if it's stored, use it; otherwise we'd need to reconstruct it
      // For now, call Stockfish with a position description
      const fen = game.fen || boardPositionsToFEN(board.positions, clawbColor);
      if (!fen) return;

      console.log(`[PVP] ${inviteCode}: Clawb's turn. FEN: ${fen}`);
      const move = await getStockfishMove(fen);
      if (!move) {
        console.error(`[PVP] ${inviteCode}: No move from Stockfish`);
        return;
      }

      // Parse the move (e.g., "e2e4") into board coordinates
      const fromCol = move.charCodeAt(0) - 97;
      const fromRow = 8 - parseInt(move[1]);
      const toCol = move.charCodeAt(2) - 97;
      const toRow = 8 - parseInt(move[3]);

      // Update the game in Firebase (frontend uses "row_col" keys, e.g. "0_0")
      const newPositions = { ...board.positions };
      const pieceKeyFrom = posKey(fromRow, fromCol);
      const pieceKeyTo = posKey(toRow, toCol);
      const piece = newPositions[pieceKeyFrom] ?? newPositions[`${fromRow},${fromCol}`];
      if (piece) {
        delete newPositions[pieceKeyFrom];
        delete newPositions[`${fromRow},${fromCol}`];
        newPositions[pieceKeyTo] = piece;
      }

      await updateGame(inviteCode, {
        board: { positions: newPositions, rows: 8, cols: 8 },
        current_player: clawbColor === 'red' ? 'blue' : 'red',
        last_move: { from: { row: fromRow, col: fromCol }, to: { row: toRow, col: toCol } },
        last_move_timestamp: Date.now(),
      });

      console.log(`[PVP] ${inviteCode}: Played ${move}`);
    } catch (err) {
      console.error(`[PVP] ${inviteCode}: Error making move:`, err.message);
    }
  });
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
    return data.bestmove || null;
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
function boardPositionsToFEN(positions, currentColor) {
  const board = Array(8).fill(null).map(() => Array(8).fill(null));

  for (const [key, piece] of Object.entries(positions)) {
    const parts = key.split(/[,_]/).map(Number);
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
        fen += (p.length === 1 ? p : pieceToFen[p]) || '?';
      }
    }
    if (empty > 0) fen += empty;
    if (row < 7) fen += '/';
  }

  const turn = currentColor === 'blue' ? 'w' : 'b';
  fen += ` ${turn} KQkq - 0 1`;
  return fen;
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
  console.log(`[PVP] Max wager: ${MAX_WAGER_ETH} ETH, ${MAX_WAGER_ERC20} ERC20`);
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

  return stopListening;
}

// Run standalone
if (process.argv[1] && process.argv[1].includes('chess-pvp-agent')) {
  startPvpAgent().catch(console.error);
  process.on('SIGINT', () => { console.log('\n[PVP] Shutting down...'); process.exit(0); });
}
