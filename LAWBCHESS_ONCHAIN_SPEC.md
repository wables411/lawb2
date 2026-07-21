# LAWB Chess — Fully On-Chain Redesign Spec (DRAFT for review)

> ## ⚡ LOCKED 2026-07-20 — token & chain rollout (owner call; contract needs NO changes, it already takes any ERC-20 + allowlisted NFTs)
> - **Ship order: Arbitrum first, featured wager token $DMT** (Dream Machine Token,
>   `0x8B0E6f19Ee57089F7649A455D89D7bC6314D04e8`). Arb gas ≈ cents/move → casual play works.
>   DMT/Arb liquidity is thin (~$29K Camelot, checked 2026-07-20) but wagering is peer-to-peer —
>   players hold DMT, nothing needs swapping; thin liquidity is acceptable.
> - **$CULT chess = the ETH-mainnet high-stakes tier** (CULT has no L2 bridge; all ~$3.36M liquidity
>   is L1). Per-move L1 gas is the cost of the big-money table; L1 players pay own gas (spec §locked).
> - **NFT wagers follow the collections' chains:** ETH deploy allowlists Lawbsters/Lawbstarz/
>   Pixelawbs; Base deploy allowlists Halloween/ASCII Lawbsters.
> - **Frontend curation:** feature $CULT/$DMT prominently per chain; keep the existing custom-token
>   input as the subtle "wager any ERC-20" option (already built in the lobby UI).
> - **$LAWB/$CLAWB are NOT wager tokens** (no liquidity) — identity/cosmetics/perks layer only.
> - Reef Run counterpart (CULT-on-ETH jackpot): see REEFRUN_ONCHAIN_SPEC.md addendum.

> Status: **design only — no code written.** This is the artifact to review before any implementation.
> Goal: PvP chess that is functionally airtight, settlement-trustless, multichain (ETH / Base / Arb),
> with connect-once UX, on-chain ELO, and NFT-collection wagers — without breaking the live site,
> burning Netlify credits, or relying on the world-writable Firebase for anything that touches money.

---

## 1. Goals / Non-Goals

**Goals**
- One audited contract, deployed independently on **Ethereum, Base, Arbitrum**.
- **Trustless settlement**: the contract is referee + escrow + clock. No off-chain "winner" anyone can forge.
- **Connect-once UX**: one approval/permission, then moves flow with no per-move wallet popups, ending in **auto-payout** (no separate "claim").
- **On-chain ELO** rating, updated atomically at settlement.
- **Wagers**: native + ERC-20, and **ERC-721 / ERC-1155 NFT-collection** wagers, on all three chains.
- "Looks like a professional EVM dev wrote it": SafeERC20, ReentrancyGuard, Pausable, UUPS behind a multisig/timelock, no escrow-draining admin path, full test + audit.

**Non-Goals**
- **No cross-chain play.** A match lives entirely on one chain: player picks chain → creates/joins there → wager, moves, ELO, payout all on that chain.
- **Minimal change to single-player.** "vs Clawb" / Hard stays on the existing Stockfish service (confirmed alive: depth-18 responses). The one addition: the service **signs each Hard-mode result** so it can feed the global ELO (§8b). Easy mode is unrated. Optional later: move the engine to in-browser WASM.
- **No Firebase in the trust path.** Firebase (or any backend) becomes, at most, a lobby cache and move *transport* convenience — never the source of truth for results or money.
- **No Netlify functions** added for gameplay. The relayer/keeper (if used) is a lightweight standalone service, not per-invocation serverless.

---

## 2. Architecture (layers)

```
            ┌──────────────────────────────────────────────────────────────┐
 CLIENT     │ React UI: board + piece-set/board cosmetics (NFT-gated),       │
 (look)     │ renders board state read FROM THE CONTRACT. No trust here.     │
            └───────────────▲───────────────────────────┬──────────────────┘
                            │ reads game state            │ signs ONE permission,
                            │ (RPC / event sub)           │ then signs moves (messages, no popups)
            ┌───────────────┴───────────────────────────▼──────────────────┐
 SESSION/   │ Session key + relayer/keeper (optional): submits move txs,     │
 RELAY      │ sponsors/forwards gas, settles timeouts. NOT a trust root.     │
            └───────────────▲───────────────────────────┬──────────────────┘
                            │                            │
            ┌───────────────┴────────────────────────────▼─────────────────┐
 ON-CHAIN   │ LawbChess contract (per chain): board state, move validation, │
 (rules +   │ checkmate/stalemate/draw/timeout, escrow, house fee, ELO,     │
 money)     │ auto-payout, NFT wagers. THE source of truth.                 │
            └──────────────────────────────────────────────────────────────┘
 OFF-CHAIN  (optional, untrusted): lobby cache, "global ELO" indexer aggregating
            GameCompleted events across the 3 chains, Retake spectator feed.
```

