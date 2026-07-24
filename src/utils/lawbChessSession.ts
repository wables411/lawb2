// Popup-free moves — app-level session key (LAWBCHESS_ONCHAIN_SPEC §6 path A, browser-submitted).
//
// One-time setup per game (the only wallet confirmations): the player registers an ephemeral
// move-key on-chain (registerMoveKey) and fronts it a sliver of ETH for gas. From then on every
// move is signed locally by the move-key (signMoveWithKey) and SUBMITTED BY THE MOVE-KEY ITSELF
// via makeMoveBySig — zero wallet popups. Leftover gas sweeps back to the player at game end.
//
// Trust model unchanged: the contract verifies the EIP-712 signature against the registered key
// and still derives the winner itself. The key can ONLY make moves for this one game; it holds
// only gas dust; it never leaves this browser (localStorage, cleared on sweep).
//
// PURE MODULE — viem only, no React, no wagmi. The Base Sepolia proof script imports this exact
// file, so what's tested is what ships. Storage is injectable for non-browser callers.

import {
  createPublicClient,
  createWalletClient,
  http,
  type Chain,
  type PublicClient,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { arbitrum, baseSepolia, foundry } from 'viem/chains';
import { LAWB_CHESS_ABI } from '../config/lawbChessAbi';
import {
  generateMoveKey,
  signMoveWithKey,
  type GameCode,
  type MoveKey,
  type MovePayload,
} from './lawbChessMoves';

/** Chains the LawbChess contract is deployed on (see config/lawbChessOnchain.ts). */
const SESSION_CHAINS: Record<number, Chain> = {
  [arbitrum.id]: arbitrum,
  [baseSepolia.id]: baseSepolia,
  // local anvil — proof harness only (scripts/proveSessionMoves.mts); unreachable in the app
  // because getLawbChessAddress(31337) is null, so no UI path ever selects this chain.
  [foundry.id]: foundry,
};

/** Floor for the gas allowance fronted to the move-key (Arbitrum-typical whole-game budget). */
export const SESSION_FUND_WEI = 400_000_000_000_000n; // 0.0004 ETH

/** Gas budget the funding must cover: ~20 moves at a generous 1.5M-gas estimate each
 *  (ordinary moves are far cheaper; mate-detection spikes are the reason for the margin). */
const SESSION_GAS_BUDGET = 30_000_000n;

/** Funding sized from the chain's LIVE gas price so it works on any gas regime
 *  (Arbitrum cents-per-game vs. higher-priced chains), never below the floor. */
export async function computeSessionFunding(chainId: number, rpcUrl?: string): Promise<bigint> {
  const gasPrice = await sessionPublicClient(chainId, rpcUrl).getGasPrice();
  const dynamic = gasPrice * SESSION_GAS_BUDGET;
  return dynamic > SESSION_FUND_WEI ? dynamic : SESSION_FUND_WEI;
}

/** Below ~2 worst-case moves' worth of gas the key needs a top-up (checked at live price). */
export async function sessionKeyLowWater(chainId: number, rpcUrl?: string): Promise<bigint> {
  const gasPrice = await sessionPublicClient(chainId, rpcUrl).getGasPrice();
  const dynamic = gasPrice * 6_000_000n;
  const floor = 80_000_000_000_000n; // 0.00008 ETH
  return dynamic > floor ? dynamic : floor;
}

/** Minimal storage surface so tests can inject a stub instead of window.localStorage. */
export interface KeyStore {
  getItem(k: string): string | null;
  setItem(k: string, v: string): void;
  removeItem(k: string): void;
}

function defaultStore(): KeyStore | null {
  try {
    if (typeof localStorage !== 'undefined') return localStorage;
  } catch {
    /* SSR / privacy mode */
  }
  return null;
}

function storageKey(chainId: number, contract: string, code: GameCode, player: string): string {
  return `lawbchess:movekey:${chainId}:${contract.toLowerCase()}:${code}:${player.toLowerCase()}`;
}

export function loadMoveKey(
  chainId: number,
  contract: `0x${string}`,
  code: GameCode,
  player: `0x${string}`,
  store: KeyStore | null = defaultStore(),
): MoveKey | null {
  if (!store) return null;
  const raw = store.getItem(storageKey(chainId, contract, code, player));
  if (!raw || !/^0x[0-9a-fA-F]{64}$/.test(raw)) return null;
  const privateKey = raw as `0x${string}`;
  return { privateKey, address: privateKeyToAccount(privateKey).address };
}

export function createAndStoreMoveKey(
  chainId: number,
  contract: `0x${string}`,
  code: GameCode,
  player: `0x${string}`,
  store: KeyStore | null = defaultStore(),
): MoveKey {
  const key = generateMoveKey();
  store?.setItem(storageKey(chainId, contract, code, player), key.privateKey);
  return key;
}

export function clearMoveKey(
  chainId: number,
  contract: `0x${string}`,
  code: GameCode,
  player: `0x${string}`,
  store: KeyStore | null = defaultStore(),
): void {
  store?.removeItem(storageKey(chainId, contract, code, player));
}

/** Wallet client acting AS the session key (it pays its own gas; no user wallet involved). */
function sessionWallet(chainId: number, privateKey: `0x${string}`, rpcUrl?: string) {
  const chain = SESSION_CHAINS[chainId];
  if (!chain) throw new Error(`popup-free moves unsupported on chain ${chainId}`);
  return createWalletClient({
    account: privateKeyToAccount(privateKey),
    chain,
    transport: http(rpcUrl),
  });
}

export function sessionPublicClient(chainId: number, rpcUrl?: string): PublicClient {
  const chain = SESSION_CHAINS[chainId];
  if (!chain) throw new Error(`popup-free moves unsupported on chain ${chainId}`);
  return createPublicClient({ chain, transport: http(rpcUrl) });
}

export async function sessionKeyBalance(
  chainId: number,
  address: `0x${string}`,
  rpcUrl?: string,
): Promise<bigint> {
  return sessionPublicClient(chainId, rpcUrl).getBalance({ address });
}

/**
 * Sign the move with the session key and submit makeMoveBySig AS the session key.
 * Returns the tx hash. Throws on any failure — callers fall back to the direct
 * wallet-signed makeMove so a broken session never blocks the game.
 */
export async function submitMoveBySessionKey(
  chainId: number,
  contract: `0x${string}`,
  key: MoveKey,
  move: MovePayload,
  rpcUrl?: string,
): Promise<`0x${string}`> {
  const sig = await signMoveWithKey(key.privateKey, chainId, contract, move);
  const wallet = sessionWallet(chainId, key.privateKey, rpcUrl);
  return wallet.writeContract({
    address: contract,
    abi: LAWB_CHESS_ABI,
    functionName: 'makeMoveBySig',
    args: [move.code, move.from, move.to, move.promo, move.nonce, sig],
  });
}

/**
 * Sweep the session key's remaining gas back to the player. Best-effort: returns the tx hash,
 * or null when the balance is too small to be worth a transfer (dust stays, key is discarded).
 */
export async function sweepSessionKey(
  chainId: number,
  key: MoveKey,
  to: `0x${string}`,
  rpcUrl?: string,
): Promise<`0x${string}` | null> {
  const pub = sessionPublicClient(chainId, rpcUrl);
  const balance = await pub.getBalance({ address: key.address });
  // Reserve at the EIP-1559 max fee and PIN those caps on the tx, so the reserved headroom
  // is exactly what the node charges against balance (gasPrice alone under-reserves ~2x).
  const fees = await pub.estimateFeesPerGas();
  const maxFeePerGas = fees.maxFeePerGas ?? (await pub.getGasPrice()) * 2n;
  // transfers cost >21000 gas on Arbitrum (L1 data fee component) — 60k is safe headroom
  const gas = 60_000n;
  const reserve = maxFeePerGas * gas;
  if (balance <= reserve * 2n) return null;
  const wallet = sessionWallet(chainId, key.privateKey, rpcUrl);
  return wallet.sendTransaction({
    to,
    value: balance - reserve,
    gas,
    maxFeePerGas,
    maxPriorityFeePerGas: fees.maxPriorityFeePerGas ?? 0n,
  });
}
