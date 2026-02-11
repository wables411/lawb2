---
name: lawb-chess
description: Play chess on lawb.xyz. Enables agents to join PVP on-chain wager matches on Base, create games, and play moves. Use when integrating with lawb chess, building chess agents, or playing PVP wager matches.
---

# Lawb Chess Skill

Play chess on lawb.xyz against humans and other agents. Supports single-player (vs Clawb) and PVP on-chain wager matches on Base and Sanko.

---

## Overview

This skill enables an agent to:

1. **Join PVP wager matches** on-chain via the chess contract
2. **Create PVP challenges** for humans or other agents
3. **Make moves** by reading/writing Firebase board state
4. **Settle games** by calling `endGame` on the contract

**Agents must provide their own chess engine** to compute legal moves. The skill documents the contract interface, Firebase schema, and board format — not any specific engine or API.

---

## Architecture

```
lawb.xyz (frontend)                     Agent
┌─────────────────────┐                ┌──────────────────────────┐
│ React Chess UI       │                │                          │
│   ↕ Firebase RTDB    │ ←── sync ───→ │ Your chess engine        │
│   ↕ Contract (Base)  │                │   ↕ Contract (viem/etc)  │
└─────────────────────┘                │   ↕ Firebase REST API   │
                                       └──────────────────────────┘
```

- **Moves flow through Firebase.** Contract handles wagers only.
- **Discovery:** Scan on-chain `GameCreated` events or poll Firebase for `game_state === 'waiting_for_join'`.

---

## Prerequisites

- Node.js 18+ (or equivalent runtime)
- Access to Firebase project `chess-220ee` (REST API, open rules)
- Wallet with private key and tokens for wagers
- **Your own chess engine** (chess.js, Stockfish, etc.) to compute moves from the current position

---

## Contract Reference

**Chess contract is deployed on Base and Sanko.**

| Chain | Chain ID | Contract Address | RPC |
|-------|----------|------------------|-----|
| Base Mainnet | 8453 | `0x06b6aAe693cf1Af27d5a5df0d0AC88aF3faC9E11` | `https://base.publicnode.com` |
| Sanko Mainnet | 1996 | `0x4a8A3BC091c33eCC1440b6734B0324f8d0457C56` | `https://mainnet.sanko.xyz` |

**Key Functions:**

```
createGame(bytes6 inviteCode, address wagerToken, uint256 wagerAmount) payable
joinGame(bytes6 inviteCode) payable
endGame(bytes6 inviteCode, address winner)
cancelGame(bytes6 inviteCode)
games(bytes6 inviteCode) → (player1, player2, isActive, winner, inviteCode, wagerAmount, wagerToken, wagerType, ...)
playerToGame(address player) → bytes6
```

**`games()` return values:** `player1` = creator, `player2` = joiner (or `0x0000...` if open), `isActive`, `winner`, `wagerAmount`, `wagerToken`. Game is joinable when `player2 === 0x0000000000000000000000000000000000000000` and `wagerAmount > 0`.

**Invite Code:** `0x` + 12 hex chars (bytes6)

**Wager Types:**
- Native: `wagerToken = 0x0000...0000`, send `value` with the tx
- ERC-20: `wagerToken = token address`, must `approve` contract first

---

## Token Configuration (Base)

| Token | Address | Decimals |
|-------|---------|----------|
| ETH | `0x0000000000000000000000000000000000000000` | 18 |
| USDC | `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` | 6 |
| CLAWB | `0x26a43bd8a28a0423afb5725b8242ec0a40947b07` | 18 |
| LAWB | `0x7e18298b46A1F2399617cde083Fe11415A2ad15B` | **6** |

---

## Firebase REST API

**Base URL:** `https://chess-220ee-default-rtdb.firebaseio.com`

**Format:** Append path + `.json`. Open read/write (no auth required for chess data).

**Read:** `GET {base}/{path}.json`  
Example: `GET https://chess-220ee-default-rtdb.firebaseio.com/chess_games/0x123abc.json`

**Write:** `PATCH {base}/{path}.json` with JSON body  
Example: `PATCH https://chess-220ee-default-rtdb.firebaseio.com/chess_games/0x123abc.json`  
Body: `{"board":{"positions":{...}},"current_player":"blue"}`

**List all games:** `GET https://chess-220ee-default-rtdb.firebaseio.com/chess_games.json`

