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

/**
 * Curated NFT collections per chain (must match the contract's on-chain allowlist set via
 * setAllowedNftCollection). From LAWBCHESS_ONCHAIN_SPEC §16.1. Used to populate the wager UI;
 * the contract rejects any non-allowlisted collection regardless.
 */
export const LAWB_CHESS_NFT_COLLECTIONS: Record<number, { label: string; address: `0x${string}` }[]> = {
  [LAWB_CHESS_CHAIN_IDS.ethereum]: [
    { label: 'Lawbsters', address: '0x0ef7ba09c38624b8e9cc4985790a2f5dbfc1dc42' },
    { label: 'Lawbstarz', address: '0xd7922cd333da5ab3758c95f774b092a7b13a5449' },
    { label: 'Pixelawbsters', address: '0x2d278e95b2fC67D4b27a276807e24E479D9707F6' },
  ],
  [LAWB_CHESS_CHAIN_IDS.base]: [
    { label: 'A Lawbster Halloween', address: '0x8ab6733f8f8702c233f3582ec2a2750d3fc63a97' },
    { label: 'ASCII Lawbs', address: '0x13c33121f8a73e22ac6aa4a135132f5ac7f221b2' },
  ],
  [LAWB_CHESS_CHAIN_IDS.baseSepolia]: [],
  [LAWB_CHESS_CHAIN_IDS.arbitrum]: [],
};
