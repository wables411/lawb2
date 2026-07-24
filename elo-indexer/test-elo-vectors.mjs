// Differential test: JS Elo port vs Elo.sol vectors.
// 1) cd ../onchain-chess && forge script script/EloVectors.s.sol:EloVectors -vv > vectors.txt
// 2) node test-elo-vectors.mjs ../onchain-chess/vectors.txt
import { readFileSync } from 'node:fs';
import { eloUpdate } from './indexer.mjs';

const lines = readFileSync(process.argv[2], 'utf8').split('\n');
let n = 0, bad = 0;
for (const line of lines) {
  const m = line.trim().match(/^V (\d+) (\d+) (\d+) (\d+) (\d+)$/);
  if (!m) continue;
  const [a, b, s, na, nb] = m.slice(1).map(Number);
  const [ja, jb] = eloUpdate(a, b, s);
  n++;
  if (ja !== na || jb !== nb) {
    bad++;
    console.error(`MISMATCH a=${a} b=${b} s=${s}: sol=(${na},${nb}) js=(${ja},${jb})`);
  }
}
console.log(`${n} vectors checked, ${bad} mismatches`);
process.exit(bad || n === 0 ? 1 : 0);
