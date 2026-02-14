/**
 * chess-pvp-agent.js — Clawb's on-chain PVP chess agent
 *
 * Watches Firebase for open PVP games, evaluates whether to join,
 * joins on-chain with Clawb's wallet, then plays moves via Stockfish.
 *
 * SAFETY: Conservative defaults. Max wager limits enforced. Base chain only.
 *
 * Run standalone: node chess-pvp-agent.js
 */

import { ethers } from 'ethers';
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
    await postGameChatMessage(inviteCode, 'the lobster has entered. there is no meme i lawb you.');

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

    // Game over
    if (game.game_state === 'finished' || game.game_state === 'cancelled') {
      gameRef.off('value', listener);
      activeGames = Math.max(0, activeGames - 1);
      await updateClawbActivity('idle');
      console.log(`[PVP] Game ${inviteCode} ended: ${game.game_state}`);
      return;
    }

    // Is it Clawb's turn?
    const clawbColor = game.red_player?.toLowerCase() === CLAWB_WALLET.toLowerCase() ? 'red' : 'blue';
    if (game.current_player !== clawbColor) return;

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

      // Update the game in Firebase
      const newPositions = { ...board.positions };
      const pieceKey = `${fromRow},${fromCol}`;
      const piece = newPositions[pieceKey];
      if (piece) {
        delete newPositions[pieceKey];
        newPositions[`${toRow},${toCol}`] = piece;
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

// --- FEN helper (simplified) ---
function boardPositionsToFEN(positions, currentColor) {
  // Build an 8x8 board from positions map
  const board = Array(8).fill(null).map(() => Array(8).fill(null));

  for (const [key, piece] of Object.entries(positions)) {
    const [row, col] = key.split(',').map(Number);
    if (row >= 0 && row < 8 && col >= 0 && col < 8) {
      board[row][col] = piece;
    }
  }

  // Convert to FEN
  const pieceMap = {
    'white-king': 'K', 'white-queen': 'Q', 'white-rook': 'R',
    'white-bishop': 'B', 'white-knight': 'N', 'white-pawn': 'P',
    'black-king': 'k', 'black-queen': 'q', 'black-rook': 'r',
    'black-bishop': 'b', 'black-knight': 'n', 'black-pawn': 'p',
    // Lawb chess uses blue/red
    'blue-king': 'K', 'blue-queen': 'Q', 'blue-rook': 'R',
    'blue-bishop': 'B', 'blue-knight': 'N', 'blue-pawn': 'P',
    'red-king': 'k', 'red-queen': 'q', 'red-rook': 'r',
    'red-bishop': 'b', 'red-knight': 'n', 'red-pawn': 'p',
  };

  let fen = '';
  for (let row = 0; row < 8; row++) {
    let empty = 0;
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (!piece) {
        empty++;
      } else {
        if (empty > 0) { fen += empty; empty = 0; }
        fen += pieceMap[piece] || '?';
      }
    }
    if (empty > 0) fen += empty;
    if (row < 7) fen += '/';
  }

  // Add turn, castling, en passant, halfmove, fullmove (simplified)
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
