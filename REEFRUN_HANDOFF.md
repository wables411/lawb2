# Reef Run — Session Handoff

> Paste the "Prompt for the new session" block below to continue. Full design + LOCKED
> decisions: `REEFRUN_ONCHAIN_SPEC.md`.

## State as of 2026-08-02 (ALL LIVE ON PROD, all pushed)
- **Every run on lawb.xyz/arcade is provable by default.** Deterministic fixed-timestep sim
  is the default (`?reefdet=0` = legacy opt-out); on game over the game submits
  `getRunProof()` (seed, characterId, inputLog, steps, survivalSec, maxActiveObstacles,
  walletAddress) to the validator. In-game parity cross-check logs `Parity OK` / mismatch.
- **Replay validator LIVE at https://reef.lawb.xyz** (droplet 157.245.86.242, systemd
  `reef-validator`, nginx vhost + certbot; fallback path https://chess.lawb.xyz/reef/).
  - `POST /validate` — replays the proof through the EXACT game sim; only reproducible
    scores are accepted (forged-score rejection verified live).
  - `GET /proofs` — last 100 accepted proofs incl. input logs (public transparency feed).
  - `GET /verified` — **credential-free per-wallet score store** (best survival, best/total
    points, runs; rebuilt from accepted.jsonl at boot). Same pattern as chess elo.json.
    NO Firebase key exists or is needed; `reef_verified` in RTDB is an optional mirror only
    (firebaseWrite.cjs no-ops without a key — don't chase the key, Netlify CLI can't read it).
- **Deploy loop:** edit `reef-validator/*` → `npm run validator:build` (bundle is COMMITTED)
  → commit+push → `ssh root@157.245.86.242 "curl -s https://raw.githubusercontent.com/wables411/lawb2/main/deploy-reef-validator.sh | bash"`.
  ⚠ The committed `_reefRunSim.cjs` bundle MUST be rebuilt whenever `reefRunSim.ts` changes,
  or the deployed validator rejects honest runs from the newer game.
- **Netlify:** `VITE_REEF_VALIDATOR_URL=https://reef.lawb.xyz` set; pushes auto-deploy.
- **Tests:** `npm run test:validator` (8) + `npm run test:reef` (17). Keep `npm run build` green.

## LOCKED decisions (owner, 2026-08-02 — do not re-litigate)
- Jackpot entry = **10,000 $CULT** (ETH mainnet `0x0000000000c5dc95539589fbD24BE07c6C14eCa4`).
- **Free play counts toward NOTHING** — no jackpot, no leaderboard stats, no points. Only paid
  runs score anywhere. (The current free-run point award in ReefArcadeMenu.onGameOver is
  therefore TEMPORARY — remove when the jackpot ships.)
- Winner metric = survival time only; pot −5% fee instant payout; 7-day stale reset
  (jackpot record only). See spec §7.

## Next tasks, in order
1. **Verified scores in the UI — DONE, committed 635e91d53 (unpushed, awaiting owner push).**
   `src/reefVerified.ts` reads `https://reef.lawb.xyz/verified` (one memoized fetch/session,
   zero Firebase reads); leaderboard rows show a green "✓ Verified reef best m:ss · N runs"
   badge (linked-wallet group resolution like the ELO badge) and the profile Reef Run stats
   show a "✓ Verified best" line. Local dev has no Firebase keys so rows don't populate
   there — final visual check happens on prod after the push.
2. **ReefRunJackpot contract** (spec §7): 10k $CULT entry, seed assigned at entry,
   `submitScore` takes a validator EIP-712 signature, pot −5% instant payout, 7-day
   `resetIfStale`. Reuse the chess escrow/UUPS/pause/small-caps patterns
   (LAWBCHESS_ONCHAIN_SPEC.md). Testnet first behind a flag. Validator gains a signing key
   for score attestations at that point (droplet env, like the chess relayer).

## OPEN BUG — long-run replay divergence (owner-reported 2026-08-03, TOP PRIORITY)
Owner's real 166s prod run logged `[ReefRun] PARITY MISMATCH: live=166.567s replay=62.767s
delta=103.800s` — the in-game self-check replayed the proof and died at ~63s. So the
validator would REJECT honest long runs; short runs (≤~19s) verified fine. Cause NOT yet
identified — do not guess; instrument. Leads to check (in order): (1) anything that changes
gameplay state mid-run in the controller but not in reefRunSim (difficulty/speed ramps,
depth tiers); (2) input-application timing — inputLog `[step,lane,w,s]` applied at a
different step in live vs replay; (3) duplicated spawn/cadence logic drift (memory warning:
ArcadeSceneController and reefRunSim must stay RNG-draw lockstep); (4) mid-run
lowPower/maxActiveObstacles change (set at boot L836, proof reports one value L482, replay
uses it L2715). Repro path: capture a real long-run proof (window/console) and replay it
headlessly through reefRunSim.

## FIXED 2026-08-03 (this session, all pushed):
- CSP `connect-src` never included reef.lawb.xyz → prod NEVER submitted proofs and the
  /verified feed was blocked (proven via securitypolicyviolation event). Fixed in _headers
  (322bd040d).
- netlify.toml build-ignore rule didn't watch `_headers`/`_redirects`, so the CSP fix
  deploy was silently canceled ("no content change"). Fixed (44b9c144f). Both verified
  live: lawb.xyz page can now fetch reef.lawb.xyz/verified.
- Note: the single verified wallet (0x9387bbf0…a090) has NO leaderboard row and NO
  wallet_links entry (checked RTDB REST) — test wallet. Badge appears once a leaderboard
  wallet gets a verified run (blocked on the parity bug for long runs).

## Guardrails
- Do NOT break live free-play; both modes must run (start → collide → game over) in browser.
- Browser pane can't composite when hidden → rAF frozen; the proven workaround is installing
  a `requestAnimationFrame` = setTimeout(16) shim on the desktop page, then SPA-routing into
  /arcade via pushState+popstate (see memory `reefrun-onchain`).
- No new Netlify functions for gameplay; off-app services live on the droplet.
- Static Netlify + Firebase reads are the cost drivers — never add per-frame/per-poll traffic.
- Stage explicit paths only (parallel sessions share the tree); push only per owner flow.

## Prompt for the new session
```
Continue Reef Run (lawb.xyz/arcade). Read REEFRUN_HANDOFF.md and REEFRUN_ONCHAIN_SPEC.md at
the lawb2 repo root first — current state, locked decisions, guardrails. Don't re-derive or
re-litigate anything locked there.

State: every run is provable by default and verified live at https://reef.lawb.xyz
(/validate, /proofs, /verified — credential-free). Jackpot LOCKED: 10,000 $CULT entry, free
play counts toward nothing.

Task 1: surface verified scores in the site UI — read https://reef.lawb.xyz/verified
(memoized one-shot fetch, like firebaseElo.ts reads elo.json) and show verified bests
(✓ badge) on the Lawb leaderboard + player profile. No new Firebase reads.

Task 2 (after owner sign-off on 1): start ReefRunJackpot per spec §7 — Foundry contract in
the chess patterns (escrow, EIP-712 validator-signed scores, UUPS+pause, small caps),
testnet first behind a flag.

Verify in-browser (rAF-shim workaround documented in the handoff), keep npm run build +
test:validator + test:reef green, commit working increments, push only per owner flow.
```
