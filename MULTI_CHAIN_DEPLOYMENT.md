# Multi-Chain Chess Contract Deployment Guide

This guide explains how to deploy the Lawb Chess contract on Base and Arbitrum networks.

## Overview

The chess contract is currently deployed on:
- **Sanko Mainnet** (Chain ID: 1996) - `0x4a8A3BC091c33eCC1440b6734B0324f8d0457C56`
- **Sanko Testnet** (Chain ID: 1992) - `0x3112AF5728520F52FD1C6710dD7bD52285a68e47`

This guide covers deploying to:
- **Base Mainnet** (Chain ID: 8453)
- **Arbitrum One** (Chain ID: 42161)

## Prerequisites

1. **Contract Repository**: Access to `lawbchess1` repository (or wherever the contract code lives)
2. **Deployment Wallet**: A wallet with sufficient funds for:
   - Base: ETH for gas fees
   - Arbitrum: ETH for gas fees
3. **Environment Setup**: Hardhat/Foundry configured for multi-chain deployment

## Step 1: Contract Deployment

### For Base Mainnet

1. **Navigate to contract repository**:
   ```bash
   cd lawbchess1  # or your contract repo
   ```

2. **Set up environment variables**:
   ```bash
   # Create or update .env file
   echo "PRIVATE_KEY=your_private_key_here" >> .env
   echo "BASE_RPC_URL=https://mainnet.base.org" >> .env
   ```

3. **Configure Hardhat for Base** (if not already configured):
   ```javascript
   // hardhat.config.js
   module.exports = {
     networks: {
       base: {
         url: process.env.BASE_RPC_URL || "https://mainnet.base.org",
         accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
         chainId: 8453,
       },
     },
   };
   ```

4. **Deploy contract**:
   ```bash
   npx hardhat run scripts/deploy-base.js --network base
   ```

   Or create a deployment script:
   ```javascript
   // scripts/deploy-base.js
   const hre = require("hardhat");

   async function main() {
     const ChessGame = await hre.ethers.getContractFactory("ChessGame");
     
     // Deploy with house address (same as Sanko deployment)
     const houseAddress = "YOUR_HOUSE_WALLET_ADDRESS"; // Replace with actual house wallet
     
     const chessGame = await ChessGame.deploy(houseAddress);
     await chessGame.waitForDeployment();
     
     const address = await chessGame.getAddress();
     console.log("Chess Game deployed to Base at:", address);
     
     // Initialize contract
     await chessGame.initialize(houseAddress);
     console.log("Contract initialized");
     
     // Set up supported tokens (USDC on Base)
     const USDC_BASE = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
     await chessGame.addSupportedToken(USDC_BASE);
     console.log("USDC added as supported token");
     
     // Set token limits (adjust as needed)
     const minWager = ethers.parseUnits("1", 6); // 1 USDC (6 decimals)
     const maxWager = ethers.parseUnits("1000", 6); // 1000 USDC
     await chessGame.updateTokenLimits(USDC_BASE, minWager, maxWager);
     console.log("Token limits set");
   }

   main()
     .then(() => process.exit(0))
     .catch((error) => {
       console.error(error);
       process.exit(1);
     });
   ```

### For Arbitrum One

1. **Set up environment variables**:
   ```bash
   echo "ARBITRUM_RPC_URL=https://arb1.arbitrum.io/rpc" >> .env
   ```

2. **Configure Hardhat for Arbitrum**:
   ```javascript
   // hardhat.config.js
   module.exports = {
     networks: {
       arbitrum: {
         url: process.env.ARBITRUM_RPC_URL || "https://arb1.arbitrum.io/rpc",
         accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
         chainId: 42161,
       },
     },
   };
   ```

3. **Deploy contract**:
   ```bash
   npx hardhat run scripts/deploy-arbitrum.js --network arbitrum
   ```

   Deployment script:
   ```javascript
   // scripts/deploy-arbitrum.js
   const hre = require("hardhat");

   async function main() {
     const ChessGame = await hre.ethers.getContractFactory("ChessGame");
     
     const houseAddress = "YOUR_HOUSE_WALLET_ADDRESS";
     
     const chessGame = await ChessGame.deploy(houseAddress);
     await chessGame.waitForDeployment();
     
     const address = await chessGame.getAddress();
     console.log("Chess Game deployed to Arbitrum at:", address);
     
     await chessGame.initialize(houseAddress);
     console.log("Contract initialized");
     
     // Set up USDC on Arbitrum
     const USDC_ARBITRUM = "0xaf88d065e77c8cC2239327C5EDb3A432268e5831";
     await chessGame.addSupportedToken(USDC_ARBITRUM);
     console.log("USDC added as supported token");
     
     const minWager = ethers.parseUnits("1", 6);
     const maxWager = ethers.parseUnits("1000", 6);
     await chessGame.updateTokenLimits(USDC_ARBITRUM, minWager, maxWager);
     console.log("Token limits set");
   }

   main()
     .then(() => process.exit(0))
     .catch((error) => {
       console.error(error);
       process.exit(1);
     });
   ```

