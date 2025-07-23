const { ethers } = require('ethers');

// Configuration
const RPC_URL = 'https://mainnet.sanko.xyz';
const PRIVATE_KEY = process.env.PRIVATE_KEY; // Set this in your environment
const PROXY_CONTRACT_ADDRESS = '0x4a8A3BC091c33eCC1440b6734B0324f8d0457C56';

// Contract ABI for addSupportedToken function
const CONTRACT_ABI = [
  {
    "inputs": [
      {"internalType": "address","name": "token","type": "address"},
      {"internalType": "uint256","name": "minWager","type": "uint256"},
      {"internalType": "uint256","name": "maxWager","type": "uint256"}
    ],
    "name": "addSupportedToken",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

async function addNativeDMTToken() {
  try {
    if (!PRIVATE_KEY) {
      throw new Error('PRIVATE_KEY environment variable not set');
    }

    console.log('=== Adding Native DMT as Supported Token ===');
    console.log('');

    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    
    console.log('Connected wallet:', wallet.address);
    console.log('Network:', await provider.getNetwork());
    console.log('');

    const contract = new ethers.Contract(PROXY_CONTRACT_ADDRESS, CONTRACT_ABI, wallet);
    
    // Native DMT address (zero address)
    const NATIVE_DMT = '0x0000000000000000000000000000000000000000';
    
    // Set limits for native DMT (0.01 to 100 DMT)
    const minWager = ethers.parseEther('0.01'); // 0.01 DMT
    const maxWager = ethers.parseEther('100');  // 100 DMT
    
    console.log('Adding native DMT token:');
    console.log(`Token address: ${NATIVE_DMT}`);
    console.log(`Min wager: ${ethers.formatEther(minWager)} DMT`);
    console.log(`Max wager: ${ethers.formatEther(maxWager)} DMT`);
    console.log('');

    // Encode the function call
    const encodedData = contract.interface.encodeFunctionData('addSupportedToken', [
      NATIVE_DMT,
      minWager,
      maxWager
    ]);

    console.log('Encoded function call:');
    console.log(`Function selector: ${encodedData.slice(0, 10)}`);
    console.log(`Full data: ${encodedData}`);
    console.log('');

    // Send the transaction
    const tx = await contract.addSupportedToken(NATIVE_DMT, minWager, maxWager, {
      gasLimit: 100000
    });
    
    console.log('Transaction sent:', tx.hash);
    console.log('Waiting for confirmation...');
    
    const receipt = await tx.wait();
    console.log('✅ Transaction confirmed in block:', receipt.blockNumber);
    console.log('✅ Native DMT is now supported!');
    console.log('');

    // Verify the token was added
    console.log('Verifying token was added...');
    try {
      const minWagerResult = await contract.tokenMinWager(NATIVE_DMT);
      const maxWagerResult = await contract.tokenMaxWager(NATIVE_DMT);
      
      console.log('✅ Verification successful:');
      console.log(`Min wager: ${ethers.formatEther(minWagerResult)} DMT`);
      console.log(`Max wager: ${ethers.formatEther(maxWagerResult)} DMT`);
    } catch (error) {
      console.log('⚠️  Could not verify token limits (function might not exist)');
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Also create a manual transaction data generator
function generateManualTransactionData() {
  console.log('=== Manual Transaction Data ===');
  console.log('');
  
  const NATIVE_DMT = '0x0000000000000000000000000000000000000000';
  const minWager = ethers.parseEther('0.01');
  const maxWager = ethers.parseEther('100');
  
  // Function selector for addSupportedToken(address,uint256,uint256)
  const functionSelector = '0x6d69fcaf';
  
  // Encode parameters
  const encodedParams = ethers.AbiCoder.defaultAbiCoder().encode(
    ['address', 'uint256', 'uint256'],
    [NATIVE_DMT, minWager, maxWager]
  );
  
  const fullData = functionSelector + encodedParams.slice(2); // Remove '0x' from encoded params
  
  console.log('For manual transaction:');
  console.log(`To: ${PROXY_CONTRACT_ADDRESS}`);
  console.log(`Data: ${fullData}`);
  console.log('');
  console.log('Parameters:');
  console.log(`Token: ${NATIVE_DMT} (native DMT)`);
  console.log(`Min wager: ${ethers.formatEther(minWager)} DMT`);
  console.log(`Max wager: ${ethers.formatEther(maxWager)} DMT`);
}

// Check if we should generate manual data or run the transaction
const args = process.argv.slice(2);
if (args.includes('--manual')) {
  generateManualTransactionData();
} else {
  addNativeDMTToken();
} 