# Simple Fix - Update Stockfish Path

## On the Droplet, Run These Commands:

```bash
cd ~/chess-api

# Update the file - change stockfish to /usr/games/stockfish
sed -i "s/spawn('stockfish')/spawn('\/usr\/games\/stockfish')/g" simple-stockfish-api.js

# Rebuild container
docker compose -f docker-compose.chess-api.yml down
docker compose -f docker-compose.chess-api.yml up -d --build

# Test
curl -X POST http://localhost:3001/api/stockfish \
  -H "Content-Type: application/json" \
  -d '{"fen": "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", "movetime": 5000}'
```

That's it! The `sed` command automatically fixes the path in the file.

