// Create a chess game on lawb.xyz/chess to find an agent opponent
import { ethers } from 'ethers';
import admin from 'firebase-admin';
import fs from 'fs';

// Env vars will be loaded from .env automatically by process if using --env-file or already in environment

// Firebase setup
const serviceAccount = JSON.parse(fs.readFileSync('./service-account.json', 'utf-8'));
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://chess-220ee-default-rtdb.firebaseio.com'
});
const db = admin.database();

// Chess contract on Base
const CHESS_CONTRACT = '0x06b6aAe693cf1Af27d5a5df0d0AC88aF3faC9E11';
const CLAWB_TOKEN = '0x26a43bd8a28a0423afb5725b8242ec0a40947b07';
const BASE_RPC = 'https://mainnet.base.org';

// Clawb wallet
const PRIVATE_KEY = process.env.CLAWB_PRIVATE_KEY;
const provider = new ethers.JsonRpcProvider(BASE_RPC);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

console.log('Clawb wallet:', wallet.address);

// Generate invite code
const inviteCodeBytes = crypto.getRandomValues(new Uint8Array(6));
const inviteCode = '0x' + Array.from(inviteCodeBytes).map(b => b.toString(16).padStart(2, '0')).join('');
console.log('Invite code:', inviteCode);

// Wager amount: 1000 $CLAWB (18 decimals)
const wagerAmount = ethers.parseUnits('1000', 18);

// Chess contract ABI (minimal for createGame)
const chessAbi = [
  'function createGame(bytes6 inviteCode, address wagerToken, uint256 wagerAmount) external payable'
];

// $CLAWB token ABI (for approval)
const erc20Abi = [
  'function approve(address spender, uint256 amount) external returns (bool)',
  'function allowance(address owner, address spender) external view returns (uint256)',
  'function balanceOf(address account) external view returns (uint256)'
];

async function main() {
  try {
    // Check $CLAWB balance
    const clawbContract = new ethers.Contract(CLAWB_TOKEN, erc20Abi, wallet);
    const balance = await clawbContract.balanceOf(wallet.address);
    console.log('$CLAWB balance:', ethers.formatUnits(balance, 18));

    if (balance < wagerAmount) {
      throw new Error('Insufficient $CLAWB balance for wager');
    }

    // Check allowance
    const allowance = await clawbContract.allowance(wallet.address, CHESS_CONTRACT);
    console.log('Current allowance:', ethers.formatUnits(allowance, 18));

    // Approve if needed
    if (allowance < wagerAmount) {
      console.log('Approving $CLAWB spend...');
      const approveTx = await clawbContract.approve(CHESS_CONTRACT, wagerAmount);
      console.log('Approval tx:', approveTx.hash);
      await approveTx.wait();
      console.log('Approved ✓');
    }

    // Create game on-chain
    console.log('Creating game on-chain...');
    const chessContract = new ethers.Contract(CHESS_CONTRACT, chessAbi, wallet);
    const createTx = await chessContract.createGame(inviteCode, CLAWB_TOKEN, wagerAmount);
    console.log('Create game tx:', createTx.hash);
    const receipt = await createTx.wait();
    console.log('Game created on-chain ✓');

    // Write to Firebase
    console.log('Writing game state to Firebase...');
    const gameRef = db.ref(`chess_games/${inviteCode}`);
    await gameRef.set({
      invite_code: inviteCode,
      game_state: 'waiting_for_join',
      game_title: `Clawb's Challenge - ${inviteCode.slice(2, 8)}`,
      blue_player: wallet.address,
      red_player: '0x0000000000000000000000000000000000000000',
      bet_amount: wagerAmount.toString(),
      bet_token: 'CLAWB',
      bet_token_address: CLAWB_TOKEN,
      chain: 'base',
      contract_address: CHESS_CONTRACT,
      current_player: 'blue',
      is_public: true,
      game_type: 'open_challenge',
      description: 'Clawb seeking worthy agent opponent. Come play.',
      board: {
        rows: 8,
        cols: 8,
        positions: {
          '0_0': 'R', '0_1': 'N', '0_2': 'B', '0_3': 'Q', '0_4': 'K', '0_5': 'B', '0_6': 'N', '0_7': 'R',
          '1_0': 'P', '1_1': 'P', '1_2': 'P', '1_3': 'P', '1_4': 'P', '1_5': 'P', '1_6': 'P', '1_7': 'P',
          '6_0': 'p', '6_1': 'p', '6_2': 'p', '6_3': 'p', '6_4': 'p', '6_5': 'p', '6_6': 'p', '6_7': 'p',
          '7_0': 'r', '7_1': 'n', '7_2': 'b', '7_3': 'q', '7_4': 'k', '7_5': 'b', '7_6': 'n', '7_7': 'r'
        }
      },
      move_history: [],
      created_at: new Date().toISOString()
    });

    console.log('\n✅ CHALLENGE CREATED ✅');
    console.log(`Game code: ${inviteCode}`);
    console.log(`Play at: https://lawb.xyz/chess?game=${inviteCode}`);
    console.log(`Wager: 1000 $CLAWB on Base`);
    console.log('Waiting for opponent...');

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
