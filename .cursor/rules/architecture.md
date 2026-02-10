# lawb.xyz Architecture Reference

## Overview

lawb.xyz is a "Lawb OS" — a Windows 98-style desktop web app for the Lawbsters NFT ecosystem. It's a React SPA with chess (single-player + on-chain PVP), NFT minting, galleries, meme generator, and a public chat — all styled as draggable OS windows.

## Stack

- **Framework**: React 18 + TypeScript + Vite
- **Styling**: react-jss + vanilla CSS (Win98 aesthetic)
- **Wallet**: wagmi v2 + viem + Reown AppKit (WalletConnect)
- **3D**: Three.js + FBXLoader (Clawb model, chess pieces)
- **Chess engine**: chess.js (client-side logic) + Stockfish API at chess.lawb.xyz (hard mode AI)
- **Database**: Firebase Realtime Database (project: `chess-220ee`)
- **Smart contracts**: Solidity (LAWBCHESS3000 — ERC1967 proxy pattern)
- **Hosting**: GitHub → Netlify → Cloudflare → Firebase
- **Chains**: Base (primary for chess), Sanko, Arbitrum, Ethereum, Solana

## Routing (src/main.tsx)

- `/` → Desktop view (Root component — App.tsx desktop or Mobile.tsx)
- `/chess` → ChessPage (full chess experience)
- `chess.lawb.xyz/*` → ChessPage (chess subdomain serves chess directly)

## Key Components

### Desktop / OS Shell
- `Desktop.tsx` — Icon grid, desktop layout
- `LinuxNavBar.tsx` — Top taskbar with wallet, chat, profile buttons
- `Taskbar.tsx` — Bottom taskbar
- `Popup.tsx` — Draggable/resizable Win98-style windows
- `Icon.tsx` — Desktop icons
- `ThemeToggle.tsx` — Dark/light mode

### Clawb (3D Lawbster)
- `Clawb.tsx` — 3D FBX model at bottom of screen. Walks, dances, idles. Speech bubbles with typewriter effect. Click to cycle animations. Already integrated into App.tsx and LinuxNavBar.
- Assets: `/assets/lawbidle.fbx`, `lawbWalk.fbx`, `lawbdance1-3.fbx`, `lawbdeath.fbx`
- Ref handle: `ClawbHandle.cycleAnimation()` — triggered from nav bar

### Chess
- `ChessGame.tsx` (170KB) — Main single-player chess game. Modes: easy/medium/hard. Hard mode calls Stockfish API.
- `ChessMultiplayer.tsx` (326KB) — On-chain PVP chess. Wagers, contract interaction, Firebase game state sync.
- `ChessPage.tsx` — Page wrapper for /chess route. Renders ChessGame + nav + popups.
- `ChessChat.tsx` (24KB) — Firebase-backed chat. Public room + per-game private rooms.
- `ChessPieceInfo.tsx` — Piece selection UI (custom piece sets)
- `chess/ChessConsole.tsx` — Debug console for chess

### NFT / Minting
- `MintPopup.tsx` — Unified mint window (ASCII LAWBS + Pixelawbsters)
- `AsciiLawbsterMint.tsx` — ASCII LAWBS minting on Base
- `NFTGallery.tsx` — Display connected wallet's NFTs
- `NFTDetailPopup.tsx` — Single NFT detail view
- `MemeGenerator.tsx` — Meme creation tool

### Other
- `PlayerProfile.tsx` — Wallet-linked player profiles with stats
- `TokenSelector.tsx` — Multi-token wager selection
- `ChainSelector.tsx` — Chain switching
- `MediaGallery.tsx` — Image gallery
- `HowToContent.tsx` — How-to guide

## Firebase Structure

Project: `chess-220ee` | DB URL: `https://chess-220ee-default-rtdb.firebaseio.com`

