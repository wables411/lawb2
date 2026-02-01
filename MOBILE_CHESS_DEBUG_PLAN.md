# Mobile Chess Debug Plan: Game Stuck & Wrong Piece Control

## Summary of Issues (from Screenshot & User Report)

1. **Game stuck**: Midway through AI hard mode, blue moved → red moved → blue could no longer move. Debug overlay shows:
   - `currentPlayer: red` (should be blue after AI moved)
   - `lastAIMoveRef: TRUE` (AI just completed a move)
   - `isAIMovingRef: false`
   - `gameState: active`

2. **Wrong piece control**: Sometimes player 1 (blue) can move red pieces on mobile.

---

## Root Cause Analysis from Screenshot

**Critical contradiction**: `lastAIMoveRef: TRUE` means the AI (red) just moved. After an AI move, `setCurrentPlayer('blue')` should run and the turn should switch. But `currentPlayer` is still `red`. So either:
- `setCurrentPlayer` never ran, or
- It ran but the update was never committed, or
- Something overwrote/reset `currentPlayer` back to `red` after the switch.

---

## Hypotheses (5 Detailed)

### Hypothesis A: React state update ordering / batching on mobile
**Idea**: On mobile (slower CPU, different React scheduling), `setCurrentPlayer` and `setBoard` may batch differently. The `lastAIMoveRef` reset `useEffect` depends on `currentPlayer === 'blue'`. If the effect runs before the batched update is committed, or if React defers the update, we could see `currentPlayer` stuck at `red` while `lastAIMoveRef` is already `true`.

**Evidence to collect**: Log `setCurrentPlayer` callback execution (prev → newPlayer) and the `lastAIMoveRef` reset effect runs. Check if the reset effect ever sees `currentPlayer === 'blue'` after an AI move.

### Hypothesis B: `checkGameEnd` or other sync logic interferes with turn switch
**Idea**: `checkGameEnd` is called inside the `setCurrentPlayer` callback and again outside. If it detects stalemate/checkmate, it calls `setGameState`. On mobile, could this create a render path where the `setCurrentPlayer` return value is dropped or overridden?

**Evidence to collect**: Log when `checkGameEnd` runs and what it returns. Log whether `setCurrentPlayer` callback returns and with what value.

### Hypothesis C: Capture animation delay + stale closure
**Idea**: For capture moves, `executeMoveAfterAnimation` runs 500ms later inside `setTimeout`. The `executeMoveAfterAnimation` callback closes over `board`, `currentPlayer`, etc. If the component re-renders during that 500ms (e.g. from `setCaptureAnimation`), the callback might use stale values. Could a stale `board` cause an early `if (!piece) return` or other early exit before `setCurrentPlayer`?

**Evidence to collect**: Log when execute path is capture vs non-capture. Log `piece` at the `if (!piece) return` check. Log whether we exit early.

### Hypothesis D: `setCurrentPlayer` callback never runs (early return or exception)
**Idea**: Something in `executeMoveAfterAnimation` causes an early return or throws before `setCurrentPlayer` is called. We set `lastAIMoveRef = true` before `setCurrentPlayer`, so we could have `lastAIMoveRef` true but `currentPlayer` never switched.

**Evidence to collect**: Log immediately before and after `setCurrentPlayer` call. Log any early returns (e.g. `if (!piece) return`).

### Hypothesis E: Mobile double-fire (touchstart + click) causes race
**Idea**: Squares use both `onTouchStart` and `onClick`. On mobile, a single tap fires touchstart → touchend → click. So `handleSquareClick` runs twice per tap. This could cause:
- Double moves if state hasn’t flushed between the two calls
- Wrong square targeting if touch and click resolve to different elements
- Selection/move confusion leading to “blue moving red pieces”

**Evidence to collect**: Log every `handleSquareClick` with timestamp and row/col. Detect rapid duplicate calls (e.g. same square within 100ms).

---

## Instrumentation Plan

### 1. Turn management (`executeMoveAfterAnimation`)

- **Before** `if (!piece) return`: log `{ from, to, piece, isAIMove }` and `hypothesisId: 'C','D'`
- **Before** `setCurrentPlayer`: log `{ isAIMove, currentPlayer, aboutToSetNewPlayer }` and `hypothesisId: 'A','D'`
- **Inside** `setCurrentPlayer` callback: log `{ prev, newPlayer }` and `hypothesisId: 'A','D'`
- **After** `setCurrentPlayer` (same tick): log `{ setCurrentPlayerCalled: true }` and `hypothesisId: 'D'`

