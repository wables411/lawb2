# Firebase 18–21GB/day Download — Findings & Fixes

## Likely culprits

### 1. **chess_games — full tree reads** (HIGHEST IMPACT)

Every call downloads the **entire** `chess_games` node:

| Caller | Frequency | What it does |
|--------|-----------|--------------|
| `getOpenGames()` | Every 60s (ChessMultiplayer lobby) | `get(ref('chess_games'))` = full tree |
| `getActiveGames()` | On load + checkPlayerGameState | Same |
| `checkPlayerGameState()` | Various flows (reconnect, etc.) | Same |

Each game stores board, moves, FEN history. With 200+ games, this can be 5–20MB per read.  
Many users × 1 read/min × large payload ≈ **most of the 18–21GB**.

### 2. **leaderboard — full tree reads**

| Caller | Frequency | What it does |
|--------|-----------|--------------|
| `getTopLeaderboardEntries(20)` | Every 30s (ChessGame, ChessMultiplayer) | `get(ref('leaderboard'))` = full tree |
| `loadLeaderboard()` | Both chess components | Same, plus 20 × `getDisplayName()` = 20 profile reads |

Leaderboard is smaller than chess_games but still unbounded. Combined with profiles, it adds up.

### 3. **ClawbWorld** (REDUCED BY OUR CHANGES)

- `refreshLeaderboard()` every 30s: leaderboard + profiles + bounties
- World presence, commands, actions listeners

**We excluded ClawbWorld from Netlify**, so public visitors to lawb.xyz no longer create these listeners. This removes one source.

---

## Fixes to implement

### A. Query chess_games instead of full read

**Current:**
```ts
const snapshot = await get(ref(db, 'chess_games'));
```

**Fix:** Use queries so Firebase only syncs matching children:

```ts
// Open games only
const openQuery = query(
  ref(db, 'chess_games'),
  orderByChild('game_state'),
  equalTo('waiting_for_join')
);
// Add index in Firebase: chess_games, game_state

// Or for "waiting" OR "waiting_for_join" — may need composite index
```

For `getActiveGames()`: query `game_state === 'active'` (and similar for waiting) instead of full tree.

### B. Limit leaderboard read

**Current:** `get(ref('leaderboard'))` downloads everything.

**Options:**
1. Use `orderByChild('points').limitToLast(20)` with an index (still downloads top 20 by points).
2. Use `subscribeToLeaderboard()` (realtime) instead of polling — one sync, then incremental updates.

### C. Reduce poll frequency

- Leaderboard: 30s → 2–5 min (or switch to realtime).
- Open games: 60s is okay if the query is scoped.

### D. Add Firebase indexes

In Firebase Console → Realtime Database → Rules/Indexes, add indexes for:
- `chess_games` on `game_state`
- `chess_games` on `game_type`
- `leaderboard` on `points` (if using limitToLast)

---

## What our changes today did

- **Excluded ClawbWorld from Netlify** — public `/world` visitors no longer create Firebase world listeners or leaderboard refresh.
- **Pruned world-only assets** — no impact on Firebase.

Chess page traffic is **unchanged** and is the main remaining source of large downloads.

---

## Next steps

1. Inspect Firebase Usage to see which paths use the most bandwidth.
2. Implement query-based reads for `chess_games` (open + active).
3. Switch leaderboard to realtime or limit + increase interval.
4. Add the necessary Firebase indexes.
