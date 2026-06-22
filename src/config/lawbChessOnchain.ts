// On-chain LawbChess wager contract config (Phase 4 frontend integration).
//
// INERT until VITE_ONCHAIN_CHESS is enabled: nothing in the live app imports this
// module yet, and the flag defaults OFF. The existing Firebase PvP path is the only
// active path until the new on-chain path is proven on testnet (see LAWBCHESS_HANDOFF.md §6).
//
// Contract source + deploy notes: onchain-chess/ (own git repo). ABI: ./lawbChessAbi.ts.

import { LAWB_CHESS_ABI } from './lawbChessAbi';

export { LAWB_CHESS_ABI };

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
 * Master switch for the on-chain chess path. Defaults OFF so the live Firebase PvP
 * stays the only active path. Flip with VITE_ONCHAIN_CHESS=true once the new path
 * is proven on testnet.
 */
export const ENABLE_ONCHAIN_CHESS = readBooleanFlag('VITE_ONCHAIN_CHESS', false);

/** Chain IDs the LawbChess contract is (or will be) deployed on. */
export const LAWB_CHESS_CHAIN_IDS = {
  baseSepolia: 84532,
  base: 8453,
  ethereum: 1,
  arbitrum: 42161,
} as const;

/**
 * Deployed UUPS proxy address per chain. Always interact with the PROXY — it is stable
 * across implementation upgrades (see LAWBCHESS_HANDOFF.md §3). `null` = not yet deployed.
 * Mainnet deploys happen post-audit from 0x13031dC2dC848A985cCb6532956f7B8f3487772A.
 */
export const LAWB_CHESS_PROXY_ADDRESS: Record<number, `0x${string}` | null> = {
  [LAWB_CHESS_CHAIN_IDS.baseSepolia]: '0xCF4131302Ed9685309F2c1Ca01b282409D1fBCE4',
  [LAWB_CHESS_CHAIN_IDS.base]: null,
  [LAWB_CHESS_CHAIN_IDS.ethereum]: null,
  [LAWB_CHESS_CHAIN_IDS.arbitrum]: null,
};

/** Returns the LawbChess proxy address for a chain, or null if not deployed there. */
export function getLawbChessAddress(chainId: number): `0x${string}` | null {
  return LAWB_CHESS_PROXY_ADDRESS[chainId] ?? null;
}
