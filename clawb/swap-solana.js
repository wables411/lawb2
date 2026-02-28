/**
 * swap-solana.js — Swap tokens on Solana via Jupiter Metis API (v1)
 *
 * Usage:
 *   node swap-solana.js <inputMint> <outputMint> <amount> [slippageBps]
 *
 * Examples:
 *   node swap-solana.js SOL LAWB 0.2           # 0.2 SOL → $LAWB, default 1% slippage
 *   node swap-solana.js SOL CLAWB 0.1 100      # 0.1 SOL → $CLAWB, 1% slippage
 *   node swap-solana.js LAWB SOL 5000          # 5000 $LAWB → SOL
 *
 * Supported aliases: SOL, LAWB, CLAWB (or pass raw mint addresses)
 *
 * Requires JUPITER_API_KEY env var (free key from https://portal.jup.ag)
 */

import * as web3 from '@solana/web3.js';
import fs from 'fs';
import { config } from 'dotenv';

config({ path: 'C:/Users/wable/lawb2/clawb/.env' });

const WALLET_PATH = 'C:/Users/wable/lawb2/clawb/credentials/solana/clawb-retake-wallet.json';
const RPC = process.env.SOLANA_RPC || 'https://api.mainnet-beta.solana.com';
const JUP_API_KEY = process.env.JUPITER_API_KEY || '';
const JUP_BASE = 'https://api.jup.ag/swap/v1';

if (!JUP_API_KEY) {
  console.error('Missing JUPITER_API_KEY in .env — get a free key at https://portal.jup.ag');
  process.exit(1);
}

const MINTS = {
  SOL: 'So11111111111111111111111111111111111111112',
  LAWB: '65GVcFcSqQcaMNeBkYcen4ozeT83tr13CeDLU4sUUdV6',
  CLAWB: 'A2bt3Mwrn9fxGFLTA3UT7dt8WMcR7tABKih4fyuiMTWn',
};

const DECIMALS = {
  SOL: 9,
  LAWB: 6,
  CLAWB: 6,
  [MINTS.SOL]: 9,
  [MINTS.LAWB]: 6,
  [MINTS.CLAWB]: 6,
};

function resolveMint(input) {
  const upper = input.toUpperCase();
  if (upper === '$LAWB') return MINTS.LAWB;
  if (upper === '$CLAWB') return MINTS.CLAWB;
  return MINTS[upper] || input;
}

function resolveDecimals(mintOrAlias) {
  const upper = mintOrAlias.toUpperCase().replace('$', '');
  return DECIMALS[upper] || DECIMALS[resolveMint(mintOrAlias)] || 9;
}

const args = process.argv.slice(2);
if (args.length < 3) {
  console.error('Usage: node swap-solana.js <inputMint> <outputMint> <amount> [slippageBps]');
  console.error('  Aliases: SOL, LAWB, CLAWB (or raw mint addresses)');
  process.exit(1);
}

const [inputRaw, outputRaw, amountStr, slippageStr] = args;
const inputMint = resolveMint(inputRaw);
const outputMint = resolveMint(outputRaw);
const decimals = resolveDecimals(inputRaw);
const amount = Math.floor(parseFloat(amountStr) * (10 ** decimals));
const slippageBps = parseInt(slippageStr || '100', 10);

const connection = new web3.Connection(RPC, 'confirmed');
const keypair = web3.Keypair.fromSecretKey(
  Uint8Array.from(JSON.parse(fs.readFileSync(WALLET_PATH, 'utf-8')))
);

console.log(`Swap: ${amountStr} ${inputRaw} → ${outputRaw}`);
console.log(`Wallet: ${keypair.publicKey.toString()}`);
console.log(`Slippage: ${slippageBps} bps (${slippageBps / 100}%)`);

const jupHeaders = { 'x-api-key': JUP_API_KEY, 'Content-Type': 'application/json' };

// 1. Get quote
console.log('\nFetching quote...');
const quoteUrl = `${JUP_BASE}/quote?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amount}&slippageBps=${slippageBps}&restrictIntermediateTokens=true`;
const quoteRes = await fetch(quoteUrl, { headers: jupHeaders, signal: AbortSignal.timeout(15000) });
if (!quoteRes.ok) {
  const errText = await quoteRes.text();
  console.error(`Quote API returned ${quoteRes.status}: ${errText}`);
  process.exit(1);
}
const quoteData = await quoteRes.json();

if (quoteData.error) {
  console.error('Quote failed:', quoteData.error);
  process.exit(1);
}

const outDecimals = resolveDecimals(outputRaw);
const outHuman = (parseInt(quoteData.outAmount) / (10 ** outDecimals)).toFixed(outDecimals > 6 ? 6 : outDecimals);
console.log(`Quote: ${amountStr} ${inputRaw} → ${outHuman} ${outputRaw}`);
console.log(`Price impact: ${quoteData.priceImpactPct || '0'}%`);

// 2. Build swap transaction
console.log('\nBuilding transaction...');
const swapRes = await fetch(`${JUP_BASE}/swap`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'x-api-key': JUP_API_KEY },
  body: JSON.stringify({
    quoteResponse: quoteData,
    userPublicKey: keypair.publicKey.toString(),
    dynamicComputeUnitLimit: true,
    prioritizationFeeLamports: {
      priorityLevelWithMaxLamports: {
        maxLamports: 500000,
        priorityLevel: 'high',
      },
    },
  }),
  signal: AbortSignal.timeout(15000),
});
if (!swapRes.ok) {
  const errText = await swapRes.text();
  console.error(`Swap API returned ${swapRes.status}: ${errText}`);
  process.exit(1);
}
const swapData = await swapRes.json();

if (!swapData.swapTransaction) {
  console.error('Swap build failed:', JSON.stringify(swapData, null, 2));
  process.exit(1);
}

// 3. Sign and send
console.log('Signing and sending...');
const txBuf = Buffer.from(swapData.swapTransaction, 'base64');
const tx = web3.VersionedTransaction.deserialize(txBuf);
tx.sign([keypair]);

const txid = await connection.sendRawTransaction(tx.serialize(), {
  skipPreflight: true,
  maxRetries: 3,
});
console.log(`\nTx sent: ${txid}`);
console.log(`Explorer: https://solscan.io/tx/${txid}`);

console.log('\nConfirming...');
const confirm = await connection.confirmTransaction(
  { signature: txid, lastValidBlockHeight: swapData.lastValidBlockHeight || (await connection.getLatestBlockhash()).lastValidBlockHeight, blockhash: (await connection.getLatestBlockhash()).blockhash },
  'confirmed'
);

if (confirm.value.err) {
  console.error('Transaction failed:', confirm.value.err);
  process.exit(1);
}

console.log(`Confirmed. Swapped ${amountStr} ${inputRaw} → ~${outHuman} ${outputRaw}`);

if (!process.env.SWAP_SILENT) {
  import('./announce-swap.js').then(({ announceSwap }) => {
    const msg = `swapped ${amountStr} ${inputRaw} for ${outHuman} $${outputRaw}`;
    announceSwap(msg).catch(() => {});
  }).catch(() => {});
}
