# Contract Verification Guide

## ⚠️ Important: Contract Address Mismatch

**Frontend is configured to use:**
- `0x06b6aAe693cf1Af27d5a5df0d0AC88aF3faC9E11` (Base Mainnet)

**You're looking at:**
- `0x7d287427ec6bbef1f00e8d8f3300a9be18cf8f29` (Base Mainnet)

**These are different addresses!**

## 🤔 Which One Is Correct?

You need to decide:
1. **Is `0x06b6aAe693cf1Af27d5a5df0d0AC88aF3faC9E11` the correct contract?**
   - If yes: Verify that one and check `allowAllTokens`
   - If no: Update frontend to use the new address

2. **Is `0x7d287427ec6bbef1f00e8d8f3300a9be18cf8f29` a new deployment?**
   - If yes: Update frontend config to use this address
   - Then verify this contract

## 📋 How to Verify a Contract on BaseScan

### Step 1: Go to Contract Page
1. Navigate to: https://basescan.org/address/YOUR_CONTRACT_ADDRESS
2. Click the **"Contract"** tab
3. Click **"Verify and Publish"**

### Step 2: Choose Verification Method
- **Via Standard JSON Input** (recommended for Hardhat)
- **Via Flattened Source Code**
- **Via Sourcify**

### Step 3: Fill in Details
- **Compiler Type**: Solidity (Single file) or Solidity (Standard JSON Input)
- **Compiler Version**: Match your deployment (check `hardhat.config.js`)
- **License**: MIT or whatever you used
- **Optimization**: Yes/No (match your deployment settings)

### Step 4: Upload Source Code
- If using **Standard JSON Input**: Upload the JSON file from `artifacts/build-info/`
- If using **Flattened**: Paste the flattened source code

### Step 5: Submit
- Click "Verify and Publish"
- Wait for verification (usually 30 seconds - 2 minutes)

## ✅ After Verification

Once verified, you can:
1. **Read Contract Functions**:
   - Go to "Contract" tab → "Read Contract"
   - Find `allowAllTokens` function
   - Click "Query" - should return `true`

2. **Check Contract Details**:
   - View source code
   - See all functions
   - Interact with read functions

## 🔧 If You Need to Update Frontend Address

If `0x7d287427ec6bbef1f00e8d8f3300a9be18cf8f29` is the correct/new contract:

1. Update `src/config/tokens.ts`:
```typescript
base: {
  chess: '0x7d287427ec6bbef1f00e8d8f3300a9be18cf8f29' // Base Mainnet
}
```

2. Verify the contract has `allowAllTokens = true`

3. Commit and push

## 🎯 Quick Check: Which Contract Should We Use?

**Tell me:**
- Which contract address did you deploy?
- Is `0x06b6aAe693cf1Af27d5a5df0d0AC88aF3faC9E11` the one from your deployment script?
- Or is `0x7d287427ec6bbef1f00e8d8f3300a9be18cf8f29` a new deployment?

Once we know the correct address, I'll help you:
1. Verify it (if needed)
2. Check `allowAllTokens`
3. Update frontend if address changed
