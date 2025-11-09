# How to Verify DigitalOcean Setup

Since I cannot directly access your DigitalOcean account, here's how we can verify everything is set up correctly:

## Option 1: Run the Verification Script (Easiest)

1. **SSH into your droplet:**
   ```bash
   ssh root@107.170.71.63
   # or if you have a user account:
   ssh your-username@107.170.71.63
   ```

2. **Upload and run the verification script:**
   ```bash
   # From your local machine, upload the script:
   scp verify-droplet.sh root@107.170.71.63:~/
   
   # Then SSH in and run it:
   ssh root@107.170.71.63
   chmod +x ~/verify-droplet.sh
   sudo ~/verify-droplet.sh
   ```

3. **Copy the output and share it with me** - I can analyze what's working and what needs to be fixed.

## Option 2: Manual Verification (Step by Step)

Run these commands on your droplet and share the output:

### 1. Check Docker
```bash
docker ps
docker logs chess-stockfish-api
```

### 2. Check Nginx
```bash
systemctl status nginx
cat /etc/nginx/sites-available/chess-api
sudo nginx -t
```

### 3. Check SSL
```bash
sudo certbot certificates
```

### 4. Test API Locally
```bash
curl http://localhost:3001/api/stockfish
curl -X POST http://localhost:3001/api/stockfish \
  -H "Content-Type: application/json" \
  -d '{"fen": "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", "movetime": 5000}'
```

### 5. Check DNS (from droplet)
```bash
dig chess.lawb.xyz
hostname -I  # Should match the IP in DNS
```

## Option 3: Share Screenshots/Output

You can also:
1. Take screenshots of your DigitalOcean dashboard
2. Copy/paste command outputs
3. Share any error messages you see

## What I Need to Know

Please check and tell me:

1. **Can you SSH into the droplet?** (Yes/No)
2. **Is Docker installed?** (`docker --version`)
3. **Is the container running?** (`docker ps`)
4. **Is Nginx running?** (`systemctl status nginx`)
5. **Does the API work locally?** (`curl http://localhost:3001/api/stockfish`)
6. **Is DNS configured?** (Check your domain registrar for `chess.lawb.xyz` A record)

Once I have this information, I can help you fix any issues!

