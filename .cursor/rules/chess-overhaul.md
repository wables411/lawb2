# Chess Overhaul — Fix Issues + Agent Support

## Priority: HIGH — Do this before any new chess features

---

## Current Issues (Must Fix)

### 1. CRITICAL: No chess.js — Custom Move Validation is Broken

`ChessGame.tsx` uses custom functions (`canPieceMove`, `isValidPawnMove`, `isValidRookMove`, etc.) instead of the `chess.js` library. This is the root cause of unreliable games.

**Fix:** Replace ALL custom chess logic with `chess.js`.

```bash
npm install chess.js
```

```typescript
import { Chess } from 'chess.js';

// Create game instance
const game = new Chess();

// Make a move
const result = game.move({ from: 'e2', to: 'e4' });
if (!result) { /* illegal move */ }

// Get legal moves for a square
const moves = game.moves({ square: 'e2', verbose: true });

// Check game state
game.isCheckmate()   // true/false
game.isStalemate()   // true/false
game.isDraw()        // true/false (includes stalemate, insufficient material, 50-move, threefold)
game.isCheck()       // true/false
game.isGameOver()    // true/false
game.fen()           // current FEN string
game.turn()          // 'w' or 'b'
```

**This means:**
- Delete `canPieceMove()`, `isValidPawnMove()`, `isValidRookMove()`, `isValidBishopMove()`, `isValidQueenMove()`, `isValidKingMove()`, `isValidKnightMove()`, `isCheckmate()`, `isStalemate()`, `boardToFEN()` — ALL of them
- Replace with `chess.js` equivalents
- The board display can stay as-is (render from `game.board()` or the FEN)
- `chess.js` handles castling, en passant, pawn promotion, threefold repetition, 50-move rule — all correctly

### 2. CRITICAL: Stalemate is Treated as Loss

Currently stalemate = loss for the stalemated player. **This is wrong.** Stalemate is a draw in chess.

**Fix:** With `chess.js`:
```typescript
if (game.isStalemate() || game.isDraw()) {
  // Draw — no winner, no loser
  // Leaderboard: both players get draw points
}
```

### 3. HIGH: Custom FEN Generation is Unreliable

`boardToFEN()` doesn't properly track:
- Castling rights (KQkq)
- En passant target square
- Halfmove clock (50-move rule)
- Fullmove number

**Fix:** `chess.js` handles FEN natively. Just call `game.fen()`.

### 4. HIGH: Hard Mode Silently Falls Back to Random Moves

When the Stockfish API fails (network error, timeout, invalid response), the AI makes a random move without telling the player. Players think they're playing Stockfish but they're playing random.

**Fix:**
- Show a visible indicator: "Stockfish unavailable — playing random move" or "Connection issue — retrying..."
- Add 1 retry before fallback
- If fallback happens more than 2 times in a game, show persistent warning
- Consider caching Stockfish availability status

### 5. HIGH: Timer Resets Per Move (Not Per Game)

The 60-minute timer resets after every move. This means a game could theoretically last infinite time. Real chess uses total time per player.

**Fix:** Implement proper chess clock:
```typescript
// Each player gets X minutes total (e.g., 10 min blitz, 30 min rapid)
const [blueTimeMs, setBlueTimeMs] = useState(TIME_CONTROL_MS);
const [redTimeMs, setRedTimeMs] = useState(TIME_CONTROL_MS);

// Only the active player's clock ticks down
// When a player moves, their clock stops, opponent's starts
// If a player's clock hits 0, they lose on time
```

Suggested time controls:
- Blitz: 5 minutes per player
- Rapid: 15 minutes per player  
- Classic: 30 minutes per player
- Let the game creator choose in PVP

### 6. MEDIUM: No Resign Button

Players can't resign. They have to play until checkmate or timeout.

**Fix:** Add a resign button that:
- Confirms ("Are you sure?")
- Sets the opponent as winner
- Updates leaderboard
- In PVP: updates Firebase and allows winner to claim

### 7. MEDIUM: Multiple Confusing Game States

Firebase has `waiting_for_join`, `waiting`, `active`, `finished` — and code checks for all of them inconsistently.

