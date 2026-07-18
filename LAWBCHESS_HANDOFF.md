# LAWB Chess On-Chain Rebuild — Session Handoff

> Read this first, then `LAWBCHESS_ONCHAIN_SPEC.md` (full design + every locked decision).
> Status as of pause: **Contract Phases 1–3 DONE, tested, deployed + verified on Base Sepolia.
> Phase 4 (frontend integration) NOT started.**

---

## 1. TL;DR — what exists right now

A fully on-chain, trustless, multichain-ready chess **wager contract** is built and live on Base Sepolia:
- Full Solidity chess engine (legality, castling/en-passant/promotion, check/checkmate/stalemate, draws) — gas-optimized, differential-tested.
- Escrow + real chess clock + **auto-payout** (winner derived on-chain — no forgeable claim).
- Wagers: **native, ERC-20, ERC-721, ERC-1155** (NFT = same-collection, winner-takes-both, no fee).
- On-chain **ELO**, bounded house fee **separated from escrow** (admin can never touch stakes), Pausable, UUPS upgradeable.
- **Session keys**: `makeMoveBySig` lets a relayer submit player-signed moves (popup-free); EIP-7702 path needs no contract change.
- **34 tests, all green.** NFT allowlist seeded with 4 Base collections.

The live lawb.xyz site is **untouched** — all of this is in an isolated repo (`onchain-chess/`).

---

## 2. Where everything is

