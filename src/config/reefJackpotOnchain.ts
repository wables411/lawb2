// ReefRunJackpot contract config (REEFRUN_ONCHAIN_SPEC §7 frontend integration).
//
// INERT until VITE_REEF_JACKPOT is enabled: the flag defaults OFF, the jackpot tile
// stays hidden, and no contract reads run. Same rollout pattern as lawbChessOnchain.ts.
//
// Contract source: onchain-chess/src/ReefRunJackpot.sol (own git repo).

function readViteEnv(name: string): string {
  if (typeof import.meta === 'undefined' || !import.meta.env) return '';
  const value = import.meta.env[name as keyof ImportMetaEnv];
  return typeof value === 'string' ? value.trim() : '';
}

function readBooleanFlag(name: string, fallback: boolean): boolean {
  const raw = readViteEnv(name).toLowerCase();
  if (!raw) return fallback;
  return raw === '1' || raw === 'true' || raw === 'yes' || raw === 'on';
}

/**
 * Master switch. Defaults OFF; flip with VITE_REEF_JACKPOT=true once proven on testnet.
 * `?jackpot=1` enables it for a single session (same opt-in pattern as `?reefdet=0`) so
 * the testnet flow is testable on prod without showing the tile to everyone.
 */
export const ENABLE_REEF_JACKPOT =
  readBooleanFlag('VITE_REEF_JACKPOT', false) ||
  (typeof window !== 'undefined' && /[?&]jackpot=1/.test(window.location.search));

/**
 * Deployed UUPS proxy per chain (always the PROXY). `null` = not deployed there yet.
 * Testnet/dev override: VITE_REEF_JACKPOT_ADDRESS + VITE_REEF_JACKPOT_CHAIN_ID point any
 * single chain at a deployment without a code change (used for Base Sepolia / local anvil).
 */
const PROXY_ADDRESS: Record<number, `0x${string}` | null> = {
  1: null, // ETH mainnet ($CULT) — post-testnet
  // Deployed 2026-08-06 (MockCult 0xb1639eEef9D669b9f01cd1d7C076495915522961, entry 10 mCULT)
  84532: '0x24724b3977De2Af6D287097B14e5bE8f4759a06B',
};

const DEV_ADDRESS = readViteEnv('VITE_REEF_JACKPOT_ADDRESS');
const DEV_CHAIN_ID = Number(readViteEnv('VITE_REEF_JACKPOT_CHAIN_ID') || 0);

export function getReefJackpotAddress(chainId: number): `0x${string}` | null {
  if (DEV_ADDRESS && DEV_CHAIN_ID === chainId) return DEV_ADDRESS as `0x${string}`;
  return PROXY_ADDRESS[chainId] ?? null;
}

/** Entry-token display label per chain (token address comes from the contract itself). */
export function entryTokenLabel(chainId: number): string {
  if (chainId === 1) return 'CULT';
  return 'mCULT'; // testnets use the MockCult stand-in
}

export const REEF_JACKPOT_ABI = [
  {
    type: 'function',
    name: 'jackpot',
    stateMutability: 'view',
    inputs: [],
    outputs: [
      { name: 'pot_', type: 'uint256' },
      { name: 'highScoreMs_', type: 'uint64' },
      { name: 'champion_', type: 'address' },
      { name: 'lastBeatenAt_', type: 'uint40' },
      { name: 'entryAmount_', type: 'uint256' },
    ],
  },
  {
    type: 'function',
    name: 'entryToken',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'address' }],
  },
  {
    type: 'function',
    name: 'pendingEntry',
    stateMutability: 'view',
    inputs: [{ name: '', type: 'address' }],
    outputs: [
      { name: 'seed', type: 'uint32' },
      { name: 'nonce', type: 'uint64' },
      { name: 'enteredAt', type: 'uint40' },
      { name: 'consumed', type: 'bool' },
    ],
  },
  { type: 'function', name: 'enter', stateMutability: 'nonpayable', inputs: [], outputs: [] },
  {
    type: 'function',
    name: 'submitScore',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'survivalMs', type: 'uint64' },
      { name: 'entryNonce', type: 'uint64' },
      { name: 'seed', type: 'uint32' },
      { name: 'deadline', type: 'uint256' },
      { name: 'sig', type: 'bytes' },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'fundPot',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'amount', type: 'uint256' }],
    outputs: [],
  },
  {
    type: 'event',
    name: 'Entered',
    inputs: [
      { name: 'player', type: 'address', indexed: true },
      { name: 'nonce', type: 'uint64', indexed: true },
      { name: 'seed', type: 'uint32', indexed: false },
      { name: 'potAfter', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'ScoreSubmitted',
    inputs: [
      { name: 'player', type: 'address', indexed: true },
      { name: 'nonce', type: 'uint64', indexed: true },
      { name: 'survivalMs', type: 'uint64', indexed: false },
      { name: 'barMs', type: 'uint64', indexed: false },
      { name: 'won', type: 'bool', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'JackpotWon',
    inputs: [
      { name: 'player', type: 'address', indexed: true },
      { name: 'survivalMs', type: 'uint64', indexed: false },
      { name: 'payout', type: 'uint256', indexed: false },
      { name: 'fee', type: 'uint256', indexed: false },
    ],
  },
] as const;

export const ERC20_ALLOWANCE_ABI = [
  {
    type: 'function',
    name: 'allowance',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'approve',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    type: 'function',
    name: 'balanceOf',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const;

/** The validator's jackpot block attached to an accepted /validate verdict. */
export type ReefJackpotVerdict = {
  player: string;
  entryNonce: number;
  seed: number;
  survivalMs: number;
  deadline: number;
  signature: `0x${string}`;
  signer: string;
};

/** Format a survival bar in ms as m:ss.mmm for the jackpot board. */
export function formatSurvivalMs(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = String(totalSec % 60).padStart(2, '0');
  const frac = String(ms % 1000).padStart(3, '0');
  return `${m}:${s}.${frac}`;
}