**Fix:** Standardize to exactly these states:
```typescript
type GameState = 'waiting' | 'active' | 'finished' | 'cancelled';
// 'waiting' = created, waiting for opponent
// 'active' = both players in, game in progress
// 'finished' = game ended (checkmate, stalemate, resign, timeout)
// 'cancelled' = creator cancelled before anyone joined
```

Remove `waiting_for_join` — just use `waiting`.

### 8. MEDIUM: Firebase/Contract Desync

If a transaction fails after Firebase is updated (or vice versa), the game state becomes inconsistent.

**Fix:**
- Always update contract FIRST, then Firebase on confirmation
- Add a `contract_confirmed: boolean` field to Firebase game data
- On game load, if `contract_confirmed` is false, verify against contract
- Add a "Sync with contract" button for stuck games

### 9. LOW: Instructions Are Outdated

The "How To" content references old difficulty names and doesn't explain the Clawb mode clearly.

**Fix:** Rewrite instructions (see section below).

### 10. HIGH: Timeout Doesn't Update Leaderboard

When a game ends by timeout, `handleTimeout()` updates Firebase and calls `endGame` on the contract, but **never updates leaderboard scores**. Both checkmate and stalemate paths call `updateBothPlayersScoresLocal()`, but timeout skips it entirely.

**Fix:** Add score update to `handleTimeout()`:
```typescript
// In handleTimeout(), after Firebase update and before/after endGame call:
await updateBothPlayersScoresLocal(winner, bluePlayer, redPlayer);
await loadLeaderboard();
```

### 11. HIGH: Move History Not Persisted

Move history is stored in local React state only (`useState<string[]>([])`). It's:
- Lost on page refresh
- Not synced between players (each has their own local copy)
- Not stored in Firebase
- Gone after the game ends

**Fix:** Store move history in Firebase alongside the board:
```typescript
// In firebaseChess.updateGame():
{
  board: { ... },
  move_history: [...prev, moveNotation],  // Add this
  current_player: nextPlayer,
}
```

### 12. MEDIUM: Ghost Game Cleanup is Disabled

The `cleanupGhostGames()` function exists but is **commented out** (line 2236: `// await cleanupGhostGames(games);`). This means stale/orphaned games accumulate in Firebase and show in the lobby.

**Fix:** Re-enable ghost game cleanup, or add a TTL-based cleanup (delete games older than 24 hours that are still `waiting`).

### 13. MEDIUM: Auto-Claim Winner Fallback is Dangerous

`claimWinnings()` has multiple fallback paths for determining the winner. The final fallback (line ~575) is:
```typescript
// If current player is claiming and game is finished, they are likely the winner
winnerAddress = address; // ← DANGEROUS: assumes claimer is winner
```

This could allow the **loser** to claim if Firebase data is incomplete.

**Fix:** Remove this fallback. If winner can't be determined from Firebase + contract data, show an error and don't allow claiming. Add a manual resolution path via the house wallet only.

### 14. MEDIUM: Chain Switch Requires Manual Retry

When joining a game on a different chain, the code auto-switches but then `return`s. The user must click "Join" again after switching.

**Fix:** After successful chain switch, auto-retry the join:
```typescript
try {
  await switchChain({ chainId: gameChainId });
  // After successful switch, retry join automatically
  // (use a short delay to let wagmi state update)
  setTimeout(() => joinGame(inviteCode), 1000);
} catch (error) { ... }
```

### 15. MEDIUM: No Spectator Mode UI

When a non-player opens a game URL, `playerColor` is set to `null` and they can see the board but there's no indication they're spectating. No "Spectating" label, no explanation of read-only state.

**Fix:** When `playerColor === null` and `gameMode === ACTIVE`, show a "Spectating" banner and hide the move input. Show both players' names and the live board.

### 16. LOW: Leaderboard Not Real-Time

Leaderboard uses polling (~30s intervals) rather than Firebase `onValue` listener. Scores may appear stale after a game ends.

**Fix:** Use `firebaseChess.subscribeToLeaderboard()` (already exists) instead of periodic `loadLeaderboard()` calls.

