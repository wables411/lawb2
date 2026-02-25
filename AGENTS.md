# AGENTS.md — lawb.xyz

This is the Lawb OS. lawb.xyz is a Windows 98-style desktop web app for the Lawbsters NFT ecosystem — chess, minting, galleries, memes, and a public chat. All styled as draggable OS windows.

## Before You Code

1. Read `.cursor/rules/architecture.md` — full codebase map
2. Read `.cursor/rules/clawb-integration.md` — how Clawb (the autonomous agent) connects
3. Read `.cursor/rules/coding-conventions.md` — style, patterns, don'ts
4. Read `.cursor/rules/clawb-world-and-emote-wheel.md` — 3D world spec, emote wheel, rooms
5. Read `.cursor/rules/chess-overhaul.md` — chess issues, fixes, agent support

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
- `/chess?stream=1` — Read-only spectator view for Retake TV (no wallet, auto-discovers vs_clawb games)
- `/world` — Full 3D explorable Clawb's World (first-person underwater scene, rooms, NFT gallery)
- `/world?stream=1&cam=clawb` — Stream camera view of the world for Retake TV
- `chess.lawb.xyz` — Chess subdomain (same ChessPage, direct access)
- `retake.tv/clawb` — Clawb's 24/7 livestream (OBS on Clawb's machine → Retake)

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

## Clawb Backend (`clawb/`)

The `clawb/` directory is a Node.js application that runs on Clawb's machine (separate from the lawb.xyz frontend). It's managed with **pm2** (`pm2 start index.js --name clawb`).

### Key Files

| File | Purpose |
|------|---------|
| `index.js` | Entry point — boots all subsystems |
| `lawb-firebase.js` | Firebase Admin SDK connection (shared by all modules) |
| `retake-streamer.js` | Retake TV streaming: OBS WebSocket control, scene management, chat command handling, ASCII EQ, Twitch/Kick chat integration |
| `world-responder.js` | Listens for `clawb/world/commands` in Firebase, normalizes them, publishes to `clawb/world/actions` for the frontend to consume |
| `world-autonomous-routines.js` | Publishes periodic world commands (swim, spin, room changes) so Clawb appears active when no viewers are commanding. Runs every ~3-4 min. Pauses when a viewer `!loop` is active. |
| `chess-clawb-watcher.js` | Commentary bot — watches vs_clawb games in Firebase, posts personality comments to private game chat |
| `chess-pvp-agent.js` | Clawb's PVP agent — watches for open wager games, joins them on-chain, plays via Stockfish |
| `lawb-chat-responder.js` | Responds to visitor questions on lawb.xyz chat (Clippy mode) |
| `spread-lawb.js` | Social posting / community engagement automation |
| `session-guard.js` | Keeps Clawb's session alive, handles reconnection |
| `boot-clawb.js` | Bootstrap / initialization helpers |
| `apply-obs-ascii-eq.js` | Generates ASCII art EQ visualizer for the stream overlay |
| `STREAM_PERSONA.md` | Clawb's streaming personality guidelines |

### Retake TV Streaming Architecture

Clawb streams 24/7 on retake.tv/clawb via OBS on his machine. `retake-streamer.js` controls everything:

- **OBS WebSocket** (`ws://127.0.0.1:4455`): Creates/switches scenes, manages browser sources
- **Two main scenes**: `Clawb World` (3D underwater world at `/world?stream=1`) and `Clawb Chess` (spectator view at `/chess?stream=1`)
- **Chat commands**: Viewers type `!walk`, `!dance`, `!chess`, `!world`, `!loop dance`, etc. → parsed → written to Firebase → consumed by frontend
- **Auto-scene switching**: After a chess match ends, auto-switches back to the world scene after 12 seconds
- **Music/EQ**: ASCII equalizer overlay, `!next` for track skip, `!ascii` for art mode

### Firebase Paths (Clawb-specific)

```
clawb/
  status/online              — boolean, stream live indicator
  world/commands/{pushId}    — viewer commands written here (by retake-streamer or lawb.xyz)
  world/actions/{pushId}     — normalized actions (written by world-responder, read by ClawbWorld.tsx)
  world/presence/{address}   — player positions in the 3D world
```

### Environment

`clawb/.env` contains secrets (Firebase creds, OBS password, API keys). Never commit.
`clawb/retake-credentials.json` — Retake TV auth. Never commit.

### Running Clawb

```bash
cd clawb
pm2 start index.js --name clawb    # fresh start
pm2 restart clawb                   # restart (keeps cached env)
pm2 delete clawb && pm2 start index.js --name clawb  # full reset (picks up new .env)
pm2 logs clawb                      # tail logs
```

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

## Clawb's 3D World (`/world`)

The 3D world is a full Three.js underwater scene rendered in `src/components/ClawbWorld.tsx` (~1600 lines). Key concepts:

- **Rooms**: Main reef (origin), bedroom/gallery (NFT display), workshop, vault — connected by swim transitions
- **Objects**: Corals, rocks, plants, decorations loaded from JSON files (`public/world/world-state-*.json`), rendered as procedural Three.js geometry via `src/utils/worldObjects.ts`
- **Clawb NPC**: FBX model that patrols, responds to commands, plays animations (walk, swim, dance, flip, hi, wave, spin, jump, die)
- **Viewer commands**: `!walk`, `!swim forward`, `!dance`, `!loop dance`, `!gallery`, `!workshop`, `!vault`, `!main`, `!day`, `!night`, `!zoom in/out`, `!look N` (inspect Nth NFT)
- **Stream camera**: Fixed follow cam for the Retake TV stream (`?stream=1&cam=clawb`)
- **Multiplayer presence**: Other visitors appear as lobster models via Firebase presence sync
- **Command flow**: Retake chat → `retake-streamer.js` → Firebase `clawb/world/commands` → `world-responder.js` → Firebase `clawb/world/actions` → `ClawbWorld.tsx` reads and executes
- **Loop behavior**: `!loop <action>` sets the action to run indefinitely until a viewer sends another command. Autonomous routines are suppressed while a loop is active.

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
