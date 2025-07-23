const { ethers } = require('ethers');

// Configuration
const CHESS_CONTRACT_ADDRESS = '0x4a8A3BC091c33eCC1440b6734B0324f8d0457C56';
const DMT_TOKEN_ADDRESS = '0x754cDAd6f5821077d6915004Be2cE05f93d176f8';

// Chess contract ABI for token limits
const CHESS_CONTRACT_ABI = [
  {
    "inputs": [{"internalType": "address","name":"","type":"address"}],
    "name": "tokenMaxWager",
    "outputs": [{"internalType": "uint256","name":"","type":"uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address","name":"","type":"address"}],
    "name": "tokenMinWager",
    "outputs": [{"internalType": "uint256","name":"","type":"uint256"}],
    "stateMutability": "view",
    "type": "function"
  }
];

async function testDMTLimits() {
  try {
    // Connect to Sanko mainnet
    const provider = new ethers.JsonRpcProvider('https://mainnet.sanko.xyz');
    
    console.log('Testing DMT wager limits...\n');
    
    const chessContract = new ethers.Contract(CHESS_CONTRACT_ADDRESS, CHESS_CONTRACT_ABI, provider);
    
    // Get min and max wager limits
    const minWager = await chessContract.tokenMinWager(DMT_TOKEN_ADDRESS);
    const maxWager = await chessContract.tokenMaxWager(DMT_TOKEN_ADDRESS);
    
    console.log('DMT Token Address:', DMT_TOKEN_ADDRESS);
    console.log('Min wager (raw):', minWager.toString());
    console.log('Max wager (raw):', maxWager.toString());
    console.log('Min wager (DMT):', ethers.formatUnits(minWager, 18));
    console.log('Max wager (DMT):', ethers.formatUnits(maxWager, 18));
    
    // Test your attempted wager
    const attemptedWager = ethers.parseUnits('0.1', 18); // 0.1 DMT
    console.log('\nYour attempted wager (0.1 DMT):', attemptedWager.toString());
    console.log('Is within limits?', attemptedWager >= minWager && attemptedWager <= maxWager ? 'YES' : 'NO');
    
    // Test a valid wager within limits
    const validWager = ethers.parseUnits('0.0000000000000001', 18); // Max allowed
    console.log('\nValid wager (max allowed):', validWager.toString());
    console.log('Valid wager (DMT):', ethers.formatUnits(validWager, 18));
    
    // Test a slightly lower valid wager
    const lowerValidWager = ethers.parseUnits('0.00000000000000005', 18); // Half of max
    console.log('\nLower valid wager (half of max):', lowerValidWager.toString());
    console.log('Lower valid wager (DMT):', ethers.formatUnits(lowerValidWager, 18));
    
  } catch (error) {
    console.error('Error testing DMT limits:', error.message);
  }
}

testDMTLimits(); 