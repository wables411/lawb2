# Coding Conventions — lawb.xyz

## General

- TypeScript strict mode. No `any` unless interfacing with Firebase (which returns untyped data).
- React functional components only. No class components.
- Use `React.lazy()` + `Suspense` for any component > 10KB.
- CSS: Vanilla CSS files alongside components (ComponentName.css). Use react-jss only in App.tsx.
- Win98 aesthetic: `#c0c0c0` backgrounds, `2px outset/inset` borders, MS Sans Serif font.

## File Structure

```
src/
  components/     # React components (*.tsx + *.css)
  config/         # Static config (tokens, ABIs, piece sets, collections)
  contexts/       # React contexts
  hooks/          # Custom hooks
  mobile/         # Mobile-specific components
  stubs/          # AppKit/wagmi stubs for build compatibility
  utils/          # Pure utility functions
  firebase*.ts    # Firebase modules (one per domain: Chess, Chat, Profiles, etc.)
  appkit.ts       # Reown AppKit initialization
  wagmi.ts        # Wagmi config
  main.tsx        # Entry point + routing
  App.tsx         # Desktop app shell
```

## Wallet / Web3

- Wallet connection: Reown AppKit (WalletConnect). Never raw ethers providers.
- Contract reads: Use wagmi hooks (`useReadContract`) when possible.
- Contract writes: Use wagmi `useWriteContract` or ethers.js v6 `Contract` for complex flows.
- Always use the **proxy** contract address, never the implementation address.
- Token amounts: Always use `ethers.parseUnits()` / `ethers.formatUnits()` with correct decimals. $LAWB is 6 decimals, not 18.

## Firebase

- Always use the helper modules (`firebaseChess.ts`, `firebaseChat.ts`, etc.), never raw Firebase SDK calls in components.
- Game state keys use `snake_case` (e.g., `game_state`, `blue_player`, `invite_code`).
- Always include `updated_at: new Date().toISOString()` on writes.
- Use `onValue()` for real-time subscriptions, `get()` for one-time reads.

## Chess Specifics

- Board representation: `{ positions: { "row,col": "piece" }, rows: 8, cols: 8 }`
- Pieces: Uppercase = blue (bottom), lowercase = red (top). K/k = King, Q/q = Queen, etc.
- Game states: `waiting_for_join` → `active` → `finished`
- Players: `blue_player` (creator), `red_player` (joiner)
- FEN strings used for Stockfish communication and chess.js validation.

## Platform Notes

- **macOS dev machine**: Use standard Unix commands. No PowerShell-specific syntax.
- **Netlify deploys**: Auto-deploy from `main` branch. `netlify.toml` configures build.
- **Cloudflare**: DNS + CDN. chess.lawb.xyz is a separate subdomain pointing to the DigitalOcean droplet.
- **DigitalOcean**: Stockfish API runs in Docker. nginx reverse proxy + Let's Encrypt SSL.

## Don't

- Don't add dependencies without checking if the functionality exists in the current stack.
- Don't modify `firebaseApp.ts` config values (they're intentionally hardcoded with env var fallbacks).
- Don't use `Invoke-WebRequest` or PowerShell-specific commands — this repo is primarily developed on macOS.
- Don't add `console.log` spam. Use `[COMPONENT_NAME]` prefix for debug logs that must stay.
- Don't break the Win98 aesthetic. New UI should match existing button/window/border styles.
