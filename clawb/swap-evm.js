/**
 * swap-evm.js — Swap tokens on Base via ParaSwap aggregator (no API key needed)
 *
 * Usage:
 *   node swap-evm.js <inputToken> <outputToken> <amount> [slippagePct]
 *
 * Examples:
 *   node swap-evm.js ETH CLAWB 0.001          # 0.001 ETH → $CLAWB on Base
 *   node swap-evm.js ETH LAWB 0.005 2         # 0.005 ETH → $LAWB, 2% slippage
 *   node swap-evm.js CLAWB ETH 10000          # 10000 $CLAWB → ETH
 *   node swap-evm.js ETH USDC 0.01            # 0.01 ETH → USDC
 *
 * Supported aliases: ETH, CLAWB, LAWB, USDC (or pass raw contract addresses)
 */

import { ethers } from 'ethers';
import dotenv from 'dotenv';
dotenv.config();

const BASE_CHAIN_ID = 8453;
const RPC = process.env.BASE_RPC || 'https://mainnet.base.org';
const PRIVATE_KEY = process.env.CLAWB_BASE_PRIVATE_KEY || process.env.CLAWB_PRIVATE_KEY;

if (!PRIVATE_KEY) {
  console.error('Missing CLAWB_BASE_PRIVATE_KEY in .env');
  process.exit(1);
}

const NATIVE = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';

const TOKENS = {
  ETH:   { address: NATIVE, decimals: 18 },
  CLAWB: { address: '0x26a43bd8a28a0423afb5725b8242ec0a40947b07', decimals: 18 },
  LAWB:  { address: '0x7e18298b46A1F2399617cde083Fe11415A2ad15B', decimals: 6 },
  USDC:  { address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', decimals: 6 },
};

const ERC20_ABI = [
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
];

function resolveToken(input) {
  const upper = input.toUpperCase().replace('$', '');
  if (TOKENS[upper]) return { symbol: upper, ...TOKENS[upper] };
  return { symbol: input, address: input, decimals: 18 };
}

const args = process.argv.slice(2);
if (args.length < 3) {
  console.error('Usage: node swap-evm.js <inputToken> <outputToken> <amount> [slippagePct]');
  process.exit(1);
}

const [inputRaw, outputRaw, amountStr, slippageStr] = args;
const inputToken = resolveToken(inputRaw);
const outputToken = resolveToken(outputRaw);
const slippagePct = parseFloat(slippageStr || '1');
const amountWei = ethers.parseUnits(amountStr, inputToken.decimals).toString();

const provider = new ethers.JsonRpcProvider(RPC);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

console.log(`Swap: ${amountStr} ${inputToken.symbol} → ${outputToken.symbol} (Base)`);
console.log(`Wallet: ${wallet.address}`);
console.log(`Slippage: ${slippagePct}%`);

// 1. Get price quote
console.log('\nFetching quote...');
const priceUrl = new URL('https://api.paraswap.io/prices');
priceUrl.searchParams.set('srcToken', inputToken.address);
priceUrl.searchParams.set('destToken', outputToken.address);
priceUrl.searchParams.set('amount', amountWei);
priceUrl.searchParams.set('srcDecimals', inputToken.decimals);
priceUrl.searchParams.set('destDecimals', outputToken.decimals);
priceUrl.searchParams.set('side', 'SELL');
priceUrl.searchParams.set('network', BASE_CHAIN_ID);
priceUrl.searchParams.set('userAddress', wallet.address);

const priceRes = await fetch(priceUrl.toString(), { signal: AbortSignal.timeout(15000) });
const priceData = await priceRes.json();

if (priceData.error) {
  console.error('Quote failed:', priceData.error);
  process.exit(1);
}

const route = priceData.priceRoute;
const outHuman = ethers.formatUnits(route.destAmount, outputToken.decimals);
console.log(`Quote: ${amountStr} ${inputToken.symbol} → ${outHuman} ${outputToken.symbol}`);

// 2. If input is ERC20, check and set allowance
if (inputToken.address !== NATIVE) {
  const tokenContract = new ethers.Contract(inputToken.address, ERC20_ABI, wallet);
  const spender = route.tokenTransferProxy;
  const currentAllowance = await tokenContract.allowance(wallet.address, spender);

  if (currentAllowance < BigInt(amountWei)) {
    console.log('\nApproving token spend...');
    const approveTx = await tokenContract.approve(spender, ethers.MaxUint256);
    console.log(`Approve tx: ${approveTx.hash}`);
    await approveTx.wait();
    console.log('Approved.');
  }
}

// 3. Build transaction
console.log('\nBuilding transaction...');
const minDestAmount = BigInt(route.destAmount) * BigInt(Math.floor((100 - slippagePct) * 100)) / 10000n;

const txUrl = `https://api.paraswap.io/transactions/${BASE_CHAIN_ID}`;
const txRes = await fetch(txUrl, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    srcToken: inputToken.address,
    destToken: outputToken.address,
    srcAmount: amountWei,
    destAmount: minDestAmount.toString(),
    priceRoute: route,
    userAddress: wallet.address,
    txOrigin: wallet.address,
    receiver: wallet.address,
  }),
  signal: AbortSignal.timeout(15000),
});
const txData = await txRes.json();

if (txData.error) {
  console.error('Build tx failed:', txData.error);
  process.exit(1);
}

// 4. Send transaction
console.log('Sending transaction...');
const tx = await wallet.sendTransaction({
  to: txData.to,
  data: txData.data,
  value: txData.value ? BigInt(txData.value) : 0n,
  gasLimit: BigInt(txData.gas || 300000),
  chainId: BASE_CHAIN_ID,
});

console.log(`\nTx sent: ${tx.hash}`);
console.log(`Explorer: https://basescan.org/tx/${tx.hash}`);

console.log('\nConfirming...');
const receipt = await tx.wait();

if (receipt.status === 0) {
  console.error('Transaction reverted.');
  process.exit(1);
}

console.log(`Confirmed (block ${receipt.blockNumber}). Swapped ${amountStr} ${inputToken.symbol} → ~${outHuman} ${outputToken.symbol}`);
