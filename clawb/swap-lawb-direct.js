// Direct Raydium swap using @raydium-io/raydium-sdk-v2
import * as web3 from '@solana/web3.js';
import { getAssociatedTokenAddressSync } from '@solana/spl-token';
import fs from 'fs';

const connection = new web3.Connection('https://api.mainnet-beta.solana.com', 'confirmed');
const keypair = web3.Keypair.fromSecretKey(
  Uint8Array.from(JSON.parse(fs.readFileSync('C:/Users/wable/lawb2/clawb/credentials/solana/clawb-retake-wallet.json', 'utf-8')))
);

const SOL_MINT = 'So11111111111111111111111111111111111111112';
const LAWB_MINT = '65GVcK2xS1RPa6sW2UdV6NJ7s5cvW6tj4UdV6z5UdV6';
const amount = 0.2; // SOL

console.log('Wallet:', keypair.publicKey.toString());
console.log('Swapping', amount, 'SOL for $LAWB...');
console.log('\nNote: Direct DEX swap requires Raydium SDK or manual pool interaction.');
console.log('Bankr API would be the simplest path but requires valid API key.');
console.log('\nPlease visit bankr.bot/api to generate a fresh API key,');
console.log('then run: bankr login --api-key bk_YOUR_KEY');
console.log('Then: bankr prompt "swap 0.2 SOL for $LAWB on Solana"');
