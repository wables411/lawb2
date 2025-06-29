var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// .wrangler/tmp/bundle-ml4F2J/checked-fetch.js
var urls = /* @__PURE__ */ new Set();
function checkURL(request, init) {
  const url = request instanceof URL ? request : new URL(
    (typeof request === "string" ? new Request(request, init) : request).url
  );
  if (url.port && url.port !== "443" && url.protocol === "https:") {
    if (!urls.has(url.toString())) {
      urls.add(url.toString());
      console.warn(
        `WARNING: known issue with \`fetch()\` requests to custom HTTPS ports in published Workers:
 - ${url.toString()} - the custom port will be ignored when the Worker is published using the \`wrangler deploy\` command.
`
      );
    }
  }
}
__name(checkURL, "checkURL");
globalThis.fetch = new Proxy(globalThis.fetch, {
  apply(target, thisArg, argArray) {
    const [request, init] = argArray;
    checkURL(request, init);
    return Reflect.apply(target, thisArg, argArray);
  }
});

// .wrangler/tmp/bundle-ml4F2J/strip-cf-connecting-ip-header.js
function stripCfConnectingIPHeader(input, init) {
  const request = new Request(input, init);
  request.headers.delete("CF-Connecting-IP");
  return request;
}
__name(stripCfConnectingIPHeader, "stripCfConnectingIPHeader");
globalThis.fetch = new Proxy(globalThis.fetch, {
  apply(target, thisArg, argArray) {
    return Reflect.apply(target, thisArg, [
      stripCfConnectingIPHeader.apply(null, argArray)
    ]);
  }
});

