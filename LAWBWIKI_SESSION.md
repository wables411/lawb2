# Lawb Wiki — Session Prep

Goal: get the Lawb ecosystem documented on the **Remilia Wiki** (wiki.remilia.org), the
community-curated encyclopedia of Remilia culture. Being in the canon = the alignment.

## Two tracks (do 1 first)

1. **Remilia Wiki entries** — author proper encyclopedic articles using Remilia's official
   agent-oriented tooling: **remilia-wikitool**
   (https://github.com/remiliacorporation/remilia-wikitool/releases — 0.6.0 as of Jul 2026).
   It runs guided "knowledge interviews," drafts against the live wiki's schema (MediaWiki +
   Cargo), and lints/validates before publishing. Use it — entries written their way don't get
   reverted as shill content.
2. **(later, optional) On-site "Lawbpedia"** — static lore pages on lawb.xyz styled as Win98
   help files, linking out to the Remilia Wiki. Zero hosting cost (static). Only after track 1.

## Candidate articles (draft in this order)
- **$LAWB** — the token: chains (ETH/SOL/Base/Arb), history, links (GeckoTerminal, NFTX, contracts in CONTRACT_ADDRESSES.md).
- **Lawbsters** (420, ETH) / **Lawbstarz** (666, ETH) / **Pixelawbs** (2222, ETH, Scatter, MS2-priced list) / **ASCII Lawbsters** (420, Base) / **Halloween Lawbsters** (Base) — collections, mint history.
- **lawb.xyz** — the Win98-desktop site itself as a New Net Art work; games (Reef Run, Lawb Chess), Clawb TV on retake.tv.
- **Clawb** — the character/stream.

## Source material (all in this repo)
- `CONTRACT_ADDRESSES.md`, `src/config/nftCollections.ts`, `src/config/tokens.ts` — hard facts.
- `docs/archive/` — historical docs (mint dates, infra history).
- Git history — launch/feature chronology.
- External evidence to archive: scatter.art collection pages, OpenSea, Miladychan threads.

## Wiki house style (from their editorial standards)
Encyclopedic neutral tone, chronological clarity, archival references for every claim.
No promo language. Write like a historian, not a marketer.

## Paste-ready prompt for the dedicated session
```
Prepare Lawb ecosystem entries for the Remilia Wiki (wiki.remilia.org).
Read LAWBWIKI_SESSION.md at the repo root first — it has the article list, source
material locations, and house-style rules.

Steps:
1. Download the latest remilia-wikitool release
   (https://github.com/remiliacorporation/remilia-wikitool/releases) and get it running
   locally; learn its interview -> draft -> lint workflow before writing anything.
2. Research each candidate article from the repo sources + archived external links
   (archive.org captures where possible for citations).
3. Draft the $LAWB and lawb.xyz articles first, run them through wikitool validation,
   and save drafts to docs/wiki-drafts/ for the owner's review BEFORE anything is
   submitted to the wiki. Do not publish anything without the owner's explicit OK.
Keep costs in mind: no paid APIs, no deploys; this is research + writing only.
```
