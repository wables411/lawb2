# Infrastructure Verification Checklist

## What I CANNOT Verify (Needs Manual Check)

I cannot access:
- Netlify dashboard
- DigitalOcean dashboard
- DNS records
- Server SSH access
- Firebase Console

## What I CAN Verify from Code

### ✅ Netlify Configuration (from `netlify.toml`)
- Build command: `npm run build` ✓
- Publish directory: `dist` ✓
- Functions directory: `functions` ✓
- Redirects configured ✓

### ❓ DigitalOcean Configuration (from code)
- **Cannot verify** - No way to check if:
  - Droplet exists at `107.170.71.63`
  - Docker container is running
  - Nginx is configured
  - SSL certificate is active

### ❓ DNS Configuration
- **Cannot verify** - No way to check if:
  - `chess.lawb.xyz` A record exists
  - DNS points to correct IP
  - DNS has propagated

## Manual Verification Steps

### 1. Netlify Verification

**Check Netlify Dashboard:**
1. Go to https://app.netlify.com
2. Find site for `lawb.xyz`
3. Verify:
   - [ ] Site is connected to GitHub repo `wables411/lawb2`
   - [ ] Branch: `main`
   - [ ] Build command: `npm run build`
   - [ ] Publish directory: `dist`
   - [ ] Custom domain: `lawb.xyz` is configured
   - [ ] SSL certificate is active (HTTPS enabled)
   - [ ] Latest deploy is successful

**Check Environment Variables:**
- [ ] Go to Site settings → Environment variables
- [ ] Verify Firebase variables are set (if using env vars):
  - `VITE_FIREBASE_API_KEY`
  - `VITE_FIREBASE_AUTH_DOMAIN`
  - `VITE_FIREBASE_DATABASE_URL`
  - `VITE_FIREBASE_PROJECT_ID`
  - etc.

**Test Netlify Functions:**
```bash
# Test game-monitor-simple function
curl https://lawb.xyz/.netlify/functions/game-monitor-simple

# Test stockfish function (should return placeholder)
curl -X POST https://lawb.xyz/.netlify/functions/stockfish \
  -H "Content-Type: application/json" \
  -d '{"fen": "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"}'
```

### 2. DigitalOcean Verification

**Check DigitalOcean Dashboard:**
1. Go to https://cloud.digitalocean.com
2. Find droplet at IP `107.170.71.63`
3. Verify:
   - [ ] Droplet exists and is running
   - [ ] Status: "Active"
   - [ ] IP address matches: `107.170.71.63`

**SSH into Droplet:**
```bash
ssh root@107.170.71.63
# or
ssh your-username@107.170.71.63
```

**Check Docker:**
```bash
# Check if Docker is installed
docker --version

# Check if container is running
docker ps

# Should see: chess-stockfish-api container
# Check logs
docker logs chess-stockfish-api
```

**Check Nginx:**
```bash
# Check if Nginx is running
systemctl status nginx

# Check Nginx config
cat /etc/nginx/sites-available/chess-api
# or
cat /etc/nginx/sites-enabled/chess-api

# Test Nginx config
sudo nginx -t

# Check if SSL certificate exists
sudo certbot certificates
```

**Test API Locally on Droplet:**
```bash
# Test API on localhost
curl http://localhost:3001/api/stockfish

# Test with a move request
curl -X POST http://localhost:3001/api/stockfish \
  -H "Content-Type: application/json" \
  -d '{"fen": "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", "movetime": 5000}'
```

### 3. DNS Verification

**Check DNS Records:**
1. Go to your domain registrar (where you manage `lawb.xyz`)
2. Check DNS records:
   - [ ] `lawb.xyz` → Netlify (CNAME or A record)
   - [ ] `chess.lawb.xyz` → `107.170.71.63` (A record)

**Test DNS Resolution:**
```bash
# From your local machine
dig chess.lawb.xyz
# Should show: 107.170.71.63

# Or
nslookup chess.lawb.xyz
# Should show: 107.170.71.63

# Or
host chess.lawb.xyz
# Should show: 107.170.71.63
```

**Test API from Browser/curl:**
```bash
# Health check
curl https://chess.lawb.xyz/api/stockfish

# Test move calculation
curl -X POST https://chess.lawb.xyz/api/stockfish \
  -H "Content-Type: application/json" \
  -d '{"fen": "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", "movetime": 5000}'
```

### 4. Firebase Verification

**Check Firebase Console:**
1. Go to https://console.firebase.google.com
2. Select project: `chess-220ee`
3. Verify:
   - [ ] Realtime Database is enabled
   - [ ] Database URL: `https://chess-220ee-default-rtdb.firebaseio.com`
   - [ ] Authentication → Authorized domains includes: `lawb.xyz`
   - [ ] Database rules are configured

**Test Firebase Connection:**
- Open browser console on `lawb.xyz/chess`
- Look for: `[FIREBASE] Initialized successfully`
- Try loading leaderboard/chat - should work

## Quick Test Script

Run this from your local machine to test everything:

```bash
#!/bin/bash

echo "=== Testing Netlify ==="
echo "Testing main site..."
curl -I https://lawb.xyz | head -1

echo "Testing Netlify function..."
curl https://lawb.xyz/.netlify/functions/game-monitor-simple | head -20

echo ""
echo "=== Testing DNS ==="
echo "Checking chess.lawb.xyz DNS..."
dig +short chess.lawb.xyz

echo ""
echo "=== Testing DigitalOcean API ==="
echo "Testing chess.lawb.xyz API..."
curl -I https://chess.lawb.xyz/api/stockfish 2>&1 | head -5

echo ""
echo "=== Testing Firebase ==="
echo "Open https://lawb.xyz/chess in browser and check console for [FIREBASE] logs"
```

## Common Issues

### Issue: `chess.lawb.xyz` returns `ERR_NAME_NOT_RESOLVED`
**Solution:**
- DNS A record not configured
- DNS not propagated (wait 5-60 minutes)
- Wrong IP address in DNS record

### Issue: `chess.lawb.xyz` returns 502 Bad Gateway
**Solution:**
- Docker container not running
- Nginx not configured correctly
- Port 3001 not accessible

### Issue: `chess.lawb.xyz` returns connection timeout
**Solution:**
- Droplet firewall blocking port 443
- Nginx not running
- SSL certificate not configured

### Issue: Netlify site not updating
**Solution:**
- Check GitHub connection
- Check build logs in Netlify dashboard
- Verify branch is `main`

## What to Report Back

Please check and report:
1. **Netlify**: Is the site deployed and accessible at `lawb.xyz`?
2. **DigitalOcean**: Can you SSH into the droplet? Is Docker running?
3. **DNS**: Does `dig chess.lawb.xyz` return `107.170.71.63`?
4. **API**: Does `curl https://chess.lawb.xyz/api/stockfish` work?
5. **Firebase**: Does the leaderboard/chat work on `lawb.xyz/chess`?