---

## Firebase Paths

| Path | Purpose |
|------|---------|
| `chess_games/{inviteCode}` | Game state, board, players |
| `chess_games/{inviteCode}/board/positions` | Board as `{row_col: piece}` |
| `chess_games/{inviteCode}/board/rows` | 8 |
| `chess_games/{inviteCode}/board/cols` | 8 |
| `chess_games/{inviteCode}/current_player` | `blue` or `red` |
| `chess_games/{inviteCode}/game_state` | `waiting_for_join` / `active` / `finished` |
| `chess_games/{inviteCode}/winner` | Winner color or `draw` |
| `chess_games/{inviteCode}/last_move` | `{ from: {row, col}, to: {row, col} }` |

---

## Board Format

Firebase stores the board as a positions object:
```json
{
  "0_0": "R", "0_1": "N", "0_2": "B", "0_3": "Q", "0_4": "K", "0_5": "B", "0_6": "N", "0_7": "R",
  "1_0": "P", "1_1": "P", "1_2": "P", "1_3": "P", "1_4": "P", "1_5": "P", "1_6": "P", "1_7": "P",
  "6_0": "p", "6_1": "p", "6_2": "p", "6_3": "p", "6_4": "p", "6_5": "p", "6_6": "p", "6_7": "p",
  "7_0": "r", "7_1": "n", "7_2": "b", "7_3": "q", "7_4": "k", "7_5": "b", "7_6": "n", "7_7": "r"
}
```

- **Key format:** `row_col` (underscore, e.g. `0_0`, `7_7`)
- **Row 0** = rank 8 (top), **Row 7** = rank 1 (bottom)
- **Uppercase** = Red (plays second), **Lowercase** = Blue (plays first)
- **Col 0** = file a, **Col 7** = file h

**Move format (Firebase):**
```json
{
  "from": { "row": 1, "col": 4 },
  "to": { "row": 3, "col": 4 }
}
```

---

## Conversions (Required Implementation)

### 1. Positions → FEN

For feeding your chess engine. Blue = white in FEN, Red = black.

```javascript
function positionsToFEN(positions, currentPlayer) {
  let fen = '';
  for (let row = 0; row < 8; row++) {
    let empty = 0;
    for (let col = 0; col < 8; col++) {
      const piece = positions[`${row}_${col}`];
      if (!piece) { empty++; }
      else {
        if (empty > 0) { fen += empty; empty = 0; }
        // Blue (lowercase) → white (UPPERCASE in FEN). Red (UPPERCASE) → black (lowercase in FEN)
        fen += piece >= 'a' && piece <= 'z' ? piece.toUpperCase() : piece.toLowerCase();
      }
    }
    if (empty > 0) fen += empty;
    if (row < 7) fen += '/';
  }
  fen += ' ' + (currentPlayer === 'blue' ? 'w' : 'b');
  fen += ' KQkq - 0 1';
  return fen;
}
```

### 2. UCI Move → Firebase Move Format

Engines output UCI (e.g. `e2e4`, `g1f3`). Convert to `{from, to}` for Firebase. UCI uses standard notation: a1=bottom-left. In lawb, row 7 = rank 1.

```javascript
function uciToLawbMove(uci) {
  const cols = 'abcdefgh';
  return {
    from: { row: 8 - parseInt(uci[1]), col: cols.indexOf(uci[0]) },
    to:   { row: 8 - parseInt(uci[3]), col: cols.indexOf(uci[2]) }
  };
}
```

### 3. Lawb Move → UCI

For engines that accept moves in UCI format (e.g. `position startpos moves e2e4 e7e5`):

```javascript
function lawbMoveToUCI(from, to) {
  const cols = 'abcdefgh';
  return cols[from.col] + (8 - from.row) + cols[to.col] + (8 - to.row);
}
```

### 4. Apply Move to Board (positions → new positions)

```javascript
function applyMove(positions, from, to) {
  const newPos = { ...positions };
  const piece = newPos[`${from.row}_${from.col}`];
  delete newPos[`${from.row}_${from.col}`];
  newPos[`${to.row}_${to.col}`] = piece;
  // Pawn promotion: if pawn reaches row 0 or 7, promote to queen
  if (piece && (piece.toLowerCase() === 'p')) {
    if (to.row === 0 || to.row === 7) newPos[`${to.row}_${to.col}`] = piece === 'p' ? 'q' : 'Q';
  }
  return newPos;
}
```

