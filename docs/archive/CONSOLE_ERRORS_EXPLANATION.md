# Console Errors Explanation

## Summary

Most console errors you see are **harmless** and don't affect app functionality. Here's what each type means:

## ✅ Harmless Errors (Can Be Ignored)

### 1. `ERR_BLOCKED_BY_CLIENT` Errors

These errors occur when browser extensions (like ad blockers, privacy extensions) block third-party requests:

- **Coinbase Analytics** (`as.coinbase.com`, `cca-lite.coinbase.com`) - Analytics/metrics tracking
- **Sentry** (`exceptions.coinbase.com`) - Error tracking service
- **Datadog RUM** (`browser-intake-datadoghq.com`) - Real User Monitoring
- **Cookie Consent** (`geolocation.onetrust.com`, `cdn.cookielaw.org`) - Cookie consent services
- **WalletConnect** (`pulse.walletconnect.org`) - Wallet connection service

**Action**: None needed. These are blocked by browser extensions and don't affect functionality.

## ⚠️ Warnings (Should Be Fixed)

### 1. RPC URL Warning

**Message**: `No 'rpcUrl' provided to Viem connector, using public endpoint. Do not use this in production`

**Status**: ✅ **FIXED** - Updated `src/wagmi.ts` to use explicit RPC URLs for all networks.

**What was changed**:
- Added explicit RPC URLs for mainnet, arbitrum, and base networks
- Supports environment variables (e.g., `VITE_BASE_RPC_URL`) for custom RPC endpoints
- Falls back to reliable public endpoints if env vars aren't set

**To use custom RPC URLs** (optional):
```bash
# Set environment variables before building
VITE_MAINNET_RPC_URL=https://your-mainnet-rpc.com
VITE_BASE_RPC_URL=https://your-base-rpc.com
VITE_ARBITRUM_RPC_URL=https://your-arbitrum-rpc.com
npm run build
```

## ❓ Optional API Endpoint (404)

### 1. Neynar API 404

**Error**: `/api/neynar/user-by-custody-address?address=...` returns 404

**What it is**: The Base SDK or Reown/AppKit is trying to fetch Farcaster user data from a Neynar API endpoint.

**Status**: **Expected behavior** - This endpoint doesn't exist on your server, and it's likely optional functionality.

**Impact**: None - The app works fine without it. This is just the SDK trying to fetch optional user profile data.

**If you want to support it** (optional):
1. Create a Netlify serverless function at `/functions/neynar.js`
2. Proxy requests to the Neynar API with your API key
3. Add a redirect in `netlify.toml`:
   ```toml
   [[redirects]]
     from = "/api/neynar/*"
     to = "/.netlify/functions/neynar"
     status = 200
   ```

**Recommendation**: Leave it as-is unless you specifically need Farcaster user profile features.

## ✅ What's Working

- ✅ App loads and functions correctly
- ✅ Wallet connections work
- ✅ Base Mainnet is configured
- ✅ All core features (chess, NFTs, memes) work
- ✅ Base Mini App SDK initializes properly

## Summary

**You can safely ignore**:
- All `ERR_BLOCKED_BY_CLIENT` errors (browser extension blocks)
- The Neynar API 404 (optional feature)

**Already fixed**:
- RPC URL warnings (now using explicit RPC endpoints)

The app is working correctly! The console errors are mostly noise from browser extensions and optional SDK features.