### 2. `lastAIMoveRef` reset effect

- At effect start: log `{ currentPlayer, lastAIMoveRef, willReset }` and `hypothesisId: 'A','F'`
- When resetting: log `{ lastAIMoveRefReset: true }` and `hypothesisId: 'F'`

### 3. `checkGameEnd`

- At entry: log `{ playerToMove }` and `hypothesisId: 'B'`
- When setting game state: log `{ setGameState, reason }` and `hypothesisId: 'B'`

### 4. `handleSquareClick` (mobile double-fire)

- At entry: log `{ row, col, timestamp: Date.now(), currentPlayer }` and `hypothesisId: 'E'`
- Add simple debounce check: if same (row,col) within 100ms, log `{ duplicateTap: true }` and skip processing (or only log, depending on strategy)

### 5. Piece selection validation

- When selecting: log `{ pieceColor, currentPlayer, allowed: pieceColor === currentPlayer }` and `hypothesisId: 'E'`
- When blocking: log `{ reason: 'currentPlayer not blue' }` and `hypothesisId: 'D'`

---

## Execution Steps

1. **Clear logs**: Delete `/Users/wables/lawb2/.cursor/debug.log` before each run.
2. **Add instrumentation**: Insert 3–8 small log statements as above in `ChessGame.tsx`.
3. **Reproduce**:
   - Start AI hard mode on mobile
   - Play until the game gets stuck (blue can’t move after red moved)
   - If possible, also reproduce “blue moving red pieces”
4. **Analyze logs**: Map each hypothesis to CONFIRMED / REJECTED / INCONCLUSIVE with cited log lines.
5. **Fix**: Implement fix only when logs give high confidence.
6. **Verify**: Keep instrumentation, reproduce again, compare before/after logs.
7. **Cleanup**: Remove instrumentation after verification and user confirmation.

---

## Potential Fixes (After Log Analysis)

### If Hypothesis A (state ordering):
- Use `flushSync` for `setCurrentPlayer` after AI move (use sparingly)
- Or drive turn from a ref + `forceUpdate` to avoid batching issues
- Or reset `lastAIMoveRef` inside the same synchronous block as `setCurrentPlayer` instead of in an effect

### If Hypothesis B (`checkGameEnd`):
- Ensure `checkGameEnd` does not block or alter the `setCurrentPlayer` return
- Move `checkGameEnd` outside the callback if it can affect the update

### If Hypothesis C (capture delay):
- Pass `newPlayer` explicitly into the delayed callback instead of relying on closure
- Or avoid closing over `currentPlayer` in the delayed path

### If Hypothesis D (early return):
- Fix the condition that causes early return (e.g. `!piece` due to stale board)
- Ensure `setCurrentPlayer` is always called when `lastAIMoveRef` is set

### If Hypothesis E (double-fire):
- Use only `onClick` and remove `onTouchStart` for square clicks, or
- Use only `onTouchEnd` with `preventDefault` to suppress click, or
- Debounce `handleSquareClick` (e.g. 150ms) to collapse touch + click

### For “blue moving red pieces”:
- If caused by wrong piece selection: tighten `pieceColor === currentPlayer` and add logging
- If caused by touch target mismatch: add `touch-action: manipulation` and/or `user-select: none` to reduce browser quirks; consider larger hit areas on mobile

---

## Files to Modify

- `src/components/ChessGame.tsx`:
  - `executeMoveAfterAnimation` (lines ~1095–1210)
  - `lastAIMoveRef` reset `useEffect` (lines ~1209–1225)
  - `handleSquareClick` (lines ~1023–1067)
  - `checkGameEnd` (lines ~1351+)
  - `renderSquare` / touch handlers (lines ~1740–1746)

---

## Success Criteria

1. Logs show the exact sequence when the game gets stuck.
2. At least one hypothesis is CONFIRMED with log evidence.
3. Fix is applied and verified with a second reproduction run.
4. No regressions on desktop or in non-AI mode.
5. User confirms both issues are resolved.
