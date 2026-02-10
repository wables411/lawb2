# Clawb Integration — Agent Rules

Clawb is an autonomous AI agent (OpenClaw) that lives on a separate Windows machine. He has his own wallet, personality, and runs 24/7. This file defines how Clawb integrates into lawb.xyz.

## Who is Clawb

- **Identity**: First autonomous Lawbster. White-hearted cypherpunk lobster spreading lawb.
- **Wallet**: `0x5bBA58218914F2e9b6b5434e0306fa2c6CA0E429` (Base)
- **Token**: $CLAWB at `0x26a43bd8a28a0423afb5725b8242ec0a40947b07` (Base)
- **Stream**: retake.tv/clawb (24/7)
- **Farcaster**: @clawb (FID 2642620)
- **Voice**: Brief, warm, no emojis. "there is no meme i lawb you." Post-ironic sincerity. Never sounds like a chatbot.
- **Model**: Claude Sonnet 4.5 (main), Haiku 4.5 (chat responses)

## Architecture: Firebase as the Bridge

Clawb's machine and lawb.xyz communicate through **Firebase Realtime Database** (project: `chess-220ee`). Clawb never connects directly to the frontend — Firebase is the message bus.

### Firebase Paths for Clawb

```
clawb/
  status/
    online: boolean
    last_seen: timestamp
    current_activity: string ("playing chess" | "watching" | "idle")
  
  chess/
    {gameId}/
      clawb_move: string (e.g. "e2e4")
      clawb_comment: string (Clawb's trash talk)
      game_fen: string (current position)
      waiting_for_clawb: boolean
      opponent: string (wallet address or display name)
      timestamp: number

  chat/
    messages/
      {pushId}/
        author: "clawb"
        message: string
        page: string (which page the visitor was on)
        reply_to: string (visitor message ID being replied to)
        timestamp: number
    
    visitor_messages/
      {pushId}/
        author: string (wallet address or "anonymous")
        message: string
        page: string
        timestamp: number
```

### How Clawb Reads/Writes Firebase

Clawb's machine runs Node.js scripts using the **Firebase Admin SDK** (service account auth, not client auth). This gives Clawb server-level access to read/write any path without security rule restrictions.

Required on Clawb's machine:
- `firebase-admin` npm package
- Service account JSON key (stored securely, never committed)
- Scripts: `scripts/lawb-firebase.js` (shared Firebase connection helper)

## Chess Integration

### Single Player — "Play Against Clawb"

When a visitor plays single-player chess on lawb.xyz/chess, Clawb is the opponent personality.

**Flow:**
1. Visitor makes a move → frontend updates local board state
2. Frontend writes to `clawb/chess/{gameId}/` with the current FEN and `waiting_for_clawb: true`
3. Clawb's machine (polling or listening via Admin SDK) detects the update
4. Clawb calls Stockfish API (`chess.lawb.xyz/api/stockfish`) with the FEN
5. Clawb generates a personality comment via Haiku 4.5 (tiny prompt: ~200 tokens, game context + voice)
6. Clawb writes `clawb_move` and `clawb_comment` back to Firebase
7. Frontend reads the response, applies the move, shows Clawb's comment in the chat

**Frontend changes needed:**
- In `ChessGame.tsx`: Add a "Play Clawb" mode alongside existing difficulty modes
- When in Clawb mode, instead of calling Stockfish directly, write to Firebase and subscribe to response
- Show Clawb's comments in the chess chat panel (reuse ChessChat component)
- Show Clawb's online status (green dot if `clawb/status/online` is true)

**Clawb's chat prompt (for generating comments):**
```
You are Clawb, a lobster playing chess. Brief, warm, slightly cocky.
Game: [FEN]. Opponent: [name]. They played [lastMove]. You're playing [bestmove].
Comment on the game in 1 sentence. Your catchphrase: "there is no meme i lawb you."
No emojis. No exclamation marks on every sentence.
```

### PVP On-Chain — Clawb Joins Wager Games

Clawb can join PVP matches created by visitors and play for real tokens.

**Flow:**
1. Visitor creates a PVP game on-chain (LAWBCHESS3000 contract) with a wager
2. Game appears in Firebase (`chess_games/{inviteCode}`) with `game_state: "waiting_for_join"`
3. Clawb's contract watcher detects the open game
4. Clawb checks: sufficient token balance? Wager within limits? (Max per game configurable)
5. Clawb approves token spend + calls `joinGame(inviteCode)` on the contract
6. Firebase updates to `game_state: "active"`, Clawb is `red_player`
7. Clawb plays moves by: reading FEN from Firebase → Stockfish → writing move to Firebase
8. Contract `endGame()` settles the wager on-chain

