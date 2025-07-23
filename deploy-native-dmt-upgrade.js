const { ethers } = require('ethers');
const fs = require('fs');

// Configuration
const RPC_URL = 'https://mainnet.sanko.xyz';
const PRIVATE_KEY = process.env.PRIVATE_KEY; // Set this in your environment
const PROXY_CONTRACT_ADDRESS = '0x4a8A3BC091c33eCC1440b6734B0324f8d0457C56';
const IMPLEMENTATION_CONTRACT_ADDRESS = '0xCDC19Fe80C53a3cc12fcFAe495b18E620b6a5D56';

// Contract ABIs
const PROXY_ABI = [
  {
    "inputs": [
      {"internalType": "address","name": "newImplementation","type": "address"},
      {"internalType": "bytes","name": "data","type": "bytes"}
    ],
    "name": "upgradeToAndCall",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  }
];

const IMPLEMENTATION_ABI = [
  {
    "inputs": [
      {"internalType": "address","name": "_houseAddress","type": "address"},
      {"internalType": "uint256","name": "_feePercentage","type": "uint256"},
      {"internalType": "uint256","name": "_moveTimeout","type": "uint256"}
    ],
    "name": "initialize",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

async function deployNativeDMTUpgrade() {
  try {
    if (!PRIVATE_KEY) {
      throw new Error('PRIVATE_KEY environment variable not set');
    }

    console.log('=== Deploying Native DMT Contract Upgrade ===');
    console.log('');

    // Connect to network
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    
    console.log('Connected wallet:', wallet.address);
    console.log('Network:', await provider.getNetwork());
    console.log('');

    // Read the contract source
    const contractSource = fs.readFileSync('contract-update-native-dmt.sol', 'utf8');
    console.log('✅ Contract source loaded');
    console.log('');

    // Step 1: Deploy new implementation contract
    console.log('Step 1: Deploying new implementation contract...');
    
    // For this example, we'll use a simplified approach
    // In practice, you'd compile the contract and deploy it
    console.log('⚠️  Note: This script assumes you have compiled the contract');
    console.log('   You need to compile contract-update-native-dmt.sol first');
    console.log('   and get the bytecode and ABI');
    console.log('');

    // Step 2: Upgrade the proxy
    console.log('Step 2: Upgrading proxy contract...');
    
    const proxyContract = new ethers.Contract(PROXY_CONTRACT_ADDRESS, PROXY_ABI, wallet);
    
    // Get current implementation
    const currentImplementation = await provider.getStorageAt(PROXY_CONTRACT_ADDRESS, '0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc');
    console.log('Current implementation:', ethers.getAddress(currentImplementation));
    console.log('');

    // For the upgrade, you would:
    // 1. Deploy the new implementation
    // 2. Call upgradeToAndCall on the proxy
    
    console.log('To complete the upgrade:');
    console.log('1. Compile the contract-update-native-dmt.sol file');
    console.log('2. Deploy the new implementation contract');
    console.log('3. Call upgradeToAndCall on the proxy with the new implementation address');
    console.log('');

    // Example upgrade call (commented out for safety)
    /*
    const upgradeData = ethers.Interface.encodeFunctionData('initialize', [
      '0x...', // house address
      250,     // fee percentage (2.5%)
      3600     // move timeout (1 hour)
    ]);
    
    const upgradeTx = await proxyContract.upgradeToAndCall(
      newImplementationAddress,
      upgradeData,
      { gasLimit: 500000 }
    );
    
    console.log('Upgrade transaction sent:', upgradeTx.hash);
    await upgradeTx.wait();
    console.log('✅ Upgrade completed!');
    */

    console.log('=== Manual Steps Required ===');
    console.log('');
    console.log('1. Compile the contract:');
    console.log('   npx hardhat compile');
    console.log('');
    console.log('2. Deploy new implementation:');
    console.log('   npx hardhat run scripts/deploy.js --network sanko');
    console.log('');
    console.log('3. Upgrade proxy (replace NEW_IMPL_ADDRESS):');
    console.log('   npx hardhat run scripts/upgrade.js --network sanko');
    console.log('');

  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Alternative: Create a simple script to update token limits for native DMT
async function updateNativeDMTLimits() {
  try {
    if (!PRIVATE_KEY) {
      throw new Error('PRIVATE_KEY environment variable not set');
    }

    console.log('=== Updating Native DMT Token Limits ===');
    console.log('');

    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    
    console.log('Connected wallet:', wallet.address);
    console.log('');

    // Contract ABI for updateTokenLimits
    const CONTRACT_ABI = [
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

    const contract = new ethers.Contract(PROXY_CONTRACT_ADDRESS, CONTRACT_ABI, wallet);
    
    // Native DMT address (zero address)
    const NATIVE_DMT = '0x0000000000000000000000000000000000000000';
    
    // Set limits for native DMT (0.01 to 100 DMT)
    const minWager = ethers.parseEther('0.01'); // 0.01 DMT
    const maxWager = ethers.parseEther('100');  // 100 DMT
    
    console.log('Updating native DMT limits:');
    console.log(`Min wager: ${ethers.formatEther(minWager)} DMT`);
    console.log(`Max wager: ${ethers.formatEther(maxWager)} DMT`);
    console.log('');

    const tx = await contract.updateTokenLimits(NATIVE_DMT, minWager, maxWager, {
      gasLimit: 100000
    });
    
    console.log('Transaction sent:', tx.hash);
    console.log('Waiting for confirmation...');
    
    const receipt = await tx.wait();
    console.log('✅ Transaction confirmed in block:', receipt.blockNumber);
    console.log('');

  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Check if we should run the upgrade or just update limits
const args = process.argv.slice(2);
if (args.includes('--limits-only')) {
  updateNativeDMTLimits();
} else {
  deployNativeDMTUpgrade();
} 