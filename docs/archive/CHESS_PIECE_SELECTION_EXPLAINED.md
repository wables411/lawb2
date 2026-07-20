# How Chess Piece Selection Currently Works

## Overview

The chess piece selection system allows players to choose between different visual styles for chess pieces. Currently, there are two piece sets:

1. **LawbStation** - Default, always available
2. **PixeLawbs** - Requires NFT ownership

## Current Flow

### 1. When Piece Set Selector is Shown

**Trigger:** When user clicks "Create Game" button in multiplayer mode, `setShowPieceSetSelector(true)` is called.

**Location:** `ChessMultiplayer.tsx` line 6423

### 2. NFT Verification (Lines 1176-1199)

When `showPieceSetSelector` becomes `true` AND `address` exists:

```typescript
useEffect(() => {
  if (showPieceSetSelector && address) {
    const checkNFT = async () => {
      setIsCheckingNFT(true);
      try {
        // Uses cross-chain verification via Ethereum RPC
        const result = await checkPixelawbsNFTOwnership(address);
        setNftVerificationResult(result);
      } catch (error) {
        setNftVerificationResult({
          hasPixelawbsNFT: false,
          balance: 0,
          error: 'Failed to check NFT ownership'
        });
      } finally {
        setIsCheckingNFT(false);
      }
    };
    checkNFT();
  }
}, [showPieceSetSelector, address]);
```

**Key Points:**
- Checks Ethereum mainnet for Pixelawbs NFT ownership (`0x2d278e95b2fC67D4b27a276807e24E479D9707F6`)
- Uses cross-chain RPC (`https://eth.llamarpc.com`) - works regardless of current network
- Sets `nftVerificationResult` state with `hasPixelawbsNFT` boolean

### 3. Available Piece Sets (Lines 5575-5579)

```typescript
const availablePieceSets = [
  getDefaultPieceSet(), // LawbStation always available
  ...(nftVerificationResult?.hasPixelawbsNFT ? [getPixelawbsPieceSet()] : [])
];
```

**Logic:**
- **LawbStation** is ALWAYS included (default)
- **PixeLawbs** is ONLY included if `nftVerificationResult?.hasPixelawbsNFT === true`

### 4. UI Rendering (Lines 5626-5661)

The dropdown shows:

**A. Available Piece Sets (mapped from `availablePieceSets`):**
- Each piece set in `availablePieceSets` is rendered as a clickable option
- If Pixelawbs is in the list but user doesn't have NFT (shouldn't happen, but has safety check):
  - Shows "(NFT Required)" text (line 5642-5644)

**B. Disabled Option (if user doesn't have NFT):**
- Shows a disabled "PixeLawbs Chess Set (NFT Required)" option at the bottom (lines 5647-5661)
- This is shown when `!nftVerificationResult?.hasPixelawbsNFT`
- Styled with `cursor: 'not-allowed'` and `opacity: 0.5`

### 5. Selection and Game Creation

When user selects a piece set:
- `handlePieceSetSelect(pieceSet)` is called (line 5564)
- Sets `selectedPieceSet` state
- Closes dropdown
- When user clicks "Start Game" button (line 5673-5677):
  - Closes piece set selector
  - Calls `createGame()` which includes `piece_set: selectedPieceSet.id` in game data (line 2488)

## Potential Issues / Confusion

### Issue 1: Duplicate Display Logic

There's redundant logic:
- Line 5642-5644: Shows "(NFT Required)" for Pixelawbs in the mapped list
- Line 5647-5661: Shows a separate disabled Pixelawbs option

**Why this might be confusing:**
- If user has NFT: Pixelawbs appears once in the mapped list (correct)
- If user doesn't have NFT: Pixelawbs appears once as disabled option (correct)
- But the check on line 5642 suggests Pixelawbs could be in `availablePieceSets` even without NFT (which shouldn't happen based on line 5578)

### Issue 2: Loading State

While NFT verification is in progress (`isCheckingNFT === true`):
- `nftVerificationResult` might be `null`
- `availablePieceSets` will only have LawbStation (correct)
- Disabled Pixelawbs option won't show (because `!null?.hasPixelawbsNFT` evaluates to `true`, but the condition might not render it)

### Issue 3: Error Handling

If NFT verification fails:
- `nftVerificationResult.error` is set
- `hasPixelawbsNFT` is `false`
- User sees error message (line 5667-5671)
- But Pixelawbs won't be available (correct behavior)

## How It's Supposed to Work (Based on Code Intent)

1. **User clicks "Create Game"** → Piece set selector appears
2. **NFT check runs** → Verifies Pixelawbs ownership on Ethereum
3. **Available sets determined:**
   - LawbStation: Always available
   - PixeLawbs: Only if `hasPixelawbsNFT === true`
4. **User selects piece set** → Stored in `selectedPieceSet`
5. **User confirms** → `createGame()` includes `piece_set` in game data
6. **Game created** → Both players see the selected piece set

## What Might Be Wrong

If you're seeing unexpected behavior, it could be:

1. **NFT verification not running** - Check if `showPieceSetSelector && address` condition is met
2. **NFT verification failing silently** - Check console for `[NFT_VERIFICATION]` logs
3. **State not updating** - `nftVerificationResult` might be stale
4. **UI showing wrong options** - The disabled option might be showing when it shouldn't, or vice versa

## Single-Player vs Multiplayer

**Single-Player (`ChessGame.tsx`):**
- Has piece set selector but **NO NFT verification**
- Always shows both piece sets (line 1644+)
- User can select either one freely

**Multiplayer (`ChessMultiplayer.tsx`):**
- Has NFT verification
- Only shows PixeLawbs if user owns the NFT
- More restrictive
