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
2. **ReefRunJackpot contract — WRITTEN + TESTED (2026-08-06), commit a1ad456 in
   `onchain-chess/` (local, unpushed).** `src/ReefRunJackpot.sol` (7.4KB, UUPS/pause/
   reentrancy/fee-pot separation), 18 tests green (57 total suite), `script/DeployJackpot.s.sol`
   (env: ENTRY_TOKEN, SCORE_SIGNER; ENTRY_AMOUNT defaults 10k e18, owner-settable for
   small-caps launch). Design per locked spec §7 + open `fundPot()` for sponsors/future
   Uniswap-v4 fee hooks. EIP-712: domain "ReefRunJackpot"/"1",
   `Score(address player,uint64 entryNonce,uint32 seed,uint64 survivalMs,uint256 deadline)`.
   Remaining to ship, in order:
   a. Droplet: validator gains the signing key + a `/sign-score` step — after replay
      validation AND reading the player's on-chain `pendingEntry` (seed must match), sign
      the Score struct. Key in droplet env like the chess relayer.
   b. Testnet deploy (Base Sepolia like chess; mock CULT + throwaway signer from .env).
   c. Frontend behind a flag: approve+`enter()` → run with assigned seed (the game already
      supports injected seeds via `setDeterministicRun(seed)`) → `submitScore` → jackpot
      board UI. On ship: remove the free-run point award (locked decision).
   d. Mainnet: ETH ($CULT), start with low ENTRY_AMOUNT, raise to 10k as confidence grows.

## FIXED 2026-08-06 — long-run replay divergence (was TOP PRIORITY) + proof off-by-one
Root causes found by instrumentation (per-step live-vs-replay fingerprint trace), both in
`ArcadeSceneController.ts`, both fixed, both verified live against the prod validator.
**Committed locally — NOT pushed (awaiting owner instruction).**

1. **Retry stale-step offset (the owner's 166s→63s parity mismatch).** `applyScreen('play')`
   sets `screen='play'` synchronously, then `enterPlay()` awaits the swimmer-model load. On a
   RETRY, the fixed-step loop kept running during that await with the PREVIOUS run's
   simState: `simStep` advanced and `inputLog` recorded against the stale sim before
   `createSimState` built the new one. Every proof input was then offset by the load
   duration, so the replay applied all dodges late and died at the first tight dodge.
   Dose–response reproduced exactly: shifting a captured 100.2s proof's inputs by K steps
   kills the replay at 94s (K=30), 72s (K=60), **62.4s (K=120 ≈ 2s load)** — the owner saw
   62.767s. First-run-of-session and cached loads have tiny/no gap → short runs "verified
   fine". Fix: `runBooting` flag — enterPlay sets it around the async build; the
   deterministic block in the tick skips stepping entirely while it's true.

2. **Proof off-by-one → validator rejected EVERY in-game submission (`run-never-ended`).**
   On the fatal step, stepSimAndSync dispatched the gameOver event (→ triggerGameOver →
   getRunProof + submit) BEFORE the loop's `simStep++` and before `runSurvivalSec` sync. So
   every submitted proof's `steps` EXCLUDED the fatal step; replayProof.cjs replays exactly
   `steps` steps and requires the death to occur within them → `run-never-ended`, always.
   (In-page parity printed Δ0.000000 because BOTH its numbers were stale by one step —
   false confidence.) Prod never accepted an in-game proof: pre-08-03 CSP blocked
   submissions entirely; after the CSP fix, this rejected them all. Fix: stepSimAndSync now
   increments `simStep` and syncs `runSurvivalSec` after `stepSim()` but before event
   dispatch (`playEnded` stays post-dispatch — triggerGameOver no-ops if already true); the
   tick-loop increment now applies only to the free-play branch.

**Live evidence (2026-08-06, local dev vs REAL prod validator reef.lawb.xyz):** autopiloted
19.2s first run AND 103.6s RETRY run both log `Parity OK (Δ0.000000s)` and
`[REEF VALIDATOR] run verified` — a 100s+ retry run verifying was impossible before. Direct
POST of a captured 104.8s proof: `{"valid":true,...,"endReason":"crush"}`. Droplet bundle is
NOT stale (verified — same verdict local vs prod).

**DEV parity tooling added (all `import.meta.env.DEV`-gated, zero prod impact):**
`window.__reefCtl` (controller handle), per-step `devTrace` fingerprints of live
deterministic runs, and `__reefCtl.debugFindDivergence()` — replays the current proof and
returns the first divergent step with both states. Use these before guessing on any future
parity issue.

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
