# Multi-Chain Chess Setup Summary

## ✅ What's Been Done

I've updated the frontend codebase to support Base and Arbitrum networks in addition to Sanko. Here's what changed:

### 1. **Token Configuration (`src/config/tokens.ts`)**
   - Added multi-chain token support with chain-specific addresses
   - Added Base and Arbitrum network configurations
   - Added ETH and USDC tokens for Base/Arbitrum
   - Created `getTokenAddressForChain()` helper function
   - Updated contract addresses structure to support all chains

### 2. **Contract Address Resolution (`src/components/ChessMultiplayer.tsx`)**
   - Updated `getContractAddress()` to handle Base (8453) and Arbitrum (42161)
   - Fixed token address resolution to use chain-specific addresses

### 3. **Token Hooks (`src/hooks/useTokens.ts`)**
   - Updated `useTokenBalance()` to support multi-chain
   - Updated `useTokenAllowance()` to support multi-chain
   - Added chain availability checking
   - Added support for Base and Arbitrum networks

### 4. **Token Selector (`src/components/TokenSelector.tsx`)**
   - Filters tokens by current chain
   - Shows appropriate messages for each network
   - Updated balance display for multi-chain support

## 📋 What You Need To Do

### Step 1: Deploy Contracts

Deploy the chess contract to Base and Arbitrum using the guide in `MULTI_CHAIN_DEPLOYMENT.md`.

**Base Mainnet:**
- Chain ID: 8453
- RPC: https://mainnet.base.org
- Explorer: https://basescan.org

**Arbitrum One:**
- Chain ID: 42161
- RPC: https://arb1.arbitrum.io/rpc
- Explorer: https://arbiscan.io

### Step 2: Update Contract Addresses

After deployment, update `src/config/tokens.ts`:

```typescript
export const CONTRACT_ADDRESSES = {
  // ... existing ...
  base: {
    chess: 'YOUR_BASE_CONTRACT_ADDRESS' // Replace with actual address
  },
  arbitrum: {
    chess: 'YOUR_ARBITRUM_CONTRACT_ADDRESS' // Replace with actual address
  }
} as const;
```

### Step 3: Configure Supported Tokens

After deploying contracts, make sure to:
1. Add USDC as a supported token on both chains
2. Set appropriate min/max wager limits
3. Configure native ETH support (zero address)

### Step 4: Test

1. **Test on Base:**
   - Switch to Base network
   - Verify token selector shows ETH and USDC
   - Create a test game
   - Verify contract interactions work

2. **Test on Arbitrum:**
   - Switch to Arbitrum network
   - Verify token selector shows ETH and USDC
   - Create a test game
   - Verify contract interactions work

## 🔧 Current Token Support

### Sanko Mainnet (1996)
- NATIVE_DMT (native)
- DMT (wrapped)
- GOLD
- LAWB
- MOSS

### Base Mainnet (8453)
- ETH (native)
- USDC

### Arbitrum One (42161)
- ETH (native)
- USDC

## 📝 Notes

1. **Token Addresses**: The frontend now uses chain-specific token addresses. Make sure the contract supports the same tokens on each chain.

2. **Native Tokens**: Both Base and Arbitrum support native ETH wagers (zero address).

3. **USDC Decimals**: USDC uses 6 decimals on both Base and Arbitrum.

4. **Contract Compatibility**: The contract should be the same codebase deployed to each chain. Only the contract address changes.

5. **House Wallet**: Use the same house wallet address across all chains for consistency.

## 🐛 Troubleshooting

If tokens don't show up:
- Check that token addresses are correct in `TOKEN_ADDRESSES_BY_CHAIN`
- Verify tokens are added to `SUPPORTED_TOKENS` with correct `chains` array
- Check browser console for errors

If contract calls fail:
- Verify contract address is correct for current chain
- Check that contract is deployed and verified
- Ensure tokens are added as supported in contract

## 🚀 Next Steps

1. Deploy contracts (see `MULTI_CHAIN_DEPLOYMENT.md`)
2. Update contract addresses in code
3. Test on each chain
4. Update any documentation
5. Consider adding more tokens (WETH, etc.) if needed

