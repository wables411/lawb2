# Piggy bank checklist — Pixelawbsters floor pool

Companion to `LAWB_NFT_LP_SPEC.md` (the research; addresses verified there 2026-07-27).
This is the do-it list. Live numbers re-checked 2026-08-20.

**The loop:** games earn crumbs → crumbs fill the pool → the pool is a standing bid under the
Pixelawbster floor → cards worth holding.

One chain (Ethereum). No new token. No new contracts to write — just one factory call and a habit.

---

## Live numbers (2026-08-20)

| Fact | Value |
|---|---|
| Pixelawbsters minted | **1,133 / 2222** (344 holders; +12 mints in last 3 weeks — will not sell out) |
| Public mint | 0.009 ETH, ends **~2026-08-26** (6 days) |
| Vault LAWB supply | **39** (someone deposited a 39th lawbster since the spec) |
| Pixel royalty | 0 bps (keep it 0 — pool would enforce any bps set) |
| Reef Run house fee | 5% of every jackpot win (contract-side) |
| Chess house fee | `houseFeeBps` on token/native games, withdrawable via `withdrawFees` (never escrow) |

## Step 1 — let the card machine stop (by Aug 26, ~zero effort)

- [ ] Let the public mint lapse on its end date. **Do not extend it.**
- [ ] After it ends: call `setMaxSupply(<final minted count>)` on `0x2d27...07F6` — makes the
      cap permanent and visible on-chain. One tx, dust gas.
- [ ] Announce: "Pixelawbsters supply is now fixed forever at N."
- Leftover ~1,089 unminted: they simply never exist. (No re-deploy anywhere. Scarcity is the point.)

## Step 2 — get the LAWB side of the pool (owner, ~1 hour)

- [ ] Decide seed size — **the only real decision in this file.** Spec's illustrative shape:
      ~25 pixels + ~5 LAWB opens at 0.2 LAWB/pixel. Scale to taste; start small, add later.
- [ ] Mint the LAWB: deposit spare lawbsters into the NFTX vault `0xDB98...6A05`
      (0.95 LAWB per lawbster, immutable, live) — or use LAWB already held.
- [ ] Set the opening price on launch day from real floors: pixels-per-LAWB ≈
      (lawbster floor in ETH) ÷ (pixel floor in ETH). Don't precompute it today.

## Step 3 — build the piggy bank (one transaction)

- [ ] `createPairERC721ERC20` on sudoswap v2 factory `0xA020...6000`:
      `token` = vault LAWB, `nft` = Pixelawbsters, `bondingCurve` = XykCurve `0xc7fB...3De5`,
      `poolType` = TRADE (2), `fee` = 2e16 (**2%**), `spotPrice`/`delta` = virtual reserves from
      step 2 price, initial pixel IDs + LAWB deposit in the same call.
- [ ] Verify the pool appears on sudoswap's frontend (free distribution, ETH v2 pools list there).
- [ ] Timing: **after** mint ends (a 0.009 ETH mint next door is competing supply and a hard
      price ceiling). Target week of **Aug 27 – Sep 2**.

## Step 4 — feed it crumbs (a monthly habit, no code)

- [ ] Pick the slice: e.g. **50% of reef house fees + 50% of chess house fees** → piggy bank.
      (Owner call; any % works, consistency matters more than size.)
- [ ] Monthly: `withdrawFees` from chess (per chain), sweep reef fee balance → swap the slice to
      ETH→LAWB (or deposit lawbsters) → **add to the pool as liquidity** (deepens the bid), or
      occasionally **buy a pixel from the pool** (raises the bid + house gets a prize NFT to give away).
- [ ] Optional later: script it (`scripts/` has the treasury patterns). Manual first is fine.

## Step 5 — let people see it (UI, later, not blocking)

- [ ] Phase A: link the sudoswap pool page from lawb.xyz (one anchor tag, ships day one).
- [ ] Phase B: "lawbswap" page on lawb.xyz — two swap calls + reads (spec §7). Only if traction.
- [ ] Reef/chess winners: "swap winnings → lawb NFT" button pointing at the pool (spec §8.2).

## Not now (on purpose)

- Lawbsters pool — blocked on the 10% immutable royalty (needs the portionclub conversation
  or v1; spec §5). Pixel pool doesn't wait for it.
- LawbPool co-LP wrapper (spec §6) — solo-LP first.
- Base / ASCII pools, RH coin, urufu launchpad, gēmu-style yield — shelved. The piggy bank
  needs none of them.
- Royalty stays **0** on Pixelawbsters. Setting even 2% taxes only the pool (marketplaces
  don't enforce it) — i.e. it would tax the piggy bank itself.

## Decisions owner still owns

1. Seed size (how many pixels + LAWB committed — withdrawable anytime while solo-LP'd).
2. House-fee slice % for the monthly feed.
3. Launch day (any day after mint end; suggest within the week while "supply fixed" is news).
