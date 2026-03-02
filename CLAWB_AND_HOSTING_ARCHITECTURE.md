# Clawb vs Netlify vs Local — What Runs Where

## Summary

| Component | Where it runs | Hits Netlify? | Hits Firebase? |
|-----------|---------------|---------------|----------------|
| **Clawb backend** (`clawb/`) | Your Windows machine (pm2) | No | Yes |
| **OBS browser source** (world/chess) | Loads from `127.0.0.1:4173` (your .env) | **No** | Yes |
| **lawb.xyz** (main site) | Netlify | Yes (every request) | Yes |
| **chess.lawb.xyz** (Stockfish API) | DigitalOcean droplet | No | No |
| **Retake TV viewers** | Watch video on retake.tv | No | No |

---

## Clawb — 100% Local

Clawb runs on **your machine** in the `clawb/` folder. It is **not** on Netlify.

- **Process:** `pm2 start index.js --name clawb`
- **Connects to:** Firebase, OBS (WebSocket), Retake TV API, Stockfish (chess.lawb.xyz)
- **OBS browser source URL:** `http://127.0.0.1:4173/world?stream=1&cam=clawb` (from your .env)

**Clawb World is local/OBS-only** — not on the public lawb.xyz site. On lawb.xyz/world, visitors see “Watch on retake.tv/clawb”. The full 3D world runs only on localhost (OBS browser source). The emote wheel “Watch Stream” opens retake.tv on the public site, navigates to /world on localhost.

So the stream loads the world/chess page from **localhost** (npm run preview), not from lawb.xyz. Clawb’s stream does **not** generate Netlify traffic.

### Netlify build: world excluded (saves credits)

When building for Netlify (`VITE_EXCLUDE_WORLD=true` in netlify.toml):
- **No ClawbWorld bundle** — WorldRouteGuardNetlify stub (~0.6 kB vs ~99 kB)
- **No world-only assets** — `local-world-assets/`, `world-state-bedroom/workshop/vault.json` pruned
- **WorldBackground kept** — Desktop keeps `world-assets`, `models`, `world-state-main.json`

Local builds produce the full world for OBS/Clawb's machine.

---

## What Hits Netlify (9.7M requests)

Every request to **lawb.xyz** goes through Netlify:

1. **Static assets** — HTML, JS, CSS, images (every page load)
2. **Netlify functions** — when the frontend calls:
   - `/.netlify/functions/alchemy-nft` — NFT gallery, profiles, mint page
   - `/.netlify/functions/game-monitor` — chess game monitoring
   - `/.netlify/functions/game-monitor-simple` — chess monitoring
   - `/api/stockfish` on lawb.xyz — only if someone hits lawb.xyz/api/stockfish (chess uses chess.lawb.xyz)

**chess.lawb.xyz** points to DigitalOcean, so chess Stockfish calls do **not** hit Netlify.

---

## What Hits Firebase (chess-220ee, $5 budget)

- **Clawb:** world commands, chess game state, chat
- **lawb.xyz frontend:** chess games, leaderboard, chat, world presence, NFT gallery JSON, world state JSON
- **Retake TV viewers:** do not hit Firebase directly (they watch video)

Firebase usage comes from Clawb + lawb.xyz visitors, not from Retake viewers.

---

## Likely Cause of 9.7M Netlify Requests

**Web requests: 9,762,627 ≈ 2,928 credits** — this is almost all of your usage.

Possible sources:

1. **Bots / crawlers** — Google, Bing, scrapers, security scanners
2. **Normal traffic** — ~10–15k visits/day × 30–50 requests/visit ≈ 9–22M requests
3. **Aggressive polling** — if something is polling lawb.xyz or a function very frequently
4. **Misconfigured client** — e.g. a loop repeatedly fetching the same URL

Since chess and NFT gallery were quiet, the main suspects are bots or a smaller number of very active visitors.

---

## Recommendations

1. **Cloudflare in front of lawb.xyz** — cache static assets, add bot protection, rate limiting.
2. **Netlify Analytics / Logs** — check which paths get the most requests (e.g. `/`, `/chess`, `/world`, `/.netlify/functions/*`).
3. **Firebase budget** — raise the $5 cap or optimize reads (e.g. cache leaderboard, reduce realtime listeners).
4. **Netlify top-up** — $10 for 1500 credits to restore the site while you apply fixes.
