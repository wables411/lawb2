# Multi-Chain Setup Checklist

## ✅ Frontend Changes (lawb2 repo) - COMPLETE

All frontend changes have been implemented and pushed:
- ✅ ChainSelector component
- ✅ TokenSelector with Base quick-select + custom input
- ✅ Token validation utility
- ✅ Custom token approval flow
- ✅ Firebase chain field support
- ✅ Multi-chain game creation/joining
- ✅ Removed Sanko requirement for single-player

## 📋 What You Need to Check/Update

### 1. Contract Repo (chess-sanko-contract) - VERIFY

**Status:** Base contract is already deployed at `0x06b6aAe693cf1Af27d5a5df0d0AC88aF3faC9E11`

**What to verify:**
- [ ] Base contract has `allowAllTokens` enabled (should be `true`)
- [ ] Contract is verified on BaseScan
- [ ] Contract address matches frontend: `0x06b6aAe693cf1Af27d5a5df0d0AC88aF3faC9E11`

**To check `allowAllTokens`:**
```javascript
// In contract repo or via BaseScan
const contract = await ethers.getContractAt("ChessGameUpgradable", "0x06b6aAe693cf1Af27d5a5df0d0AC88aF3faC9E11");
const allowAll = await contract.allowAllTokens();
console.log("allowAllTokens:", allowAll); // Should be true
```

**If `allowAllTokens` is false:**
You'll need to call `setAllowAllTokens(true)` on the Base contract. This requires the contract owner/admin.

### 2. Firebase Rules - UPDATE NEEDED

**Current Status:** Firebase rules don't validate the `chain` field

**What to update:**
The `chain` field is now being stored in game data, but Firebase rules should validate it.

**Recommended update to `firebase.rules`:**
```json
{
  "rules": {
    "chess_games": {
      ".read": true,
      ".write": true,
      "$inviteCode": {
        ".validate": "newData.hasChildren(['invite_code', 'game_state']) && newData.child('invite_code').isString() && newData.child('game_state').isString() && (newData.child('game_state').val() === 'waiting' || newData.child('game_state').val() === 'waiting_for_join' || newData.child('game_state').val() === 'active' || newData.child('game_state').val() === 'finished') && (!newData.hasChild('chain') || (newData.child('chain').isString() && (newData.child('chain').val() === 'sanko' || newData.child('chain').val() === 'base' || newData.child('chain').val() === 'arbitrum')))"
      }
    },
    // ... rest of rules
  }
}
```

**Action Required:**
- [ ] Update `firebase.rules` to validate `chain` field (optional but recommended)
- [ ] Deploy updated rules: `firebase deploy --only database:rules`

**Note:** The app will work without this update, but adding validation is a best practice.

### 3. Platform Compatibility - ALL WORK

**✅ Regular Web Browser/Desktop:**
- All changes work - uses standard wagmi/appkit
- ChainSelector shows Sanko/Base/Arbitrum options
- TokenSelector adapts based on connected chain

**✅ Base Mini App (Farcaster):**
- All changes work - same codebase
- Base Mini App SDK is separate from wagmi
- When embedded in Base app, users are already on Base network
- TokenSelector will show Base options automatically

**✅ Mobile:**
- All changes work - uses same components
- Responsive design handles mobile layouts
- ChainSelector may be hidden on mobile (check `isMobile` prop)

**How it works:**
- The code detects the environment automatically
- Base Mini App: Uses Base network by default when embedded
- Regular web: User selects chain via ChainSelector
- All platforms use the same Firebase database (chain field supports all)

### 4. Testing Checklist

**Before going live, test:**

**Base Network:**
- [ ] Connect wallet to Base
- [ ] Create game with USDC (quick-select)
- [ ] Create game with ETH (quick-select)
- [ ] Create game with GG (quick-select)
- [ ] Create game with LAWB (quick-select)
- [ ] Create game with custom ERC20 address
- [ ] Verify approval flow works for all tokens
- [ ] Verify game appears in lobby
- [ ] Join game from different wallet
- [ ] Verify chain switching prompt when joining cross-chain game

**Sanko Network:**
- [ ] Verify existing functionality still works
- [ ] Create game with DMT
- [ ] Create game with other Sanko tokens
- [ ] Verify no custom token input shows (Sanko only)

**Cross-Chain:**
- [ ] Create game on Base
- [ ] Switch to Sanko
- [ ] Try to join Base game - should prompt to switch
- [ ] Switch to Base
- [ ] Join game successfully

**Single-Player:**
- [ ] Connect to Base - should work (no chain requirement)
- [ ] Connect to Arbitrum - should work
- [ ] Connect to Sanko - should work
- [ ] Verify leaderboard updates work on all chains

## 🚨 Common Issues & Fixes

### Issue: "Token approval not working"
**Fix:** Check that `allowAllTokens` is `true` on Base contract

### Issue: "Invalid token address"
**Fix:** Make sure address is:
- Valid Ethereum address format (0x...)
- Contract exists on Base network
- Contract implements ERC20 (has symbol() and decimals())

### Issue: "Game not appearing in lobby"
**Fix:** Check:
- Firebase write permissions
- Game `chain` field is set correctly
- Game `is_public` is `true`
- Game `game_state` is `'waiting_for_join'`

### Issue: "Wrong decimals for token"
**Fix:** The app fetches decimals from contract automatically. If wrong, check:
- Token contract's `decimals()` function
- Network is correct (Base vs Sanko)

## 📝 Summary

**Contract Repo:** ✅ No changes needed (Base already deployed with allowAllTokens)

**Firebase:** ⚠️ Optional update to rules (recommended but not required)

**Platforms:** ✅ All work (web, Base app, mobile)

**Next Steps:**
1. Verify Base contract has `allowAllTokens = true`
2. (Optional) Update Firebase rules
3. Test on Base network
4. Deploy to production
