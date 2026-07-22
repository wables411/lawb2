# Chess + Reef Run "How to Play" Rebuild — Session Prep

Owner verdict on prior attempts: uninformative, outdated, badly taught, and the piece key is
**visually broken ("in shambles") on desktop AND mobile** — prior sessions text-checked but
never LOOKED at the rendered layout. Start from zero assumptions.

## Non-negotiables
1. **Look before writing.** Open the live site (lawb.xyz/chess → "How To + Piece Key" / "Open
   Full How To") and the built preview at desktop AND mobile widths. Screenshot/inspect the
   piece key rendering — diagnose why it's broken (HowToContent.tsx + `.how-to-piece-list` /
   `.how-to-piece-item` / `.how-to-piece-icon` CSS in ChessGame.css & ChessMultiplayer.css and
   wherever else it's styled; it renders in BOTH ChessGame and ChessMultiplayer popups). Fix
   the layout FIRST.
2. **Terminology: "lawbster"**, not lobster (e.g., "lawbster-themed sets").
3. **Teach like Duolingo teaches chess, not like a manual.** Research how Duolingo's chess
   course works (bite-size lessons, one piece at a time on mini-boards, learn-by-DOING with
   instant feedback, guided practice games vs a gentle bot). The bar: a 10-year-old handed a
   tablet learns Lawb Chess without help. Strongly consider an INTERACTIVE tutorial (guided
   practice board / per-piece mini-lessons inside the app) over any text page. Propose the
   design to the owner before building big.
4. **NEVER `git push`** unless the owner explicitly says "push" in the current message.
   Commit locally, report the queue. (See memory: never-push-unprompted.)
5. Build must stay green (`npm run build` = tsc && vite). Verify renders visually in the
   browser preview (launch config `lawb-dist-preview` serves the built dist on :3213;
   `lawb-dev` is the dev server). Text-presence checks ≠ verification.

## Current state
- Local commit `bb4ae23ae` (kid-friendly TEXT rewrite of HowToContent.tsx) is committed but
  NOT pushed. Owner was not satisfied — treat it as raw material, replace freely.
- A chat draft in wiki-entry style (lead + sections + history) exists in the prior session's
  transcript; owner's reaction: terminology wrong, teaching still inadequate. Do better.
- There is currently NO Reef Run how-to anywhere in the app.

## Verified facts to build on (code-verified 2026-07-21 — re-verify anything you extend)
**Chess:** Blue = bottom, always moves first. Modes: VS Clawb (free, Easy/Hard, Stockfish via
chess.lawb.xyz droplet), classic PvP wagers (Firebase-matched, Base contract
0x06b6aAe693cf1Af27d5a5df0d0AC88aF3faC9E11), NEW on-chain tab (Arbitrum One proxy
0x3112AF5728520F52FD1C6710dD7bD52285a68e47, $DMT + ETH wagers, contract validates moves +
auto-pays). Points: win 3 / draw 1 / loss 0, +10 first wallet connect, saves only while
wallet connected. Piece sets are lawbster-themed, some NFT-gated (chessPieceSets.ts).
**Reef Run** (`src/pages/arcade/`): survival seconds = score; 3 lanes; controls KEYBOARD ONLY
— ←/→ or A/D lanes, hold W faster, S slower (NO touch handlers — flag this gap to the owner
if a tablet tutorial is in scope). Two meters: armor + oxygen. Characters
(arcadeCharacterStats.ts): Clawb 3/∞/3 (no O₂ mechanic, no tanks spawn, extra loot), Milady
5/3/3 (fastest), Radbro 3/3/5 (130 armor vs 94). Pickups (arcadePickupKinds.ts): air tank
+44 O₂ & clears slow; peptides +22 armor & clears slow; cheese ~3.6s speed buff; trash +3
armor; coin +1 & tiny O₂. Hazards: jellyfish (−5 armor/−8 O₂/slow), pufferfish (−10/−4/slow),
mine (−26/−10). Hazard odds ramp with survival time. Profile saves longest run/totals when
wallet connected; NO leaderboard points until the validator ("referee") ships. Planned:
$CULT jackpot on ETH (see REEFRUN_ONCHAIN_SPEC.md addendum).

## Paste-ready prompt
```
Rebuild the "How to Play" experience for Lawb Chess and Reef Run on lawb.xyz.
Read HOWTO_REBUILD_SESSION.md at the repo root FIRST and follow its non-negotiables
exactly — especially: visually inspect the currently-broken piece key on desktop and
mobile before touching copy, use "lawbster" terminology, never git push without an
explicit owner instruction, and design the teaching the way Duolingo teaches chess
(interactive, one concept at a time, learn by doing) rather than as a text manual.
Step 1 is a diagnosis: show the owner what the how-to/piece key currently looks like
(desktop + mobile) and propose the fix + tutorial design. Get approval before building.
```
