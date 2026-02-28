/**
 * check-lp.js — Query Clawb's Meteora DLMM liquidity position
 *
 * Usage:
 *   node check-lp.js              # human-readable summary
 *   node check-lp.js --json       # raw JSON for piping
 *   node check-lp.js --announce   # push status to EQ feed + Retake chat
 */

import 'dotenv/config';

const POSITION_ADDRESS = '13N61SZdGVFgM24t6mtYbAhV7T2nD67QmzEqsaT1DEeg';
const PAIR_ADDRESS = 'AVoLSxAV41A2estUDUkV4yCM9GJ7dM7V2A57jNtoaoWD';
const METEORA_API = 'https://dlmm-api.meteora.ag';

const TOKEN_NAMES = {
  A2bt3Mwrn9fxGFLTA3UT7dt8WMcR7tABKih4fyuiMTWn: 'CLAWB',
  '65GVcFcSqQcaMNeBkYcen4ozeT83tr13CeDLU4sUUdV6': 'LAWB',
};

async function fetchJson(url) {
  const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`${url} returned ${res.status}`);
  return res.json();
}

async function getPositionData() {
  const [position, pair] = await Promise.all([
    fetchJson(`${METEORA_API}/position/${POSITION_ADDRESS}`),
    fetchJson(`${METEORA_API}/pair/${PAIR_ADDRESS}`),
  ]);

  const tokenX = TOKEN_NAMES[pair.mint_x] || pair.mint_x?.slice(0, 8);
  const tokenY = TOKEN_NAMES[pair.mint_y] || pair.mint_y?.slice(0, 8);

  return {
    positionAddress: POSITION_ADDRESS,
    pairAddress: PAIR_ADDRESS,
    pairName: pair.name || `${tokenX}-${tokenY}`,
    owner: position.owner,
    tokenX,
    tokenY,
    mintX: pair.mint_x,
    mintY: pair.mint_y,
    currentPrice: pair.current_price,
    binStep: pair.bin_step,
    reserveX: pair.reserve_x_amount,
    reserveY: pair.reserve_y_amount,
    feesClaimedUsd: position.total_fee_usd_claimed,
    feeXClaimed: position.total_fee_x_claimed,
    feeYClaimed: position.total_fee_y_claimed,
    rewardXClaimed: position.total_reward_x_claimed,
    rewardYClaimed: position.total_reward_y_claimed,
    feeApy24h: position.fee_apy_24h,
    feeApr24h: position.fee_apr_24h,
    dailyFeeYield: position.daily_fee_yield,
    volume24h: pair.trade_volume_24h,
    fees24h: pair.fees_24h,
    poolApr: pair.apr,
    poolApy: pair.apy,
    meteora: `https://www.meteora.ag/dlmm/${PAIR_ADDRESS}?referrer=portfolio&position=${POSITION_ADDRESS}`,
    solscan: `https://solscan.io/account/${POSITION_ADDRESS}`,
  };
}

function formatSummary(data) {
  const lines = [
    `=== Clawb LP Position ===`,
    `Pool: ${data.pairName} (Meteora DLMM)`,
    `Position: ${data.positionAddress}`,
    `Owner: ${data.owner}`,
    ``,
    `Current price: 1 ${data.tokenX} = ${data.currentPrice?.toFixed(6)} ${data.tokenY}`,
    `Bin step: ${data.binStep}`,
    ``,
    `Fees claimed: $${data.feesClaimedUsd?.toFixed(4)} USD`,
    `  ${data.tokenX}: ${data.feeXClaimed}`,
    `  ${data.tokenY}: ${data.feeYClaimed}`,
    `Fee APY (24h): ${(data.feeApy24h * 100)?.toFixed(2)}%`,
    `Daily fee yield: ${(data.dailyFeeYield * 100)?.toFixed(4)}%`,
    ``,
    `Pool 24h volume: $${data.volume24h?.toFixed(2)}`,
    `Pool 24h fees: $${data.fees24h?.toFixed(2)}`,
    `Pool APR: ${data.poolApr?.toFixed(2)}%`,
    ``,
    `Meteora: ${data.meteora}`,
    `Solscan: ${data.solscan}`,
  ];
  return lines.join('\n');
}

const args = process.argv.slice(2);
const jsonMode = args.includes('--json');
const announceMode = args.includes('--announce');

try {
  const data = await getPositionData();

  if (jsonMode) {
    console.log(JSON.stringify(data, null, 2));
  } else {
    console.log(formatSummary(data));
  }

  if (announceMode) {
    const { announceSwap } = await import('./announce-swap.js');
    const msg = `LP update: ${data.pairName} pool | price ${data.currentPrice?.toFixed(4)} | fees claimed $${data.feesClaimedUsd?.toFixed(2)} | 24h vol $${data.volume24h?.toFixed(0)}`;
    await announceSwap(msg, { eq: true, chat: false });
    console.log('\nAnnounced to EQ feed.');
  }
} catch (err) {
  console.error('Failed to fetch LP data:', err.message);
  process.exit(1);
}