// functions/api/stockfish.js
var SimpleChessEngine = class {
  constructor() {
    this.board = this.initializeBoard();
    this.moveHistory = [];
  }
  initializeBoard() {
    const board = Array(8).fill(null).map(() => Array(8).fill(null));
    const initialSetup = {
      0: ["r", "n", "b", "q", "k", "b", "n", "r"],
      // Black pieces
      1: ["p", "p", "p", "p", "p", "p", "p", "p"],
      // Black pawns
      6: ["P", "P", "P", "P", "P", "P", "P", "P"],
      // White pawns
      7: ["R", "N", "B", "Q", "K", "B", "N", "R"]
      // White pieces
    };
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        if (initialSetup[row]) {
          board[row][col] = initialSetup[row][col];
        }
      }
    }
    return board;
  }
  setPositionFromFEN(fen) {
    const parts = fen.split(" ");
    const position = parts[0];
    const rows = position.split("/");
    this.board = Array(8).fill(null).map(() => Array(8).fill(null));
    for (let row = 0; row < 8; row++) {
      let col = 0;
      for (let char of rows[row]) {
        if (char >= "1" && char <= "8") {
          col += parseInt(char);
        } else {
          this.board[row][col] = char;
          col++;
        }
      }
    }
    if (parts.length > 1) {
      this.currentPlayer = parts[1] === "w" ? "white" : "black";
    } else {
      this.currentPlayer = "white";
    }
  }
  getLegalMoves() {
    const moves = [];
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = this.board[row][col];
        if (piece && this.isPieceOfPlayer(piece, this.currentPlayer)) {
          const pieceMoves = this.getMovesForPiece(row, col, piece);
          moves.push(...pieceMoves);
        }
      }
    }
    return moves;
  }
  getCurrentPlayer() {
    return this.currentPlayer;
  }
  isPieceOfPlayer(piece, player) {
    const isWhite = piece === piece.toUpperCase();
    return player === "white" && isWhite || player === "black" && !isWhite;
  }
  getMovesForPiece(row, col, piece) {
    const moves = [];
    const isWhite = piece === piece.toUpperCase();
    const pieceType = piece.toLowerCase();
    switch (pieceType) {
      case "p":
        moves.push(...this.getPawnMoves(row, col, isWhite));
        break;
      case "r":
        moves.push(...this.getRookMoves(row, col));
        break;
      case "n":
        moves.push(...this.getKnightMoves(row, col));
        break;
      case "b":
        moves.push(...this.getBishopMoves(row, col));
        break;
      case "q":
        moves.push(...this.getQueenMoves(row, col));
        break;
      case "k":
        moves.push(...this.getKingMoves(row, col));
        break;
    }
    return moves;
  }
  getPawnMoves(row, col, isWhite) {
    const moves = [];
    const direction = isWhite ? -1 : 1;
    const startRow = isWhite ? 6 : 1;
    if (this.isValidPosition(row + direction, col) && !this.board[row + direction][col]) {
      moves.push({ from: [row, col], to: [row + direction, col] });
      if (row === startRow && !this.board[row + 2 * direction][col]) {
        moves.push({ from: [row, col], to: [row + 2 * direction, col] });
      }
    }
    for (let dcol of [-1, 1]) {
      const newRow = row + direction;
      const newCol = col + dcol;
      if (this.isValidPosition(newRow, newCol) && this.board[newRow][newCol] && this.isPieceOfPlayer(this.board[newRow][newCol], isWhite ? "black" : "white")) {
        moves.push({ from: [row, col], to: [newRow, newCol] });
      }
    }
    return moves;
  }
  getRookMoves(row, col) {
    return this.getSlidingMoves(row, col, [[-1, 0], [1, 0], [0, -1], [0, 1]]);
  }
  getBishopMoves(row, col) {
    return this.getSlidingMoves(row, col, [[-1, -1], [-1, 1], [1, -1], [1, 1]]);
  }
  getQueenMoves(row, col) {
    return this.getSlidingMoves(row, col, [
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1],
      [-1, -1],
      [-1, 1],
      [1, -1],
      [1, 1]
    ]);
  }
  getKnightMoves(row, col) {
    const moves = [];
    const knightMoves = [
      [-2, -1],
      [-2, 1],
      [-1, -2],
      [-1, 2],
      [1, -2],
      [1, 2],
      [2, -1],
      [2, 1]
    ];
    for (let [drow, dcol] of knightMoves) {
      const newRow = row + drow;
      const newCol = col + dcol;
      if (this.isValidPosition(newRow, newCol) && (!this.board[newRow][newCol] || !this.isPieceOfPlayer(this.board[newRow][newCol], this.getCurrentPlayer()))) {
        moves.push({ from: [row, col], to: [newRow, newCol] });
      }
    }
    return moves;
  }
  getKingMoves(row, col) {
    const moves = [];
    const kingMoves = [
      [-1, -1],
      [-1, 0],
      [-1, 1],
      [0, -1],
      [0, 1],
      [1, -1],
      [1, 0],
      [1, 1]
    ];
    for (let [drow, dcol] of kingMoves) {
      const newRow = row + drow;
      const newCol = col + dcol;
      if (this.isValidPosition(newRow, newCol) && (!this.board[newRow][newCol] || !this.isPieceOfPlayer(this.board[newRow][newCol], this.getCurrentPlayer()))) {
        moves.push({ from: [row, col], to: [newRow, newCol] });
      }
    }
    return moves;
  }
  getSlidingMoves(row, col, directions) {
    const moves = [];
    const currentPlayer = this.getCurrentPlayer();
    for (let [drow, dcol] of directions) {
      let newRow = row + drow;
      let newCol = col + dcol;
      while (this.isValidPosition(newRow, newCol)) {
        const targetPiece = this.board[newRow][newCol];
        if (!targetPiece) {
          moves.push({ from: [row, col], to: [newRow, newCol] });
        } else {
          if (!this.isPieceOfPlayer(targetPiece, currentPlayer)) {
            moves.push({ from: [row, col], to: [newRow, newCol] });
          }
          break;
        }
        newRow += drow;
        newCol += dcol;
      }
    }
    return moves;
  }
  isValidPosition(row, col) {
    return row >= 0 && row < 8 && col >= 0 && col < 8;
  }
  findBestMove() {
    const legalMoves = this.getLegalMoves();
    if (legalMoves.length === 0) {
      return null;
    }
    let bestMove = legalMoves[0];
    let bestScore = -Infinity;
    for (let move of legalMoves) {
      const score = this.evaluateMove(move);
      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
    }
    return this.moveToNotation(bestMove);
  }
  evaluateMove(move) {
    let score = 0;
    const targetPiece = this.board[move.to[0]][move.to[1]];
    if (targetPiece) {
      score += this.getPieceValue(targetPiece);
    }
    const centerDistance = Math.abs(move.to[0] - 3.5) + Math.abs(move.to[1] - 3.5);
    score += (7 - centerDistance) * 0.1;
    score += Math.random() * 0.5;
    return score;
  }
  getPieceValue(piece) {
    const values = { "p": 1, "n": 3, "b": 3, "r": 5, "q": 9, "k": 0 };
    return values[piece.toLowerCase()] || 0;
  }
  moveToNotation(move) {
    const files = "abcdefgh";
    const ranks = "87654321";
    const fromFile = files[move.from[1]];
    const fromRank = ranks[move.from[0]];
    const toFile = files[move.to[1]];
    const toRank = ranks[move.to[0]];
    return fromFile + fromRank + toFile + toRank;
  }
};
__name(SimpleChessEngine, "SimpleChessEngine");
var stockfish_default = {
  async fetch(request) {
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type"
        }
      });
    }
    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }
    try {
      const { fen, movetime = 1200 } = await request.json();
      if (!fen) {
        return new Response(JSON.stringify({ error: "FEN position required" }), {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
          }
        });
      }
      const engine = new SimpleChessEngine();
      engine.setPositionFromFEN(fen);
      const bestmove = engine.findBestMove();
      if (!bestmove) {
        return new Response(JSON.stringify({ error: "No legal moves found" }), {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
          }
        });
      }
      const response = {
        bestmove,
        fen,
        movetime
      };
      return new Response(JSON.stringify(response), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      });
    }
  }
};

// node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-ml4F2J/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = stockfish_default;

// node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-ml4F2J/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof __Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
__name(__Facade_ScheduledController__, "__Facade_ScheduledController__");
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = (request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    };
    #dispatcher = (type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    };
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=stockfish.js.map