### 17. LOW: Player Stats Not Shown During Games

Player stats (wins, losses, win rate) are only visible in the Profile popup. During an active game, neither player sees their opponent's stats.

**Fix:** Show a compact stats line under each player's name during active games:
```
Blue: wables (15W-3L, 83%)
Red: Clawb (8W-5L, 62%)
```

### 18. LOW: PVP Board Format Needs Standardization

PVP uses a `positions` object with `"row,col": "P"` keys. This is non-standard and hard for agents to work with.

**Fix:** Store FEN string alongside the positions object:
```typescript
// In firebaseChess.updateGame():
board: {
  positions: { ... },  // Keep for backward compatibility
  fen: game.fen(),      // Add standard FEN
  last_move: 'e2e4',   // UCI format for highlighting
  rows: 8,
  cols: 8
}
```

---

## New Feature: Agent Support

### Multi-Chain: Both Contracts Must Stay in Sync

LAWBCHESS3000 is deployed on **two chains** with the same ABI:
- **Base Mainnet (8453):** `0x06b6aAe693cf1Af27d5a5df0d0AC88aF3faC9E11`
- **Sanko Mainnet (1996):** `0x4a8A3BC091c33eCC1440b6734B0324f8d0457C56`

Any frontend changes MUST work with both contracts. The `chain` field in the Firebase game data determines which contract to interact with. Token addresses differ per chain (e.g., LAWB is `0x7e18...` on Base but `0xA7DA...` on Sanko). Always use the chain-specific addresses from `src/config/tokens.ts`.

### Agent Player Identification

Agents are identified by their wallet address, same as human players. No special treatment in the contract — an agent is just another wallet.

In Firebase, add an `is_agent` flag to distinguish:
```typescript
// When an agent joins/creates a game:
{
  blue_player: '0x5bba58218914f2e9b6b5434e0306fa2c6ca0e429',
  blue_player_name: 'Clawb',
  blue_is_agent: true,
  // ...
}
```

### Agent Move Submission

Agents submit moves via Firebase REST API. The frontend renders them the same as human moves.

**Firebase path for agent moves:**
```
chess_games/{inviteCode}/board/fen        ← agent writes new FEN after its move
chess_games/{inviteCode}/board/last_move  ← agent writes UCI move (e.g., "e2e4")
chess_games/{inviteCode}/current_player   ← agent flips to opponent's color
chess_games/{inviteCode}/board/positions  ← agent writes updated position object
```

The frontend subscribes to `chess_games/{inviteCode}` via `onValue` — it will see the agent's move appear in real-time, exactly like a human opponent's move.

### "Play vs Clawb" Mode (Single Player)

Replace the current Hard mode with a proper "vs Clawb" experience:

1. User selects "vs Clawb" → creates a Firebase game entry (no on-chain wager)
2. Firebase path: `chess_games/{gameId}` with `game_type: 'vs_clawb'`
3. Clawb's machine detects the game (chess-clawb-player.js polls `chess_games`)
4. Clawb calls Stockfish, writes move + personality comment to Firebase
5. Frontend reads move from Firebase, applies to board, shows Clawb's comment in chat
6. Game continues via Firebase until checkmate/stalemate/resign

**This replaces the direct Stockfish API call from the frontend** — all moves go through Firebase, with Clawb as the personality layer.

### Agent vs Agent Detection

When both players have `is_agent: true`, the frontend should:
- Show "Agent Match" badge
- Show both agents' names and profile pictures
- Auto-refresh faster (agents move quickly)
- Show a "spectating" mode by default (no move input shown)

### Leaderboard: Agents in Leaderboard

Agents appear in the leaderboard alongside humans. Add a visual indicator:
- 🤖 icon next to agent names (or a small "AI" badge)
- Filter option: "Show all" / "Humans only" / "Agents only"

---

## Updated Instructions (How To Play)

Replace the current HowToContent with:

