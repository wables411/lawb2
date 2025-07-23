const { ethers } = require('ethers');

// Configuration
const CHESS_CONTRACT_ADDRESS = '0x4a8A3BC091c33eCC1440b6734B0324f8d0457C56';
const DMT_TOKEN_ADDRESS = '0x754cDAd6f5821077d6915004Be2cE05f93d176f8'; // Wrapped DMT (what contract expects)
const LAWB_TOKEN_ADDRESS = '0xA7DA528a3F4AD9441CaE97e1C33D49db91c82b9F';

// Chess contract ABI for updateTokenLimits
const CHESS_CONTRACT_ABI = [
  {
    "inputs": [
      {"internalType": "address","name": "token","type": "address"},
      {"internalType": "uint256","name": "minWager","type": "uint256"},
      {"internalType": "uint256","name": "maxWager","type": "uint256"}
    ],
    "name": "updateTokenLimits",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

async function updateTokenLimits() {
  try {
    // Connect to Sanko mainnet
    const provider = new ethers.JsonRpcProvider('https://mainnet.sanko.xyz');
    
    console.log('Updating token limits for Wrapped DMT...\n');
    
    const chessContract = new ethers.Contract(CHESS_CONTRACT_ADDRESS, CHESS_CONTRACT_ABI, provider);
    
    // Calculate new limits
    // DMT: 18 decimals (Wrapped DMT)
    const dmtMinWager = ethers.parseUnits('0.1', 18); // 0.1 DMT
    const dmtMaxWager = ethers.parseUnits('1000', 18); // 1000 DMT
    
    // LAWB: 6 decimals
    const lawbMinWager = ethers.parseUnits('100', 6); // 100 LAWB
    const lawbMaxWager = ethers.parseUnits('10000000', 6); // 10,000,000 LAWB
    
    console.log('New DMT limits (Wrapped DMT):');
    console.log('  Min: 0.1 DMT =', dmtMinWager.toString());
    console.log('  Max: 1000 DMT =', dmtMaxWager.toString());
    console.log('');
    
    console.log('New LAWB limits:');
    console.log('  Min: 100 LAWB =', lawbMinWager.toString());
    console.log('  Max: 10,000,000 LAWB =', lawbMaxWager.toString());
    console.log('');
    
    // Note: This script only shows the transaction data
    // You'll need to execute these transactions with a wallet that has admin privileges
    
    console.log('=== TRANSACTION DATA ===');
    console.log('');
    
    // DMT update transaction data (Wrapped DMT)
    const dmtUpdateData = chessContract.interface.encodeFunctionData('updateTokenLimits', [
      DMT_TOKEN_ADDRESS,
      dmtMinWager,
      dmtMaxWager
    ]);
    
    console.log('DMT Update Transaction (Wrapped DMT):');
    console.log('  To:', CHESS_CONTRACT_ADDRESS);
    console.log('  Data:', dmtUpdateData);
    console.log('');
    
    // LAWB update transaction data
    const lawbUpdateData = chessContract.interface.encodeFunctionData('updateTokenLimits', [
      LAWB_TOKEN_ADDRESS,
      lawbMinWager,
      lawbMaxWager
    ]);
    
    console.log('LAWB Update Transaction:');
    console.log('  To:', CHESS_CONTRACT_ADDRESS);
    console.log('  Data:', lawbUpdateData);
    console.log('');
    
    console.log('=== VERIFICATION ===');
    console.log('After updating, you can verify the new limits by running:');
    console.log('node test-token-balance.js');
    
  } catch (error) {
    console.error('Error preparing token limit updates:', error.message);
  }
}

updateTokenLimits(); 