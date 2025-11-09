// Check if playerToGame mapping still exists
const { ethers } = require('ethers');

const CHESS_CONTRACT_ADDRESS = '0x4a8A3BC091c33eCC1440b6734B0324f8d0457C56';
const RPC_URL = 'https://mainnet.sanko.xyz';

// Players from the game
const BLUE_PLAYER = '0x9387B5a08d050427F74CC9949D811EB6eaEe1090';
const RED_PLAYER = '0x9CCa475416BC3448A539E30369792A090859De9d';

const CHESS_CONTRACT_ABI = [
  {
    "inputs": [{"internalType": "address", "name": "", "type": "address"}],
    "name": "playerToGame",
    "outputs": [{"internalType": "bytes6", "name": "", "type": "bytes6"}],
    "stateMutability": "view",
    "type": "function"
  }
];

async function checkPlayerMapping() {
  try {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const contract = new ethers.Contract(CHESS_CONTRACT_ADDRESS, CHESS_CONTRACT_ABI, provider);
    
    console.log('Checking playerToGame mappings...');
    console.log('');
    
    const bluePlayerGame = await contract.playerToGame(BLUE_PLAYER);
    const redPlayerGame = await contract.playerToGame(RED_PLAYER);
    
    console.log('Blue Player (0x9387...1090):');
    console.log('  playerToGame:', bluePlayerGame);
    console.log('  Is zero?', bluePlayerGame === '0x000000000000');
    console.log('');
    
    console.log('Red Player (0x9CCa...De9d):');
    console.log('  playerToGame:', redPlayerGame);
    console.log('  Is zero?', redPlayerGame === '0x000000000000');
    console.log('');
    
    if (bluePlayerGame === '0x000000000000' && redPlayerGame === '0x000000000000') {
      console.log('✅ Both player mappings are cleared - game should NOT reload');
    } else {
      console.log('❌ Player mappings still exist:');
      if (bluePlayerGame !== '0x000000000000') {
        console.log('  Blue player still mapped to:', bluePlayerGame);
      }
      if (redPlayerGame !== '0x000000000000') {
        console.log('  Red player still mapped to:', redPlayerGame);
      }
      console.log('');
      console.log('⚠️ This is why the game reloads - playerToGame still returns the invite code');
    }
    
  } catch (error) {
    console.error('Error checking player mapping:', error.message);
  }
}

checkPlayerMapping();

