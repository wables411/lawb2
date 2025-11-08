# Deploying Stockfish API to DigitalOcean

This guide walks you through deploying the Stockfish API to a DigitalOcean Droplet.

## Prerequisites

- DigitalOcean account
- Domain `chess.lawb.xyz` (or subdomain) ready to point to your droplet

## Step 1: Create a DigitalOcean Droplet

1. **Log into DigitalOcean** and go to "Create" → "Droplets"

2. **Choose configuration**:
   - **Image**: Ubuntu 22.04 (LTS)
   - **Plan**: Basic plan, Regular Intel with SSD
   - **CPU**: 1 vCPU, 1GB RAM (minimum) - 2GB recommended for better performance
   - **Datacenter region**: Choose closest to your users
   - **Authentication**: SSH keys (recommended) or password

3. **Create the droplet** (takes ~1 minute)

4. **Note the IP address** - you'll need this for DNS configuration

## Step 2: Configure DNS

1. **Point `chess.lawb.xyz` to your droplet**:
   - Go to your domain registrar (where you manage `lawb.xyz`)
   - Add an **A record**:
     - **Name**: `chess` (or `api.chess` if you want `api.chess.lawb.xyz`)
     - **Type**: A
     - **Value**: Your droplet's IP address
     - **TTL**: 3600 (or default)

2. **Wait for DNS propagation** (5-60 minutes, usually faster)

## Step 3: SSH into Your Droplet

```bash
ssh root@YOUR_DROPLET_IP
# Or if you set up a user:
ssh your-username@YOUR_DROPLET_IP
```

## Step 4: Install Docker

```bash
# Update system
sudo apt-get update
sudo apt-get upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo apt-get install docker-compose-plugin -y

# Verify installation
docker --version
docker compose version

# Add your user to docker group (if not using root)
sudo usermod -aG docker $USER
# Log out and back in for this to take effect
```

## Step 5: Upload Files to Droplet

You have a few options:

### Option A: Clone from GitHub (if files are in repo)
```bash
# Install git if needed
sudo apt-get install git -y

# Clone your repo (or just the files you need)
git clone https://github.com/wables411/lawb2.git
cd lawb2
```

### Option B: Upload via SCP (from your local machine)
```bash
# From your local machine (in the lawb2 directory)
scp simple-stockfish-api.js root@YOUR_DROPLET_IP:/root/chess-api/
scp Dockerfile.chess-api root@YOUR_DROPLET_IP:/root/chess-api/
scp docker-compose.chess-api.yml root@YOUR_DROPLET_IP:/root/chess-api/
```

### Option C: Create files directly on server
```bash
mkdir -p ~/chess-api
cd ~/chess-api
nano simple-stockfish-api.js
# Paste the contents, save (Ctrl+X, Y, Enter)

nano Dockerfile.chess-api
# Paste the contents, save

nano docker-compose.chess-api.yml
# Paste the contents, save
```

## Step 6: Deploy with Docker

```bash
cd ~/chess-api  # Or wherever you put the files

# Build and start the container
docker compose -f docker-compose.chess-api.yml up -d

# Verify it's running
docker ps
docker logs chess-stockfish-api
```

You should see: `Stockfish API running on port 3001`

## Step 7: Configure Nginx (Reverse Proxy)

```bash
# Install Nginx
sudo apt-get install nginx -y

# Create Nginx config for chess.lawb.xyz
sudo nano /etc/nginx/sites-available/chess-api
```

Paste this configuration:

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

Save and enable:

```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/chess-api /etc/nginx/sites-enabled/

# Test Nginx config
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

## Step 8: Set Up SSL with Let's Encrypt

```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx -y

# Get SSL certificate
sudo certbot --nginx -d chess.lawb.xyz

# Follow the prompts:
# - Enter your email
# - Agree to terms
# - Choose whether to redirect HTTP to HTTPS (recommended: Yes)
```

Certbot will automatically update your Nginx config with SSL settings.

## Step 9: Test the API

```bash
# Health check
curl https://chess.lawb.xyz/api/stockfish

# Test move calculation
curl -X POST https://chess.lawb.xyz/api/stockfish \
  -H "Content-Type: application/json" \
  -d '{"fen": "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", "movetime": 5000}'
```

## Step 10: Set Up Auto-Restart (Optional but Recommended)

Docker Compose already has `restart: unless-stopped` in the config, but you can also:

```bash
# Enable Docker to start on boot
sudo systemctl enable docker

# Verify container restarts on reboot
sudo reboot
# After reboot, check:
docker ps
```

## Monitoring & Maintenance

### View logs
```bash
docker logs chess-stockfish-api
docker logs -f chess-stockfish-api  # Follow logs
```

### Restart container
```bash
docker restart chess-stockfish-api
```

### Update after code changes
```bash
cd ~/chess-api
# Update files (git pull, or upload new versions)
docker compose -f docker-compose.chess-api.yml down
docker compose -f docker-compose.chess-api.yml up -d --build
```

### Check resource usage
```bash
docker stats chess-stockfish-api
```

## Cost Estimate

- **Droplet**: $6-12/month (1-2GB RAM)
- **Domain**: Already have `lawb.xyz`
- **Total**: ~$6-12/month

## Troubleshooting

### Container won't start
```bash
docker logs chess-stockfish-api
```

### Port already in use
```bash
# Check what's using port 3001
sudo lsof -i :3001
# Or change port in docker-compose.yml
```

### Nginx 502 Bad Gateway
- Check if container is running: `docker ps`
- Check container logs: `docker logs chess-stockfish-api`
- Verify Nginx proxy_pass points to correct port

### DNS not resolving
- Wait longer (can take up to 24 hours, usually much faster)
- Check DNS: `dig chess.lawb.xyz` or `nslookup chess.lawb.xyz`

### SSL certificate issues
```bash
# Renew certificate manually
sudo certbot renew

# Check certificate status
sudo certbot certificates
```

## Security Recommendations

1. **Set up firewall**:
   ```bash
   sudo ufw allow 22/tcp    # SSH
   sudo ufw allow 80/tcp    # HTTP
   sudo ufw allow 443/tcp   # HTTPS
   sudo ufw enable
   ```

2. **Disable root login** (create a user account):
   ```bash
   adduser yourusername
   usermod -aG sudo yourusername
   # Then use that user instead of root
   ```

3. **Keep system updated**:
   ```bash
   sudo apt-get update && sudo apt-get upgrade -y
   ```

That's it! Your Stockfish API should now be running at `https://chess.lawb.xyz/api/stockfish`

