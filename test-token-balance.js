const { ethers } = require('ethers');

// Token contract addresses to test
const TOKEN_ADDRESSES = {
  DMT: '0x754cDAd6f5821077d6915004Be2cE05f93d176f8', // Wrapped DMT
  GOLD: '0x6F5e2d3b8c5C5c5F9bcB4adCF40b13308e688D4D',
  LAWB: '0xA7DA528a3F4AD9441CaE97e1C33D49db91c82b9F',
  MOSS: '0xeA240b96A9621e67159c59941B9d588eb290ef09'
};

const USER_ADDRESS = '0x9387B5a08d050427F74CC9949D811EB6eaEe1090';
const CHESS_CONTRACT_ADDRESS = '0x4a8A3BC091c33eCC1440b6734B0324f8d0457C56';

// ERC20 ABI (balanceOf, totalSupply, decimals functions)
const ERC20_ABI = [
  {
    "constant": true,
    "inputs": [{"name": "_owner", "type": "address"}],
    "name": "balanceOf",
    "outputs": [{"name": "balance", "type": "uint256"}],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [],
    "name": "totalSupply",
    "outputs": [{"name": "", "type": "uint256"}],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [],
    "name": "decimals",
    "outputs": [{"name": "", "type": "uint8"}],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [],
    "name": "name",
    "outputs": [{"name": "", "type": "string"}],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [],
    "name": "symbol",
    "outputs": [{"name": "", "type": "string"}],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  }
];

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
  },
  {
    "inputs": [{"internalType": "address","name":"","type":"address"}],
    "name": "supportedTokens",
    "outputs": [{"internalType": "bool","name":"","type":"bool"}],
    "stateMutability": "view",
    "type": "function"
  }
];

async function testTokenContract(tokenSymbol, tokenAddress, provider) {
  try {
    console.log(`\n--- Testing ${tokenSymbol} contract: ${tokenAddress} ---`);
    
    // Create contract instance
    const contract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
    
    // Check contract info
    const name = await contract.name();
    const symbol = await contract.symbol();
    const decimals = await contract.decimals();
    const totalSupply = await contract.totalSupply();
    
    console.log('Token name:', name);
    console.log('Token symbol:', symbol);
    console.log('Token decimals:', decimals);
    console.log('Total supply:', ethers.formatUnits(totalSupply, decimals));
    
    // Call balanceOf for the user
    const balance = await contract.balanceOf(USER_ADDRESS);
    console.log('User balance (raw):', balance.toString());
    console.log('User balance (formatted):', ethers.formatUnits(balance, decimals));
    
    return { name, symbol, decimals, balance: ethers.formatUnits(balance, decimals) };
    
  } catch (error) {
    console.error(`Error with ${tokenSymbol} contract ${tokenAddress}:`, error.message);
    return null;
  }
}

async function testChessContractLimits(tokenSymbol, tokenAddress, provider) {
  try {
    console.log(`\n--- Testing Chess Contract Token Limits for ${tokenSymbol} (${tokenAddress}) ---`);
    
    const chessContract = new ethers.Contract(CHESS_CONTRACT_ADDRESS, CHESS_CONTRACT_ABI, provider);
    
    // Check if token is supported
    const isSupported = await chessContract.supportedTokens(tokenAddress);
    console.log('Token supported:', isSupported);
    
    if (isSupported) {
      // Get min and max wager limits
      const minWager = await chessContract.tokenMinWager(tokenAddress);
      const maxWager = await chessContract.tokenMaxWager(tokenAddress);
      
      console.log('Min wager (raw):', minWager.toString());
      console.log('Max wager (raw):', maxWager.toString());
      
      // Get token decimals to format correctly
      const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
      const tokenDecimals = await tokenContract.decimals();
      
      console.log(`Min wager with ${tokenDecimals} decimals:`, ethers.formatUnits(minWager, tokenDecimals));
      console.log(`Max wager with ${tokenDecimals} decimals:`, ethers.formatUnits(maxWager, tokenDecimals));
      
      // Also show with 18 decimals for comparison
      console.log('Min wager with 18 decimals:', ethers.formatUnits(minWager, 18));
      console.log('Max wager with 18 decimals:', ethers.formatUnits(maxWager, 18));
      
      return { minWager, maxWager, isSupported, tokenDecimals };
    } else {
      console.log('Token not supported by chess contract');
      return { isSupported: false };
    }
    
  } catch (error) {
    console.error(`Error checking chess contract limits for ${tokenSymbol}:`, error.message);
    return null;
  }
}

async function main() {
  console.log('Testing all supported tokens and chess contract configuration...');
  console.log('User address:', USER_ADDRESS);
  
  // Connect to Sanko mainnet
  const provider = new ethers.JsonRpcProvider('https://mainnet.sanko.xyz');
  
  try {
    const network = await provider.getNetwork();
    const latestBlock = await provider.getBlockNumber();
    console.log('\n=== Testing with Sanko Mainnet RPC ===');
    console.log('Network:', network);
    console.log('Latest block:', latestBlock);
    
    // Test all token contracts
    for (const [symbol, address] of Object.entries(TOKEN_ADDRESSES)) {
      await testTokenContract(symbol, address, provider);
    }
    
    // Test chess contract limits for all tokens
    for (const [symbol, address] of Object.entries(TOKEN_ADDRESSES)) {
      await testChessContractLimits(symbol, address, provider);
    }
    
    // Test native DMT balance
    console.log('\n--- Native DMT Balance ---');
    const nativeBalance = await provider.getBalance(USER_ADDRESS);
    console.log('Native balance:', ethers.formatEther(nativeBalance));
    
    console.log('\n=== SUMMARY ===');
    console.log('Check if the chess contract limits match the actual token decimals!');
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

main(); 