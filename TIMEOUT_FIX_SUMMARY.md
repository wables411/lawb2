# PvP Timeout Fix Summary

## Problem Identified

1. **Timeout exists**: 60-minute timeout (`GAME_TIMEOUT_MS = 3600000`) that triggers when a player takes too long to make a move
2. **State synchronization issue**: When `endGame` is called on the contract (either from timeout or `claimWinnings`), the contract state is updated but **Firebase is NOT updated**
3. **Game reloads incorrectly**: When clicking PvP, `resumeGame()` or `checkPlayerGameState()` loads games from Firebase even if the contract shows `isActive = false`

## Root Cause

- `handleTimeout()` calls `endGame` on the contract but doesn't update Firebase
- `checkPlayerGameState()` reads `isActive` from contract but then loads from Firebase and ignores the contract's `isActive` flag
- `resumeGame()` doesn't check contract state before loading from Firebase
- When `endGame` transaction is confirmed, Firebase is not updated to `game_state: 'finished'`

## Fixes Applied

### 1. Update Firebase when `endGame` transaction is confirmed
- Added Firebase update in the `useEffect` that handles `endGameHash` confirmation
- Updates Firebase to `game_state: 'finished'` when the transaction is confirmed

### 2. Update Firebase immediately on timeout
- Modified `handleTimeout()` to update Firebase **before** calling the contract
- Sets `game_state: 'finished'` and `winner` in Firebase immediately

### 3. Check contract `isActive` flag before loading games
- Modified `checkPlayerGameState()` to check `isActive` from contract **before** loading from Firebase
- If `isActive === false`, don't load the game even if Firebase shows it as active
- Syncs Firebase to match contract state if they're out of sync

### 4. Check contract state in `resumeGame()`
- Added contract state check in `resumeGame()` before loading from Firebase
- If contract shows `isActive === false`, don't resume the game
- Also checks Firebase `game_state === 'finished'` as a double-check

## Timeout Mechanism

- **Timeout duration**: 60 minutes (`GAME_TIMEOUT_MS = 3600000`)
- **When timeout starts**: When game becomes active (`GameMode.ACTIVE`)
- **When timeout resets**: After each move is made
- **When timeout triggers**: After 60 minutes of no moves
- **Timeout action**: 
  1. Determines winner (opponent of player who was waiting)
  2. Updates Firebase to `game_state: 'finished'`
  3. Calls `endGame` on contract with winner address
  4. Sets game mode to `FINISHED`

## Testing

To verify the fix works:
1. Create a PvP game
2. Wait 60 minutes (or manually trigger timeout for testing)
3. Click PvP again - should NOT reload the ended game
4. Check Firebase - should show `game_state: 'finished'`
5. Check contract - should show `isActive = false`

## Files Modified

- `src/components/ChessMultiplayer.tsx`:
  - `handleTimeout()` - Added Firebase update
  - `useEffect` for `endGameHash` - Added Firebase sync
  - `checkPlayerGameState()` - Added `isActive` check before loading
  - `resumeGame()` - Added contract state check before loading

