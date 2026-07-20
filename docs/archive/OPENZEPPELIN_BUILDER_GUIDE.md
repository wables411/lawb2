# Using OpenZeppelin Contract Builder

## What is it?

[OpenZeppelin Contract Builder](https://builder.openzeppelin.com/) is a web UI for viewing and interacting with verified smart contracts. It's useful for:
- Viewing contract state variables
- Calling view functions
- Understanding contract structure

## ⚠️ Important: Use the PROXY Address

**Always use the PROXY contract address for interactions:**

- ✅ **Correct (Proxy):** `0x06b6aAe693cf1Af27d5a5df0d0AC88aF3faC9E11`
- ℹ️ **Implementation (verified on Sourcify):** `0x7d287427EC6bBEF1f00e8d8f3300a9be18cF8f29`

**Why?** 
- The proxy stores the actual state (including `allowAllTokens`)
- The implementation is verified on Sourcify but its storage is empty/uninitialized
- BaseScan shows "Read as Proxy" / "Write as Proxy" because the proxy itself isn't verified, but it uses the implementation's ABI
- When using BaseScan's "Read as Proxy", it reads from the proxy's storage using the implementation's verified ABI

## Rate Limit Errors (429)

If you see errors like:
```
Error: Failed to query view function allowAllTokens_ on network Base
Status: 429
Details: {"code":-32016,"message":"over rate limit"}
```

This means the public Base RPC endpoint is being rate-limited.

### Solutions:

1. **Wait a few minutes** - Rate limits reset after a short period
2. **Use a different RPC endpoint:**
   - Alchemy: `https://base-mainnet.g.alchemy.com/v2/YOUR_API_KEY`
   - Infura: `https://base-mainnet.infura.io/v3/YOUR_API_KEY`
   - QuickNode: Your custom endpoint
3. **Use BaseScan directly:**
   - Go to: https://basescan.org/address/0x06b6aAe693cf1Af27d5a5df0d0AC88aF3faC9E11#readProxyContract
   - Click "Read as Proxy" tab
   - Query functions there (usually more reliable)

## How to Use OpenZeppelin Builder

1. Go to: https://builder.openzeppelin.com/
2. Enter contract address: `0x06b6aAe693cf1Af27d5a5df0d0AC88aF3faC9E11` (PROXY)
3. Select network: **Base**
4. The UI will auto-detect it's a proxy and show "Read as Proxy" options
5. View contract state and call view functions

## Alternative: Use Our Verification Script

Instead of the web UI, you can use our local script:
```bash
node check-allow-all-tokens.js
```

This script:
- ✅ Uses the correct proxy address
- ✅ Has better error handling
- ✅ Shows storage slot reading as backup
- ✅ Doesn't depend on web UI rate limits

## Current Contract State (Verified)

- **allowAllTokens:** `true` ✅
- **house:** `0x13031dC2dC848A985cCb6532956f7B8f3487772A`
- **LAWB_TOKEN:** `0xA7DA528a3F4AD9441CaE97e1C33D49db91c82b9F`
- **MOSS_TOKEN:** `0xeA240b96A9621e67159c59941B9d588eb290ef09`
- **totalGamesCompleted:** `0`
