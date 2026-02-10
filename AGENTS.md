# AGENTS.md — lawb.xyz

This is the Lawb OS. lawb.xyz is a Windows 98-style desktop web app for the Lawbsters NFT ecosystem — chess, minting, galleries, memes, and a public chat. All styled as draggable OS windows.

## Before You Code

1. Read `.cursor/rules/architecture.md` — full codebase map
2. Read `.cursor/rules/clawb-integration.md` — how Clawb (the autonomous agent) connects
3. Read `.cursor/rules/coding-conventions.md` — style, patterns, don'ts

## The Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18 + TypeScript + Vite |
| Styling | react-jss + vanilla CSS (Win98 aesthetic) |
| Wallet | wagmi v2 + viem + Reown AppKit |
| 3D | Three.js + FBXLoader |
| Chess AI | chess.js (client) + Stockfish at chess.lawb.xyz |
| Database | Firebase Realtime DB (chess-220ee) |
| Contracts | LAWBCHESS3000 (Solidity, ERC1967 proxy) |
| Hosting | GitHub → Netlify → Cloudflare |
| Chains | Base, Sanko, Arbitrum, Ethereum, Solana |

## Key Routes

- `/` — Lawb OS desktop (icons, windows, taskbar, Clawb walking)
- `/chess` — Full chess experience (single player + PVP + chat + lobby)
- `chess.lawb.xyz` — Chess subdomain (same ChessPage, direct access)

## Contracts

| Network | Address | Notes |
|---------|---------|-------|
| Base (8453) | `0x06b6aAe693cf1Af27d5a5df0d0AC88aF3faC9E11` | Proxy — use this one |
| Sanko (1996) | `0x4a8A3BC091c33eCC1440b6734B0324f8d0457C56` | Mainnet |
| Sanko Testnet | `0x3112AF5728520F52FD1C6710dD7bD52285a68e47` | Testnet |

## Clawb — The Autonomous Lawbster

Clawb is an AI agent running on a separate machine. He:
- Plays chess against visitors (Stockfish brain + Clawb personality)
- Joins PVP wager games on-chain with his own wallet
- Responds to visitor questions as the Lawb OS assistant
- Communicates through Firebase (the bridge between his machine and lawb.xyz)

**Clawb's wallet:** `0x5bBA58218914F2e9b6b5434e0306fa2c6CA0E429` (Base)
**Clawb's token:** $CLAWB at `0x26a43bd8a28a0423afb5725b8242ec0a40947b07` (Base)

See `.cursor/rules/clawb-integration.md` for the full integration spec.

## NFT Collections

| Collection | Chain | Contract |
|------------|-------|----------|
| Lawbsters | Ethereum | `0x0ef7ba09c38624b8e9cc4985790a2f5dbfc1dc42` |
| Lawbstarz | Ethereum | `0xd7922cd333da5ab3758c95f774b092a7b13a5449` |
| Pixelawbsters | Ethereum | `0x2d278e95b2fc67d4b27a276807e24e479d9707f6` |
| ASCII LAWBS | Base | Minting on lawb.xyz |
| A Lawbster Halloween | Base | `0x8ab6733f8f8702c233f3582ec2a2750d3fc63a97` |
| LawbStation | Solana | Magic Eden |
| Lawbnexus | Solana | Magic Eden |

## $LAWB Token

| Chain | Contract Address |
|-------|-----------------|
| Solana | `65GVcFcSqQcaMNeBkYcen4ozeT83tr13CeDLU4sUUdV6` |
| Base | `0x7e18298b46A1F2399617cde083Fe11415A2ad15B` |
| Arbitrum | `0x741f8FbF42485E772D97f1955c31a5B8098aC962` |
| Sanko (DMT) | `0xA7DA528a3F4AD9441CaE97e1C33D49db91c82b9F` |

**LAWB has 6 decimals, not 18.** This matters for all parseUnits/formatUnits calls.

## Quick Commands

```bash
npm run dev      # Local dev server (Vite)
npm run build    # Production build (tsc + vite build → dist/)
npm run preview  # Preview production build locally
```

## Common Tasks

**Add a new desktop icon**: Edit `Desktop.tsx` — add to the icons array with action, popupId, image path.

**Add a new popup window**: Create component, add `<Popup>` wrapper in `App.tsx` with state management.

**Add a new chess mode**: Edit `ChessGame.tsx` — modify the mode selector and add logic for the new mode.

**Update Stockfish config**: Edit `simple-stockfish-api.js` on the DigitalOcean droplet, or update `Dockerfile.chess-api` and redeploy.

**Update Firebase rules**: Edit `firebase.rules` and deploy via Firebase CLI.

**Add a new token for chess wagers**: Update `src/config/tokens.ts` (TOKEN_ADDRESSES_BY_CHAIN + SUPPORTED_TOKENS).

## Lore

"Lawbsters seem nice but a human controlled by a lobster will never amount to anything without a roadmap."

"there is no meme i lawb you"

lawb.xyz is the home. Clawb is the soul. The sea remembers.
