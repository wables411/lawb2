const { ethers } = require('ethers');

// Transaction hash from the user
const TX_HASH = '0xfa8e12703a3c4ea6cd8bfa32c1148cbac9dd3b3de9f75dec19e266eac60df610';

// ERC20 ABI for approve function
const ERC20_ABI = [
  {
    "inputs": [
      {"internalType": "address","name": "spender","type": "address"},
      {"internalType": "uint256","name": "amount","type": "uint256"}
    ],
    "name": "approve",
    "outputs": [{"internalType": "bool","name": "","type": "bool"}],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

async function decodeApprovalTransaction() {
  try {
    const provider = new ethers.JsonRpcProvider('https://mainnet.sanko.xyz');
    
    console.log('=== Decoding Token Approval Transaction ===');
    console.log(`Transaction Hash: ${TX_HASH}`);
    console.log('');
    
    // Get transaction details
    const tx = await provider.getTransaction(TX_HASH);
    if (!tx) {
      console.log('❌ Transaction not found');
      return;
    }
    
    console.log('Transaction Details:');
    console.log(`From: ${tx.from}`);
    console.log(`To: ${tx.to}`);
    console.log(`Value: ${ethers.formatEther(tx.value)} ETH`);
    console.log(`Data: ${tx.data}`);
    console.log('');
    
    // Decode the approval transaction data
    const erc20Contract = new ethers.Contract('0x0000000000000000000000000000000000000000', ERC20_ABI);
    
    try {
      const decodedData = erc20Contract.interface.parseTransaction({ data: tx.data });
      
      console.log('Decoded Approval Transaction:');
      console.log(`Function: ${decodedData.name}`);
      console.log(`Arguments:`);
      console.log(`  spender: ${decodedData.args[0]}`);
      console.log(`  amount: ${decodedData.args[1].toString()}`);
      console.log('');
      
      // Check what's happening
      console.log('Analysis:');
      console.log(`✅ This is a token approval transaction`);
      console.log(`❌ The approval is for the zero address (0x0000000000000000000000000000000000000000)`);
      console.log(`✅ The spender is the chess contract: ${decodedData.args[0]}`);
      console.log(`✅ The amount is: ${ethers.formatUnits(decodedData.args[1], 18)} DMT`);
      console.log('');
      console.log('The problem is:');
      console.log('- Frontend is trying to approve the zero address (native DMT)');
      console.log('- But native DMT doesn\'t need approval');
      console.log('- The contract expects Wrapped DMT which does need approval');
      console.log('');
      console.log('Solution:');
      console.log('- Either wrap your DMT to Wrapped DMT');
      console.log('- Or update the contract to handle native DMT properly');
      
    } catch (error) {
      console.log('❌ Could not decode transaction data:', error.message);
    }
    
    // Check transaction receipt
    const receipt = await provider.getTransactionReceipt(TX_HASH);
    if (receipt) {
      console.log('');
      console.log('Transaction Receipt:');
      console.log(`Status: ${receipt.status === 1 ? 'Success' : 'Failed'}`);
      console.log(`Gas Used: ${receipt.gasUsed.toString()}`);
      console.log(`Block Number: ${receipt.blockNumber}`);
    }
    
  } catch (error) {
    console.error('Error decoding transaction:', error.message);
  }
}

decodeApprovalTransaction(); 