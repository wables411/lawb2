# Next Steps After Firebase Rules Update

## ✅ Completed
- [x] Frontend multi-chain support implemented
- [x] Firebase rules updated and published
- [x] Token validation improved

## 🔍 Critical: Verify Base Contract

**You MUST verify the Base contract has `allowAllTokens = true`**

### Quick Check (via BaseScan):
1. Go to: https://basescan.org/address/0x06b6aAe693cf1Af27d5a5df0d0AC88aF3faC9E11#readContract
2. Find function: `allowAllTokens` (or `allowAllTokens()`)
3. Click "Read" - should return `true`

### Or Check in Contract Repo:
```bash
cd /path/to/chess-sanko-contract
npx hardhat console --network base
> const contract = await ethers.getContractAt("ChessGameUpgradable", "0x06b6aAe693cf1Af27d5a5df0d0AC88aF3faC9E11");
> await contract.allowAllTokens(); // Should return true
```

**If it returns `false`:**
- You need to call `setAllowAllTokens(true)` as contract owner
- This is in the deployment script (`deploy-base.js`), so it should already be set
- But verify it!

## 🧪 Testing Checklist

### Test 1: Base Network - Quick Select Tokens
1. Connect wallet to Base
2. Go to `/chess` → Multiplayer
3. Click "Create New Match"
4. Test each quick-select button:
   - [ ] USDC - should validate and show balance
   - [ ] ETH - should validate and show balance
   - [ ] GG - should validate and show balance
   - [ ] LAWB - should validate and show balance

### Test 2: Base Network - Custom Token
1. Still on Base network
2. Enter a custom ERC20 address in the "Or Custom" field
3. Should see:
   - [ ] "Validating..." message
   - [ ] ✓ with token symbol if valid
   - [ ] ✗ with error if invalid
4. Try invalid address (like `0x123`) - should show error

### Test 3: Create Game on Base
1. Select LAWB token (or any Base token)
2. Enter wager amount (e.g., 1000)
3. Click "Create Game"
4. Should see:
   - [ ] "Approving token..." message
   - [ ] Wallet popup for approval
   - [ ] After approval, "Creating game..." message
   - [ ] Wallet popup for game creation
   - [ ] Game appears in lobby

### Test 4: Cross-Chain Game Joining
1. Create a game on Base (from Test 3)
2. Switch wallet to Sanko network
3. Try to join the Base game
4. Should see:
   - [ ] Message: "Please switch to base network to join this game"
   - [ ] Option to switch chains
5. Switch to Base
6. Should be able to join successfully

### Test 5: Sanko Still Works
1. Switch to Sanko network
2. Create game with DMT
3. Should work exactly as before (no custom token input)

### Test 6: Single-Player on Any Chain
1. Connect to Base - should work (no chain requirement)
2. Connect to Arbitrum - should work
3. Connect to Sanko - should work
4. No "Switch to Sanko" button should appear

## 🐛 If Something Doesn't Work

### "Token approval not working"
- Check Base contract `allowAllTokens` is `true`
- Check browser console for errors
- Verify you're on Base network

### "Invalid token" for valid address
- Check you're on Base network (not Sanko)
- Verify the contract address exists on Base
- Check browser console for validation errors

### "Game not appearing in lobby"
- Check Firebase console - is game being created?
- Check `chain` field is set to 'base'
- Check `is_public` is `true`
- Check `game_state` is 'waiting_for_join'

### "Can't join game"
- Check you're on the correct network
- Check you have enough token balance
- Check token approval completed

## 📊 Monitor Firebase

After creating games, check Firebase Console:
1. Go to Realtime Database
2. Check `chess_games` node
3. Verify new games have:
   - `chain: "base"` (for Base games)
   - `bet_token_address` field (for custom tokens)
   - All other fields present

## 🚀 Production Deployment

Once testing passes:
1. ✅ All tests pass
2. ✅ Base contract verified (`allowAllTokens = true`)
3. ✅ Firebase rules deployed
4. ✅ Frontend changes pushed

**You're ready to go live!**

The changes will automatically deploy via Netlify on the next push (or current push if already live).

## 📝 Notes

- **Sanko games**: Continue to work exactly as before
- **Base games**: New functionality, backward compatible
- **All platforms**: Web, Base app, mobile all work
- **Leaderboard**: Works across all chains (tracks by wallet address)
