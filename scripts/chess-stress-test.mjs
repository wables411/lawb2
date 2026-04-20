import { Chess } from 'chess.js';

const endpoint = process.env.CHESS_API_URL || 'https://chess.lawb.xyz/api/stockfish';
const hostHeader = process.env.CHESS_STRESS_HOST || '';
const rounds = Number(process.env.CHESS_STRESS_ROUNDS || 40);
const parallelism = Number(process.env.CHESS_STRESS_PARALLEL || 4);
const moveTimeMs = Number(process.env.CHESS_STRESS_MOVETIME || 1200);
const requestTimeoutMs = Number(process.env.CHESS_STRESS_TIMEOUT || 10000);
const maxRandomPlies = Number(process.env.CHESS_STRESS_MAX_PLIES || 22);

function randomFen(maxPlies) {
  const chess = new Chess();
  const targetPlies = Math.floor(Math.random() * maxPlies) + 2;
  for (let i = 0; i < targetPlies; i += 1) {
    if (chess.isGameOver()) break;
    const moves = chess.moves({ verbose: true });
    if (!moves.length) break;
    const pick = moves[Math.floor(Math.random() * moves.length)];
    chess.move(pick);
  }
  return chess.fen();
}

function toMoveObject(uci) {
  if (!uci || typeof uci !== 'string' || uci.length < 4) return null;
  const move = { from: uci.slice(0, 2), to: uci.slice(2, 4) };
  if (uci.length > 4) move.promotion = uci.slice(4, 5).toLowerCase();
  return move;
}

async function requestEngineMove(fen) {
  const startedAt = performance.now();
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(hostHeader ? { Host: hostHeader } : {}),
    },
    body: JSON.stringify({
      fen,
      movetime: moveTimeMs,
      difficulty: 'play',
    }),
    signal: AbortSignal.timeout(requestTimeoutMs),
  });
  const elapsedMs = performance.now() - startedAt;
  const body = await response.text();
  let json = null;
  try {
    json = JSON.parse(body);
  } catch {
    json = null;
  }
  return { response, elapsedMs, json, rawBody: body };
}

async function runCase(id) {
  const fen = randomFen(maxRandomPlies);
  const chess = new Chess(fen);
  const legalMoves = chess.moves({ verbose: true });

  if (!legalMoves.length) {
    return {
      id,
      ok: true,
      skipped: true,
      reason: 'no legal moves in generated FEN',
      latencyMs: 0,
    };
  }

  try {
    const { response, elapsedMs, json, rawBody } = await requestEngineMove(fen);
    if (!response.ok) {
      return {
        id,
        ok: false,
        skipped: false,
        reason: `http_${response.status}`,
        latencyMs: elapsedMs,
        details: rawBody.slice(0, 200),
      };
    }

    const bestMove = json?.bestmove || json?.move || null;
    const parsedMove = toMoveObject(bestMove);
    if (!parsedMove) {
      return {
        id,
        ok: false,
        skipped: false,
        reason: 'missing_or_invalid_bestmove',
        latencyMs: elapsedMs,
        details: JSON.stringify(json || {}).slice(0, 200),
      };
    }

    const applied = chess.move(parsedMove);
    if (!applied) {
      return {
        id,
        ok: false,
        skipped: false,
        reason: 'illegal_move_returned',
        latencyMs: elapsedMs,
        details: bestMove,
      };
    }

    return {
      id,
      ok: true,
      skipped: false,
      reason: 'ok',
      latencyMs: elapsedMs,
      bestMove,
      evaluation: json?.evaluation ?? null,
      depth: json?.depth ?? null,
    };
  } catch (error) {
    return {
      id,
      ok: false,
      skipped: false,
      reason: 'request_error',
      latencyMs: 0,
      details: error instanceof Error ? error.message : String(error),
    };
  }
}

async function main() {
  console.log(
    `[chess:stress] endpoint=${endpoint} host=${hostHeader || 'default'} rounds=${rounds} parallel=${parallelism} movetime=${moveTimeMs} timeout=${requestTimeoutMs}`,
  );

  let nextIndex = 0;
  const results = [];

  async function worker(workerId) {
    while (true) {
      const id = nextIndex;
      nextIndex += 1;
      if (id >= rounds) return;
      const result = await runCase(id);
      results.push(result);
      const tag = result.ok ? 'PASS' : 'FAIL';
      console.log(
        `[${tag}] case=${id} worker=${workerId} reason=${result.reason} latency=${Math.round(result.latencyMs)}ms`,
      );
    }
  }

  await Promise.all(Array.from({ length: Math.max(1, parallelism) }, (_, i) => worker(i + 1)));

  const failures = results.filter((r) => !r.ok);
  const passes = results.filter((r) => r.ok && !r.skipped);
  const skipped = results.filter((r) => r.skipped);
  const latencies = passes.map((r) => r.latencyMs).sort((a, b) => a - b);
  const averageLatency =
    latencies.length > 0 ? latencies.reduce((sum, ms) => sum + ms, 0) / latencies.length : 0;
  const p95Latency =
    latencies.length > 0 ? latencies[Math.min(latencies.length - 1, Math.floor(latencies.length * 0.95))] : 0;

  console.log('\n[chess:stress] summary');
  console.log(`- total: ${results.length}`);
  console.log(`- pass: ${passes.length}`);
  console.log(`- skipped: ${skipped.length}`);
  console.log(`- fail: ${failures.length}`);
  console.log(`- avg latency: ${Math.round(averageLatency)}ms`);
  console.log(`- p95 latency: ${Math.round(p95Latency)}ms`);

  if (failures.length > 0) {
    console.log('\n[chess:stress] first failures:');
    failures.slice(0, 10).forEach((f) => {
      console.log(`  - case=${f.id} reason=${f.reason} details=${f.details || 'n/a'}`);
    });
    process.exit(1);
  }
}

void main();
