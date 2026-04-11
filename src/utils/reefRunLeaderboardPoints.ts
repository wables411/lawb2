/**
 * Reef Run → Firebase leaderboard `points_breakdown.games` (one award per run, on game over).
 * Cost: one RTDB write per game over only — never per-frame / per-pickup (keeps Firebase + static Netlify hosting cheap).
 * Parity: 3 pts per full minute survived matches chess win value; under 1 minute = participation.
 */
export function reefRunLeaderboardPointsForRound(survivalSec: number): number {
  const sec = Math.floor(Math.max(0, survivalSec));
  if (sec < 60) return 1;
  return Math.floor(sec / 60) * 3;
}