| Thing | Path |
|---|---|
| **Design spec + all decisions** | `C:\Users\wable\lawb2\LAWBCHESS_ONCHAIN_SPEC.md` |
| **This handoff** | `C:\Users\wable\lawb2\LAWBCHESS_HANDOFF.md` |
| **Contracts (own git repo + Foundry project)** | `C:\Users\wable\lawb2\onchain-chess\` |
| — chess rules engine (linked library) | `onchain-chess/src/ChessEngine.sol` |
| — wager contract (UUPS) | `onchain-chess/src/LawbChess.sol` |
| — integer ELO library | `onchain-chess/src/Elo.sol` |
| — tests (34) | `onchain-chess/test/*.t.sol` |
| — deploy / upgrade scripts | `onchain-chess/script/Deploy.s.sol`, `Upgrade.s.sol` |
| — secrets (gitignored) | `onchain-chess/.env` (PRIVATE_KEY, BASESCAN_API_KEY, FEE_BPS) |
| **Live frontend chess (DO NOT BREAK)** | `src/components/ChessMultiplayer.tsx` (PvP, ~7.7k lines), `ChessGame.tsx` (single-player), `ChessPage.tsx`, `firebaseChess.ts`, `ChessSpectator.tsx` |
| Cosmetics (carry over as-is) | `src/config/chessPieceSets.ts`, `src/utils/chessCollectionPerks.ts` |

---

## 3. Deployed addresses

**Base Sepolia (chain 84532) — current:**
- Proxy (USE THIS, unchanged through all upgrades): `0xCF4131302Ed9685309F2c1Ca01b282409D1fBCE4`
- Current impl (Phase 3): `0x5051B8d9a0f236F892CaBc4bC01AB7de87dc8160`
- ChessEngine library (linked): `0x4a328b8065979dbd8baa7e27710b1f5b2d365556`
- All verified on BaseScan.
- NFT allowlist set (`allowedNftCollection == true`): `0x8ab6733f…3a97` (Halloween), `0x13c33121…21b2` (ASCII Lawbs), `0xee7d1b18…cdefa`, `0xf6f26064…18d4c`.

**Wallets:**
- Testnet deployer/owner (throwaway, key in `.env`): `0x170FA63c701b00651f475948b512Ae9F45E735Ad` (had ~0.0095 ETH left on Base Sepolia).
- **MAINNET deployer/owner (use for ETH/Base/Arb mainnet):** `0x13031dC2dC848A985cCb6532956f7B8f3487772A`.

**The OLD live contract being replaced** (still serving lawb.xyz today):
- LAWBCHESS3000 proxy `0x06b6aAe693cf1Af27d5a5df0d0AC88aF3faC9E11` (Base), impl `0x7c93f0e9…4e22` (verified; source via Sourcify). Off-chain: Firebase RTDB `chess-220ee`; Stockfish at `https://chess.lawb.xyz/api/stockfish` (DigitalOcean droplet, confirmed alive, depth-18).

---

## 4. Toolchain notes (gotchas that cost time)

- **Foundry** is installed at `~/.foundry/bin/` (forge/cast/anvil v1.7.1). It is **not on PATH** — call with the full path `~/.foundry/bin/forge`.
- The **shell cwd does not persist** between Bash calls. Use `forge --root /c/Users/wable/lawb2/onchain-chess ...` OR `cd` inside the same command. Running forge from `lawb2/` (the parent) says "Nothing to compile" because there's no foundry project there.
- **Run tests:** `~/.foundry/bin/forge test --root /c/Users/wable/lawb2/onchain-chess` → expect **34 passed**.
- **Sizes:** `forge build --sizes` — `LawbChess` is ~23.1 KB (limit 24.576 KB, **~1.48 KB margin**). The engine is a separately-deployed linked library; if you add more contract logic, externalize to a library or you'll blow the limit.
- **Deploy:** `PRIVATE_KEY` from `.env`; `forge script script/Deploy.s.sol:Deploy --rpc-url base_sepolia --broadcast`. **Upgrade:** set `PROXY` env, `forge script script/Upgrade.s.sol:Upgrade --rpc-url base_sepolia --broadcast` (redeploys impl, relinks library, `upgradeToAndCall`).
- **BaseScan verification uses Etherscan V2**, not V1: `--verifier-url 'https://api.etherscan.io/v2/api?chainid=84532' --etherscan-api-key $KEY`. For the impl, pass `--libraries src/ChessEngine.sol:ChessEngine:<libAddr>`. For the proxy, encode constructor args `(impl, initCalldata)`.
- **Public RPC `sepolia.base.org` lags on nonces** (caused "nonce too low" + stale reads). For sequential txs/reads use `https://base-sepolia-rpc.publicnode.com`.
- **Don't deploy twice to capture an address** — the no-`--broadcast` run simulates a *different* address. Read the deployed address from `broadcast/<script>/84532/run-latest.json`.

---

## 5. Decisions already LOCKED (do not re-litigate — see spec §13/§16)

- Fully **on-chain move validation** (not state channel).
- **Session keys: EIP-7702 primary + app-level `makeMoveBySig` fallback** (the contract has the fallback; 7702 needs no contract change).
- **Gas: sponsor L2 from the house fee; ETH-L1 users pay their own.**
- **ELO: per-chain on-chain rating + ONE global ELO** computed off-chain from all 3 chains' `GameEnded` events **plus house-signed Hard-mode (vs-Clawb) results.** Easy mode unrated.
- **Threefold: full on-chain** (positionHash→count).
- **Rollout: new contract per chain + frontend feature flag.** Old proxy untouched; legacy games settle on it during a grace window.
- **Real chess clock** (total time per player), not per-move timeout.
- **NFT wagers: same-collection, winner-takes-both, refund-both on draw, no house fee.** Allowlist confirmed (spec §16.1).
- Multichain = same code on ETH/Base/Arb; **a match lives entirely on one chain; no cross-chain play.**
- Cosmetics (boards/pieces) stay client-side, NFT-gated; render from contract board state.

---

## 6. PHASE 4 — what to do next (frontend integration)

Goal: wire the React app to the new contract **behind a feature flag**, without breaking the existing Firebase PvP. Order, each step build-verified (`npm run build`) + preview-checked:

1. **Inert scaffold (zero behavior change):** add the new contract address + ABI + a `VITE_ONCHAIN_CHESS` flag (default off). Export the ABI from `onchain-chess` (`forge inspect LawbChess abi`). Build must stay green.
2. **Read path:** render the board from `getBoard(code)` / `games(code)` (contract is source of truth) using the existing piece-set/board cosmetics. Each square decoded from the packed `uint256` (a1=0..h8=63; 4 bits/square; bit3=color; type=code&7).
3. **Write path (flagged):** create/join/move/claim against the contract via wagmi/viem. Moves: direct `makeMove` (player signs each, or EIP-7702 session key), with `makeMoveBySig` for the relayer/popup-free path.
4. **Lobby + chain picker** for the new path; **spectator** reads contract state.
5. Keep the **existing Firebase PvP fully intact** until the new path is proven on testnet, then switch the flag.

**Off-chain infra still to build (separate from the app, NOT Netlify functions):**
- **Relayer/keeper service**: sponsors `makeMoveBySig` txs (gas from house fee on L2) and calls `claimTimeout` for abandoned games.
- **Global ELO indexer**: reads `GameEnded` events across chains + ingests **house-signed Hard-mode results** (add a signing step to the Stockfish service at `chess.lawb.xyz`).

After Phase 4 + audit: deploy to **Base/Arb/ETH mainnet** from `0x13031dC2…772A`, set owner to a multisig/timelock, seed allowlists per chain, transfer the existing players over via the flag.

---

## 7. What NOT to do (guardrails the user cares about)

- **Do not break the live site.** Frontend work is feature-flagged + build/preview-verified at every step. The existing Firebase PvP path stays working until the new one is proven.
- **Do not add Netlify functions** for gameplay, or introduce new polling/listeners/bundle bloat (Netlify-credit + bandwidth sensitivity). The relayer is a standalone service.
- **Do not burn excessive Claude credits** — no re-running agent fleets; targeted reads; act when you have enough info.
- **Do not commit secrets.** `onchain-chess/.env` is gitignored. Keys (Alchemy `d50toAxGEoxZG9NkLtscy`, BaseScan `1QGPSV4…WKXC7`) were pasted in chat — they should be rotated.
- **Do not reorder contract storage.** Upgrades append-only (Game struct + top-level vars). Existing layout is sacred for UUPS.
- **Do not touch the OLD contract / old games** beyond letting them settle.
- **Mainnet:** not deployed, **not audited** — get a third-party audit before real wagers.

---

## 8. Known state / loose ends

- **`onchain-chess/` is committed** — Phases 1-3 are at commit `14e24f0` on branch `master` (local git identity set to wables411/wablesphoto@gmail.com; `.env` is gitignored and NOT tracked; libs are submodules). Commit further work as you go; this repo has no remote yet (add one if you want it backed up).
- The **lawb2 working tree has uncommitted changes** unrelated to chess (the $lawb/clawb "tokens" popup restructure in `App.tsx`/`Mobile.tsx`/`Desktop.tsx` + the `vite.config.ts` dayjs/optimizeDeps fix). Decide separately whether to commit those.
- Bytecode margin is tight (~1.48 KB) — externalize to a library before adding more contract logic.
- Single-player "vs Clawb" still uses the live Stockfish droplet; only change planned is adding result-signing for global ELO.

---

## 9. Quick start for next session

```bash
# verify everything still green
~/.foundry/bin/forge test --root /c/Users/wable/lawb2/onchain-chess        # expect 34 passed
# confirm live app still builds (end-to-end safety)
cd /c/Users/wable/lawb2 && npm run build                                    # expect ✓ built
# read the design + decisions
#   LAWBCHESS_ONCHAIN_SPEC.md   (full spec)
#   onchain-chess/src/LawbChess.sol  (the contract)
```
Then begin **Phase 4 step 1** (inert flag + ABI + config), build-verify, and proceed.
