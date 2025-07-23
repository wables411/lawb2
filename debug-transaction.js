const { ethers } = require('ethers');

// Transaction hash from the user
const TX_HASH = '0xfa8e12703a3c4ea6cd8bfa32c1148cbac9dd3b3de9f75dec19e266eac60df610';

// Chess contract ABI for createGame function
const CHESS_CONTRACT_ABI = [
  {
    "inputs": [
      {"internalType": "bytes6","name": "inviteCode","type": "bytes6"},
      {"internalType": "address","name": "wagerToken","type": "address"},
      {"internalType": "uint256","name": "wagerAmount","type": "uint256"}
    ],
    "name": "createGame",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

async function decodeTransaction() {
  try {
    const provider = new ethers.JsonRpcProvider('https://mainnet.sanko.xyz');
    
    console.log('=== Decoding Transaction ===');
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
    
    // Decode the transaction data
    const chessContract = new ethers.Contract('0x0000000000000000000000000000000000000000', CHESS_CONTRACT_ABI);
    
    try {
      const decodedData = chessContract.interface.parseTransaction({ data: tx.data });
      
      console.log('Decoded Transaction Data:');
      console.log(`Function: ${decodedData.name}`);
      console.log(`Arguments:`);
      console.log(`  inviteCode: ${decodedData.args[0]}`);
      console.log(`  wagerToken: ${decodedData.args[1]}`);
      console.log(`  wagerAmount: ${decodedData.args[2].toString()}`);
      console.log('');
      
      // Check if wagerToken is zero address (native DMT)
      if (decodedData.args[1] === '0x0000000000000000000000000000000000000000') {
        console.log('❌ PROBLEM FOUND:');
        console.log('The transaction is sending zero address (native DMT) to the contract');
        console.log('But the contract expects Wrapped DMT address');
        console.log('');
        console.log('Expected Wrapped DMT: 0x754cDAd6f5821077d6915004Be2cE05f93d176f8');
        console.log('Sent: 0x0000000000000000000000000000000000000000');
      } else {
        console.log('✅ Token address looks correct');
      }
      
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
      
      if (receipt.logs.length > 0) {
        console.log('');
        console.log('Transaction Logs:');
        receipt.logs.forEach((log, index) => {
          console.log(`Log ${index}: ${log.address} - ${log.topics.join(', ')}`);
        });
      }
    }
    
  } catch (error) {
    console.error('Error decoding transaction:', error.message);
  }
}

decodeTransaction(); 