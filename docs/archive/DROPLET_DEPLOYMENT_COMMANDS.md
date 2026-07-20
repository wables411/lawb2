# Commands to Run on Your Droplet

Copy and paste these commands directly into your droplet terminal.

## Step 1: Deploy Stockfish API

Run this entire block on your droplet:

```bash
cd /root && \
mkdir -p chess-api && cd chess-api && \
cat > deploy.sh << 'SCRIPT_END'
#!/bin/bash
set -e
echo "=========================================="
echo "STOCKFISH API DEPLOYMENT"
echo "=========================================="
echo ""

# Install Docker
echo "Step 1: Installing Docker..."
if command -v docker &> /dev/null; then
    echo "✓ Docker already installed"
else
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
    echo "✓ Docker installed"
fi

# Install Docker Compose
echo ""
echo "Installing Docker Compose..."
apt-get update -qq
apt-get install -y docker-compose-plugin
echo "✓ Docker Compose installed"

# Create simple-stockfish-api.js
echo ""
echo "Step 2: Creating files..."
cat > simple-stockfish-api.js << 'EOF'
const http = require('http');
const { spawn } = require('child_process');
const url = require('url');

function getDifficultySettings(difficulty) {
  return {
    skillLevel: 20,
    depth: 25,
    movetime: 12000,
    description: 'Strong chess AI'
  };
}

function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      try { resolve(JSON.parse(body)); }
      catch (error) { reject(error); }
    });
  });
}

const server = http.createServer(async (req, res) => {
  setCorsHeaders(res);
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  const parsedUrl = url.parse(req.url, true);
  
  if (req.method === 'GET' && parsedUrl.pathname === '/api/stockfish') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'Stockfish API is running' }));
    return;
  }
  
  if (req.method === 'POST' && parsedUrl.pathname === '/api/stockfish') {
    try {
      const body = await parseJsonBody(req);
      const { fen, difficulty = 'play', movetime } = body;
      
      if (!fen) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'FEN position required' }));
        return;
      }
      
      const settings = getDifficultySettings(difficulty);
      const actualMovetime = movetime || settings.movetime;
      
      const stockfish = spawn('stockfish');
      let bestmove = null;
      let evaluation = null;
      let depth = null;
      let timeout = null;
      let responseSent = false;

      timeout = setTimeout(() => {
        if (!responseSent) {
          stockfish.kill();
          responseSent = true;
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Request timed out' }));
        }
      }, 20000);

      stockfish.stdout.on('data', (data) => {
        const lines = data.toString().split('\n');
        lines.forEach(line => {
          const trimmedLine = line.trim();
          if (trimmedLine && !responseSent) {
            if (trimmedLine.startsWith('info') && trimmedLine.includes('score')) {
              const scoreMatch = trimmedLine.match(/score (cp|mate) (-?\d+)/);
              if (scoreMatch) {
                const scoreType = scoreMatch[1];
                const scoreValue = parseInt(scoreMatch[2]);
                evaluation = scoreType === 'cp' ? scoreValue : (scoreValue > 0 ? 10000 : -10000);
              }
              const depthMatch = trimmedLine.match(/depth (\d+)/);
              if (depthMatch) depth = parseInt(depthMatch[1]);
            }
            
            if (trimmedLine.startsWith('bestmove')) {
              bestmove = trimmedLine.split(' ')[1];
              clearTimeout(timeout);
              stockfish.kill();
              responseSent = true;
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
        if (!responseSent) {
          clearTimeout(timeout);
          responseSent = true;
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Failed to start Stockfish' }));
        }
      });

      stockfish.on('close', (code) => {
        if (!bestmove && !responseSent) {
          clearTimeout(timeout);
          responseSent = true;
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Stockfish process closed without providing a move' }));
        }
      });

      stockfish.stdin.write('uci\n');
      stockfish.stdin.write('isready\n');
      stockfish.stdin.write(`setoption name Skill Level value ${settings.skillLevel}\n`);
      stockfish.stdin.write(`setoption name MultiPV value 1\n`);
      stockfish.stdin.write(`setoption name Threads value 1\n`);
      stockfish.stdin.write(`setoption name Hash value 32\n`);
      stockfish.stdin.write(`position fen ${fen}\n`);
      stockfish.stdin.write(`go movetime ${actualMovetime} depth ${settings.depth}\n`);
      
    } catch (error) {
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

# Create Dockerfile
cat > Dockerfile.chess-api << 'EOF'
FROM node:18
RUN apt-get update && \
    apt-get install -y stockfish curl && \
    rm -rf /var/lib/apt/lists/*
RUN stockfish --version || echo "Stockfish installed"
WORKDIR /app
COPY simple-stockfish-api.js .
EXPOSE 3001
ENV PORT=3001
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:3001/api/stockfish || exit 1
CMD ["node", "simple-stockfish-api.js"]
EOF

# Create docker-compose
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
EOF

echo "✓ Files created"

# Build and start
echo ""
echo "Step 3: Building and starting container..."
docker compose -f docker-compose.chess-api.yml up -d --build

sleep 5

if docker ps | grep -q chess-stockfish-api; then
    echo "✓ Container is running!"
    docker logs chess-stockfish-api | tail -3
    curl -s http://localhost:3001/api/stockfish && echo ""
else
    echo "✗ Container failed. Check logs: docker logs chess-stockfish-api"
    exit 1
fi

echo ""
echo "=========================================="
echo "DEPLOYMENT COMPLETE!"
echo "=========================================="
SCRIPT_END
chmod +x deploy.sh
./deploy.sh
```

## Step 2: Configure Nginx

After Step 1 completes successfully, run:

```bash
cat > /etc/nginx/sites-available/chess-api << 'EOF'
server {
    listen 80;
    server_name chess.lawb.xyz;
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF
ln -sf /etc/nginx/sites-available/chess-api /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
echo "✓ Nginx configured"
```

## Step 3: Set up SSL

```bash
apt-get install -y certbot python3-certbot-nginx
certbot --nginx -d chess.lawb.xyz
```

Follow the prompts (enter email, agree to terms, choose redirect HTTP to HTTPS).

## Verify Everything Works

```bash
# Test API directly
curl http://localhost:3001/api/stockfish

# Test through domain (after DNS propagates)
curl https://chess.lawb.xyz/api/stockfish

# Check container status
docker ps
docker logs chess-stockfish-api
```

