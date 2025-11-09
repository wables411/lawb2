# Quick Verification Guide

Since SSH access requires authentication, here are your options:

## Option 1: Use DigitalOcean Web Console

1. Go to https://cloud.digitalocean.com
2. Click on your droplet
3. Click "Access" → "Launch Droplet Console" (or "Web Console")
4. This opens a browser-based terminal - no SSH needed!

5. Once in the console, run:
   ```bash
   # Create the script file
   nano verify-droplet.sh
   # (Paste the contents of verify-droplet.sh, save with Ctrl+X, Y, Enter)
   
   # Or download it from GitHub:
   curl -o verify-droplet.sh https://raw.githubusercontent.com/wables411/lawb2/main/verify-droplet.sh
   
   # Make it executable and run:
   chmod +x verify-droplet.sh
   sudo ./verify-droplet.sh
   ```

## Option 2: Manual Quick Checks

In the DigitalOcean web console, run these commands and share the output:

```bash
# 1. Check Docker
docker ps
docker logs chess-stockfish-api --tail 20

# 2. Check Nginx
systemctl status nginx
cat /etc/nginx/sites-available/chess-api 2>/dev/null || echo "Config not found"

# 3. Test API locally
curl http://localhost:3001/api/stockfish

# 4. Check your IP
hostname -I
```

## Option 3: Set Up SSH Keys (for future)

If you want to use SSH from your local machine:

1. **Generate SSH key** (if you don't have one):
   ```bash
   ssh-keygen -t ed25519 -C "your_email@example.com"
   ```

2. **Copy public key to droplet**:
   - In DigitalOcean dashboard → Droplet → Settings → "Add SSH Key"
   - Or manually: `cat ~/.ssh/id_ed25519.pub` and add to droplet

3. **Then you can use**:
   ```bash
   scp verify-droplet.sh root@107.170.71.63:~/
   ssh root@107.170.71.63
   ```

## What to Share

After running the verification, please share:
1. Output of `docker ps`
2. Output of `curl http://localhost:3001/api/stockfish`
3. Output of `systemctl status nginx`
4. Any error messages you see

This will help me identify what's working and what needs to be fixed!