The redesign touches the **bottom two layers**. Cosmetics and rendering (top layer) carry over unchanged and lose their Firebase dependency.

---

## 3. On-Chain Board Encoding

Stored compactly in storage words per game (target ~2–3 `uint256`):

- **Squares**: 64 squares × 4 bits (piece type 0–6: empty/P/N/B/R/Q/K) = 256 bits → one `uint256` for *types*; a second 64-bit field for *color* (1 bit/occupied square), or fold color into the 4-bit code (e.g. high bit = color, giving 0–14). Recommended: **4-bit code per square, bit3 = color** → one `uint256` covers the whole board.
- **Game meta** packed into a second word: side-to-move (1 bit), castling rights (4 bits), en-passant target square (6 bits), halfmove clock for 50-move rule (8 bits), fullmove number, status enum.
- **Chess clock** (decided §13.7 — real per-player clock, not per-move timeout): store `whiteTimeLeft`, `blackTimeLeft` (uint32 seconds) + `lastMoveAt` (uint40). On a move, deduct `now − lastMoveAt` from the mover's clock (plus increment if used), reset `lastMoveAt`. `claimTimeout` is callable when the side-to-move's remaining time is exhausted (`now − lastMoveAt > theirTimeLeft`).
- **Move format**: `(fromSq:6, toSq:6, promo:3)` — a single `uint16`. Squares 0–63 (a1=0 … h8=63).

This keeps per-move storage writes minimal (1–2 words) — important for L1 gas.

---

## 4. Move Validation (what the contract enforces)

On `makeMove`, the contract validates **full legality**:
- Correct side to move; piece belongs to mover; geometry per piece type; path not blocked; capture rules.
- **Special moves**: castling (rights + king path not attacked/occupied), en passant, promotion (must specify piece).
- **Self-check rule**: after applying the move, mover's king must not be in check (make → scan king attackers → keep/revert).
- **Game-over detection in the same tx**:
  - **Checkmate** = side-to-move is in check AND has no legal move → mover (the one who just moved) wins → auto-payout.
  - **Stalemate** = not in check AND no legal move → draw → split.
  - **50-move rule** (halfmove clock) → draw (cheap).
  - **Insufficient material** (K vs K, K+minor vs K) → draw (cheap).
  - **Threefold repetition** → see §4.1 (the one expensive draw rule).

**Gas reality (be honest):** the heavy op is *checkmate/stalemate detection* (must prove no legal move exists, i.e. generate + self-check-filter all moves for the side to move). Ordinary moves are light. On **Base/Arb this is cents or less**; on **Ethereum L1 it can be dollars on a mate-detecting move**. This is the central cost trade-off of "completely on-chain." Mitigations: encode efficient move-gen, only run full mate-detection when the king is in check or no quick legal move is found.

### 4.1 Threefold repetition (decision point)
Storing every prior position hash on-chain is the costliest part. Options:
- **(a)** Maintain a rolling map `positionHash => count` per game (extra SSTORE per move). Simple, gas-heavier.
- **(b)** **Claim-based**: contract tracks a Zobrist-style running hash; a player *claims* threefold by submitting the indices of three repeated positions, contract verifies. Cheaper default path.
- **(c)** Omit on-chain; rely on 50-move + stalemate + agreement-draw. Pragmatic; slightly less "complete."
**Decided: (a) full on-chain** — maintain `positionHash => count` per game; threefold enforced automatically. (Higher gas accepted.)

---

## 5. Contract Interface (sketch — spec, not implementation)

