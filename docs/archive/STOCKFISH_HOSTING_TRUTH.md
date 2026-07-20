# Stockfish Hosting — What Actually Exists

## TL;DR — The Confusion

The codebase has **three different Stockfish setups** documented. Only one is wired into the app. Here's what exists and what the app actually uses.

---

## 1. DigitalOcean Droplet (Primary, Intended)

**What:** Node.js server spawning Stockfish binary, in Docker, behind nginx.

**Where:** `chess.lawb.xyz` → A record → `107.170.71.63` (DigitalOcean droplet)

**Files:** `simple-stockfish-api.js`, `Dockerfile.chess-api`, `docker-compose.chess-api.yml`, `deploy-to-droplet.sh`, `setup-nginx.sh`, `verify-droplet.sh`

**Used by:** 
- `ChessGame.tsx` — hardcodes `https://chess.lawb.xyz/api/stockfish`
- `clawb/chess-pvp-agent.js` — `STOCKFISH_API_URL` defaults to `https://chess.lawb.xyz/api/stockfish`

**Docs:** AGENTS.md, architecture.md, CLAWB_AND_HOSTING_ARCHITECTURE.md, NS1_DNS_SETUP.md

---

## 2. Cloudflare Workers (Alternative, Not Wired In)

**What:** Stockfish WASM running in a Cloudflare Worker.

**Where:** `https://lawb-chess-api.wablesphoto.workers.dev`

**Files:** `src/stockfish-worker.js`, README.md

**Used by:** Nothing. The frontend never calls this URL.

**Docs:** README.md says "Stockfish chess engine API deployed on Cloudflare Workers" and "API endpoint: https://lawb-chess-api.wablesphoto.workers.dev"

---

## 3. Netlify Function (Stub, Returns Null)

**What:** Netlify serverless function that returns `move: null` with a note to use the worker.

**Where:** `lawb.xyz/api/stockfish` → `/.netlify/functions/stockfish`

**Files:** `functions/stockfish.js`, `netlify.toml`

**Used by:** Only if someone hits `lawb.xyz/api/stockfish`. Chess uses `chess.lawb.xyz`, so this path is not used for chess.

---

## What the App Actually Uses

| Caller | URL | Intended Backend |
|--------|-----|------------------|
| ChessGame.tsx (hard mode) | `https://chess.lawb.xyz/api/stockfish` | DigitalOcean droplet |
| Clawb PVP agent | `https://chess.lawb.xyz/api/stockfish` | DigitalOcean droplet |

---

## How to Verify (Run These)

```bash
# 1. Where does chess.lawb.xyz resolve?
dig +short chess.lawb.xyz

# 2. Does the API respond?
curl -s https://chess.lawb.xyz/api/stockfish

# 3. POST a move request
curl -X POST https://chess.lawb.xyz/api/stockfish \
  -H "Content-Type: application/json" \
  -d '{"fen":"rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1","movetime":2000}'
```

**Interpretation:**
- If `dig` returns `107.170.71.63` → chess.lawb.xyz points to DigitalOcean
- If `dig` returns Cloudflare IPs (e.g. 104.x, 172.x) → chess.lawb.xyz may be proxied through Cloudflare or point to Workers
- If `curl` returns `{"status":"Stockfish API is running"}` → DigitalOcean droplet is serving
- If `curl` returns `{"move":null,"note":"Use worker..."}` → you're hitting Netlify (wrong DNS)
- If `curl` returns a different JSON with `bestmove` → you're hitting something that works

---

## Cloudflare vs DigitalOcean — Clarification

- **Cloudflare** can be DNS + CDN. If chess.lawb.xyz uses Cloudflare as DNS (orange cloud), traffic goes: User → Cloudflare edge → origin. The origin is still the DigitalOcean droplet. Stockfish runs on the droplet.
- **Cloudflare Workers** = serverless compute. The `lawb-chess-api.wablesphoto.workers.dev` Worker runs Stockfish WASM. The app does not call this.

So "Stockfish on Cloudflare" could mean:
1. **Proxied through Cloudflare** — DNS/CDN in front of DigitalOcean (Stockfish still on DO)
2. **On Cloudflare Workers** — lawb-chess-api.wablesphoto.workers.dev (not used by the app)

---

## Recommendation

1. Run the verification commands above and note the results.
2. If chess is working, whatever DNS resolves to is the right backend. If it's `107.170.71.63`, it's DigitalOcean.
3. Update AGENTS.md and README to match reality once you confirm.
4. If you prefer Cloudflare Workers, change `ChessGame.tsx` and `clawb/.env` to use `https://lawb-chess-api.wablesphoto.workers.dev` and point chess.lawb.xyz to that Worker.
