#!/bin/bash
# Deployment script for Stockfish API on DigitalOcean droplet
# Run this on your droplet: bash <(curl -s) or copy-paste

set -e  # Exit on error

echo "=========================================="
echo "STOCKFISH API DEPLOYMENT"
echo "=========================================="
echo ""

# Step 1: Install Docker
echo "Step 1: Installing Docker..."
if command -v docker &> /dev/null; then
    echo "✓ Docker already installed"
    docker --version
else
    echo "Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
    echo "✓ Docker installed"
fi

# Install Docker Compose plugin
echo ""
echo "Installing Docker Compose..."
apt-get update -qq
apt-get install -y docker-compose-plugin
echo "✓ Docker Compose installed"

# Step 2: Create directory
echo ""
echo "Step 2: Creating deployment directory..."
mkdir -p /root/chess-api
cd /root/chess-api
echo "✓ Directory created: /root/chess-api"

# Step 3: Create files
echo ""
echo "Step 3: Creating deployment files..."

# Create simple-stockfish-api.js
cat > simple-stockfish-api.js << 'EOF'
const http = require('http');
const { spawn } = require('child_process');
const url = require('url');

// Helper function to get difficulty settings
function getDifficultySettings(difficulty) {
  // Only support 'play' difficulty
  return {
    skillLevel: 20,
    depth: 25,
    movetime: 12000,
    description: 'Strong chess AI'
  };
}

// CORS headers
function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

// Parse JSON from request body
function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(body));
      } catch (error) {
        reject(error);
      }
    });
  });
}

