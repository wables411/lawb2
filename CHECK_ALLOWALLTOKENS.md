# How to Check `allowAllTokens` on Base Contract

## Contract Details

- **Proxy Address:** `0x06b6aAe693cf1Af27d5a5df0d0AC88aF3faC9E11` (use this in frontend)
- **Implementation Address:** `0x7d287427EC6bBEF1f00e8d8f3300a9be18cF8f29` (verified on Sourcify)

## Method 1: Check via Proxy (Recommended)

1. Go to: https://basescan.org/address/0x06b6aAe693cf1Af27d5a5df0d0AC88aF3faC9E11
2. Click **"More Options"** (top right of Contract tab)
3. Select **"Is this a proxy?"**
4. This enables **"Read as Proxy"** and **"Write as Proxy"** tabs
5. Click **"Read as Proxy"** tab
6. Scroll to find `allowAllTokens` function
7. Click **"Query"** button
8. Should return: `true` ✅

## Method 2: Check via Sourcify (Recommended Alternative)

1. Go to: https://repo.sourcify.dev/8453/0x7d287427EC6bBEF1f00e8d8f3300a9be18cF8f29
2. View the verified source code
3. Check the **Storage Layout** section - you can see `allowAllTokens` at slot 0, offset 20
4. To check the actual value, use BaseScan or a block explorer's "Read Contract" feature

## Method 3: Check Implementation Directly on BaseScan

1. Go to: https://basescan.org/address/0x7d287427EC6bBEF1f00e8d8f3300a9be18cF8f29#readContract
2. Find `allowAllTokens` function in the list
3. Click **"Query"** button
4. Should return: `true` ✅

## What This Means

- ✅ `allowAllTokens = true`: Any ERC20 token can be wagered (custom token input works)
- ❌ `allowAllTokens = false`: Only pre-approved tokens can be wagered (custom tokens won't work)

## If `allowAllTokens` is `false`

You'll need to call `setAllowAllTokens(true)` as the contract owner/admin:

1. Go to proxy contract: https://basescan.org/address/0x06b6aAe693cf1Af27d5a5df0d0AC88aF3faC9E11#writeProxyContract
2. Connect wallet (must be contract owner/admin)
3. Find `setAllowAllTokens` function
4. Enter `true` as parameter
5. Submit transaction

**Note:** This should already be set from your deployment script (`deploy-base.js`), but verify it!
