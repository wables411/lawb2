import * as web3 from '@solana/web3.js';
import fs from 'fs';

const connection = new web3.Connection('https://api.mainnet-beta.solana.com', 'confirmed');
const keypair = web3.Keypair.fromSecretKey(
  Uint8Array.from(JSON.parse(fs.readFileSync('C:/Users/wable/lawb2/clawb/credentials/solana/clawb-retake-wallet.json', 'utf-8')))
);

const LAWB_MINT = '65GVcK2xS1RPa6sW2UdV6NJ7s5cvW6tj4UdV6z5UdV6';
const amount = 0.2; // SOL
const slippage = 50; // 0.5% in bps

console.log('Fetching quote...');
const quoteResponse = await fetch(
  `https://api.jup.ag/quote/v1/quote?inputMint=So11111111111111111111111111111111111111112&outputMint=${LAWB_MINT}&amount=${Math.floor(amount * web3.LAMPORTS_PER_SOL)}&slippageBps=${slippage}`
);
const quoteData = await quoteResponse.json();

console.log('Raw quote response:', JSON.stringify(quoteData, null, 2));

if (quoteData.error || !quoteData.data) {
  console.error('Quote error:', quoteData.error || 'No data in response');
  process.exit(1);
}

const route = quoteData.data[0]; // Get best route

console.log('Quote received:');
console.log('Input:', amount, 'SOL');
console.log('Expected output:', route.outAmount / 1e6, '$LAWB');
console.log('Price impact:', route.priceImpactPct + '%');

console.log('\nExecuting swap...');
const swapResponse = await fetch('https://api.jup.ag/swap/v1/swap', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    route: route,
    userPublicKey: keypair.publicKey.toString(),
    wrapUnwrapSOL: true,
  })
});

const { swapTransaction } = await swapResponse.json();

const swapTransactionBuf = Buffer.from(swapTransaction, 'base64');
const transaction = web3.VersionedTransaction.deserialize(swapTransactionBuf);
transaction.sign([keypair]);

const rawTransaction = transaction.serialize();
const txid = await connection.sendRawTransaction(rawTransaction, {
  skipPreflight: true,
  maxRetries: 2
});

console.log('\nTransaction sent:', txid);
console.log('Explorer: https://solscan.io/tx/' + txid);

console.log('\nWaiting for confirmation...');
const confirmation = await connection.confirmTransaction(txid, 'confirmed');
console.log('Confirmed:', !confirmation.value.err);