```
chess_games/
  {inviteCode}/
    invite_code, game_title, bet_amount, bet_token
    blue_player, red_player (wallet addresses)
    game_state: "waiting_for_join" | "waiting" | "active" | "finished"
    board: { positions: {"row,col": "piece"}, rows: 8, cols: 8 }
    current_player: "blue" | "red"
    winner: "blue" | "red" | null
    chain: "sanko" | "base" | "arbitrum"
    contract_address, is_public, created_at, updated_at

chess_chat/
  public/
    messages/{pushId}: { userId, walletAddress, displayName, message, timestamp, room: "public" }
    lastMessage: timestamp
  private/
    {inviteCode}/
      participants: { walletAddress: true }
      messages/{pushId}: { ...same as public, inviteCode }
      lastMessage: timestamp

leaderboard/
  {username}: { points, wins, losses, ... }
```

Files:
- `src/firebaseApp.ts` — Firebase init (config hardcoded with env var overrides)
- `src/firebaseChess.ts` — Game CRUD, subscriptions, leaderboard
- `src/firebaseChat.ts` — Chat send/listen for public and private rooms
- `src/firebaseLeaderboard.ts` — Leaderboard operations
- `src/firebaseProfiles.ts` — Player profile operations

## Smart Contracts

### LAWBCHESS3000 (ChessGameUpgradable.sol)

**Base Mainnet:**
- Proxy: `0x06b6aAe693cf1Af27d5a5df0d0AC88aF3faC9E11`
- Implementation: `0x7d287427EC6bBEF1f00e8d8f3300a9be18cF8f29`
- Verified on Sourcify

**Sanko Mainnet:** `0x4a8A3BC091c33eCC1440b6734B0324f8d0457C56`
**Sanko Testnet:** `0x3112AF5728520F52FD1C6710dD7bD52285a68e47`

Key functions: `createGame()`, `joinGame()`, `endGame()`, `cancelGame()`
Pattern: ERC1967 Proxy — all calls go to proxy address, storage in proxy, logic in implementation.
`allowAllTokens: true` — any ERC-20 can be wagered.

## Token Config (src/config/tokens.ts)

Multi-chain tokens:
- **Base (8453)**: ETH (native), USDC, GG, LAWB (`0x7e18...5B`), wables411
- **Sanko (1996)**: DMT (native), WDMT, GOLD, LAWB (`0xA7DA...9F`), MOSS
- **Arbitrum (42161)**: ETH (native), USDC

$LAWB decimals: 6 (not 18)

## Stockfish API (chess.lawb.xyz)

- Node.js server spawning Stockfish binary
- Deployed via Docker on DigitalOcean droplet
- Endpoint: `POST https://chess.lawb.xyz/api/stockfish`
- Body: `{ fen: string, difficulty?: string, movetime?: number }`
- Response: `{ bestmove, fen, evaluation, depth, skillLevel }`
- Files: `simple-stockfish-api.js`, `Dockerfile.chess-api`, `docker-compose.chess-api.yml`

## Build & Deploy

- `npm run dev` — local Vite dev server
- `npm run build` — `tsc && vite build` → `dist/`
- Netlify auto-deploys from GitHub `main` branch
- Netlify config: `netlify.toml`
- Custom headers: `_headers` file

## Important Patterns

1. **Lazy loading**: Heavy components (MintPopup, ChessChat, NFTGallery, Clawb, etc.) use `React.lazy()` + `Suspense`
2. **Win98 UI**: All windows use `Popup.tsx` — draggable, resizable, minimizable
3. **Mobile detection**: `useMediaQuery` hook + UA sniffing. Separate `Mobile.tsx` for mobile users.
4. **Wallet connection**: AppKit (Reown/WalletConnect) with fallback wagmi config. Polling for AppKit load.
5. **Game state sync**: Contract is source of truth → Firebase mirrors state for real-time UI. `firebaseChess.ts` handles sync.
6. **Chess subdomain**: `chess.lawb.xyz` serves ChessPage directly (detected by hostname check in main.tsx)
