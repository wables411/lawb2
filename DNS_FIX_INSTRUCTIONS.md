# DNS Configuration Fix for chess.lawb.xyz

## Current Status

✅ **Server is PERFECTLY configured!**
- Docker container running
- Nginx configured
- SSL certificate active
- API working on localhost

❌ **Only issue: DNS not configured**

## What You Need to Do

### Step 1: Add DNS A Record

Go to your domain registrar (where you manage `lawb.xyz`) and add:

**Record Type:** A  
**Name/Host:** `chess`  
**Value/IP:** `107.170.71.63`  
**TTL:** 3600 (or default)

This will make `chess.lawb.xyz` point to your DigitalOcean droplet.

### Step 2: Wait for DNS Propagation

DNS changes can take:
- **Minimum:** 5-15 minutes
- **Average:** 30-60 minutes  
- **Maximum:** 24-48 hours (rare)

### Step 3: Verify DNS is Working

After adding the record, wait a few minutes, then test:

```bash
# From your local machine:
dig chess.lawb.xyz
# Should show: 107.170.71.63

# Or test the API:
curl https://chess.lawb.xyz/api/stockfish
# Should return: {"status":"Stockfish API is running"}
```

## Where to Add DNS Record

Common domain registrars:
- **Namecheap:** Domain List → Manage → Advanced DNS → Add A Record
- **GoDaddy:** DNS Management → Add Record → A
- **Google Domains:** DNS → Custom records → Add A record
- **Cloudflare:** DNS → Add record → Type A, Name: chess, Content: 107.170.71.63
- **Netlify DNS:** If using Netlify DNS, go to Domain settings → DNS → Add A record

## Once DNS is Configured

After DNS propagates, test from your browser:

1. **Health check:**
   ```
   https://chess.lawb.xyz/api/stockfish
   ```
   Should return: `{"status":"Stockfish API is running"}`

2. **Test move calculation:**
   ```bash
   curl -X POST https://chess.lawb.xyz/api/stockfish \
     -H "Content-Type: application/json" \
     -d '{"fen": "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", "movetime": 5000}'
   ```

3. **Test from the app:**
   - Go to `lawb.xyz/chess`
   - Start a hard mode game
   - Should work without DNS errors!

## Summary

**Everything on the server is perfect!** You just need to:
1. Add the DNS A record: `chess.lawb.xyz` → `107.170.71.63`
2. Wait for propagation (usually 15-60 minutes)
3. Test and enjoy! 🎉

