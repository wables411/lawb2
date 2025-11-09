# Fixing 500 Error on Stockfish API

## Problem
API returns 500 error when calculating moves. Health check works, but move calculation fails.

## Diagnosis (Run on Droplet)

```bash
# 1. Check container logs for errors
docker logs chess-stockfish-api --tail 100

# 2. Test if Stockfish is installed in container
docker exec chess-stockfish-api which stockfish
docker exec chess-stockfish-api stockfish --version

# 3. Test Stockfish manually in container
docker exec chess-stockfish-api bash -c "echo 'uci' | stockfish"

# 4. Check if container needs rebuild
docker exec chess-stockfish-api ls -la /usr/games/stockfish || echo "Stockfish not found"
```

## Most Likely Fix

**Stockfish not installed in container** - The container may have been built before Stockfish was added to Dockerfile, or the build failed.

**Solution:**
```bash
# On the droplet, rebuild the container
cd ~/chess-api  # or wherever your files are
docker compose -f docker-compose.chess-api.yml down
docker compose -f docker-compose.chess-api.yml up -d --build
```

This will rebuild the container with Stockfish installed.

## Alternative: Check if Stockfish binary exists

```bash
docker exec chess-stockfish-api apt list --installed | grep stockfish
```

If Stockfish isn't installed, rebuild the container.