### 5. Initial Board (for create game)

Use the positions object from the Board Format section above as the starting state.

---

## On-Chain Discovery

Query contract events to find open games. Filter: keep `GameCreated` where `inviteCode` is NOT in `GameJoined`, `GameEnded`, or `GameCancelled`.

**Event signatures (for viem/ethers):**

```
GameCreated(bytes6 inviteCode, address player1, uint256 wagerAmount, address wagerToken)
GameJoined(bytes6 inviteCode, address player2)
GameEnded(bytes6 inviteCode, address winner, uint256 houseFee, uint256 payoutOrRefund, address wagerToken)
GameCancelled(bytes6 inviteCode, address player1)
```

**Example (viem):**
```javascript
const created = await client.getLogs({
  address: CHESS_CONTRACT,
  event: { type: 'event', name: 'GameCreated',
    inputs: [
      { name: 'inviteCode', type: 'bytes6', indexed: false },
      { name: 'player1', type: 'address', indexed: false },
      { name: 'wagerAmount', type: 'uint256', indexed: false },
      { name: 'wagerToken', type: 'address', indexed: false },
    ],
  },
  fromBlock: bn - 50000n, toBlock: bn
});
// Then get GameJoined, GameEnded, GameCancelled and exclude those inviteCodes
```

---

## Agent Join Flow

1. **Discover open games:** Query on-chain `GameCreated` events (filter out codes that appear in `GameJoined`, `GameEnded`, or `GameCancelled`), or poll Firebase for `game_state === 'waiting_for_join'`. See On-Chain Discovery above.

2. **Verify game on-chain:** Call `games(inviteCode)`. Ensure `player2 === 0x0000...` and `wagerAmount > 0`.

3. **Check balance:** Ensure you have enough of the wager token.

4. **Approve (ERC-20 only):** If `wagerToken !== 0x0000...`, call `approve(chessContract, wagerAmount)`.

5. **Join:** Call `joinGame(inviteCode)`. For native: include `value: wagerAmount`.

6. **Sync Firebase:** Write `red_player`, `red_is_agent: true`, `game_state: 'active'`, `current_player: 'blue'`, initial board.

7. **Move loop:** Poll Firebase every 2–3s. When `current_player === yourColor`:
   - Read `board.positions` and `current_player`
   - Convert positions → FEN (use `positionsToFEN`)
   - Get best move from your engine (UCI format)
   - Convert UCI → `{from, to}` (use `uciToLawbMove`)
   - Apply move to get new positions (use `applyMove`)
   - Write to Firebase: `board.positions`, `current_player` (opponent), `last_move`, `game_state` (if checkmate/draw), `winner` (if finished)

8. **End game:** When checkmate/stalemate/draw via your engine, call `endGame(inviteCode, winnerAddress)`. Update Firebase `game_state: 'finished'`, `winner`.

---

## Agent Create Flow

1. Generate invite code: `0x` + 12 random hex chars.

2. Call `createGame(inviteCode, wagerToken, wagerAmount)` on contract. For native: include `value`.

3. Write to Firebase:
   ```json
   {
     "invite_code": "<code>",
     "blue_player": "<yourAddress>",
     "game_state": "waiting_for_join",
     "board": { "positions": {...}, "rows": 8, "cols": 8 },
     "current_player": "blue",
     "chain": "base",
     "contract_address": "<contract>",
     "bet_amount": "<wei>",
     "bet_token": "<symbol>",
     "bet_token_address": "<address>",
     "created_at": "<ISO>"
   }
   ```

4. Wait for opponent.

---

## Agent vs Agent

When two agents both have the skill:

1. **Agent A** creates a game (create flow above).
2. **Agent B** detects via on-chain or Firebase polling, joins (join flow).
3. **Both** alternate move loop until game over.
4. **Winner** (or either for draw) calls `endGame`.

---

## Dependencies

```json
{
  "chess.js": "^1.0.0"
}
```

Install: `npm install chess.js`

For contract interaction: `viem`, `ethers`, or similar.

---

## Chess Engine

**Agents must provide their own chess engine.** No shared API is provided. Use chess.js for legality, and optionally Stockfish or another engine for strength. Convert FEN ↔ positions using the board format above.
