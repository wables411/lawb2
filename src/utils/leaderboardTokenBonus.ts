import { createPublicClient, http, erc20Abi } from 'viem';
import { base } from 'viem/chains';
import { TOKEN_ADDRESSES_BY_CHAIN } from '../config/tokens';
import { computeTokenHoldingsBonusPoints } from './leaderboardHoldingsScore';

const BASE_CHAIN_ID = 8453;

function normalizeEvmAddresses(addresses: string[]): `0x${string}`[] {
  const seen = new Set<string>();
  const out: `0x${string}`[] = [];
  for (const a of addresses) {
    if (!/^0x[a-fA-F0-9]{40}$/.test(a)) continue;
    const lower = a.toLowerCase() as `0x${string}`;
    if (seen.has(lower)) continue;
    seen.add(lower);
    out.push(lower);
  }
  return out;
}

/**
 * Sum Base $LAWB + $CLAWB across EVM wallets, convert to leaderboard holdings bonus points.
 * Uses the public Base RPC (no Alchemy cost for this read).
 */
export async function fetchBaseLawbClawbHoldingsBonus(evmAddresses: string[]): Promise<number> {
  const addrs = normalizeEvmAddresses(evmAddresses);
  if (addrs.length === 0) return 0;

  const lawbAddr = TOKEN_ADDRESSES_BY_CHAIN[BASE_CHAIN_ID].LAWB_BASE as `0x${string}`;
  const clawbAddr = TOKEN_ADDRESSES_BY_CHAIN[BASE_CHAIN_ID].CLAWB_BASE as `0x${string}`;

  const client = createPublicClient({
    chain: base,
    transport: http(),
  });

  const rows = await Promise.all(
    addrs.map(async (owner) => {
      const [l, c] = await Promise.all([
        client.readContract({
          address: lawbAddr,
          abi: erc20Abi,
          functionName: 'balanceOf',
          args: [owner],
        }),
        client.readContract({
          address: clawbAddr,
          abi: erc20Abi,
          functionName: 'balanceOf',
          args: [owner],
        }),
      ]);
      return { l, c };
    }),
  );

  let totalLawb = 0n;
  let totalClawb = 0n;
  for (const { l, c } of rows) {
    totalLawb += l;
    totalClawb += c;
  }

  return computeTokenHoldingsBonusPoints(totalLawb, totalClawb);
}