## Step 2: Update Frontend Configuration

After deployment, update the frontend contract addresses:

1. **Update `src/config/tokens.ts`**:
   ```typescript
   export const CONTRACT_ADDRESSES = {
     testnet: {
       chess: '0x3112AF5728520F52FD1C6710dD7bD52285a68e47' // Sanko Testnet
     },
     mainnet: {
       chess: '0x4a8A3BC091c33eCC1440b6734B0324f8d0457C56' // Sanko Mainnet
     },
     base: {
       chess: 'YOUR_BASE_CONTRACT_ADDRESS' // Replace with actual Base address
     },
     arbitrum: {
       chess: 'YOUR_ARBITRUM_CONTRACT_ADDRESS' // Replace with actual Arbitrum address
     }
   } as const;
   ```

## Step 3: Verify Deployment

1. **Verify contract on block explorer**:
   - Base: https://basescan.org/address/YOUR_CONTRACT_ADDRESS
   - Arbitrum: https://arbiscan.io/address/YOUR_CONTRACT_ADDRESS

2. **Test contract functions**:
   ```bash
   # Test on Base
   npx hardhat run scripts/test-contract.js --network base
   
   # Test on Arbitrum
   npx hardhat run scripts/test-contract.js --network arbitrum
   ```

3. **Verify token support**:
   - Check that USDC is added as a supported token
   - Verify token limits are set correctly
   - Test creating a game with USDC

## Step 4: Supported Tokens

### Base Mainnet
- **ETH** (Native) - `0x0000000000000000000000000000000000000000`
- **USDC** - `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`

### Arbitrum One
- **ETH** (Native) - `0x0000000000000000000000000000000000000000`
- **USDC** - `0xaf88d065e77c8cC2239327C5EDb3A432268e5831`

## Step 5: Contract Verification

After deployment, verify the contract source code on block explorers:

### Base
```bash
npx hardhat verify --network base YOUR_CONTRACT_ADDRESS "HOUSE_ADDRESS"
```

### Arbitrum
```bash
npx hardhat verify --network arbitrum YOUR_CONTRACT_ADDRESS "HOUSE_ADDRESS"
```

## Important Notes

1. **House Wallet**: Use the same house wallet address across all chains for consistency
2. **Token Decimals**: USDC uses 6 decimals on both Base and Arbitrum
3. **Gas Costs**: Base and Arbitrum have lower gas costs than Ethereum mainnet
4. **Native ETH**: Both chains support native ETH wagers (zero address)
5. **Contract Upgradeability**: If using UUPS proxy pattern, deploy proxy on each chain

## Testing Checklist

- [ ] Contract deployed on Base
- [ ] Contract deployed on Arbitrum
- [ ] Contract addresses updated in frontend
- [ ] USDC added as supported token on both chains
- [ ] Token limits configured
- [ ] Contract verified on block explorers
- [ ] Test game creation on Base
- [ ] Test game creation on Arbitrum
- [ ] Test game joining on both chains
- [ ] Test game resolution and payout
- [ ] Frontend UI shows correct chain selection
- [ ] Token selector shows correct tokens per chain

## Troubleshooting

### Contract deployment fails
- Check RPC endpoint is correct
- Verify wallet has sufficient funds for gas
- Ensure contract constructor parameters are correct

### Token not showing in frontend
- Verify token address is correct for the chain
- Check token is added to `TOKEN_ADDRESSES_BY_CHAIN` in `tokens.ts`
- Ensure token is added as supported in contract

### Game creation fails
- Verify token approval is sufficient
- Check wager amount is within min/max limits
- Ensure contract address is correct for current chain

## Next Steps

After successful deployment:
1. Update frontend contract addresses
2. Test end-to-end game flow on each chain
3. Monitor contract for any issues
4. Consider adding more tokens (e.g., WETH) if needed
5. Update documentation with new contract addresses

