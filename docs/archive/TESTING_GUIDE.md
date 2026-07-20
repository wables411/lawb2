# Testing Guide: Base Multi-Chain Integration

## ✅ Prerequisites (All Done!)

- [x] Frontend multi-chain support implemented
- [x] Firebase rules updated
- [x] `allowAllTokens = true` verified on Base
- [x] Contract addresses configured
- [x] Token validation working

## 🧪 Test Checklist

### Test 1: Quick-Select Tokens on Base

1. **Connect wallet to Base network**
2. Go to `lawb.xyz/chess` → **Multiplayer** tab
3. Click **"Create New Match"**
4. Test each quick-select button:
   - [ ] **USDC** - should show balance, allow wager input
   - [ ] **ETH** - should show balance, allow wager input  
   - [ ] **GG** - should show balance, allow wager input
   - [ ] **LAWB** - should show balance, allow wager input

**Expected:** Each button should:
- Show your token balance
- Allow you to enter a wager amount
- Validate the amount (min/max if set)

### Test 2: Custom Token Input on Base

1. Still on **Base network**
2. In the token selector, find the **"Or Custom"** input field
3. Enter a valid Base ERC20 address (e.g., `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` - Base USDC)
4. Should see:
   - [ ] "Validating..." message appears
   - [ ] ✓ checkmark with token symbol (e.g., "$USDC")
   - [ ] Balance displays (if you have any)
   - [ ] Can enter wager amount

5. Try an **invalid address** (e.g., `0x123`):
   - [ ] ✗ error icon appears
   - [ ] Error message shows
   - [ ] Cannot proceed

### Test 3: Create Game with Custom Token

1. Select a custom token (or use LAWB)
2. Enter wager amount (e.g., 1000)
3. Click **"Create Game"**
4. Should see:
   - [ ] "Approving token..." message
   - [ ] Wallet prompts for approval transaction
   - [ ] After approval: "Creating game..." message
   - [ ] Wallet prompts for createGame transaction
   - [ ] Game created successfully
   - [ ] Invite code displayed
   - [ ] Game appears in "My Games" section

### Test 4: Join Game from Different Chain

1. **Create a game on Base** (from Test 3)
2. **Switch wallet to Sanko network**
3. Try to join the Base game
4. Should see:
   - [ ] Warning/notification that game is on Base
   - [ ] "Switch to Base" button appears
   - [ ] Clicking it prompts wallet to switch chains
   - [ ] After switching, can join the game

### Test 5: Chain Selector

1. On **Create New Match** screen
2. Check **Chain Selector** component:
   - [ ] Shows "Sanko", "Base", "Arbitrum (Soon)"
   - [ ] Can click to switch chains
   - [ ] Wallet prompts for chain switch
   - [ ] UI updates based on selected chain

## 🐛 If Something Doesn't Work

### Issue: Token approval not triggering

**Check:**
- Are you on Base network?
- Do you have enough token balance?
- Check browser console for errors

**Fix:**
- Make sure `selectedToken` is being set correctly
- Verify `checkAndApproveToken()` is being called

### Issue: Custom token validation fails

**Check:**
- Is the address a valid ERC20 on Base?
- Check browser console for validation errors

**Fix:**
- Verify `validateERC20Token()` is working
- Check RPC endpoint is responding

### Issue: Game creation fails

**Check:**
- Browser console for transaction errors
- BaseScan for failed transaction
- Verify contract address is correct

**Fix:**
- Check `createGame()` function
- Verify Firebase write permissions
- Check contract `allowAllTokens` is true (we verified this ✅)

### Issue: Can't see games from different chain

**Check:**
- Firebase rules allow reading
- `getOpenGames()` is filtering correctly

**Fix:**
- Check Firebase console for data
- Verify `chain` field is being stored

## 📊 What to Monitor

1. **Browser Console:**
   - Look for errors during token validation
   - Check transaction status
   - Watch for RPC rate limit errors

2. **BaseScan:**
   - Monitor transaction success/failure
   - Check gas usage
   - Verify contract interactions

3. **Firebase Console:**
   - Check games are being created with `chain` field
   - Verify data structure is correct

## ✅ Success Criteria

You'll know everything works when:

1. ✅ Can create game on Base with any ERC20 token (quick-select or custom)
2. ✅ Token approval flow works smoothly
3. ✅ Game creation succeeds and appears in Firebase
4. ✅ Can join games across chains (with chain switch prompt)
5. ✅ No console errors during normal flow

## 🚀 Next Steps After Testing

Once all tests pass:

1. **Deploy to production** (if not already)
2. **Test on mobile** (Base Mini App / Farcaster)
3. **Monitor for user issues**
4. **Plan Arbitrum deployment** (when ready)

## 📝 Notes

- Sanko chain behavior should be **unchanged** (fixed token list, no custom input)
- Base/Arbitrum have **new features** (custom tokens, NFT wagering coming soon)
- All changes are **backward compatible**