```solidity
// Same source deployed on ETH (1), Base (8453), Arbitrum (42161).
interface ILawbChess {
  enum WagerKind { NATIVE, ERC20, ERC721, ERC1155 }
  enum Status    { OPEN, ACTIVE, FINISHED, CANCELLED }
  enum EndReason { CHECKMATE, STALEMATE, FIFTYMOVE, INSUFFICIENT, THREEFOLD, TIMEOUT, RESIGN, DRAW_AGREE }

  // ---- create / join (escrow taken up-front so payout needs no later player action) ----
  function createGame(bytes6 code, WagerKind kind, address token, uint256 amountOrId, uint256 qty,
                      bytes32 moveKeyCommit, uint32 baseTimeSec, uint32 incrementSec) external payable; // real chess clock
  function joinGame(bytes6 code, uint256 amountOrId, bytes32 moveKeyCommit) external payable;
  function cancelOpenGame(bytes6 code) external;          // creator only, before someone joins

  // ---- play (popup-free; see §6) ----
  // Either the player's session key OR a relayer carrying the player's signed move calls this.
  function makeMove(bytes6 code, uint16 move, bytes calldata moveAuth) external;
  function claimTimeout(bytes6 code) external;            // opponent missed perMoveTimeout → present player wins
  function resign(bytes6 code, bytes calldata auth) external;
  function offerDraw(bytes6 code, bytes calldata auth) external;  // both-sign → draw

  // ---- views ----
  function board(bytes6 code) external view returns (uint256 squares, uint256 meta);
  function rating(address p) external view returns (uint32 elo, uint32 games);

  // ---- governance (multisig + timelock; see §10) ----
  function setTokenAllowed(address token, bool ok) external; // curated allowlist per chain
  function setHouseFeeBps(uint16 bps) external;              // bounded, e.g. ≤ 500 (5%)
  function withdrawFees(address token, address to) external; // ONLY accrued fees, never escrow
  function pause() external; function unpause() external;
}

event GameCreated(bytes6 indexed code, address indexed p1, WagerKind kind, address token, uint256 amountOrId, uint256 qty, uint8 chainId);
event GameJoined (bytes6 indexed code, address indexed p2);
event MovePlayed (bytes6 indexed code, address indexed mover, uint16 move, uint256 newSquares);
event GameEnded  (bytes6 indexed code, address indexed winner, EndReason reason, uint256 payout, uint256 houseFee, int16 eloDeltaWinner, int16 eloDeltaLoser);
```

