# Stockfish API Deployment Guide for chess.lawb.xyz

This guide explains how to deploy the Stockfish API to `chess.lawb.xyz` subdomain using Docker.

## Overview

The Stockfish API is a Node.js server that spawns the Stockfish chess engine binary to calculate optimal moves. It should be deployed on the `chess.lawb.xyz` subdomain.

## Files

- `simple-stockfish-api.js` - Main Node.js server that runs Stockfish
- `Dockerfile.chess-api` - Docker configuration with Stockfish pre-installed
- `docker-compose.chess-api.yml` - Docker Compose configuration for easy deployment
- `chess-api-package.json` - Package configuration for the API server

## Prerequisites

1. **Docker and Docker Compose** installed on your server
   ```bash
   # On Ubuntu/Debian
   sudo apt-get update
   sudo apt-get install docker.io docker-compose
   sudo systemctl start docker
   sudo systemctl enable docker
   
   # Verify installation
   docker --version
   docker-compose --version
   ```

2. **Domain Configuration**: 
   - DNS A record for `chess.lawb.xyz` pointing to your server IP
   - Or CNAME record pointing to your hosting service

## Docker Deployment (Recommended)

1. **SSH into your server**:
   ```bash
   ssh user@your-server-ip
   ```

2. **Clone the repository or upload files**:
   ```bash
   mkdir -p ~/chess-api
   cd ~/chess-api
   # Upload these files:
   # - simple-stockfish-api.js
   # - Dockerfile.chess-api
   # - docker-compose.chess-api.yml
   ```

3. **Build and start the Docker container**:
   ```bash
   # Using Docker Compose (recommended)
   docker-compose -f docker-compose.chess-api.yml up -d
   
   # Or using Docker directly
   docker build -f Dockerfile.chess-api -t chess-api .
   docker run -d -p 3001:3001 --name chess-api --restart unless-stopped chess-api
   ```

4. **Verify the container is running**:
   ```bash
   docker ps
   docker logs chess-api
   ```

5. **Configure Nginx** (reverse proxy):
   ```nginx
   server {
       listen 80;
       server_name chess.lawb.xyz;

       location / {
           proxy_pass http://localhost:3001;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

6. **Set up SSL** (Let's Encrypt):
   ```bash
   sudo certbot --nginx -d chess.lawb.xyz
   ```

7. **Update Nginx config for HTTPS**:
   ```nginx
   server {
       listen 443 ssl;
       server_name chess.lawb.xyz;

       ssl_certificate /etc/letsencrypt/live/chess.lawb.xyz/fullchain.pem;
       ssl_certificate_key /etc/letsencrypt/live/chess.lawb.xyz/privkey.pem;

       location / {
           proxy_pass http://localhost:3001;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
           proxy_cache_bypass $http_upgrade;
       }
   }

   server {
       listen 80;
       server_name chess.lawb.xyz;
       return 301 https://$server_name$request_uri;
   }
   ```

8. **Reload Nginx**:
   ```bash
   sudo nginx -t
   sudo systemctl reload nginx
   ```

### Alternative: Railway/Render with Docker

1. **Create a new service** on Railway or Render

2. **Set environment variables**:
   - `PORT`: 3001 (or let the platform assign)

3. **Build command**: (none needed, just Node.js)

4. **Start command**: `node simple-stockfish-api.js`

5. **Note**: Railway/Render may not have Stockfish pre-installed. You may need to:
   - Use a custom Docker image with Stockfish
   - Or use a Stockfish npm package instead of binary

Railway and Render support Docker deployments. Simply:

1. **Connect your repository** to Railway/Render
2. **Set Dockerfile path**: `Dockerfile.chess-api`
3. **Set port**: `3001`
4. **Deploy!**

The Dockerfile already includes Stockfish installation, so no additional setup is needed.

## Testing

1. **Health check**:
   ```bash
   curl https://chess.lawb.xyz/api/stockfish
   ```

2. **Test move calculation**:
   ```bash
   curl -X POST https://chess.lawb.xyz/api/stockfish \
     -H "Content-Type: application/json" \
     -d '{"fen": "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", "movetime": 5000}'
   ```

## Configuration

The API accepts:
- `fen`: FEN position string (required)
- `movetime`: Time limit in milliseconds (optional, default: 12000)
- `difficulty`: Difficulty level (optional, default: 'play' - maximum strength)

Response format:
```json
{
  "bestmove": "e2e4",
  "fen": "...",
  "evaluation": 20,
  "depth": 25,
  "skillLevel": 20
}
```

## Frontend Integration

The frontend code in `src/components/ChessGame.tsx` is already configured to call:
```
https://chess.lawb.xyz/api/stockfish
```

No frontend changes needed once the API is deployed!

## Docker Commands

```bash
# View logs
docker logs chess-api
docker logs -f chess-api  # Follow logs

# Restart container
docker restart chess-api

# Stop container
docker stop chess-api

# Start container
docker start chess-api

# Remove container
docker stop chess-api
docker rm chess-api

# Rebuild after code changes
docker-compose -f docker-compose.chess-api.yml down
docker-compose -f docker-compose.chess-api.yml up -d --build
```

## Troubleshooting

1. **Stockfish not found**: The Dockerfile installs Stockfish automatically. If issues persist:
   ```bash
   docker exec chess-api stockfish --version
   ```

2. **Port conflicts**: Change the port mapping in docker-compose.yml or docker run command
   ```bash
   # Change from 3001:3001 to 3002:3001 if port 3001 is taken
   docker run -d -p 3002:3001 --name chess-api chess-api
   ```

3. **CORS issues**: CORS headers are already set in the server code

4. **Timeout errors**: Increase `timeoutDuration` in `simple-stockfish-api.js` if needed (currently 20000ms)

5. **Container won't start**: Check logs
   ```bash
   docker logs chess-api
   ```

6. **Permission issues**: If Docker commands require sudo, add your user to docker group:
   ```bash
   sudo usermod -aG docker $USER
   # Log out and back in for changes to take effect
   ```

## Security Notes

- The API currently allows CORS from all origins (`*`)
- Consider rate limiting for production
- Consider authentication if you want to restrict access

