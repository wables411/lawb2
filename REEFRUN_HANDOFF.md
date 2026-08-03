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