Key contract-level invariants (vs the current live contract's flaws):
- `makeMove` is the **only** way to change board state, and it validates legality — so no one can assert an arbitrary board or winner.
- **No `endGame(code, winner)` taking an attacker-chosen winner.** The winner is *derived by the contract* from the game-over condition. This closes the current unilateral-settlement / pot-theft hole entirely.
- `withdrawFees` can move **only accrued house fees**, tracked separately — admin can never touch live escrow (closes the current `withdrawTokens` drain-everything risk).

---

## 6. Connect-Once / Popup-Free Moves (session keys)

**Decided: EIP-7702 primary, app-level fallback.** Both achieve one-signature-then-popup-free moves; 7702 makes the move appear on-chain as the player.

**B (primary). EIP-7702 session key**
- A normal EOA delegates a scoped session key (only `makeMove` on this contract, time-boxed, `value = 0`) via EIP-7702 (live since Pectra, 2025). An ERC-4337 paymaster sponsors gas on L2 (funded from the house fee, §13.3). `msg.sender` is the player.
- Caveats accepted: 7702 wallet/chain support is still maturing → the app-level scheme below is the automatic fallback when 7702 is unavailable.

**A (fallback). App-level move-key (no extra infra)**
1. On create/join, the client generates an ephemeral **move-key** (keypair) and the player signs **one** authorization binding that key to this game (`moveKeyCommit`). One signature, at the start.
2. Each move: the move-key signs `(code, moveNonce, move)` (EIP-712, a *message* — free, instant, no popup). A **relayer** (or the player's own browser) submits `makeMove(code, move, moveAuth)`; the contract verifies the sig against the registered key + nonce.
3. Gas for the move tx: paid by the relayer and reimbursed from a small **native gas-deposit** taken at join (remainder refunded at game end), **or** sponsored by us on L2 (cents).

**B. EIP-7702 session key (standards-based enhancement)**
- A normal EOA delegates a scoped session key (only `makeMove` on this contract, time-boxed, `value=0`) via EIP-7702 (live since Pectra, 2025). Optional ERC-4337 paymaster sponsors gas. Cleaner wallet story; more moving parts.

Either way: **one signature to start, then moves auto-flow, ending in auto-payout.** The relayer is a convenience, never a trust root — it cannot forge a move (no move-key) and cannot steal funds (contract derives the winner).

---

## 7. Escrow, Fees, Payout

- **Escrow up-front**: both stakes held by the contract from join, so settlement needs no further player action.
- **House fee**: bounded `houseFeeBps` (≤ 5%), taken only on ERC-20/native games. Winner gets pot − fee. **NFT games: no fee.**
- **Draw**: refund each side their stake (decision: 0% fee on draw, vs the current contract which still skims 5% on draws — recommend **0% on draw**).
- **Auto-payout**: settlement happens *inside* the settling tx — the checkmating move pays the winner; stalemate/draw splits; `claimTimeout` pays the present player. **No separate claim step exists.**
- **Robust transfers**: SafeERC20; **push payout with a credited-balance fallback** — if a push fails (weird token / reverting receiver), credit an internal balance the winner can `withdraw()`, so auto-payout never bricks.
- **Fee-on-transfer / rebasing safety**: measure balance delta on deposit and record the actual received amount; prefer a **curated per-chain token allowlist** over "allow all tokens."

---

## 8. ELO — per-chain on-chain (PvP) + one global rating (PvP + Hard mode)  *(DECIDED)*

Two layers, because ELO must include **both** on-chain PvP **and** off-chain Hard-mode (vs-Clawb/Stockfish) results:

**8a. Per-chain on-chain rating (trustless, PvP only).** Each chain's contract keeps
`mapping(address => Rating { uint32 elo; uint32 games; })`, initial **1200**, updated at settlement with integer/fixed-point ELO:
- `E_a = 1 / (1 + 10^((elo_b − elo_a)/400))` via a **precomputed lookup table** (clamped rating-diff buckets, scored to 1e4).
- `elo_a' = elo_a + K·(S_a − E_a)`, `S` ∈ {1 win, ½ draw, 0 loss}; **K = 32** (optionally lower at high elo / high games). Clamp; emit `eloDelta*` in `GameEnded`.
- This is the tamper-proof PvP rating (replaces the forgeable Firebase leaderboard).

**8b. Global rating (player-facing) = on-chain PvP + signed Hard-mode.** A lightweight **off-chain indexer** (periodic cron, **NOT** a Netlify function — no credit burn) computes one global ELO per player from two trustworthy sources:
- **On-chain PvP**: ingests `GameEnded` events from all 3 chains (fully trustless — anyone can recompute from chain data).
- **Off-chain Hard mode**: single-player results are off-chain and not trustless on their own, so the **Stockfish/house service signs each Hard-mode result** (it computed the game → it knows the true outcome). The indexer ingests these **house-signed** results. Trust = same as trusting the house (already trusted for fees/upgrades).
- Only **Hard / vs-Clawb** counts toward ELO — **Easy does not**, and depth-18 Stockfish isn't farmable.
- The global ELO is stored wherever the lobby reads from (a small table); it's a *view* derived from on-chain truth + signed SP results, recomputable by anyone.

Net: trustless per-chain rating for on-chain/wager purposes; one combined global number (PvP + Hard) as the headline rank.

---

## 9. NFT-Collection Wagers (all 3 chains)

- Supported via `WagerKind.ERC721` / `ERC1155` (the current contract already proves this pattern works).
- **Same-collection vs same-collection**: both players stake from the same NFT contract; winner takes both, draw refunds both, **no house fee**.
- Per chain, wager-able collections = whatever ERC-721/1155 exists there (Lawbsters/Lawbstarz/Pixelawbsters on ETH; ASCII/Halloween on Base; any approved collection on Arb). Solana collections are out of scope (not EVM).
- Safety: `onERC721Received` / `onERC1155Received` handling, approval checks, and reentrancy guards on NFT transfers.

---

## 10. Cosmetics (boards / pieces) — unchanged, client-side

- Piece sets are a **char→image map** ([chessPieceSets.ts](src/config/chessPieceSets.ts)); boards are background images; both stay as static client assets.
- **NFT-gating is correct as-is**: `unlockedPieceSetIds` derives from holdings ([chessCollectionPerks.ts:75](src/utils/chessCollectionPerks.ts)) — `pixelawbs` unlocks only with the collection. To verify as part of tightening: that the picker *enforces* the unlock (cosmetic only, bypassable, but should match intent).
- The renderer simply paints whatever the **contract** says is on each square, in the viewer's chosen skin. Each viewer can use a different skin; nothing cosmetic touches escrow or goes on-chain.

---

## 11. Security / Professional-Grade Checklist

- UUPS upgradeable; `_authorizeUpgrade` behind a **multisig (Safe) + Timelock**, not a single EOA.
- `house`/fee withdrawal behind the same multisig; **fees tracked separately from escrow** — admin can never drain active games.
- `ReentrancyGuard` on all state-changers; checks-effects-interactions; **SafeERC20** everywhere; push-with-credit-fallback payouts.
- `Pausable`: can halt new creates/joins in emergency, but **never** blocks settlement/refund of existing games.
- Curated token allowlist per chain + balance-delta accounting (fee-on-transfer/rebasing safe).
- No hardcoded token constants (the current source hardcodes **Sanko** addresses — dropped; tokens are per-chain config).
- Full **Foundry** suite: unit + invariant + fuzz, replay of real PGN games to validate the move engine, and a fork-test against each chain. Then a third-party **audit** before mainnet + before holding real wagers.

---

## 12. Per-Chain Deploy & Gas/Cost Model

- Same source on ETH / Base / Arb (CREATE2 for identical addresses if desired). Per-chain config: token allowlist, min/max wagers, fee bps, timeouts.
- **Who pays move gas:**
  - L2 (Base/Arb): cents — we can **sponsor** via relayer/paymaster for a seamless UX at trivial cost.
  - L1 (ETH): real money, esp. on mate-detecting moves → require a **gas deposit** from players (reimburse relayer, refund remainder) or simply let L1 be the "whales pay their own gas" tier.
- No new Firebase write load (moves go on-chain); no Netlify functions. Existing bandwidth posture preserved.

---

## 13. Decisions (RESOLVED)

1. **Settlement model** → **(A) fully on-chain move validation.** ✅
2. **Session keys** → **EIP-7702 primary** (move attributed to the player on-chain; sponsored gas via paymaster on L2), with the **app-level signed-move + relayer as fallback** for wallets/chains that don't support 7702 yet. ✅
3. **Gas** → **sponsor L2 gas out of the house fee**; **ETH L1 users pay their own gas** for now. ✅
4. **ELO** → **global** (it's a cheap indexer, not Netlify-costly) **and must include both on-chain PvP and off-chain Hard-mode** results — see §8 (per-chain on-chain rating + global = PvP + house-signed Hard). ✅
5. **Threefold repetition** → **full on-chain** (`positionHash => count` per game; slightly higher gas, accepted). ✅
6. **Rollout** → **new contract per chain + frontend feature flag** (§14); existing proxy untouched. ✅
7. **Time control** → **(B) real chess clock** — each player a total time budget; on the move your clock ticks; hit zero = loss. On-chain via `block.timestamp` deltas. ✅

---

## 14. Rollout Without Breaking the Live Site

- Deploy the **new** contract per chain; do **not** disturb the existing Base proxy or its in-flight games.
- Frontend: a **feature flag** routes *new* PvP games to the new contract; legacy games can still be settled/claimed on the old contract during a grace window.
- **Single-player stays exactly as-is** (Stockfish droplet) throughout — zero risk to the working mode.
- Cosmetics, chat, spectator: unchanged; spectator reads board state from the new contract.
- Ship behind the flag → test on testnets → enable per chain once audited.

---

## 15. Phased Build Plan (each phase independently verifiable, testnet-first)

- **Phase 0** — Finalize this spec + the §13 decisions. *(no code)*
- **Phase 1** — Core contract: board encoding, full move engine, checkmate/stalemate/50-move/insufficient, escrow (native+ERC20), auto-payout, per-move timeout, Pausable, SafeERC20, multisig/timelock governance, fee accounting. Foundry unit+fuzz+PGN-replay. **Deploy to Base Sepolia.**
- **Phase 2** — ELO + NFT wagers (721/1155) + threefold (claim-based). Tests.
- **Phase 3** — Session keys + relayer (connect-once, popup-free, auto-payout). Gas model.
- **Phase 4** — Frontend integration behind feature flag: render board from contract using existing cosmetics, lobby (per chain), chain picker, spectator. No Firebase in the money path.
- **Phase 5** — Testnets E2E on Base/Arb/ETH Sepolia → external audit → mainnet deploy (ETH/Base/Arb) → enable flag per chain. Optional follow-up: single-player → in-browser WASM Stockfish (removes droplet SPOF).

---

### Scope honesty
A Solidity chess engine + session keys + multichain + on-chain ELO is a **substantial, audit-heavy build** — not a weekend patch. The phasing above keeps each step shippable and verifiable, never a big-bang, and never touches the working single-player or the live PvP until the new path is audited and flag-enabled.

---

## 16. Decisions Log — session of build kickoff (RESOLVED/APPROVED)

- **Phase 1 status: DONE.** Engine + UUPS wager wrapper built, 23/23 tests, deployed + verified + functionally proven on **Base Sepolia** (proxy `0xCF4131302Ed9685309F2c1Ca01b282409D1fBCE4`).
- **#1 Gas-optimization pass — APPROVED.** Optimize the engine's legal-move generation (mate-detecting move ~2.5–3.3M gas), differential-fuzz-tested against the current proven engine as the oracle.
- **#2 NFT wager collections — current state confirmed:** NFT wagering is *not enabled* today (frontend: "coming soon"; the live contract accepts any NFT permissionlessly with no allowlist). The new contract will use a **curated per-chain allowlist**. Candidate EVM collections:
  - **Ethereum:** Lawbsters `0x0ef7ba09c38624b8e9cc4985790a2f5dbfc1dc42`, Lawbstarz `0xd7922cd333da5ab3758c95f774b092a7b13a5449`, Pixelawbsters `0x2d278e95b2fC67D4b27a276807e24E479D9707F6`
  - **Base:** A Lawbster Halloween `0x8ab6733f8f8702c233f3582ec2a2750d3fc63a97`; ASCII Lawbs (address TBD — lawb.xyz mint contract)
  - **Arbitrum:** none currently
  - **Solana (LawbStation, Lawbnexus):** out of scope — non-EVM
  - → **Final allowlist to be confirmed by wables411 before Phase 2 ship.**
- **#3 Session keys (EIP-7702 primary + app-level fallback) — APPROVED.**
- **#4 Frontend integration + deploy to Arb/ETH Sepolia — APPROVED.**
- **#5 MAINNET deployer/owner wallet:** `0x13031dC2dC848A985cCb6532956f7B8f3487772A` (the wallet that deployed the existing LAWBCHESS3000). All mainnet (ETH/Base/Arb) deploys and contract ownership use this address; testnet continues with the throwaway deployer.

### 16.1 NFT wager allowlist — CONFIRMED by wables411

**Ethereum**
- Lawbsters `0x0ef7ba09c38624b8e9cc4985790a2f5dbfc1dc42`
- Lawbstarz `0xd7922cd333da5ab3758c95f774b092a7b13a5449`
- Pixelawbsters `0x2d278e95b2fC67D4b27a276807e24E479D9707F6`
- `0x5af0d9827e0c53e4799bb226655a1de152a425a5`
- `0xabcdb5710b88f456fed1e99025379e2969f29610`

**Base**
- A Lawbster Halloween `0x8ab6733f8f8702c233f3582ec2a2750d3fc63a97`
- ASCII Lawbs `0x13c33121f8a73e22ac6aa4a135132f5ac7f221b2`
- `0xee7d1b184be8185adc7052635329152a4d0cdefa`
- `0xf6f260643f5f666c0828cef6b016f9cba3718d4c`

Set per chain via `setAllowedNftCollection(address,bool)` after deploy (same pattern as ERC-20 allowlist). Arbitrum: none yet.
