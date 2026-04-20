import type { Chess, Move } from 'chess.js';
import { pickEasyPassiveMove, validateEngineUci } from './lawbChessCore';

export type SinglePlayerDifficulty = 'easy' | 'hard';

export type AICoordsMove = {
  from: { row: number; col: number };
  to: { row: number; col: number };
  promotion?: string;
};

export interface SinglePlayerDifficultyProfile {
  id: SinglePlayerDifficulty;
  label: string;
  thinkDelayMs: number;
  engineMovetimeMs: number;
  engineMaxAttempts: number;
  engineRetryDelayMs: number;
  fallbackCooldownMs: number;
  easyAggressiveChance: number;
  hardOpeningMovetimeMs: number;
  hardMiddlegameMovetimeMs: number;
  hardEndgameMovetimeMs: number;
}

export const SINGLE_PLAYER_DIFFICULTY_PROFILES: Record<SinglePlayerDifficulty, SinglePlayerDifficultyProfile> = {
  easy: {
    id: 'easy',
    label: 'Easy Mode',
    thinkDelayMs: 600,
    engineMovetimeMs: 0,
    engineMaxAttempts: 0,
    engineRetryDelayMs: 0,
    fallbackCooldownMs: 0,
    easyAggressiveChance: 0.26,
    hardOpeningMovetimeMs: 0,
    hardMiddlegameMovetimeMs: 0,
    hardEndgameMovetimeMs: 0,
  },
  hard: {
    id: 'hard',
    label: 'Hard Mode',
    thinkDelayMs: 0,
    engineMovetimeMs: 4500,
    engineMaxAttempts: 3,
    engineRetryDelayMs: 350,
    fallbackCooldownMs: 2500,
    easyAggressiveChance: 0,
    hardOpeningMovetimeMs: 3000,
    hardMiddlegameMovetimeMs: 4600,
    hardEndgameMovetimeMs: 6200,
  },
};

export interface ChooseSinglePlayerAIMoveArgs {
  chess: Chess;
  difficulty: SinglePlayerDifficulty;
  requestEngineMove: (fen: string, movetimeMs: number) => Promise<string | null>;
}

export interface AIDecision {
  move: AICoordsMove | null;
  source: 'easy-passive' | 'stockfish' | 'hard-fallback' | 'none';
  statusMessage: string;
  cooldownUntilMs: number;
}

export function getSinglePlayerDifficultyProfile(
  difficulty: SinglePlayerDifficulty,
): SinglePlayerDifficultyProfile {
  return SINGLE_PLAYER_DIFFICULTY_PROFILES[difficulty];
}

function pickEasyStyledMove(chess: Chess, profile: SinglePlayerDifficultyProfile): AICoordsMove | null {
  const moves = chess.moves({ verbose: true }) as Move[];
  if (!moves.length) return null;

  const passive = pickEasyPassiveMove(chess);
  const shouldPlayAggressive = Math.random() < profile.easyAggressiveChance;
  if (!shouldPlayAggressive) return passive;

  const captures = moves.filter((move) => move.isCapture());
  const checkingMoves = moves.filter((move) => move.san.includes('+') || move.san.includes('#'));
  const tacticalPool = captures.length ? captures : checkingMoves.length ? checkingMoves : moves;
  const pick = tacticalPool[Math.floor(Math.random() * tacticalPool.length)];
  if (!pick) return passive;
  return {
    from: { row: 8 - Number(pick.from[1]), col: pick.from.charCodeAt(0) - 97 },
    to: { row: 8 - Number(pick.to[1]), col: pick.to.charCodeAt(0) - 97 },
    promotion: pick.promotion,
  };
}

function chooseHardMoveTime(chess: Chess, profile: SinglePlayerDifficultyProfile): number {
  const plies = chess.history().length;
  if (plies < 12) return profile.hardOpeningMovetimeMs;
  if (plies < 34) return profile.hardMiddlegameMovetimeMs;
  return profile.hardEndgameMovetimeMs;
}

export async function chooseSinglePlayerAIMove(
  args: ChooseSinglePlayerAIMoveArgs,
): Promise<AIDecision> {
  const { chess, difficulty, requestEngineMove } = args;
  const profile = getSinglePlayerDifficultyProfile(difficulty);

  if (difficulty === 'easy') {
    const move = pickEasyStyledMove(chess, profile);
    return {
      move,
      source: move ? 'easy-passive' : 'none',
      statusMessage: move ? 'Easy Mode thinking...' : 'Easy Mode could not find a legal move.',
      cooldownUntilMs: 0,
    };
  }

  const fen = chess.fen();
  let lastEngineError: unknown = null;
  let lastRawMove: string | null = null;

  const engineMovetimeMs = chooseHardMoveTime(chess, profile);

  for (let attempt = 1; attempt <= profile.engineMaxAttempts; attempt += 1) {
    try {
      const rawMove = await requestEngineMove(fen, engineMovetimeMs);
      lastRawMove = rawMove;
      const move = validateEngineUci(chess, rawMove);
      if (move) {
        return {
          move,
          source: 'stockfish',
          statusMessage: 'Hard mode engine move confirmed.',
          cooldownUntilMs: 0,
        };
      }
      globalThis.console.warn('[STOCKFISH] Rejected move from engine', {
        attempt,
        rawMove,
      });
    } catch (error) {
      lastEngineError = error;
      globalThis.console.warn('[STOCKFISH] Engine request failed', { attempt, error });
    }

    if (attempt < profile.engineMaxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, profile.engineRetryDelayMs));
    }
  }

  globalThis.console.error('[STOCKFISH] Hard mode move failed after retries', {
    lastRawMove,
    lastError: (lastEngineError as { message?: string } | null)?.message || lastEngineError || null,
  });

  const fallback = pickEasyPassiveMove(chess);
  if (fallback) {
    return {
      move: fallback,
      source: 'hard-fallback',
      statusMessage: 'Hard mode engine unavailable. Using fallback move.',
      cooldownUntilMs: Date.now() + profile.fallbackCooldownMs,
    };
  }

  return {
    move: null,
    source: 'none',
    statusMessage: 'Hard mode engine unavailable, and no legal move found.',
    cooldownUntilMs: 0,
  };
}
