/**
 * Script to check if allowAllTokens is enabled on Base contract
 * 
 * Usage:
 *   node check-allow-all-tokens.js
 * 
 * Or with custom RPC:
 *   BASE_RPC_URL=https://mainnet.base.org node check-allow-all-tokens.js
 */

const { ethers } = require('ethers');

// Base contract addresses
const BASE_PROXY_ADDRESS = '0x06b6aAe693cf1Af27d5a5df0d0AC88aF3faC9E11';
const BASE_IMPLEMENTATION_ADDRESS = '0x7d287427EC6bBEF1f00e8d8f3300a9be18cF8f29';

// Minimal ABI for allowAllTokens
const CHESS_ABI = [
  {
    "inputs": [],
    "name": "allowAllTokens",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  }
];

async function checkAllowAllTokens() {
  try {
    // Use Base public RPC
    const rpcUrl = process.env.BASE_RPC_URL || 'https://mainnet.base.org';
    console.log(`Connecting to Base via: ${rpcUrl}`);
    
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    
    // Check via proxy (this is what frontend uses)
    console.log('\n📋 Checking via Proxy Contract...');
    const proxyContract = new ethers.Contract(BASE_PROXY_ADDRESS, CHESS_ABI, provider);
    
    try {
      const allowAll = await proxyContract.allowAllTokens();
      console.log(`✅ Proxy (${BASE_PROXY_ADDRESS}):`);
      console.log(`   allowAllTokens = ${allowAll}`);
      
      if (allowAll) {
        console.log('   ✅ SUCCESS: allowAllTokens is ENABLED - custom tokens will work!');
      } else {
        console.log('   ❌ WARNING: allowAllTokens is DISABLED - custom tokens will NOT work!');
        console.log('   ⚠️  You need to call setAllowAllTokens(true) as contract owner');
      }
    } catch (error) {
      console.log(`   ❌ Error reading from proxy: ${error.message}`);
    }
    
    // Also check implementation directly (for reference)
    console.log('\n📋 Checking via Implementation Contract (for reference)...');
    const implContract = new ethers.Contract(BASE_IMPLEMENTATION_ADDRESS, CHESS_ABI, provider);
    
    try {
      const allowAllImpl = await implContract.allowAllTokens();
      console.log(`✅ Implementation (${BASE_IMPLEMENTATION_ADDRESS}):`);
      console.log(`   allowAllTokens = ${allowAllImpl}`);
      
      if (allowAllImpl !== undefined) {
        console.log('   ℹ️  Note: This reads from implementation storage, not proxy storage');
        console.log('   ℹ️  The proxy value (above) is what matters for the frontend');
      }
    } catch (error) {
      console.log(`   ⚠️  Could not read from implementation (this is normal for proxies): ${error.message}`);
    }
    
    // Alternative: Read storage slot directly
    console.log('\n📋 Reading Storage Slot 0 (alternative method)...');
    try {
      // Storage slot 0 contains: house (address, 20 bytes) + allowAllTokens (bool, 1 byte at offset 20)
      const slot0 = await provider.getStorage(BASE_PROXY_ADDRESS, 0);
      console.log(`   Slot 0 (hex): ${slot0}`);
      
      // Extract the bool at offset 20 (bytes 20-21)
      // Slot 0 is 32 bytes: [house (20 bytes)][allowAllTokens (1 byte)][padding (11 bytes)]
      const slot0Bytes = ethers.getBytes(slot0);
      const allowAllFromStorage = slot0Bytes[20] !== 0;
      
      console.log(`   allowAllTokens (from storage) = ${allowAllFromStorage}`);
      
      if (allowAllFromStorage) {
        console.log('   ✅ Storage confirms: allowAllTokens is ENABLED');
      } else {
        console.log('   ❌ Storage confirms: allowAllTokens is DISABLED');
      }
    } catch (error) {
      console.log(`   ⚠️  Could not read storage: ${error.message}`);
    }
    
    console.log('\n✅ Check complete!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkAllowAllTokens();
