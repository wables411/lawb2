// Replay pipeline test: pairing, winner mapping, draws, code reuse, cross-chain merge.
// The `whiteElo`/`blackElo` fields in each fabricated GameEnded are the values the real
// contract would emit (computed with the vector-verified eloUpdate) — so the built-in
// replay/contract self-check also exercises itself here.
import { replay, eloUpdate } from './indexer.mjs';

const A = '0x' + 'a'.repeat(40), B = '0x' + 'b'.repeat(40), C = '0x' + 'c'.repeat(40);
const DRAW = '0x' + '0'.repeat(40);
const ev = (chain, ts, type, code, fields) => ({ type, code, ts, blockNumber: ts, logIndex: 0, ...fields });

// Timeline: (1) A beats B on arbitrum; (2) same code reused on arbitrum, C beats A;
// (3) A vs B draw on base (fresh per-chain, continuing global).
const [a1, b1] = eloUpdate(1200, 1200, 1000);            // arb game 1: A(white) wins
const [c2, a2arb] = eloUpdate(1200, a1, 1000);           // arb game 2: C(white) beats A — per-chain elos
const [a3, b3] = eloUpdate(1200, 1200, 500);             // base game: draw, both fresh per-chain

const events = {
  arbitrum: [
    ev('arbitrum', 100, 'created', '0xaaaaaaaaaaaa', { white: A }),
    ev('arbitrum', 101, 'joined', '0xaaaaaaaaaaaa', { black: B }),
    ev('arbitrum', 102, 'ended', '0xaaaaaaaaaaaa', { winner: A, whiteElo: a1, blackElo: b1 }),
    ev('arbitrum', 103, 'created', '0xaaaaaaaaaaaa', { white: C }), // code reuse
    ev('arbitrum', 104, 'joined', '0xaaaaaaaaaaaa', { black: A }),
    ev('arbitrum', 105, 'ended', '0xaaaaaaaaaaaa', { winner: C, whiteElo: c2, blackElo: a2arb }),
    ev('arbitrum', 200, 'created', '0xdddddddddddd', { white: A }), // dangling create, never joined
  ],
  base: [
    ev('base', 150, 'created', '0xbbbbbbbbbbbb', { white: A }),
    ev('base', 151, 'joined', '0xbbbbbbbbbbbb', { black: B }),
    ev('base', 152, 'ended', '0xbbbbbbbbbbbb', { winner: DRAW, whiteElo: a3, blackElo: b3 }),
  ],
};

const { global, perChain, mismatches } = replay(events);

// Expected GLOBAL: replay the same outcomes in ts order across chains.
let g = { [A]: 1200, [B]: 1200, [C]: 1200 };
[g[A], g[B]] = eloUpdate(g[A], g[B], 1000);  // ts 102
[g[C], g[A]] = eloUpdate(g[C], g[A], 1000);  // ts 105  (wait: ts 105 > 152? no — see sort below)
// NOTE: base game ts=152 lands between arb ts=105? No: 152 > 105, so order is 102, 105, 152. Correct.
[g[A], g[B]] = eloUpdate(g[A], g[B], 500);   // ts 152 draw

let fail = 0;
const expect = (label, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (!ok) { fail++; console.error(`FAIL ${label}: got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`); }
  else console.log(`ok  ${label}: ${JSON.stringify(got)}`);
};

expect('mismatches', mismatches, 0);
expect('global A', global[A], { elo: g[A], games: 3 });
expect('global B', global[B], { elo: g[B], games: 2 });
expect('global C', global[C], { elo: g[C], games: 1 });
expect('arb A', perChain.arbitrum[A], { elo: a2arb, games: 2 });
expect('arb C', perChain.arbitrum[C], { elo: c2, games: 1 });
expect('base A', perChain.base[A], { elo: a3, games: 1 });
expect('base B', perChain.base[B], { elo: b3, games: 1 });

process.exit(fail ? 1 : 0);
