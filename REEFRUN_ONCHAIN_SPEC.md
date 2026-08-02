# Reef Run — On-Chain Play-to-Earn Spec (DRAFT for review)

> ## ⚡ LOCKED 2026-07-20 — token & chain decision (owner call, overrides §4–§9 where they conflict)
> - **Jackpot/economy token: $CULT (Milady Cult Coin, ETH mainnet `0x0000000000c5dc95539589fbD24BE07c6C14eCa4`).**
>   Verified: all CULT liquidity is L1 (~$3.36M Uniswap CULT/WETH); **no bridged CULT exists on
>   Base/Arb** (checked 2026-07-20). Reef Run tolerates L1 because it's ONE tx per jackpot entry +
>   one per payout — not per-action like chess.
> - **Jackpot entry denominated in CULT** (amount TBD at deploy; also show gwei-style meme framing
>   in UI). Pot = entries, winner-takes-pot −5% fee → **self-funding, house never buys prize tokens**.
> - **$CLAWB RewardPool emissions: PARKED.** No inflationary reward token. $LAWB/$CLAWB become the
>   identity/cosmetics/perks layer only (no liquidity required).
> - Rationale + chess counterpart: see LAWBCHESS_ONCHAIN_SPEC.md addendum ($DMT on Arbitrum).

> Status: **design only — no code written.** Companion to `LAWBCHESS_ONCHAIN_SPEC.md`; reuses its
> proven patterns (EIP-712 signed claims, non-drainable escrow, UUPS+pause+multisig, off-app
> services instead of Netlify functions, small-caps de-risking).
> Goal: turn Reef Run (the higher-traffic prototype) into a shippable on-chain game with a
> trust-minimized play-to-earn loop — **without** the forgeable-leaderboard hole or a ruggable
> hot-wallet payout.

---

## 1. Where Reef Run is today
- Three.js endless underwater runner ([ArcadeSceneController.ts](src/pages/arcade/ArcadeSceneController.ts)); FBX/GLTF characters with idle + dance anims (`/arcade-assets`).
- 3 characters — **clawb / milady / radbro** — each a stat spread (speed/oxygen/armor), and a **1–5 stars** system that already scales oxygen capacity, armor, drain, and speed ([arcadeCharacterStats.ts](src/pages/arcade/arcadeCharacterStats.ts)). Upgrades = more stars.
- Pickups/soft currency: **coins, cheese, peptides** (+ hazards: jellyfish, pufferfish, mine; resource: air_tank). Score = survival time.
- Leaderboard/points + `reef_run_stats` written **client-side to Firebase**.

## 2. The core problem (must fix before any tokens)
`database.rules.json` allows `".write": true` on `leaderboard/$wallet` and `profiles/$wallet`
with **shape-only** validation and **no ownership/auth check** — and the score is client-asserted.
So scores are **forgeable today**. Wallet-keyed ≠ secured. The moment points convert to tokens, a
forged run = drained reward pool. **Closing this is the foundation, not a feature.**

## 3. Trust model (the keystone): deterministic runs + replay validation
Real-time gameplay can't be validated on-chain (unlike turn-based chess). The arcade analog of
"derive the result from verifiable data":
1. **Deterministic engine.** Replace all `Math.random()` (spawns, pickups, hazards) with a **seeded
   PRNG**. A run is fully reproducible from `(seed, characterId, stars, inputLog)`.
2. **Submit a run proof** on game-over: `seed`, `characterId`, `stars`, a compact `inputLog`
   (lane changes / actions with frame indices), and the claimed result.
3. **Off-app validator** (cron/worker — **not** a Netlify function) **replays** the run headlessly
   with the same engine and computes the *true* coins/cheese/peptides/survival. Mismatch → reject.
4. **Validator is the only writer** of authoritative leaderboard/stats/balances (lock Firebase to
   client-read-only for those paths). Trust = "the house scores honestly," and replay makes that
   **publicly recomputable by anyone** from the submitted proof.

This single change unlocks fair scoring, anti-cheat, tokenomics, and PvP. Do it first.

## 4. Currencies & the play-to-earn loop (leaning into burn-for-reward)
Two currencies, per the pattern you sent:
- **Soft currency** (coins/cheese/peptides) — earned by playing, validated per §3, stored off-chain
  (no cash value until burned, so cheap to keep in the DB).
- **Crypto token** — `$CLAWB` (and/or `$LAWB`) — earned by **burning soft currency** against an
  on-chain **reward pool**.

