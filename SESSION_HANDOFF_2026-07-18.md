# lawb2 Session Handoff — 2026-07-18

Everything below is **DONE, committed, pushed to `origin/main`, and live on lawb.xyz** unless marked TODO.
Last deployed commit at handoff: `9c256dda5` (frontend) + Firebase rules released separately (see §4).

## 1. Backlog flushed to production
The repo had ~19 commits that had never been pushed (all chess Phase 4 + all Reef Run work).
All pushed and deployed this session. Live free-play / live site behavior preserved; the on-chain
chess UI stays behind the `VITE_ONCHAIN_CHESS` flag (default OFF).

## 2. Removed end to end (user order — commercials dead on retake.tv/clawb)
- **Clawb TV sponsor/auction system**: 13 `sponsor-*` Netlify functions, their `/api/sponsor/*`
  redirects, `SponsorAdPanel`, all "Advertise on Clawb TV" entry points (desktop + mobile).
- **CLAWB claim**: `clawb-claim-*` functions, `ClawbClaimPanel`, the "restitution note" buttons,
  the merkle claims artifact, `submitClaimRequest`, and the `clawb/ads` + `claims` Firebase rule nodes.
- The Clawb TV **stream button + chat** (clawb/status, clawb/chat) were KEPT.

## 3. Bandwidth / cost pass (user has a hard "$50/day spike" constraint — see memory)
- `public/assets` 385MB → ~90MB. GIFs → animated WebP, videos re-encoded h264, 52MB chess-bg
  PNG → 1MB WebP. Homepage per-visitor payload ~90MB → ~15MB.
- Deleted ~178MB of unreferenced assets (incl. a 140MB mp4).
- Firebase idle-read drips gated on `document.hidden` (ChessSpectator 10s poll, ChessMultiplayer
  2s/5s in-game polls). Deleted dead unbounded root listeners (`subscribeToAllGames`,
  `subscribeToLeaderboard`, `getLeaderboard`, `RetakeLiveBadge`) — a warning comment marks the spot.
- **Still oversized (TODO):** `public/arcade-assets/radbro*.fbx` (~100MB total, 3 files embedding
  large PNGs). Only downloads when a player picks radbro, and is immutable-cached, so low urgency.
  A background task chip exists to slim these via Blender (Blender 5 is installed). milady/lawb FBX
  are already small (~3MB).

## 4. Leaderboard/profile integrity — wallet-signature auth lock (DONE & VERIFIED)
The old hole: `database.rules.json` had `.write: true` on `leaderboard/$wallet` etc., so anyone
could write any score into any wallet's entry (or with no auth). Closed:
- `functions/wallet-auth.js`: verifies an EVM (ethers) / Solana (tweetnacl ed25519) signature over a
  fresh login message → mints a Firebase **custom token** with `uid = wallet path key`.
- `src/firebaseWalletAuth.ts` + `WalletConnectLeaderboardSync.tsx`: on wallet connect, sign ONCE →
  `signInWithCustomToken`; session persists. EVM signs via wagmi `useSignMessage`; Solana via the
  AppKit provider. Solana keys auth on a **second Firebase app instance** (`getFirebaseAppForKey` /
  `getFirebaseDatabaseForKey` in `firebaseApp.ts`) so EVM + Solana can both be signed in at once.
- `database.rules.json`: writes to `leaderboard` / `profiles` / `usernames` / `wallet_links` now
  require `auth.uid === entry key`. **Deployed** via `npx firebase deploy --only database --project chess-220ee`.
- Chess now records **each player's own result** on game end (`updateBothPlayersScores` deleted — one
  client could previously write/forge the opponent's stats).
- **Verified on prod, 6/6:** `npx tsx scripts/dbAuthE2E.mts` mints EVM+Solana tokens and asserts
  own-entry write = 200, spoof-other-wallet = 401, no-auth = 401, spoof-profile = 401.

### Landmines encoded (so you don't re-learn them)
- **Netlify does NOT auto-install a function's own `package.json` deps.** wallet-auth's deps
  (`ethers`, `firebase-admin`, `tweetnacl`) live in the **root** `package.json`; `functions/package.json`
  was deleted. If you add a new function dependency, put it in root package.json.
- **`/api/*` → function redirects do NOT resolve on this site.** Every function call in the app uses
  the direct `/.netlify/functions/<name>` path. Follow that convention; don't use `/api/...`.
- **Deploy order for the auth lock:** frontend + function must be live BEFORE the locked rules, or
  authed users can't write. (Already done; only relevant if rules are ever re-derived.)
- Netlify `NODE_VERSION` is now `20` (was 18/EOL).
- To read a failed Netlify build's real error, the API/CLI log endpoints 404; the log is in the
  Netlify UI (app.netlify.com → site → the failed deploy). Ask the user to paste it.

## 5. Mobile UI
- Added **Miladychan** icon + popup to the mobile grid (was desktop-only).
- Fixed the mobile **Applications menu** covering the taskbar: `position: fixed` above the bar,
  tap-anywhere backdrop, explicit ✕ close on mobile. Folded the orphaned link list
  (GeckoTerminal/NFTX/Purity/UwU LAWB/Discord/Lawb.Shop) into the shared Applications menu and
  deleted the dead mobile bottom-sheet menu.
- Also: tokens popup restructured to `$LAWB / Clawb / FAQ` tabs; dev-server dayjs prebundle fix.

## 6. What's next (TODO)
- **Reef Run Phase 2** = the referee. The integrity story is only half done: the auth lock stops you
  writing SOMEONE ELSE's score, but a wallet can still inflate its OWN Reef Run score until an
  off-app validator replays `(seed, inputLog)` and becomes the only writer. The pure replay core
  (`src/pages/arcade/reefRunSim.ts`, headless tests `npm run test:reef`) is built; the validator/signer
  service + the `ReefRunJackpot` contract are not. See `REEFRUN_ONCHAIN_SPEC.md` / `REEFRUN_HANDOFF.md`.
- **radbro FBX slimming** (§3).
- **onchain-chess/** Foundry repo still has NO git remote (single-machine risk) — back it up.
- LawbChess on-chain: paused, feature-complete behind flag, mainnet deploy runbook ready
  (`onchain-chess/`), awaiting user's deploy. See `LAWBCHESS_HANDOFF.md`.

## Verify commands
- `npm run build` (tsc && vite) — must stay green.
- `npm run test:reef` — Reef Run sim (17 tests).
- `npx tsx scripts/dbAuthE2E.mts` — live auth-lock proof (expects 6/6).
