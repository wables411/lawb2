import {
  createPublicClient,
  fallback,
  http,
  parseAbi,
  parseAbiItem,
  zeroAddress,
} from 'viem';
import { base } from 'viem/chains';
import {
  BASE_CLAWB_TOKEN,
  BASE_UNISWAP_V4_FIRST_BLOCK,
  BASE_UNISWAP_V4_POSITION_MANAGER,
  BASE_WETH,
} from '../config/lpPools';

const pmAbi = parseAbi([
  'function balanceOf(address owner) view returns (uint256)',
  'function getPoolAndPositionInfo(uint256 tokenId) view returns ((address currency0, address currency1, uint24 fee, int24 tickSpacing, address hooks) poolKey, uint256 info)',
  'function getPositionLiquidity(uint256 tokenId) view returns (uint128)',
]);

const transferEvent = parseAbiItem(
  'event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)',
);

function baseLiquidityClient() {
  return createPublicClient({
    chain: base,
    transport: fallback([http('https://mainnet.base.org'), http('https://base.drpc.org')]),
  });
}
type BaseLiquidityClient = ReturnType<typeof baseLiquidityClient>;

const CLAWB_L = BASE_CLAWB_TOKEN.toLowerCase();
const WETH_L = BASE_WETH.toLowerCase();

/** v4 pools may use native ETH (currency0) + CLAWB (currency1) or WETH + CLAWB. */
function isClawbEthOrWethPool(poolKey: {
  currency0: `0x${string}`;
  currency1: `0x${string}`;
}): boolean {
  const c0 = poolKey.currency0.toLowerCase();
  const c1 = poolKey.currency1.toLowerCase();
  const z = zeroAddress.toLowerCase();
  const hasClawb = c0 === CLAWB_L || c1 === CLAWB_L;
  if (!hasClawb) return false;
  const other = c0 === CLAWB_L ? c1 : c0;
  return other === WETH_L || other === z;
}

function signextendInt24(n: bigint): number {
  let v = n & 0xffffffn;
  if (v & 0x800000n) v = v - 0x1000000n;
  return Number(v);
}

function ticksFromPositionInfo(info: bigint): { tickLower: number; tickUpper: number } {
  const tickLower = signextendInt24((info >> 8n) & 0xffffffn);
  const tickUpper = signextendInt24((info >> 32n) & 0xffffffn);
  return { tickLower, tickUpper };
}

/** Base `eth_getLogs` allows at most 10_000 blocks per query (inclusive span). */
const LOG_BLOCK_SPAN = 10000n;
const MAX_CHUNKS_DEFAULT = 220;
const LOG_BATCH_CONCURRENCY = 6;

export interface BaseUniswapV4ClawbPosition {
  tokenId: string;
  liquidity: bigint;
  fee: number;
  tickLower: number;
  tickUpper: number;
  /** Native ETH leg uses address(0) as currency0 in the pool key. */
  usesNativeEth: boolean;
}

/**
 * Optional: Etherscan API key (v2 multi-chain). Pro tier often required for Base `addresstokennftinventory`.
 */
async function tryTokenIdsFromExplorer(owner: `0x${string}`): Promise<bigint[] | null> {
  const key =
    (typeof process !== 'undefined' && process.env && process.env.REACT_APP_ETHERSCAN_API_KEY) || '';
  if (!key) return null;
  const url =
    `https://api.etherscan.io/v2/api?chainid=8453&module=account&action=addresstokennftinventory` +
    `&address=${owner}&contractaddress=${BASE_UNISWAP_V4_POSITION_MANAGER}&page=1&offset=100&apikey=${encodeURIComponent(key)}`;
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(15000) });
    const j = (await r.json()) as { status?: string; result?: unknown; message?: string };
    if (j.status !== '1' || !Array.isArray(j.result)) return null;
    const ids: bigint[] = [];
    for (const row of j.result) {
      if (
        typeof row === 'object' &&
        row !== null &&
        'TokenId' in row &&
        typeof (row as { TokenId?: string }).TokenId === 'string'
      ) {
        ids.push(BigInt((row as { TokenId: string }).TokenId));
      }
    }
    return ids;
  } catch {
    return null;
  }
}

/** Non-overlapping ranges from `latest` backward toward `deploy`, at most `maxChunks` ranges. */
function makeRangesFromLatest(
  latest: bigint,
  deploy: bigint,
  maxChunks: number,
): { ranges: [bigint, bigint][]; hitDeploy: boolean } {
  const ranges: [bigint, bigint][] = [];
  let to = latest;
  let chunks = 0;
  let hitDeploy = false;
  while (to >= deploy && chunks < maxChunks) {
    const spanStart = to - (LOG_BLOCK_SPAN - 1n) >= deploy ? to - (LOG_BLOCK_SPAN - 1n) : deploy;
    ranges.push([spanStart, to]);
    if (spanStart === deploy) {
      hitDeploy = true;
      break;
    }
    to = spanStart - 1n;
    chunks++;
  }
  return { ranges, hitDeploy };
}

