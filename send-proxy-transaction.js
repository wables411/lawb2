const { ethers } = require('ethers');

// Use the PROXY address - this is where the house is set
const PROXY_CONTRACT_ADDRESS = '0x4a8A3BC091c33eCC1440b6734B0324f8d0457C56';

// Wrapped DMT token address
const DMT_TOKEN = '0x754cDAd6f5821077d6915004Be2cE05f93d176f8';
const LAWB_TOKEN = '0xA7DA528a3F4AD9441CaE97e1C33D49db91c82b9F';

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

async function generateProxyTransaction() {
  try {
    const chessContract = new ethers.Contract(PROXY_CONTRACT_ADDRESS, CHESS_CONTRACT_ABI);
    
    // DMT limits (18 decimals)
    const dmtMinWager = ethers.parseUnits('0.1', 18); // 0.1 DMT
    const dmtMaxWager = ethers.parseUnits('1000', 18); // 1000 DMT
    
    // LAWB limits (6 decimals)
    const lawbMinWager = ethers.parseUnits('100', 6); // 100 LAWB
    const lawbMaxWager = ethers.parseUnits('10000000', 6); // 10,000,000 LAWB
    
    console.log('=== Transaction Data for PROXY Contract ===');
    console.log(`Contract Address: ${PROXY_CONTRACT_ADDRESS}`);
    console.log('⚠️  Use this PROXY address - the house is set here!');
    console.log('');
    
    // Generate DMT transaction data
    const dmtCalldata = chessContract.interface.encodeFunctionData('updateTokenLimits', [
      DMT_TOKEN,
      dmtMinWager,
      dmtMaxWager
    ]);
    
    console.log('=== DMT Token Update ===');
    console.log(`Token: ${DMT_TOKEN} (Wrapped DMT)`);
    console.log(`Min Wager: ${ethers.formatUnits(dmtMinWager, 18)} DMT`);
    console.log(`Max Wager: ${ethers.formatUnits(dmtMaxWager, 18)} DMT`);
    console.log(`Calldata: ${dmtCalldata}`);
    console.log('');
    
    // Generate LAWB transaction data
    const lawbCalldata = chessContract.interface.encodeFunctionData('updateTokenLimits', [
      LAWB_TOKEN,
      lawbMinWager,
      lawbMaxWager
    ]);
    
    console.log('=== LAWB Token Update ===');
    console.log(`Token: ${LAWB_TOKEN} (LAWB)`);
    console.log(`Min Wager: ${ethers.formatUnits(lawbMinWager, 6)} LAWB`);
    console.log(`Max Wager: ${ethers.formatUnits(lawbMaxWager, 6)} LAWB`);
    console.log(`Calldata: ${lawbCalldata}`);
    console.log('');
    
    console.log('=== Instructions ===');
    console.log('1. Use MetaMask or your wallet to send a transaction');
    console.log(`2. To: ${PROXY_CONTRACT_ADDRESS}`);
    console.log('3. Value: 0 ETH');
    console.log('4. Data: Use the calldata above');
    console.log('5. This will forward to the implementation contract');
    console.log('');
    console.log('=== Alternative: Use Wallet Interface ===');
    console.log('1. In your wallet, click "Send" or "Transfer"');
    console.log('2. Paste the proxy contract address');
    console.log('3. Set value to 0');
    console.log('4. In the data field, paste the calldata');
    console.log('5. Send the transaction');
    
  } catch (error) {
    console.error('Error generating transaction:', error.message);
  }
}

generateProxyTransaction(); 