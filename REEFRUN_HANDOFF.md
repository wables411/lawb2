# Reef Run On-Chain — Session Handoff

> Paste the "Prompt for the new session" block below to continue. Full design: `REEFRUN_ONCHAIN_SPEC.md`.

## What Reef Run is
A Three.js underwater endless-runner in lawb.xyz (`src/pages/arcade/`, core = `ArcadeSceneController.ts`).
The team's higher-traffic prototype. Goal: turn it into a shippable **on-chain play-to-earn** game,
reusing the patterns proven in the LawbChess rebuild (EIP-712 signed claims, non-drainable escrow,
feature-flag rollout, off-app services instead of Netlify functions, small-caps de-risking).

## Done so far (all committed on `main`, live free-play UNCHANGED)
- **Phase 1a — seeded gameplay RNG** (`src/pages/arcade/arcadeRng.ts`, mulberry32). All gameplay
  randomness (spawns/lanes/pickups/difficulty/speed) draws from one seeded stream; cosmetic
  randomness stays on `Math.random`. Default seed random → live behavior unchanged.
- **Phase 1b — fixed-timestep deterministic mode + input capture** (flag-gated). `stepPlaySim(dt)`
  is the extracted gameplay step; free play calls it once/frame with real dt (identical to before),
  deterministic mode runs a fixed-timestep accumulator (`FIXED_DT=1/60`). Gameplay timers use a
  sim clock (`simNow`). Captures an input log; `getRunProof()` returns `{seed,characterId,inputLog,
  survivalSec,steps}`. Enable via `setDeterministicRun(seed)` or the hidden `?reefdet=1` toggle.
- **Visuals (3 procedural passes, ZERO hosting cost — no new assets):** underwater gradient
  background + teal fog + surface-sun/hemisphere lighting + marine-snow particles; god-ray light
  shafts + vignette/color-grade overlay; procedural caustics with a boost speed-cue.
- **Lifecycle hardening:** `disposed` guard so async FBX loads abort after teardown; menu dance
  fully resets (no stacked dancer/idler); overlay removed on dispose.

## Verified-good commit: `791ffac59`
The last commit on the arcade controller. **Everything builds and runs from here.**

## ⚠️ The immediate next task (and a landmine to avoid)
**Deterministic mode (`?reefdet=1`) has occasional lateral (left/right) lag** — classic
fixed-timestep **temporal aliasing**. Correct fix = **render interpolation**: separate the
authoritative sim Z from the displayed `root.position.z` and lerp the displayed value between sim
steps by `simAcc / FIXED_DT`.

**A previous attempt at this REGRESSED the run** (survival froze at 0s; no console error; couldn't
diagnose in the WebGL preview) and was **reverted** to `791ffac59`. The attempt added `z`/`prevZ`
to the `Obstacle`/`PickupEnt` types, moved sim/collision/lane-helpers from `o.root.position.z` to
`o.z`, and added a render-sync pass. The approach is right; the execution broke something subtle.

**Do it differently:** build a **headless test harness first** (Node/tsx) so the sim is debuggable
WITHOUT the WebGL preview, then make the change with that safety net. Do NOT refactor this
collision-critical code blind against the browser only.

## Then: Phase 1c — the replay validator
A trustworthy validator MUST run the EXACT same sim as the game (same constants, same RNG
**draw order**) — a hand-written parallel copy will silently drift and is worse than nothing. So:
1. Extract the gameplay into a pure, Three-free `reefRunSim` core (reuse the already-pure helpers:
   `reefRunSpawnRowThisWave`, `rollPickupKind`, `applyPickupEffect`, `reefRunSpawnIntervalSec`,
   `oxygenDrainPerSec`, `speedBandForStars`, `reefRunPlayIntensityMultiplier`, etc.).
