/**
 * esbuild bundle entry for the Reef Run validator — the validator MUST replay
 * runs through the exact same sim module the game uses (same constants, same
 * RNG draw order), so this re-exports the real sim core plus the points rule.
 *
 * Build: `npm run validator:build` → reef-validator/_reefRunSim.cjs (gitignored).
 */
export * from '../src/pages/arcade/reefRunSim';
export { reefRunLeaderboardPointsForRound } from '../src/utils/reefRunLeaderboardPoints';