async function fetchTransferLogs(
  client: BaseLiquidityClient,
  owner: `0x${string}`,
  fromBlock: bigint,
  toBlock: bigint,
) {
  const [incoming, outgoing] = await Promise.all([
    client.getLogs({
      address: BASE_UNISWAP_V4_POSITION_MANAGER,
      event: transferEvent,
      args: { to: owner },
      fromBlock,
      toBlock,
    }),
    client.getLogs({
      address: BASE_UNISWAP_V4_POSITION_MANAGER,
      event: transferEvent,
      args: { from: owner },
      fromBlock,
      toBlock,
    }),
  ]);
  return [...incoming, ...outgoing];
}

function ownedTokenIdsFromLogs(
  logs: Awaited<ReturnType<typeof fetchTransferLogs>>,
  ownerLower: string,
): bigint[] {
  const sorted = [...logs].sort((a, b) => {
    const abn = (a.blockNumber ?? 0n) - (b.blockNumber ?? 0n);
    if (abn !== 0n) return abn < 0n ? -1 : 1;
    return (a.logIndex ?? 0) - (b.logIndex ?? 0);
  });
  const owned = new Set<string>();
  for (const log of sorted) {
    if (!('args' in log) || log.args == null) continue;
    const args = log.args as { from?: `0x${string}`; to?: `0x${string}`; tokenId?: bigint };
    const tid = args.tokenId;
    if (tid == null) continue;
    const id = tid.toString();
    if (args.to?.toLowerCase() === ownerLower) owned.add(id);
    if (args.from?.toLowerCase() === ownerLower) owned.delete(id);
  }
  return [...owned].map((s) => BigInt(s));
}

/**
 * Uniswap v4 positions on Base where the pool is CLAWB with native ETH or WETH.
 * Token IDs: Etherscan v2 inventory when API key works; otherwise a bounded log scan from the chain tip backward.
 */
export async function fetchBaseUniswapV4ClawbEthPositions(
  owner: `0x${string}`,
  options?: { maxChunks?: number },
): Promise<{ positions: BaseUniswapV4ClawbPosition[]; scanIncomplete: boolean }> {
  const client = baseLiquidityClient();

  const bal = await client.readContract({
    address: BASE_UNISWAP_V4_POSITION_MANAGER,
    abi: pmAbi,
    functionName: 'balanceOf',
    args: [owner],
  });
  if (bal === 0n) return { positions: [], scanIncomplete: false };

  const ownerLower = owner.toLowerCase();
  let tokenIds: bigint[] | null = await tryTokenIdsFromExplorer(owner);
  let scanIncomplete = false;

  if (tokenIds != null && tokenIds.length === 0 && bal > 0n) {
    tokenIds = null;
  }

  if (tokenIds == null) {
    const latest = await client.getBlockNumber();
    const maxChunks = options?.maxChunks ?? MAX_CHUNKS_DEFAULT;
    const { ranges, hitDeploy } = makeRangesFromLatest(latest, BASE_UNISWAP_V4_FIRST_BLOCK, maxChunks);
    if (!hitDeploy) scanIncomplete = true;

    const allLogs: Awaited<ReturnType<typeof fetchTransferLogs>> = [];
    for (let i = 0; i < ranges.length; i += LOG_BATCH_CONCURRENCY) {
      const slice = ranges.slice(i, i + LOG_BATCH_CONCURRENCY);
      const batches = await Promise.all(
        slice.map(([from, to]) => fetchTransferLogs(client, owner, from, to)),
      );
      for (const b of batches) allLogs.push(...b);
    }
    tokenIds = ownedTokenIdsFromLogs(allLogs, ownerLower);
    if (tokenIds.length < Number(bal)) scanIncomplete = true;
  }

  const out: BaseUniswapV4ClawbPosition[] = [];
  for (const tokenId of tokenIds) {
    const [poolKey, info] = await client.readContract({
      address: BASE_UNISWAP_V4_POSITION_MANAGER,
      abi: pmAbi,
      functionName: 'getPoolAndPositionInfo',
      args: [tokenId],
    });
    if (!isClawbEthOrWethPool(poolKey)) continue;
    const liquidity = await client.readContract({
      address: BASE_UNISWAP_V4_POSITION_MANAGER,
      abi: pmAbi,
      functionName: 'getPositionLiquidity',
      args: [tokenId],
    });
    if (liquidity === 0n) continue;
    const { tickLower, tickUpper } = ticksFromPositionInfo(info);
    const usesNativeEth = poolKey.currency0.toLowerCase() === zeroAddress.toLowerCase();
    out.push({
      tokenId: tokenId.toString(),
      liquidity,
      fee: Number(poolKey.fee),
      tickLower,
      tickUpper,
      usesNativeEth,
    });
  }

  return { positions: out, scanIncomplete };
}