2. Make the **game render from it** (this is also what fixes the interpolation cleanly — one source
   of truth), and the **headless validator run the identical module**. Add an in-game **parity
   cross-check** (re-run the core on the recorded seed+inputs, assert it matches) to prove no drift.
3. The headless harness from the task above becomes the validator.

## Hard constraints / guardrails
- **Do NOT break live free-play.** Deterministic mode is opt-in (`?reefdet=1`), default OFF. The
  gameplay core is collision-critical — verify thoroughly (build a run, confirm survival advances,
  collisions fire, game-over fires; both `/arcade` and `/arcade?reefdet=1`).
- **No heavy hosting cost** (static Netlify, bandwidth-sensitive): keep all visuals/effects
  **procedural** — no new GLTF/image-texture downloads.
- **No new Netlify functions** for gameplay; off-app services (validator/signer) are standalone.
- `npm run build` runs `tsc && vite build` — keep both green at every step.

## Tokenomics / on-chain plan (later phases, see spec §4–§9)
Play → earn soft currency (coins/cheese/peptides, validated) → **burn to claim $CLAWB from an
on-chain RewardPool** (EIP-712 signed claims; existing `ClawbMerkleDistributor` for epoch drops).
**PvP = Jackpot (LOCKED design):** 0.001 Base ETH entry → one pot → beat the high score (survival
time) → take pot −5% fee; lose → entry stays; record resets if unbeaten 7 days (jackpot score only,
NOT the persistent Lawb leaderboard); free play-for-fun mode. Needs the validator (1c) first.

## Key files
- `src/pages/arcade/ArcadeSceneController.ts` — engine (gameplay + render).
- `src/pages/arcade/arcadeRng.ts` — seeded PRNG.
- `src/pages/arcade/arcadeDifficulty.ts`, `arcadePickupKinds.ts` — pure gameplay helpers (reuse for the core).
- `src/pages/arcade/arcadeCharacterStats.ts` — stars/stat model (clawb/milady/radbro).
- `src/pages/ArcadeThreeBackground.tsx` — React mount (StrictMode double-mounts in dev).
- `REEFRUN_ONCHAIN_SPEC.md` — full spec + locked decisions.

## How to verify
- `cd /c/Users/wable/lawb2 && npm run build` (expect tsc + vite ✓).
- Play-test: dev server on port 3000 → `/arcade?reefdet=1` (deterministic) vs `/arcade` (live).

---

## Prompt for the new session
```
Continue upgrading Reef Run (the on-chain play-to-earn arcade game in lawb.xyz).
First read REEFRUN_HANDOFF.md and REEFRUN_ONCHAIN_SPEC.md at the repo root — they hold the
full state, locked decisions, and guardrails. Don't re-derive decisions already there.

Current state: deterministic engine (seeded RNG + fixed-timestep behind ?reefdet=1), 3 procedural
visual passes, and lifecycle hardening are DONE and committed (good commit 791ffac59). Live
free-play is unchanged.

Two tasks, in order:
1. Fix the deterministic-mode lateral lag via RENDER INTERPOLATION (separate sim Z from displayed
   root.position.z, interpolate by simAcc/FIXED_DT). A prior attempt regressed the run (survival
   froze) and was reverted — so FIRST build a headless Node/tsx test harness for the sim so you can
   debug without the WebGL preview, THEN make the change with that safety net.
2. Phase 1c: extract a pure, Three-free reefRunSim core (reusing the existing pure helpers, exact
   RNG draw order), have the game render from it AND a headless validator run the identical module,
   with an in-game parity cross-check.

Hard rules: do NOT break live free-play (deterministic mode is opt-in, default off; the gameplay
core is collision-critical — verify runs advance + collide + game-over in BOTH /arcade and
/arcade?reefdet=1). Keep all visuals procedural (no new asset downloads — static Netlify, bandwidth
sensitive). No new Netlify functions. Keep `npm run build` (tsc && vite) green at every step.
Verify in the browser preview (port 3000) and commit working increments.
```
