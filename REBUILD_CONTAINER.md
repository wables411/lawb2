# Rebuild Docker Container with Stockfish

## Problem
Stockfish is not installed in the container - the container was built without it.

## Solution: Rebuild Container

Run these commands on the droplet:

```bash
# 1. Navigate to where your docker-compose file is
cd ~/chess-api  # or wherever you have docker-compose.chess-api.yml

# 2. Stop and remove the current container
docker compose -f docker-compose.chess-api.yml down

# 3. Rebuild with Stockfish (this will install Stockfish during build)
docker compose -f docker-compose.chess-api.yml up -d --build

# 4. Check logs to verify Stockfish is installed
docker logs chess-stockfish-api --tail 20

# 5. Verify Stockfish is now installed
docker exec chess-stockfish-api stockfish --version

# 6. Test the API
curl -X POST http://localhost:3001/api/stockfish \
  -H "Content-Type: application/json" \
  -d '{"fen": "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", "movetime": 5000}'
```

## What This Does

The `--build` flag will:
1. Rebuild the Docker image using `Dockerfile.chess-api`
2. Install Stockfish during the build (via `apt-get install stockfish`)
3. Create a new container with Stockfish installed

## After Rebuild

Once Stockfish is installed, the API should work:
- Health check: `curl https://chess.lawb.xyz/api/stockfish` → `{"status":"Stockfish API is running"}`
- Move calculation: Should return `{"bestmove": "e2e4", ...}` instead of 500 error

