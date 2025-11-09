# Fix Stockfish Path Issue

## Problem
Stockfish is installed but not in PATH. On Debian/Ubuntu, it's typically in `/usr/games/stockfish`.

## Quick Fix on Droplet

First, verify where Stockfish is:
```bash
docker exec chess-stockfish-api find /usr -name stockfish 2>/dev/null
```

Then update the code to use the full path, or we can fix it in the code.

## Solution: Update Code

I've updated `simple-stockfish-api.js` to use `/usr/games/stockfish` instead of just `stockfish`.

**On the droplet:**
```bash
cd ~/chess-api

# Update the file (or pull from git)
# Then rebuild
docker compose -f docker-compose.chess-api.yml down
docker compose -f docker-compose.chess-api.yml up -d --build

# Test
docker exec chess-stockfish-api /usr/games/stockfish --version
curl -X POST http://localhost:3001/api/stockfish \
  -H "Content-Type: application/json" \
  -d '{"fen": "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", "movetime": 5000}'
```

