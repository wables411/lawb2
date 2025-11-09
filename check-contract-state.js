// Check contract state for game 0xc3914d386391
const { ethers } = require('ethers');

const CHESS_CONTRACT_ADDRESS = '0x4a8A3BC091c33eCC1440b6734B0324f8d0457C56';
const INVITE_CODE = '0xc3914d386391';
const RPC_URL = 'https://mainnet.sanko.xyz';

const CHESS_CONTRACT_ABI = [
  {
    "inputs": [{"internalType": "bytes6", "name": "inviteCode", "type": "bytes6"}],
    "name": "games",
    "outputs": [
      {"internalType": "address", "name": "player1", "type": "address"},
      {"internalType": "address", "name": "player2", "type": "address"},
      {"internalType": "bool", "name": "isActive", "type": "bool"},
      {"internalType": "address", "name": "winner", "type": "address"},
      {"internalType": "bytes6", "name": "inviteCode", "type": "bytes6"},
      {"internalType": "uint256", "name": "wagerAmount", "type": "uint256"}
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

async function checkGameState() {
  try {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const contract = new ethers.Contract(CHESS_CONTRACT_ADDRESS, CHESS_CONTRACT_ABI, provider);
    
    console.log('Checking contract state for game:', INVITE_CODE);
    console.log('Contract address:', CHESS_CONTRACT_ADDRESS);
    console.log('');
    
    const gameData = await contract.games(INVITE_CODE);
    
    console.log('Contract Game Data:');
    console.log('  Player 1:', gameData.player1);
    console.log('  Player 2:', gameData.player2);
    console.log('  isActive:', gameData.isActive);
    console.log('  Winner:', gameData.winner);
    console.log('  Invite Code:', gameData.inviteCode);
    console.log('  Wager Amount:', gameData.wagerAmount.toString());
    console.log('');
    
    if (!gameData.isActive) {
      console.log('✅ Contract shows game is ENDED (isActive = false)');
      console.log('✅ Winner:', gameData.winner);
    } else {
      console.log('❌ Contract shows game is ACTIVE (isActive = true)');
    }
    
  } catch (error) {
    console.error('Error checking contract state:', error.message);
  }
}

checkGameState();

