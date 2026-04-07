import { createPublicClient, fallback, http, parseAbi } from 'viem';
import { base } from 'viem/chains';
import {
  BASE_CLAWB_TOKEN,
  BASE_UNISWAP_V3_POSITION_MANAGER,
  BASE_WETH,
} from '../config/lpPools';

const npmAbi = parseAbi([
  'function balanceOf(address owner) view returns (uint256)',
  'function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)',
  'function positions(uint256 tokenId) view returns (uint96 nonce, address operator, address token0, address token1, uint24 fee, int24 tickLower, int24 tickUpper, uint128 liquidity, uint256 feeGrowthInside0LastX128, uint256 feeGrowthInside1LastX128, uint128 tokensOwed0, uint128 tokensOwed1)',
]);

const CLAWB_L = BASE_CLAWB_TOKEN.toLowerCase();
const WETH_L = BASE_WETH.toLowerCase();

export interface BaseClawbWethPosition {
  tokenId: string;
  liquidity: bigint;
  fee: number;
  tickLower: number;
  tickUpper: number;
  tokensOwed0: bigint;
  tokensOwed1: bigint;
}

const MAX_SCAN = 32;

function isClawbWethPair(token0: string, token1: string): boolean {
  const a = token0.toLowerCase();
  const b = token1.toLowerCase();
  return (
    (a === CLAWB_L && b === WETH_L) ||
    (a === WETH_L && b === CLAWB_L)
  );
}

/**
 * Open Uniswap V3 liquidity positions on Base where the pair is CLAWB / WETH.
 * $CLAWB is deployed on Base; there is no canonical mainnet ETH pool in-app.
 */
export async function fetchBaseUniswapClawbWethPositions(
  owner: `0x${string}`,
): Promise<BaseClawbWethPosition[]> {
  const client = createPublicClient({
    chain: base,
    transport: fallback([http('https://mainnet.base.org'), http('https://base.drpc.org')]),
  });

  const npm = BASE_UNISWAP_V3_POSITION_MANAGER;

  const bal = await client.readContract({
    address: npm,
    abi: npmAbi,
    functionName: 'balanceOf',
    args: [owner],
  });

  const n = Number(bal);
  if (!Number.isFinite(n) || n <= 0) return [];

  const count = Math.min(n, MAX_SCAN);
  const out: BaseClawbWethPosition[] = [];

  for (let i = 0; i < count; i++) {
    const tokenId = await client.readContract({
      address: npm,
      abi: npmAbi,
      functionName: 'tokenOfOwnerByIndex',
      args: [owner, BigInt(i)],
    });

    const pos = await client.readContract({
      address: npm,
      abi: npmAbi,
      functionName: 'positions',
      args: [tokenId],
    });

    const token0 = pos[2];
    const token1 = pos[3];
    const fee = pos[4];
    const tickLower = pos[5];
    const tickUpper = pos[6];
    const liquidity = pos[7];
    const tokensOwed0 = pos[10];
    const tokensOwed1 = pos[11];

    if (!isClawbWethPair(token0, token1)) continue;
    if (liquidity === 0n && tokensOwed0 === 0n && tokensOwed1 === 0n) continue;

    out.push({
      tokenId: tokenId.toString(),
      liquidity,
      fee: Number(fee),
      tickLower,
      tickUpper,
      tokensOwed0,
      tokensOwed1,
    });
  }

  return out;
}