The loop:
```
play ─▶ earn soft currency (validated) ─▶ BURN soft currency ─▶ claim $CLAWB from reward pool
  ▲                                                                        │
  └────────── spend soft currency &/or $CLAWB to upgrade your toon ◀───────┘
                          (more stars ⇒ earn more next run)
```
**Burn-for-reward, on-chain (trust-minimized):** burning soft currency is recorded by the validator,
which signs a claim `(wallet, amount, nonce)`; the **RewardPool contract** verifies the signature +
nonce + pool balance and pays $CLAWB. The pool is non-custodial, not admin-drainable, auditable, and
claims are non-replayable — strictly better than wallet-to-wallet from a hot wallet.

**Sustainability (so it's neither ruggable nor hyper-inflationary):**
- **Source:** the reward pool (seeded + refilled by the team and/or a cut of token spent on upgrades).
- **Sinks:** token spent/burned on upgrades and cosmetics returns supply to the pool (or burns it).
- **Emission control:** the validator caps soft→token conversion rate (per-wallet/day) and the pool
  has a hard balance limit on payouts — same **small-caps de-risking** as chess (bounded blast radius
  with no audit budget).

## 5. Contracts (reuse the chess family)
- **RewardPoolClaim (new).** Holds $CLAWB. `claim(amount, nonce, sig)` — EIP-712, house-signed,
  per-wallet nonce, pays from pool; `pause`, UUPS, owner→multisig, **no admin path to user funds**.
  *(You already have a `ClawbMerkleDistributor` — for periodic epoch rewards, extend that with a
  Merkle root per epoch; for continuous claims, use the signed-claim path. Recommendation: signed
  claims for the live loop, Merkle for big periodic drops.)*
- **UpgradeSink (optional).** Burns/escrows $CLAWB spent on upgrades; emits an event the validator
  reads to credit on-chain-verifiable upgrades.
- **ReefRunWager (new, for PvP — §7).** Escrow + settlement for staked races; same shape as LawbChess
  (escrow up-front, winner *derived* from validated scores, no forgeable winner, NFT/native/ERC-20).

All inherit the chess de-risking: EIP-712 verified off-chain, escrow≠fees separation, small caps,
testnet-first behind a feature flag.

## 6. Upgrading the toon (stars) — what's on-chain vs off
The stars system already exists; the question is where "ownership" of upgrades lives:
- **v1 (cheapest):** stars are **off-chain** state the validator maintains (it already gates earning).
  Spending soft currency to upgrade = validator debits + bumps stars. Token spend = on-chain burn via
  UpgradeSink, validator credits the star. Pro: cheap, fast. Con: upgrades aren't player-owned assets.
- **v2 (player-owned):** the toon is an **NFT** with **on-chain attributes** (stars per stat).
  Upgrading writes attributes on-chain (paid in $CLAWB). Pro: upgrades are tradeable/portable, fully
  player-owned, composable. Con: gas per upgrade, more contract surface. Recommended once the loop is
  proven.

## 7. On-chain PvP — Reef Run Jackpot (LOCKED design)
Pay-to-play, single growing pot, beat-the-high-score. Async (no matchmaking, no netcode); the
deterministic engine (§3) makes scores verifiable.

**Rules**
- **Entry:** denominated in **$CULT** (ETH mainnet; amount TBD at deploy — owner locked 2026-08-02) per run → added to the pot.
- **Winner metric:** longest **survival time** (ms precision). Coins/cheese/peptides are NOT the
  jackpot score — they're soft currency for upgrades later (§4/§6).
- **Seed assigned at entry** (VRF / validator-committed) — players can't shop seeds or precompute an
  optimal run; each run is replay-validated (§3) against its assigned seed.
- **Beat the high score → instantly win the pot, minus a 5% house fee** (funds payout gas). You
  become champion and top the jackpot board. Pot resets to 0 and refills from new entries; your score
  is the new bar.
- **Lose → your entry stays in the pot** (grows it).
- **Safety valve:** if the high score goes **unbeaten for 7 days, the jackpot score resets** (bar
  drops so the standing pot becomes winnable again). This resets **only the jackpot record** — it does
  **NOT** touch the persistent Lawb leaderboard / profile stats.
- **Free "play for fun" mode:** no entry, no seed assignment, no validator, no reward; kept on a
  separate board so it never muddies the jackpot ranking.

**Two distinct boards (don't conflate):**
1. **Jackpot board** — current champion + high score to beat; resettable (7-day valve; on a win the
   bar becomes the winner's score).
2. **Lawb overall leaderboard** — persistent all-time points/stats (the existing leaderboard); never
   reset by the jackpot.

**Contract `ReefRunJackpot`** (reuses chess escrow / EIP-712 / pause / UUPS / small-caps):
holds `pot`, `highScore`, `champion`, `lastBeatenAt`. `enter()` pays + assigns the run seed;
`submitScore(score, sig)` takes a validator-signed survival time and, if it beats `highScore`, pays
`pot − 5%` to the player, sets the new bar/champion, restarts the 7-day timer; `resetIfStale()` drops
the bar after 7 days unbeaten. Winner is **derived from the validated score**, never caller-asserted.

**Later (post-jackpot):** 1v1 same-seed **wager races** and async **ghost races** — same trust model.

## 8. Upgrading Reef Run visuals (what it looks like)
Two separate axes — keep cosmetic value off the trust path (like chess boards/pieces):
- **Fidelity / polish (pure client, no trust):** higher-poly or re-textured character models, new
  dances/animations, richer reef environments, particle/lighting passes, post-processing. Mind mobile
  perf: LOD, draw-call batching, the existing lazy-loaded GLTF chunk, texture compression (KTX2/Draco).
- **Cosmetic economy (NFT-gated, monetizable):** new **characters/skins as NFTs** (own it → select it),
  tradeable, exactly the chess piece-set model (`unlockedX` from holdings). Visual **star tiers** —
  a maxed toon *looks* upgraded (trail FX, gear, glow) — driven by the on-chain/validated star count.
  Buy skins with $CLAWB (a token sink) or NFT-mint.
- **Art-direction goal (wables):** the run currently reads like "swimming through *space*" under flat
  *studio* lighting. Target = a believable **oceanic migration tunnel / hyperspeed**:
  exponential depth fog with a teal→deep-blue gradient; **volumetric god-rays** angled from the
  surface; animated **caustics** on surfaces; suspended **marine-snow particulate** drifting past
  (parallax for speed); a warm key "sun from above" + cool ambient instead of uniform studio light;
  color-grade toward cyan/teal with a vignette; speed cues (subtle chromatic/radial blur + faster
  particulate) on hyperspeed; optional schools of fish / kelp / silhouettes in the tunnel. All
  shader/material/light work — cheap, client-side, no trust impact.
- **Known polish bug:** on the menu/select screen the character's *idle* and *dance* models can be
  visible at once (idle root not hidden when the dance root loads, ArcadeSceneController ~L1094) —
  shows as two stacked characters. Hide idle when dance becomes visible.
- **No cosmetic ever touches escrow or scoring** — render reflects owned/earned state; integrity stays
  in §3/§5.

## 9. Phased plan (testnet-first, each step shippable)
- **Phase 0** — this spec + decisions (§11). *(no code)*
- **Phase 1 — Close the hole.** Seeded PRNG refactor + run-proof submission + off-app replay validator;
  lock Firebase so only the validator writes scores/stats. *(no tokens yet — pure integrity)*
- **Phase 2 — Reward pool + burn-for-reward.** `RewardPoolClaim` (signed claims), validator signs
  burns→claims, emission caps. Behind a flag, testnet, small pool cap.
- **Phase 3 — Upgrades loop.** Soft-currency upgrades (off-chain) + token-spend upgrades (on-chain
  burn/sink); tune the economy (source/sink balance).
- **Phase 4 — PvP.** Daily-seed tournaments → 1v1 wager races (`ReefRunWager`) → ghosts.
- **Phase 5 — Visual upgrades + cosmetic NFTs**; toon-as-NFT (on-chain attributes) if desired.
- **Phase 6 — Audit/de-risk → mainnet**, per the chess no-budget ladder (free tooling, small caps,
  multisig/timelock, public beta, optional fee-funded bounty).

## 10. What carries over from chess (so this is fast)
EIP-712 sign/verify (built + verified), non-drainable escrow + fee separation, UUPS/pause/multisig,
the off-app-service model (relayer/indexer ≈ validator/signer), small-caps de-risking, feature-flag
rollout, NFT-gated cosmetics, and the fork-test harness pattern.

## 11. Decisions

**Locked**
- **PvP first slice = the Jackpot (§7):** $CULT entry (amount TBD at deploy), single pot,
  beat-the-high-score, instant payout minus **5% house fee** (gas), record **resets if unbeaten
  7 days** (jackpot score only — never the persistent Lawb leaderboard), plus a free no-reward
  play mode.
- **Winner metric = survival time only** (coins/pickups → upgrade use-cases later).
- **Entry currency = $CULT (owner re-confirmed 2026-08-02; supersedes the earlier Base ETH note).**

**Still open (for the play-to-earn loop, not the jackpot)**
1. **Claim model:** continuous **signed claims** (recommended) vs **Merkle epochs** (extend
   `ClawbMerkleDistributor`) vs both.
2. **Reward token:** $CLAWB, $LAWB, or both? Pool funding source + per-day emission cap?
3. **Upgrades:** off-chain stars (v1) now, NFT toon (v2) later — agree?
4. **Soft currency:** keep off-chain (recommended) or also mint an on-chain soft-token to literally
   burn? (more decentralized, more gas/complexity)
5. **Chains:** Base first (matches chess), others later?
6. **Determinism scope:** confirm we can make the engine fully deterministic (seeded PRNG everywhere)
   — the keystone dependency for both anti-cheat and the jackpot.
