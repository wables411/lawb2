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
  // Deployed 2026-07-24 (0.01 ETH native cap, §16.1 NFT allowlist; verified on Basescan)
  [LAWB_CHESS_CHAIN_IDS.base]: '0xBe0C68afE6f412d052C8fa306e9191D2b6371Aec',
  // Deployed 2026-07-24 (0.01 ETH native cap, §16.1 NFT allowlist, $CULT; verified on Etherscan)
  [LAWB_CHESS_CHAIN_IDS.ethereum]: '0x6aa574B21212C6E7436Eb26A27542F1AEFfFad87',
  // Deployed 2026-07-20 ($DMT launch, 0.01 ETH native cap, DMT allowlisted; verified on Arbiscan)
  [LAWB_CHESS_CHAIN_IDS.arbitrum]: '0x3112AF5728520F52FD1C6710dD7bD52285a68e47',
};

/** Returns the LawbChess proxy address for a chain, or null if not deployed there. */
export function getLawbChessAddress(chainId: number): `0x${string}` | null {
  return LAWB_CHESS_PROXY_ADDRESS[chainId] ?? null;
}

/**
 * Featured ERC-20 wager tokens per chain (must match the contract's on-chain allowlist set via
 * setAllowedToken). Locked 2026-07-20: $DMT is the featured Arbitrum token; $CULT joins the
 * Ethereum deploy. The lobby's custom-token input stays as the subtle any-ERC-20 option — the
 * contract rejects non-allowlisted tokens regardless.
 */
export const LAWB_CHESS_WAGER_TOKENS: Record<number, { label: string; address: `0x${string}`; decimals: number }[]> = {
  [LAWB_CHESS_CHAIN_IDS.arbitrum]: [
    { label: 'DMT (Dream Machine Token)', address: '0x8B0E6f19Ee57089F7649A455D89D7bC6314D04e8', decimals: 18 },
  ],
  [LAWB_CHESS_CHAIN_IDS.ethereum]: [
    // Verified live 2026-07-24: symbol CULT, "Milady Cult Coin", 18 decimals; allowlisted on the ETH proxy.
    { label: 'CULT (Milady Cult Coin)', address: '0x0000000000c5dc95539589fbD24BE07c6C14eCa4', decimals: 18 },
  ],
  [LAWB_CHESS_CHAIN_IDS.base]: [],
  [LAWB_CHESS_CHAIN_IDS.baseSepolia]: [],
};

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
    { label: 'Milady', address: '0x5af0d9827e0c53e4799bb226655a1de152a425a5' },
    { label: 'Radbro Webring V2', address: '0xabcdb5710b88f456fed1e99025379e2969f29610' },
  ],
  [LAWB_CHESS_CHAIN_IDS.base]: [
    { label: 'A Lawbster Halloween', address: '0x8ab6733f8f8702c233f3582ec2a2750d3fc63a97' },
    { label: 'ASCII Lawbs', address: '0x13c33121f8a73e22ac6aa4a135132f5ac7f221b2' },
    { label: 'Kemonokaki', address: '0xee7d1b184be8185adc7052635329152a4d0cdefa' },
    { label: 'Frequent Flyers', address: '0xf6f260643f5f666c0828cef6b016f9cba3718d4c' },
  ],
  [LAWB_CHESS_CHAIN_IDS.baseSepolia]: [],
  [LAWB_CHESS_CHAIN_IDS.arbitrum]: [],
};
