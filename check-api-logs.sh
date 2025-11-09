#!/bin/bash
# Run this on the droplet to check API logs

echo "=== Checking Docker Container Logs ==="
docker logs chess-stockfish-api --tail 50

echo ""
echo "=== Testing Stockfish in Container ==="
docker exec chess-stockfish-api stockfish --version 2>&1 || echo "Stockfish not found in container"

echo ""
echo "=== Testing API with verbose output ==="
curl -v -X POST http://localhost:3001/api/stockfish \
  -H "Content-Type: application/json" \
  -d '{"fen": "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", "movetime": 10000, "difficulty": "play"}' 2>&1

