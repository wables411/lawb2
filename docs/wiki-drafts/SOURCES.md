# Wiki draft sources & verification notes

> **2026-07-21 owner rulings:** (1) Token ($LAWB) and Clawb are excluded for now — the
> `$LAWB.wiki` draft is parked in `on-hold/` and the Clawb/Token sections were removed from
> `Lawb.xyz.wiki`. (2) Owner-canon lore lives in `docs/LAWBLORE.md` — it wins over
> everything below. Lawbsters origin facts (Portion Club DAO deploy, Neochibi, HashLips,
> lobster emoji, Pappachaga trait lease, group-chat origin quote, 4-post fictional news
> story, trait reference list) come from the owner directly.

Companion to `$LAWB.wiki` and `Lawb.xyz.wiki` (drafted 2026-07-20, wikitool 0.6.1,
`article lint` + `review` both clean). **Nothing has been pushed to the wiki.**

## How to publish (when you're ready)

1. Review/edit the two `.wiki` files here.
2. In `tools/wikitool/wikitool-0.6.1-windows-x86_64/`, set bot credentials
   (`WIKITOOL_BOT_USER` / `WIKITOOL_BOT_PASS` from wiki.remilia.org Special:BotPasswords).
3. `wikitool article promote .wikitool/drafts/<name>.wiki --title "<Title>"`, then
   `wikitool push --dry-run --summary "..."` and review before `wikitool push`.

## Verified facts and their sources

| Fact | Source |
|---|---|
| $LAWB Solana mint `65GVcF...UUdV6`, name "🦞", 6 decimals, supply ≈999,131,071 | GeckoTerminal API (networks/solana/tokens/...) |
| Created 03.15.24 on pump.fun; airdrop to LawbStation holders 03.19.24 | lawb.xyz token window (site copy) |
| Raydium LAWB/SOL pool `DTxVuY...vep` | GeckoTerminal + Dexscreener |
| Base LAWB `0x7e18...ad15B` = proxy to `CrossChainERC20`, 6 dec | Blockscout Base API |
| Arbitrum LAWB `0x741f...C962`, 6 dec, bridged supply ~1.7M | GeckoTerminal API |
| Sanko LAWB `0xA7DA...b9F` | lawb.xyz only (Sanko explorer API 404'd — could not independently verify) |
| Lawbsters deploy **2023-02-01**, Zora ERC721Drop, 420 supply, 0.015 ETH | Etherscan/Blockscout tx `0xf4e1a8e1...`; CoinStats corroborates |
| Lawbstarz deploy **2023-05-31**, Scatter Archetype, 666, 0.02 ETH sold out | Etherscan/Blockscout; scatter.art/collection/lawbstarz |
| Lawbstarz lore tweet | x.com/wables411/status/1669009492007354369 (Jun 14, 2023) — **no Wayback snapshot exists** |
| A Lawbster Halloween **2023-10-23**, Zora ERC721Drop on Base | Blockscout Base (first activity ts 1698049425) |
| ASCII Lawbsters first activity **2024-02-06**, thirdweb DropERC721, symbol `lawbcii` | Blockscout Base |
| Pixelawbs deploy **2025-06-11**, Scatter ArchetypeErc721a, 2222 max, still minting | Blockscout; scatter.art/collection/pixelawbs |
| lawb.xyz earliest Wayback capture **2024-05-17** | web.archive.org/web/20240517073131/https://lawb.xyz/ |
| Clawb stream at retake.tv/clawb (not /lawb) | lawb.xyz Clawb window |

## Archive.org snapshots (for the wiki's archive-url fields — house style says humans fill these in)

- Dexscreener LAWB/SOL: http://web.archive.org/web/20250616221012/https://dexscreener.com/solana/dtxvuypheobwo66afefp9mfgt2e14c6ufexnvxwnvep
- OpenSea Lawbsters: http://web.archive.org/web/20231102123026/https://opensea.io/collection/lawbsters
- Scatter Lawbstarz: http://web.archive.org/web/20260518065557/https://www.scatter.art/collection/lawbstarz
- Scatter Pixelawbs: http://web.archive.org/web/20260310041338/https://www.scatter.art/collection/pixelawbs
- Magic Eden LawbStation: http://web.archive.org/web/20240906183421/https://magiceden.io/marketplace/lawbstation
- Magic Eden LawbNexus: http://web.archive.org/web/20240523185014/https://magiceden.io/marketplace/lawbnexus
- lawb.xyz (earliest): http://web.archive.org/web/20240517073131/https://lawb.xyz/
- lawb.xyz (latest checked): http://web.archive.org/web/20260519122841/https://lawb.xyz/

## Facts deliberately left OUT of the drafts (couldn't verify — decide before publishing)

- LawbStation supply and mint date (Magic Eden API rate-limited; "June 14, 2023" in one
  search result likely conflates the Lawbstarz tweet).
- LawbNexus mint date (existed by May 2024 per Wayback).
- MS2-priced Pixelawbs mint list (in site code, no public doc).
- Any $LAWB market-cap/price claims.
- **Trap:** an unrelated 18-decimal "LAWB" on Base (`0xb6317130a11c4E626D7aFabA922212CE2457809d`,
  June 2026, 100B supply) is what Dexscreener currently indexes as "LAWB on Base".
  It is NOT yours — the drafts deliberately cite only `0x7e18...ad15B`.
- "there is no meme we lawb you" as a riff on Milady's "there is no team" — plausible
  but unsourced, so not asserted.

## Existing wiki canon that mentions the ecosystem (linked in drafts)

- `Stationthisbot` article: "An early use was Lawbstation, a collection by wables given its
  low-poly look by running its art through img2img on the bot."
- `Milady Raves` article: Wables DJed Milady Rave Denver, March 2, 2023.

## Next candidate articles (per LAWBWIKI_SESSION.md order)

Lawbsters → Lawbstarz → Pixelawbs → ASCII Lawbsters → Halloween Lawbsters → Clawb.
The research above covers most of their hard facts already.