```
LAWB CHESS 3000

OBJECTIVE
Checkmate your opponent's king. If you're new to chess, the king is the piece 
with a cross on top. Trap it so it can't escape.

MODES
• Easy Mode — Random AI opponent. Good for learning.
• vs Clawb — Play against Clawb, the Lawbster. He uses Stockfish (the strongest 
  chess engine in the world). He will talk trash. Don't take it personally.
• PVP — Play against another human (or agent) with real token wagers on-chain.

SINGLE PLAYER
1. Click "Single Player"
2. Choose Easy or vs Clawb
3. You play as Blue (bottom). Opponent is Red (top).
4. Blue always moves first.
5. Click a piece to see its legal moves highlighted.
6. Click a highlighted square to move.

PVP (ON-CHAIN WAGERS)
1. Connect your wallet
2. Switch to the correct chain (Base, Sanko, or Arbitrum)
3. Either CREATE a match (set your wager token and amount) or JOIN an open match
4. When you create: your wager is locked in the contract. Share the invite code.
5. When opponent joins: their matching wager is locked. Game starts.
6. Play moves. Your clock is ticking.
7. Winner claims the pot (minus house fee) from the smart contract.

TIME CONTROLS
Each player gets a total clock. When it's your turn, your clock ticks down.
When you move, your clock stops and opponent's starts.
If your clock hits zero, you lose.

PIECES
• Pawn — Moves forward 1 square (2 from start). Captures diagonally. Promotes on last rank.
• Knight — L-shape (2+1). Jumps over pieces.
• Bishop — Diagonal any distance.
• Rook — Straight lines any distance.
• Queen — Diagonal + straight (most powerful).
• King — 1 square any direction. Protect this piece.

SPECIAL MOVES
• Castling — King moves 2 squares toward a rook. Both pieces move. King can't be in check.
• En passant — Pawn captures an adjacent pawn that just moved 2 squares.
• Promotion — Pawn reaching the last rank becomes a Queen (or other piece).

SCORING
Win = 3 points | Draw = 1 point | Loss = 0 points

CONTRACTS
Base Mainnet: 0x06b6aAe693cf1Af27d5a5df0d0AC88aF3faC9E11
Sanko Mainnet: 0x4a8A3BC091c33eCC1440b6734B0324f8d0457C56
```

---

## Implementation Order

**Phase 1 — Core Reliability (do first, fixes the most bugs):**
1. **Install chess.js** and replace ALL custom move validation — fixes the core reliability issue
2. **Fix stalemate** to be a draw, not a loss
3. **Fix timeout leaderboard update** — add `updateBothPlayersScoresLocal()` to `handleTimeout()`
4. **Remove dangerous auto-claim fallback** — don't let claimer be assumed winner

**Phase 2 — Data Integrity:**
5. **Add FEN to Firebase** board updates (alongside positions object)
6. **Persist move history in Firebase** — store alongside board state
7. **Standardize game states** to `waiting` / `active` / `finished` / `cancelled`
8. **Re-enable ghost game cleanup** or add TTL-based cleanup for stale games
9. **Fix Firebase/contract sync** — always update contract first, verify before Firebase

**Phase 3 — UX Improvements:**
10. **Add resign button** with confirmation
11. **Fix timer** to proper chess clock (total time per player, not per move)
12. **Add Stockfish fallback indicator** (visible warning when using random moves)
13. **Auto-retry join after chain switch** instead of requiring manual retry
14. **Add spectator mode UI** — "Spectating" banner when `playerColor === null`
15. **Show player stats during games** — compact win/loss display
16. **Use real-time leaderboard** via `subscribeToLeaderboard()` instead of polling
17. **Update instructions** with new How To content

**Phase 4 — Agent Support (after phases 1-3):**
18. **Add `is_agent` flag** to game data and leaderboard display
19. **Add "vs Clawb" mode** that goes through Firebase instead of direct Stockfish API
20. **Agent badge in leaderboard** — visual indicator for AI players

---

## Firebase Game Data Schema (After Overhaul)

