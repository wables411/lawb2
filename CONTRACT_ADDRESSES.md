# Contract Addresses Reference

## Base Network

**Proxy Contract:** `0x06b6aAe693cf1Af27d5a5df0d0AC88aF3faC9E11`
- ✅ **Use this in frontend** (already configured)
- This is the ERC1967Proxy (EIP-1967 Transparent Proxy pattern)
- **Not verified on BaseScan** - shows "Source unverified (no ABI)"
- BaseScan provides "Read as Proxy" / "Write as Proxy" tabs that use the implementation's ABI
- All contract calls should go to this address

**Implementation Contract:** `0x7d287427EC6bBEF1f00e8d8f3300a9be18cF8f29`
- ✅ Verified on Sourcify: https://repo.sourcify.dev/8453/0x7d287427EC6bBEF1f00e8d8f3300a9be18cF8f29
- Contract Name: `LAWBCHESS3000` (ChessGameUpgradable.sol)
- Contains the actual chess game logic
- Storage Layout: `allowAllTokens` is at slot 0, offset 20 (bool)
- Do NOT use this address in frontend - use the proxy instead

## How Proxy Contracts Work

When you call functions on the proxy (`0x06b6aAe693cf1Af27d5a5df0d0AC88aF3faC9E11`):
- The proxy forwards all calls to the implementation (`0x7d287427EC6bBEF1f00e8d8f3300a9be18cF8f29`)
- Storage is in the proxy, logic is in the implementation
- This allows for upgrades without changing the proxy address

## Checking `allowAllTokens`

To verify `allowAllTokens` is enabled:

### Option 1: BaseScan "Read as Proxy"
1. Go to: https://basescan.org/address/0x06b6aAe693cf1Af27d5a5df0d0AC88aF3faC9E11#readProxyContract
2. Click "More Options" → "Is this a proxy?"
3. Go to "Read as Proxy" tab
4. Find `allowAllTokens` function
5. Click "Query" - should return `true`

### Option 2: View on Sourcify
1. Go to: https://repo.sourcify.dev/8453/0x7d287427EC6bBEF1f00e8d8f3300a9be18cF8f29
2. View verified source code and storage layout
3. `allowAllTokens` is at slot 0, offset 20 in storage layout

### Option 3: Direct Implementation Check on BaseScan
1. Go to: https://basescan.org/address/0x7d287427EC6bBEF1f00e8d8f3300a9be18cF8f29#readContract
2. Find `allowAllTokens` function
3. Click "Query" - should return `true`

**Note:** The value should be the same either way, but checking through the proxy (Option 1) is the correct way since that's what the frontend uses. Sourcify is great for viewing the verified source code and storage layout.

## Sanko Network

**Mainnet:** `0x4a8A3BC091c33eCC1440b6734B0324f8d0457C56`
**Testnet:** `0x3112AF5728520F52FD1C6710dD7bD52285a68e47`

## Arbitrum Network

**Coming Soon** - Contract not yet deployed