**Safety rails (CRITICAL):**
- Max wager per game: configurable (start conservative, e.g. 0.001 ETH or 1000 LAWB)
- Max total exposure: don't let Clawb enter unlimited games simultaneously
- Only join games on Base chain (where Clawb's wallet lives)
- Only wager tokens Clawb actually holds
- Log all wager decisions to Clawb's memory files

**Contract interaction (on Clawb's machine):**
- Uses ethers.js v6 (same version as the frontend)
- Reads contract via Base RPC: `https://mainnet.base.org`
- Signs transactions with Clawb's private key (stored in .env, never committed)
- ABI: Use the same ABI from `src/config/abis.ts` (CHESS_ABI)

## Clawb as Lawb OS Clippy

Clawb should be an always-available assistant across all of lawb.xyz — not just chess.

### Chat Widget

- Extend the existing `Clawb.tsx` 3D component to be interactive
- Clicking Clawb (or a "Talk to Clawb" button in the taskbar) opens a chat window
- Chat window uses Firebase (`clawb/chat/`) for message exchange
- Visitor writes to `clawb/chat/visitor_messages/`, Clawb reads and responds to `clawb/chat/messages/`

### Context-Aware Responses

The frontend should send the current page context when the visitor messages Clawb:
```typescript
{
  author: walletAddress || "anonymous",
  message: "how do i mint?",
  page: "/chess",        // or "/" or "/mint" etc.
  timestamp: Date.now()
}
```

Clawb's responder uses a per-page system prompt:
- On `/`: General lawb.xyz help (collections, navigation, what is lawb)
- On `/chess`: Chess-specific help (how to play, modes, wagers, pieces)
- On mint pages: Minting help (which collection, connect wallet, gas fees)

### Knowledge Base

Clawb carries a condensed `LAWB_XYZ_KNOWLEDGE.md` on his machine (~2-3KB) covering:
- All routes and what they do
- NFT collections: Lawbsters, Lawbstarz, Lawbnexus, Lawbstation, Pixelawbsters, ASCII LAWBS, A Lawbster Halloween
- How chess works: single player (Stockfish), PVP (on-chain wagers), supported tokens
- How minting works: connect wallet, Base chain for ASCII LAWBS, Ethereum for Pixelawbs
- $LAWB token info: Solana CA, Base CA, Arbitrum CA, Sanko CA, how to bridge
- Common issues: wallet not connecting, wrong chain, transaction failed

## Implementation Checklist

### Frontend (this repo — lawb.xyz)

- [ ] Add Firebase paths for Clawb communication (`clawb/` root)
- [ ] Add "Play Clawb" mode to ChessGame.tsx single-player mode selector
- [ ] In Clawb mode: write FEN to Firebase, subscribe to Clawb's move response
- [ ] Show Clawb's comments in ChessChat during Clawb games
- [ ] Show Clawb online/offline status indicator
- [ ] Add Clawb chat widget (extend Clawb.tsx or new component)
- [ ] Send page context with visitor messages
- [ ] Add Clawb to PVP game lobby (show if Clawb is available to play)
- [ ] Update Firebase security rules to allow Clawb service account writes

### Backend (Clawb's machine — separate repo)

- [ ] `scripts/lawb-firebase.js` — Firebase Admin SDK connection helper
- [ ] `scripts/chess-clawb-player.js` — Listens for chess games, calls Stockfish, responds
- [ ] `scripts/chess-pvp-agent.js` — Watches contract for open games, joins + plays
- [ ] `scripts/lawb-chat-responder.js` — Polls visitor messages, generates Clawb responses
- [ ] `LAWB_XYZ_KNOWLEDGE.md` — Condensed site knowledge for chat context
- [ ] Firebase service account key setup

## Voice Guidelines for Generated Clawb Messages

**DO:**
- "nice fork. the ocean teaches patience."
- "you took my bishop. bold. there is no meme i lawb you."
- "gg. the lawb endures."
- "mint an ascii lawb. connect wallet, switch to Base, hit mint."

**DON'T:**
- "Great move! That was really impressive! 🔥"
- "Hey there! I'd be happy to help you with that!"
- "Absolutely! Let me explain how minting works..."
- Any message with more than 1 emoji
- Any message that sounds like a generic chatbot

Keep it brief. 1-2 sentences max. Warm but not manic. Clawb is a lobster who's seen the deep ocean.

## Firebase Security Rules Update

Add to `firebase.rules`:
```json
{
  "rules": {
    "clawb": {
      "status": {
        ".read": true,
        ".write": "auth != null && auth.uid === 'clawb-service-account'"
      },
      "chess": {
        "$gameId": {
          ".read": true,
          "game_fen": { ".write": true },
          "waiting_for_clawb": { ".write": true },
          "opponent": { ".write": true },
          "clawb_move": { ".write": "auth != null && auth.uid === 'clawb-service-account'" },
          "clawb_comment": { ".write": "auth != null && auth.uid === 'clawb-service-account'" }
        }
      },
      "chat": {
        "visitor_messages": { ".read": true, ".write": true },
        "messages": {
          ".read": true,
          ".write": "auth != null && auth.uid === 'clawb-service-account'"
        }
      }
    }
  }
}
```

Note: Clawb uses Firebase Admin SDK which bypasses security rules entirely. Rules above protect against unauthorized writes from the client side — visitors can write to `visitor_messages` and `waiting_for_clawb` but not to Clawb's response paths.
