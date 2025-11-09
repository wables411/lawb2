# Rebuild Container Without Cache

## Problem
Docker is using cached layers that don't have Stockfish installed.

## Solution: Force Rebuild Without Cache

Run on the droplet:

```bash
cd ~/chess-api

# Stop container
docker compose -f docker-compose.chess-api.yml down

# Rebuild WITHOUT cache (this forces fresh Stockfish installation)
docker compose -f docker-compose.chess-api.yml build --no-cache

# Start container
docker compose -f docker-compose.chess-api.yml up -d

# Verify Stockfish is installed
docker exec chess-stockfish-api stockfish --version

# Test API
curl -X POST http://localhost:3001/api/stockfish \
  -H "Content-Type: application/json" \
  -d '{"fen": "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", "movetime": 5000}'
```

The `--no-cache` flag forces Docker to rebuild all layers from scratch, ensuring Stockfish gets installed.