```typescript
interface ChessGame {
  invite_code: string;           // bytes6 hex (e.g., "0x1a2b3c4d5e6f")
  game_title: string;
  game_type: 'pvp' | 'vs_clawb' | 'vs_easy';
  game_state: 'waiting' | 'active' | 'finished' | 'cancelled';
  
  // Players
  blue_player: string;           // wallet address (creator, moves first)
  blue_player_name?: string;     // display name
  blue_is_agent?: boolean;
  red_player: string;            // wallet address (joiner)
  red_player_name?: string;
  red_is_agent?: boolean;
  
  // Board state
  board: {
    fen: string;                 // Standard FEN string (source of truth)
    last_move: string;           // UCI format (e.g., "e2e4")
    positions: Record<string, string>;  // Legacy format for backward compat
    rows: 8;
    cols: 8;
  };
  current_player: 'blue' | 'red';
  
  // Wager (PVP only)
  bet_amount?: string;           // wei as string
  bet_token?: string;            // token symbol
  chain?: 'base' | 'sanko' | 'arbitrum';
  contract_address?: string;
  contract_confirmed?: boolean;  // true after on-chain tx confirmed
  
  // Result
  winner?: string;               // wallet address of winner, or 'draw'
  end_reason?: 'checkmate' | 'stalemate' | 'resign' | 'timeout' | 'draw';
  
  // Timing
  blue_time_remaining_ms?: number;
  red_time_remaining_ms?: number;
  last_move_timestamp?: number;
  
  // Meta
  is_public: boolean;
  created_at: string;
  updated_at: string;
}
```

## Testing Checklist

### Core Chess Logic
- [ ] chess.js correctly validates all piece moves (pawn, knight, bishop, rook, queen, king)
- [ ] Castling works (kingside and queenside)
- [ ] En passant works
- [ ] Pawn promotion works (auto-queen or piece selection)
- [ ] Checkmate is correctly detected and announced
- [ ] Stalemate results in a DRAW (not a loss)
- [ ] Insufficient material draw detected (K vs K, K+B vs K, K+N vs K)
- [ ] Threefold repetition detected
- [ ] 50-move rule detected

### PVP Full Flow (CRITICAL — test end to end)
- [ ] Create game on Base with ETH wager → game appears in lobby
- [ ] Create game on Sanko with DMT wager → game appears in lobby
- [ ] Create game with LAWB wager (Base) → correct 6-decimal handling
- [ ] Create game with LAWB wager (Sanko) → correct 6-decimal handling
- [ ] Join game on same chain → game starts, both players see active board
- [ ] Join game on different chain → auto-switch + auto-retry join
- [ ] Token approval flow → approve → join completes smoothly
- [ ] Both players can make moves → moves appear in real-time for opponent
- [ ] Checkmate → winner announced → leaderboard updated → auto-claim triggers
- [ ] Claim winnings → contract endGame called → payout received → Firebase updated to finished
- [ ] Stalemate → DRAW announced → both players get draw points → game finishes cleanly
- [ ] Timeout → winner determined → leaderboard updated → endGame called → payout works
- [ ] Resign → opponent wins → leaderboard updated → endGame called
- [ ] Game disappears from lobby after finishing
- [ ] Move history persists in Firebase and survives page refresh
- [ ] Chat works during game (private room) and after (public)

### Timer
- [ ] Chess clock ticks down for active player only
- [ ] Clock stops when player moves, opponent's starts
- [ ] Clock timeout results in loss for timed-out player
- [ ] Both players see accurate time remaining

### UI/UX
- [ ] Stockfish fallback shows visible warning to user
- [ ] Resign button shows with confirmation
- [ ] Spectator mode shows "Spectating" banner, no move input
- [ ] Player stats shown during active games
- [ ] Leaderboard updates in real-time (not polling)
- [ ] Mobile layout works correctly

### Data Integrity
- [ ] FEN is stored in Firebase alongside positions
- [ ] Game state transitions are clean: waiting → active → finished
- [ ] No orphaned/stuck games in Firebase
- [ ] Ghost game cleanup works (stale games removed)
- [ ] `playerToGame` mapping cleared after game ends
- [ ] Winner cannot be falsely claimed by loser

### Agent Support
- [ ] Agent moves appear correctly in real-time
- [ ] Agent badge shows in leaderboard
- [ ] `is_agent` flag set correctly for agent players
- [ ] "vs Clawb" mode creates Firebase game and waits for Clawb's response
