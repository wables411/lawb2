const { ethers } = require('ethers');

// Token contract addresses to test
const TOKEN_ADDRESSES = {
  DMT: '0x754cDAd6f5821077d6915004Be2cE05f93d176f8', // Wrapped DMT
  LAWB: '0xA7DA528a3F4AD9441CaE97e1C33D49db91c82b9F', // Current LAWB address
};

const USER_ADDRESS = '0x9387B5a08d050427F74CC9949D811EB6eaEe1090';

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
    
    // Test different decimal calculations
    console.log('Balance with 18 decimals:', ethers.formatUnits(balance, 18));
    console.log('Balance with 6 decimals:', ethers.formatUnits(balance, 6));
    console.log('Balance with 8 decimals:', ethers.formatUnits(balance, 8));
    
    return { name, symbol, decimals, balance: ethers.formatUnits(balance, decimals) };
    
  } catch (error) {
    console.error(`Error with ${tokenSymbol} contract ${tokenAddress}:`, error.message);
    return null;
  }
}

async function testWithProvider(rpcUrl, providerName) {
  try {
    console.log(`\n=== Testing with ${providerName} ===`);
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    
    // Get network info
    const network = await provider.getNetwork();
    console.log('Network:', network);
    
    // Get latest block
    const latestBlock = await provider.getBlockNumber();
    console.log('Latest block:', latestBlock);
    
    // Test each token contract
    const results = [];
    for (const [symbol, address] of Object.entries(TOKEN_ADDRESSES)) {
      const result = await testTokenContract(symbol, address, provider);
      if (result) results.push(result);
    }
    
    // Check native balance (for native DMT)
    const nativeBalance = await provider.getBalance(USER_ADDRESS);
    console.log('\n--- Native DMT Balance ---');
    console.log('Native balance:', ethers.formatEther(nativeBalance));
    
    return results;
    
  } catch (error) {
    console.error(`Error with ${providerName}:`, error.message);
    return [];
  }
}

async function testTokenBalance() {
  console.log('Testing token contracts...');
  console.log('User address:', USER_ADDRESS);
  
  // Test with Sanko Mainnet RPC
  await testWithProvider('https://mainnet.sanko.xyz', 'Sanko Mainnet RPC');
}

testTokenBalance(); 