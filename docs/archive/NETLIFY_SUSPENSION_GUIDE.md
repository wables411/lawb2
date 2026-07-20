# Netlify Suspension & Credit Limit — Diagnosis & Fix

## 1. Info Needed to Diagnose

**From Netlify Dashboard:**

1. **Site → Analytics → Usage** (or **Team → Billing → Account usage**)
   - Bandwidth (GB)
   - Function invocations (count)
   - Build minutes
   - Which metric hit the limit?

2. **Site → Functions → Logs**
   - Which functions are most invoked?
   - `alchemy-nft`, `game-monitor`, `game-monitor-simple`, `stockfish`?

3. **Site → Observability** (Pro plan — last 7 days)
   - Top endpoints by request count
   - Any spikes or unusual patterns?

4. **Suspension email from Netlify**
   - Exact reason (bandwidth, functions, abuse, ToS)
   - Timestamp of suspension

5. **DNS**
   - Does `chess.lawb.xyz` point to Netlify or to DigitalOcean?
   - If `chess.lawb.xyz` → Netlify, chess API calls are also hitting your Netlify functions.

---

## 2. Netlify Pro vs Enterprise

| Feature | Pro | Enterprise |
|--------|-----|------------|
| **WAF** | ❌ No | ✅ Yes |
| **Rate limiting (UI)** | ❌ No | ✅ Yes |
| **Rate limiting (code)** | ✅ Yes | ✅ Yes |
| **Firewall Traffic Rules** | ❌ No | ✅ Yes |

**Netlify Pro does not include WAF or UI-based rate limiting.** Those are Enterprise-only.

**What you CAN do on Pro:**
- Add rate limiting in your function code (e.g. in-memory or Redis-backed limits)
- Put Cloudflare in front (free WAF + rate limiting)
- Reduce function invocations

---

## 3. Likely Culprits (High Invocations)

| Function | When called | Risk |
|----------|-------------|------|
| **alchemy-nft** | Profile load, NFT gallery, mint page | **HIGH** — every profile/NFT browse |
| **game-monitor** | Chess spectator polling | **HIGH** — if Retake TV stream has many viewers |
| **game-monitor-simple** | Chess game monitoring | **MEDIUM** |
| **stockfish** | Hard-mode chess moves | **LOW** — if chess.lawb.xyz points to DigitalOcean |

**Client-side polling that multiplies traffic:**
- `ChessSpectator`: polls for vs_clawb games
- `ChessMultiplayer`: leaderboard every 30s, open games every 60s
- `ClawbWorld`: leaderboard every 30s
- `MintPopup`: NFT polling after mint

---

## 4. Mitigations

### A. Cloudflare (free tier)

If lawb.xyz goes through Cloudflare:

1. **Security → WAF** — enable managed rules
2. **Security → Bots** — enable Bot Fight Mode
3. **Rate limiting** — create a rule like:
   - Path: `/api/*` or `/.netlify/functions/*`
   - Rate: 100 req/min per IP
   - Action: Block

### B. Reduce Netlify function invocations

1. **alchemy-nft**
   - Add client-side caching (e.g. cache NFT data for 5–10 min)
   - Call Alchemy from the client directly (with CORS) if possible, bypassing Netlify
   - Or proxy via a cheap external service (e.g. Vercel Edge)

2. **game-monitor / game-monitor-simple**
   - Increase chess spectator poll interval (e.g. 60s → 120s)
   - Use Firebase or WebSocket instead of polling Netlify

3. **Remove or disable unused functions**
   - `stockfish` on Netlify: if chess uses `chess.lawb.xyz` (DigitalOcean), remove the Netlify redirect for `/api/stockfish` (or keep it as a no-op if chess subdomain is on Netlify)

### C. Netlify cache headers

Add to `netlify.toml`:

```toml
[[headers]]
  for = "/assets/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "SAMEORIGIN"
```

### D. Clear Netlify cache

- **Site → Deploys → Trigger deploy** → check "Clear cache and deploy site"
- Or: **Site settings → Build & deploy → Post processing → Clear cache**

### E. Move heavy functions off Netlify

- **alchemy-nft** → Vercel Edge Function, Cloudflare Worker, or direct client call
- **game-monitor** → Firebase Cloud Function or a small server

---

## 5. Immediate Actions

1. **Check Netlify usage** — Site → Functions → Usage
2. **Clear cache** — Deploy with "Clear cache" checked
3. **Add Cloudflare** — if not already, put Cloudflare in front of lawb.xyz
4. **Throttle** — increase `ChessSpectator` and `ClawbWorld` leaderboard poll intervals
5. **Contact Netlify** — ask for suspension reason and whether they can restore the site while you apply fixes

---

## 6. Netlify Support

- **Help** → [support.netlify.com](https://support.netlify.com)
- **Community** → [answers.netlify.com](https://answers.netlify.com)
- **Status** → [status.netlify.com](https://status.netlify.com)

Share the suspension email and usage screenshots with support for a faster resolution.
