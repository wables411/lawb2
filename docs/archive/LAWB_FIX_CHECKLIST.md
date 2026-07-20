# lawb.xyz — Fix Checklist (Stop the 3x/Week Suspensions)

This is the actionable list. Do these or it will keep breaking.

---

## What’s Already Done (in Code)

1. **Client-side NFT cache** — alchemy-nft and magiceden-nft responses cached 5 min. Fewer Netlify function calls when users browse.
2. **robots.txt** — Bots told not to hit `/api/` and `/.netlify/`. Helps with well-behaved crawlers.

---

## What You Must Do (External Setup)

### 1. Put Cloudflare in Front of lawb.xyz

**Why:** ~9.7M requests hit Netlify. Cloudflare caches static assets at the edge so most requests never reach Netlify.

**Steps:**

1. Sign up at [cloudflare.com](https://cloudflare.com) (free).
2. Add site: **Add site** → enter `lawb.xyz` → Free plan.
3. Cloudflare will scan DNS. Confirm it sees your records.
4. Change nameservers: At your domain registrar (where you bought lawb.xyz), replace the current nameservers with the two Cloudflare gives you (e.g. `ada.ns.cloudflare.com`, `bob.ns.cloudflare.com`).
5. Wait for propagation (up to 48h, often <1h).
6. In Cloudflare: **SSL/TLS** → set to **Full** (or Full (strict) if you have a valid cert).
7. **Caching** → **Configuration** → **Caching Level**: Standard.
8. **Caching** → **Cache Rules** (or Page Rules on older UI):
   - Rule 1: URL `lawb.xyz/assets/*` → Cache eligibility: Eligible for cache, Edge TTL: 1 year.
   - Rule 2: URL `lawb.xyz/world-assets/*` → Same.
   - Rule 3: URL `lawb.xyz/images/*` → Same.
   - Rule 4: URL `lawb.xyz/models/*` → Same.
9. **Security** → **Bots** → enable **Bot Fight Mode** (free).
10. **Security** → **WAF** → add **Rate limiting rule**: Path contains `/.netlify/functions` → 100 requests/minute per IP → Block.

**Verify:** `curl -I https://lawb.xyz/assets/something.js` — response should include `cf-cache-status: HIT` after first load.

---

### 2. Netlify — Buy Credits or Upgrade

**Why:** Free tier ≈ 3000 credits/month. 9.7M requests ≈ 2900 credits. One bad week can exhaust it.

**Options:**

- **Top-up:** Netlify → Team/Billing → buy extra credits ($10 ≈ 1500 credits).
- **Pro plan:** $19/mo, more credits and features.

---

### 3. Firebase — Raise Budget

**Why:** chess-220ee hit its $5 cap. Clawb + lawb.xyz both use it.

**Steps:**

1. Firebase Console → Project **chess-220ee** → Usage and billing.
2. Change budget from $5 to $25 or $50.
3. Set billing alerts at 50% and 90%.

---

### 4. Verify DNS

**chess.lawb.xyz** should point to your Stockfish server (DigitalOcean droplet), not to Netlify.

```bash
dig +short chess.lawb.xyz
```

- If you see `107.170.71.63` (or your droplet IP) → correct.
- If you see Netlify IPs → fix DNS so chess.lawb.xyz goes to the droplet.

---

## After You Deploy

1. **Deploy** — Push the code changes (cache + robots.txt) and let Netlify build.
2. **Check Cloudflare** — Confirm proxy is on (orange cloud) for lawb.xyz.
3. **Monitor** — Netlify → Usage; Firebase → Usage. Watch for spikes.

---

## If It Suspends Again

1. **Netlify support** — Ask why (bandwidth, functions, abuse) and request temporary restore while you fix.
2. **Netlify logs** — Site → Functions → Logs. See which paths/functions are hit most.
3. **Cloudflare Analytics** — See traffic and top paths. If Cloudflare isn’t caching, fix cache rules.

---

## Summary

| Action | Impact |
|--------|--------|
| Cloudflare in front + cache rules | 80–95% fewer requests to Netlify |
| Client-side NFT cache (done) | Fewer alchemy/magiceden function calls |
| robots.txt (done) | Less bot traffic to APIs |
| Netlify credits / Pro | Avoid suspension when traffic spikes |
| Firebase budget increase | Avoid Firebase cutoff |

Cloudflare in front is the main fix. The code changes help; they are not enough by themselves.
