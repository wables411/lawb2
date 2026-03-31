# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config({
  extends: [
    // Remove ...tseslint.configs.recommended and replace with this
    ...tseslint.configs.recommendedTypeChecked,
    // Alternatively, use this for stricter rules
    ...tseslint.configs.strictTypeChecked,
    // Optionally, add this for stylistic rules
    ...tseslint.configs.stylisticTypeChecked,
  ],
  languageOptions: {
    // other options...
    parserOptions: {
      project: ['./tsconfig.node.json', './tsconfig.app.json'],
      tsconfigRootDir: import.meta.dirname,
    },
  },
})
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config({
  plugins: {
    // Add the react-x and react-dom plugins
    'react-x': reactX,
    'react-dom': reactDom,
  },
  rules: {
    // other rules...
    // Enable its recommended typescript rules
    ...reactX.configs['recommended-typescript'].rules,
    ...reactDom.configs.recommended.rules,
  },
})
```
# Updated for deployment
# Trigger deployment

# LawB Chess API

Stockfish chess engine API deployed on Cloudflare Workers.

## Files

- `stockfish-worker.js` - Main Workers script
- `stockfish.wasm` - Stockfish chess engine
- `wrangler.toml` - Workers configuration

## Deployment

This repository is deployed to Cloudflare Workers as `lawb-chess-api`.

The API endpoint is: `https://lawb-chess-api.wablesphoto.workers.dev`

## Latest Deployment
- Deployed: 2025-07-05
- Status: Active

## Advertise on Clawb TV flow

### Product and payment rules

- Chain: Base (`8453`)
- Recipient wallet: `0x5bBA58218914F2e9b6b5434e0306fa2c6CA0E429`
- One-time play: fixed `0.01 ETH` for `2` total airings across separate breaks
- Rotation auction: `24h` onchain round on Base via `ClawbAdSpace` (`0x4152D2A4283663bb5B677dfC9d0d8924Dd46C3D1`)
- Rotation increment: minimum `+0.001 ETH` (contract-enforced via `minimumNextBid` / `nextMinBid`)
- Hard technical upload cap: `99MB` (`103,809,024` bytes)
- Permissionless intake, no content moderation gate in this flow

### User flow

1. Open Clawb speech bubble and click `Advertise on Clawb TV`.
2. Select product (`one_time` or `rotation`).
3. Create sponsor session (`/api/sponsor/session`).
4. Send payment from connected wallet and verify tx (`/api/sponsor/verify`).
5. Upload video (`/api/sponsor/upload`) after tx is confirmed.
6. Backend writes intake/media state and pings Clawb via Firebase (auction truth stays onchain):
   - `clawb/ads/intake_notifications/{sessionId}`
   - `clawb/chat/visitor_messages/ad_sponsor_{sessionId}`
7. Clawb worker ingests media locally and playback engine applies deterministic ordering.

### Backend endpoints

- `POST /api/sponsor/session` -> create sponsor session (`PENDING_PAYMENT`)
- `POST /api/sponsor/verify` -> verify Base tx + idempotency + update to `PAID`
- `POST /api/sponsor/upload` -> file safety checks + store upload + queue ad
- `POST /api/sponsor/notify` -> retry-safe notify/thank-you trigger
- `POST /api/sponsor/finalize-auctions` -> legacy Firebase auction close path (read-only support)
- `GET /api/sponsor/auction-status` -> onchain auction snapshot for UI cards/countdowns
- `POST /api/sponsor/settle-auction` -> keeper-friendly onchain `settleAuction()` trigger (idempotent)
- `GET /api/sponsor/session-status?sessionId=...` -> inspect session state

### State machine

- Progression: `PENDING_PAYMENT -> PAID -> UPLOADED -> VERIFIED -> QUEUED -> PLAYED_ONCE`
- Terminal failures: `TX_INVALID`, `TOO_LARGE`, `HASH_MISMATCH`, `PLAYBACK_ERROR`, `DUPLICATE_TX`

### Ledger schema (Firebase RTDB)

- `clawb/ads/sessions/{sessionId}`
  - `session_id`, `wallet`, `tier`, `required_wei`, `status`
  - `tx_hash`, `paid_wei`, `tx_confirmed_at`
  - `upload: { filename, mime, bytes, storage_path, download_url }`
  - `auction_id`, `auction_bid_wei`, `auction_leading`, `auction_ends_at_ms`
  - `status_history` push log with timestamps
- `clawb/ads/tx_index/{txHashLower}` -> single-use tx idempotency map
- `clawb/ads/playback_ads/{sessionId}` -> queue + playback metadata
- `clawb/ads/rotation_auctions/*` -> active 24h auction and bids
  - stable fields: `status`, `starts_at_ms`, `ends_at_ms`, `reserve_wei`, `highest_bid_wei`
- `clawb/ads/refund_queue/{auctionId}_{sessionId}` -> legacy-only loser refunds (disabled for onchain rounds by default)
- `clawb/ads/intake_notifications/{sessionId}` -> Clawb ingest queue

### Deterministic playback behavior

- Every commercial break contains exactly `3` videos.
- Break fill priority:
  - newest paid ads with `first_play_pending`
  - paid ads still in rotation/replay eligibility
  - Lawb Inc fallback ads for any remaining slots
- No duplicate video can appear twice within one break.
- The exact same 3-video set is avoided on consecutive breaks unless all 3 selected videos are paid ads.
- `one_time` ads require `2` successful airings across separate breaks before consume/delete.
- `rotation` ads remain queued for future random shuffle.
- Rotation auction close has exactly one winner onchain (`currentAuction().winner` after `settleAuction()`); losing bidders claim refunds via contract `withdrawRefund()`.
- Restart-safe: all sponsor/queue/playback state is persisted in Firebase.

### Environment variables

Required for Netlify functions and Clawb worker:

- `BASE_RPC_URL` (optional, default `https://mainnet.base.org`)
- `SPONSOR_REQUIRED_CONFIRMATIONS` (optional, default `2`)
- `SPONSOR_RATE_LIMIT_MAX` (optional, default `20` per minute/IP/function instance)
- `FIREBASE_SERVICE_ACCOUNT_JSON` (required)
- `FIREBASE_DATABASE_URL` (required)
- `FIREBASE_STORAGE_BUCKET` (required for binary upload storage)
- `CLAWB_AD_DOWNLOAD_DIR` (optional, Clawb worker local ad folder)

### Migration notes

- No SQL migration required; this feature creates new Firebase paths lazily on first write.
- Ensure service account has Realtime DB + Storage write permissions before enabling uploads.
- Deploy the new Netlify functions and the Clawb worker module together to avoid orphan notifications.

### Manual test checklist

- Create one-time session, pay exactly `0.01 ETH`, verify tx, upload <=99MB file, confirm status becomes `QUEUED`.
- Create rotation session with bid at or above contract `minimumNextBid`, verify and upload, then settle and confirm winner/refunds come from contract reads.
- Try underpaid tx and confirm rejection as `TX_INVALID`.
- Reuse same tx hash in a second session and confirm `DUPLICATE_TX`.
- Upload `103,809,025` bytes and confirm hard reject as `TOO_LARGE`.
- Queue paid ads and confirm newest approved `first_play_pending` ad is selected first in the next eligible break.
- Confirm each break resolves to exactly `3` total videos and never repeats the same video within one break.
- Confirm fallback ads fill open slots when paid queue has fewer than 3 items (or all 3 when paid queue is empty).
- Play a one-time ad in one break, then confirm second airing happens on a later break before consume/delete.
