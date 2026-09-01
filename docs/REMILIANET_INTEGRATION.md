# RemiliaNET integration

Docs: <https://docs.remilia.net> · API base `https://www.remilia.net/api/v1` ·
OIDC issuer `https://www.remilia.net/oidc/realms/remilia` (Keycloak).

Three pieces are built. Two of them are live-inert until an application exists in
the RemiliaNET developer portal — see [What the owner has to do](#what-the-owner-has-to-do).

## 1. Public profile reads (no credentials, working today)

`GET /users/{handle}` needs no token and answers `access-control-allow-origin: *`,
so the browser calls it directly.

- [src/remiliaNet.ts](../src/remiliaNet.ts) — fetch + parse + sessionStorage cache (10 min).
- Pfp URLs come back **absolute** for default avatars (`pfp.remilia.net`) and
  **relative** (`/imgproxy/...`) for NFT avatars. `remiliaImageUrl()` fixes both;
  don't use `pfpUrl` raw.
- Verified live from the browser against `@remilia` (default pfp) and `@soap`
  (imgproxy pfp) — both render.

## 2. Sign in with RemiliaNET → verified link

Authorization Code + PKCE, popup, public client.

| File | Role |
| --- | --- |
| [src/config/remiliaNet.ts](../src/config/remiliaNet.ts) | endpoints, client id, feature flags |
| [src/remiliaAuth.ts](../src/remiliaAuth.ts) | PKCE, popup, calls the function |
| [public/remilia-callback.html](../public/remilia-callback.html) | static redirect target; posts the code to the opener |
| [functions/remilia-auth.js](../functions/remilia-auth.js) | code→token exchange, `/me`, admin-SDK write |
| [src/remiliaLink.ts](../src/remiliaLink.ts) | reads the link; 60s cache |
| [src/components/RemiliaNetSection.tsx](../src/components/RemiliaNetSection.tsx) | profile panel |

Data model (both nodes are `.write: false` for every client — only the admin SDK writes them):

```
remilia_links/<walletKey>   { handle, display_name, pfp_url, social_credit,
                              achievements_count, sub, verified, linked_at, updated_at }
remilia_handles/<handle>    { wallet, linked_at }     one handle, one wallet
```

Design notes worth keeping:

- **Why server-side exchange for a public client.** The link has to be written to
  an admin-only node or `verified` means nothing. The function also proves wallet
  ownership first: the caller sends the Firebase ID token minted by
  `wallet-auth.js`, whose uid *is* the wallet key. Without that, anyone with an
  authorization code could attach a handle to a wallet they don't own.
- **No self-typed handles are stored.** An unverified claim would let anyone wear
  someone else's name and pfp on the leaderboard. `?remiliapreview=<handle>`
  renders the card from public data for UI work; it writes nothing.
- **No silent-iframe renew.** remilia.net sends `frame-ancestors 'self'`, so
  lawb.xyz can never frame the auth server. Popup redirect only.
- A verified handle outranks ENS in [displayName.ts](../src/utils/displayName.ts),
  but not a username the player set here.

## 3. Leaderboard gate

Owner's intent: signing in with RemiliaNET is the last requirement to earn and
climb. Two halves:

**Client** — `canEarnLeaderboardPoints()` in
[src/firebaseLeaderboard.ts](../src/firebaseLeaderboard.ts) guards every award
path (`updateLeaderboardEntry`, `addEcosystemPoints`, `setHoldingsPoints`). With
the gate on and no link, the write is skipped and a `lawb:remilia-gate-blocked`
event fires so the UI can prompt. Enabled by `VITE_REMILIA_LEADERBOARD_GATE=1`.

**Rules** — the enforcing half. Not deployed: flipping it instantly blocks every
unlinked player, so it goes live only once adoption is there. Change
`leaderboard/$walletAddress` `.write` in [database.rules.json](../database.rules.json) to append:

```
&& root.child('remilia_links').child(auth.uid).child('verified').val() === true
```

Existing balances are never touched by either half — the gate blocks new writes,
it does not subtract.

## 4. Open-match announcements in RemiliaNET global chat

[elo-indexer/remiliaAnnounce.mjs](../elo-indexer/remiliaAnnounce.mjs), called from
`main()` in the indexer. An open match is a `GameCreated` with no `GameJoined` and
no `GameEnded` — already in the indexer's event cache, so this costs no RPC calls
and no Firebase reads.

- Announces **CULT stakes and Remilia-NFT stakes only**. Native, DMT and
  lawb-native NFT matches stay quiet — a Lawbsters match is not news in that room.
- Dedupes in `state/remilia-announced.json`, ignores matches older than
  `REMILIA_ANNOUNCE_MAX_AGE_H` (default 6), caps `REMILIA_ANNOUNCE_MAX_PER_RUN`
  (default 3), sleeps 2.5s between posts (documented limit is 1 per 2s).
- Failures are swallowed — a chat outage must never stop ELO from publishing.
- `node elo-indexer/indexer.mjs --dry-run` prints the lines it would post.

### Which NFTs count as Remilia

**The rule is a denylist of lawb's own collections, not an allowlist of theirs.**
Every allowlisted NFT stake announces except the six that are ours.

Why that way round. RemiliaNET has ~51 projects — enumerated at
[remistats.net/communities](https://remistats.net/communities), corroborated by
sampling 160 public profiles for distinct `pfp.project` slugs (2026-08-11, 41 of
the same names, no contradictions). The API lists them nowhere:
`/api/v1/collections`, `/api/v1/pfp/projects` and every sibling path 404.

Mapping those 51 names to contract addresses is where it falls apart. The Remilia
wiki has pages for some, and its search collides badly: *Schizoposters* resolves
to Radbro's contract, *PudgyMilady* to Kemonokaki's, *BoredMilady* to Pixelady
Maker's, and 32 of the 51 have no address on the wiki at all. A hardcoded table
of 51 would be wrong in ways nobody would notice for months.

It is also unnecessary. Only collections on the chess contract's on-chain
allowlist can be staked (§16.1), and that list is curated by hand — nine entries
today. So the denylist is exact and finite, and the day any Remilia collection is
allowlisted for wagering it announces itself with no table to update.

Excluded (`LAWB_NATIVE_NFTS`): Lawbsters, Lawbstarz, Pixelawbsters,
A Lawbster Halloween, ASCII Lawbs, Frequent Flyers.

Announcing today: Milady, Radbro Webring V2, Kemonokaki.

Collection names in the message come from an on-chain `name()` read, cached
forever in the state file, with overrides for the two whose contract name is
unhelpful (`Milady Maker` → Milady). An unreadable name degrades to "an NFT",
never to `undefined`.

Sample line:

```
open chess match on lawb.xyz — 250,000 CULT per side, Ethereum. code abc123def456 — join at https://lawb.xyz/chess
```

**Posting requires a user account.** `POST /global-chat/messages` rejects
app-only tokens with `403 requires_user`, so the announcer posts as one
designated RemiliaNET account. Get its refresh token once with:

```bash
REMILIA_CLIENT_ID=<login client id> node scripts/remilia-login.mjs
```

Sign in as the account that should appear as the poster. The token is a
credential: droplet env file, `chmod 600`, never committed. Rotated tokens are
persisted back into the state file automatically.

## What the owner has to do

1. Sign in at <https://www.remilia.net>, open the developer portal from the
   profile menu, create an application, type **Login (public)**.
2. Register these redirect URIs verbatim:
   - `https://lawb.xyz/remilia-callback.html`
   - `http://localhost:5173/remilia-callback.html` (dev + the login helper)
3. Scopes: `openid` covers the account link. Add `remilia:chat.write` and
   `offline_access` for the chess announcements.
4. Send over the client id.

## Environment

| Variable | Where | Purpose |
| --- | --- | --- |
| `VITE_REMILIA_CLIENT_ID` | Netlify build | login client id; empty hides the link UI |
| `VITE_REMILIA_EXTRA_SCOPES` | Netlify build | extra scopes beyond `openid` |
| `VITE_REMILIA_LEADERBOARD_GATE` | Netlify build | `1` = points require a link |
| `REMILIA_CLIENT_ID` | Netlify function + droplet | same id, server side |
| `REMILIA_ANNOUNCE` | droplet | `1` enables chat posting |
| `REMILIA_REFRESH_TOKEN` | droplet | seed token from `scripts/remilia-login.mjs` |
| `REMILIA_ANNOUNCE_MAX_AGE_H` / `REMILIA_ANNOUNCE_MAX_PER_RUN` | droplet | throttles |

`_headers` already carries `https://www.remilia.net` in `connect-src`; `img-src`
was already `https:`.

## Not built (ready to be, once scopes are approved)

- `/me/stats` → CULT tier and collections as a badge on the chess board and the
  diver's ID card (`remilia:stats.read`).
- Beetle cards alongside the satchel's junk log (`remilia:beetle.read`).
- Poke-to-nudge on async chess — the 24h poke cooldown fits waiting-for-a-move
  almost exactly (`remilia:pokes.write`).
- `directory.read` backfill mapping known X handles to RemiliaNET identities
  (app-only, needs the confidential API client and its secret — droplet only,
  never the bundle).

## Docs re-audit 2026-08-31 (full crawl of docs.remilia.net — 4 pages total)

New or firmed-up since the 2026-08-11 build:

- **`remilia:chat.read` exists and is DUAL-MODE (user-delegated OR app-only).**
  `GET /global-chat/messages` — `limit` ≤100, `before` cursor, oldest-first,
  messages carry replies/media/reactions/edits. App-only means the droplet can
  mirror the real RemiliaNET global chat into a static JSON (elo.json/tides
  pattern) with just the confidential API client — no login client, no user.
  This reshapes overhaul step 4: the console's chat rail can SHOW the real room
  read-only for everyone; posting stays user-delegated `chat.write`.
- **`remilia:notifications.read`** (new): `GET /me/notifications`, limit 1–50.
- **Directory confirmed app-only capable**: `POST /directory/resolve` takes up to
  50 identifiers of types handle / x_handle / github / discord; `GET /users`
  enumerates with cursor. The X-handle backfill idea is fully supported.
- **Confidential client approval loop**: client id is immediate but the SECRET is
  only revealed "after approval" — register early, the wait is on their admins.
- Rate limits confirmed: chat post 1/2s (our announcer's 2.5s spacing is safe),
  text ≤8192 bytes; poke 24h cooldown returns `429 poke_cooldown` +
  `next_allowed_at` (fits the async-chess nudge).
- Login guide now offers an oidc-spa React path; our manual PKCE flow remains a
  documented first-class option — no rework needed.

Owner registration is now TWO applications, both worth doing in one portal visit:
1. **Login (public)** — as §"What the owner has to do" above.
2. **API key (confidential)** — scopes `remilia:chat.read` + `remilia:directory.read`;
   secret arrives after their approval; droplet-only, never the bundle.