const server = http.createServer(async (req, res) => {
  setCorsHeaders(res);
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  const parsedUrl = url.parse(req.url, true);
  
  // Health check endpoint
  if (req.method === 'GET' && parsedUrl.pathname === '/api/stockfish') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'Stockfish API is running' }));
    return;
  }
  
  // Stockfish API endpoint
  if (req.method === 'POST' && parsedUrl.pathname === '/api/stockfish') {
    try {
      const body = await parseJsonBody(req);
      const { fen, difficulty = 'play', movetime } = body;
      
      console.log(`Received request for FEN: ${fen}, difficulty: ${difficulty}, movetime: ${movetime}`);
      
      if (!fen) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'FEN position required' }));
        return;
      }
      
      const settings = getDifficultySettings(difficulty);
      const actualMovetime = movetime || settings.movetime;
      
      console.log(`Using settings: skillLevel=${settings.skillLevel}, depth=${settings.depth}, movetime=${actualMovetime}`);
      
      const stockfish = spawn('stockfish');
      let bestmove = null;
      let evaluation = null;
      let depth = null;
      let timeout = null;
      let responseSent = false;

      // Set a timeout to prevent hanging
      const timeoutDuration = 20000;
      timeout = setTimeout(() => {
        if (!responseSent) {
          console.log('Request timed out, killing Stockfish process');
          stockfish.kill();
          responseSent = true;
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Request timed out' }));
        }
      }, timeoutDuration);

      stockfish.stdout.on('data', (data) => {
        const lines = data.toString().split('\n');
        lines.forEach(line => {
          const trimmedLine = line.trim();
          if (trimmedLine && !responseSent) {
            console.log(`Stockfish output: ${trimmedLine}`);
            
            // Parse evaluation info
            if (trimmedLine.startsWith('info') && trimmedLine.includes('score')) {
              const scoreMatch = trimmedLine.match(/score (cp|mate) (-?\d+)/);
              if (scoreMatch) {
                const scoreType = scoreMatch[1];
                const scoreValue = parseInt(scoreMatch[2]);
                if (scoreType === 'cp') {
                  evaluation = scoreValue;
                } else if (scoreType === 'mate') {
                  evaluation = scoreValue > 0 ? 10000 : -10000;
                }
              }
              
              const depthMatch = trimmedLine.match(/depth (\d+)/);
              if (depthMatch) {
                depth = parseInt(depthMatch[1]);
              }
            }
            
            // Parse best move
            if (trimmedLine.startsWith('bestmove')) {
              bestmove = trimmedLine.split(' ')[1];
              clearTimeout(timeout);
              stockfish.kill();
              console.log(`Best move found: ${bestmove}, evaluation: ${evaluation}, depth: ${depth}`);
              responseSent = true;
              
              // Return response in the format expected by the frontend
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({
                bestmove: bestmove,
                fen: fen,
                evaluation: evaluation || 0,
                difficulty: difficulty,
                depth: depth || settings.depth,
                skillLevel: settings.skillLevel
              }));
            }
          }
        });
      });

      stockfish.stderr.on('data', (data) => {
        console.log(`Stockfish error: ${data.toString()}`);
      });

      stockfish.on('error', (error) => {
        console.log(`Failed to start Stockfish: ${error.message}`);
        if (!responseSent) {
          clearTimeout(timeout);
          responseSent = true;
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Failed to start Stockfish' }));
        }
      });

      stockfish.on('close', (code) => {
        console.log(`Stockfish process exited with code ${code}`);
        if (!bestmove && !responseSent) {
          clearTimeout(timeout);
          responseSent = true;
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Stockfish process closed without providing a move' }));
        }
      });

      // Send commands to Stockfish with difficulty-specific settings
      stockfish.stdin.write('uci\n');
      stockfish.stdin.write('isready\n');
      stockfish.stdin.write(`setoption name Skill Level value ${settings.skillLevel}\n`);
      stockfish.stdin.write(`setoption name MultiPV value 1\n`);
      stockfish.stdin.write(`setoption name Threads value 1\n`);
      stockfish.stdin.write(`setoption name Hash value 32\n`);
      stockfish.stdin.write(`position fen ${fen}\n`);
      stockfish.stdin.write(`go movetime ${actualMovetime} depth ${settings.depth}\n`);
      
    } catch (error) {
      console.error('Server error:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Internal server error' }));
    }
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
  }
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Stockfish API running on port ${PORT}`);
});
EOF

# Create Dockerfile.chess-api
cat > Dockerfile.chess-api << 'EOF'
FROM node:18

# Install Stockfish chess engine
RUN apt-get update && \
    apt-get install -y stockfish curl && \
    rm -rf /var/lib/apt/lists/*

# Verify Stockfish installation
RUN stockfish --version || echo "Stockfish installed"

WORKDIR /app

# Copy server file
COPY simple-stockfish-api.js .

# Expose port
EXPOSE 3001

# Set environment variable
ENV PORT=3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:3001/api/stockfish || exit 1

# Start server
CMD ["node", "simple-stockfish-api.js"]
EOF

# Create docker-compose.chess-api.yml
cat > docker-compose.chess-api.yml << 'EOF'
version: '3.8'

services:
  chess-api:
    build:
      context: .
      dockerfile: Dockerfile.chess-api
    container_name: chess-stockfish-api
    ports:
      - "3001:3001"
    environment:
      - PORT=3001
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/api/stockfish"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
EOF

echo "✓ Files created"

# Step 4: Build and start Docker container
echo ""
echo "Step 4: Building and starting Docker container..."
docker compose -f docker-compose.chess-api.yml up -d --build

# Wait a moment for container to start
sleep 5

# Check if container is running
if docker ps | grep -q chess-stockfish-api; then
    echo "✓ Container is running"
    docker logs chess-stockfish-api | tail -5
else
    echo "✗ Container failed to start. Checking logs..."
    docker logs chess-stockfish-api
    exit 1
fi

# Step 5: Test the API
echo ""
echo "Step 5: Testing API..."
sleep 2
curl -s http://localhost:3001/api/stockfish && echo "" || echo "API test failed"

echo ""
echo "=========================================="
echo "DEPLOYMENT COMPLETE!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Configure Nginx to proxy chess.lawb.xyz to localhost:3001"
echo "2. Set up SSL certificate with Let's Encrypt"
echo ""
echo "To view logs: docker logs -f chess-stockfish-api"
echo "To restart: docker restart chess-stockfish-api"

