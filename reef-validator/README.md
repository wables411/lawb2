# Reef Run Replay Validator (the referee)

Judges Reef Run run-proofs by replaying them through the exact same sim the game
runs (`src/pages/arcade/reefRunSim.ts`). A score is only trusted if the replay
reproduces it — this is what makes the leaderboard/jackpot cheat-proof.

## What it does
- `POST /validate` with a run proof (`getRunProof()` output) → verdict:
  `{valid, reason?, survivalSec, points, endReason, pickups}`.
  `survivalSec`/`points` are the replayed (authoritative) values, never the claim.
- `GET /health` → `{ok:true}`.
- Zero dependencies, no credentials — it only judges. Writing verified scores to
  Firebase is the next step (needs a scoped service account on the host).

## Run locally
```bash
npm run validator:serve        # builds the sim bundle, serves on 127.0.0.1:8787
npm run test:validator         # 7 tests incl. forged-score rejection + HTTP e2e
```
To point the game at it: set `VITE_REEF_VALIDATOR_URL=http://127.0.0.1:8787` in
`.env.local`, run the dev server, play a run at `/arcade?reefdet=1` — the console
logs `[REEF VALIDATOR] run verified` on game over. Unset = no request (default;
live free-play never submits).

## Droplet deploy (same pattern as the chess ELO indexer)
1. Copy `reef-validator/` + the built `_reefRunSim.cjs` (or build on the box with
   esbuild) to the droplet.
2. Run `node server.mjs` under systemd (`REEF_VALIDATOR_PORT`, binds 127.0.0.1).
3. nginx `location /reef/validate` → `proxy_pass http://127.0.0.1:8787/validate;`
   on chess.lawb.xyz (already has TLS).
4. Set `VITE_REEF_VALIDATOR_URL=https://chess.lawb.xyz/reef` in Netlify env and
   redeploy the site.

IMPORTANT: the sim bundle must be rebuilt and redeployed whenever
`reefRunSim.ts` (or anything it imports) changes, or the validator will reject
honest runs from the newer game. Keep them in lockstep.
