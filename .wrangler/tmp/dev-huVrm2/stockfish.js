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
var OPENING_MOVES = {
  "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w": ["e2e4", "d2d4", "c2c4", "g1f3", "b1c3"],
  "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b": ["e7e5", "c7c5", "e7e6", "d7d5", "g8f6"],
  "rnbqkbnr/pppppppp/8/8/3P4/8/PPP1PPPP/RNBQKBNR b": ["d7d5", "g8f6", "e7e6", "c7c5", "g7g6"],
  "rnbqkbnr/pppppppp/8/8/2P5/8/PP1PPPPP/RNBQKBNR b": ["e7e5", "d7d5", "g8f6", "e7e6", "g7g6"]
};
var PIECE_SQUARE_TABLES = {
  "P": [
    // White pawns
    [0, 0, 0, 0, 0, 0, 0, 0],
    [50, 50, 50, 50, 50, 50, 50, 50],
    [10, 10, 20, 30, 30, 20, 10, 10],
    [5, 5, 10, 25, 25, 10, 5, 5],
    [0, 0, 0, 20, 20, 0, 0, 0],
    [5, -5, -10, 0, 0, -10, -5, 5],
    [5, 10, 10, -20, -20, 10, 10, 5],
    [0, 0, 0, 0, 0, 0, 0, 0]
  ],
  "N": [
    // Knights
    [-50, -40, -30, -30, -30, -30, -40, -50],
    [-40, -20, 0, 0, 0, 0, -20, -40],
    [-30, 0, 10, 15, 15, 10, 0, -30],
    [-30, 5, 15, 20, 20, 15, 5, -30],
    [-30, 0, 15, 20, 20, 15, 0, -30],
    [-30, 5, 10, 15, 15, 10, 5, -30],
    [-40, -20, 0, 5, 5, 0, -20, -40],
    [-50, -40, -30, -30, -30, -30, -40, -50]
  ],
  "B": [
    // Bishops
    [-20, -10, -10, -10, -10, -10, -10, -20],
    [-10, 0, 0, 0, 0, 0, 0, -10],
    [-10, 0, 5, 10, 10, 5, 0, -10],
    [-10, 5, 5, 10, 10, 5, 5, -10],
    [-10, 0, 10, 10, 10, 10, 0, -10],
    [-10, 10, 10, 10, 10, 10, 10, -10],
    [-10, 5, 0, 0, 0, 0, 5, -10],
    [-20, -10, -10, -10, -10, -10, -10, -20]
  ],
  "R": [
    // Rooks
    [0, 0, 0, 0, 0, 0, 0, 0],
    [5, 10, 10, 10, 10, 10, 10, 5],
    [-5, 0, 0, 0, 0, 0, 0, -5],
    [-5, 0, 0, 0, 0, 0, 0, -5],
    [-5, 0, 0, 0, 0, 0, 0, -5],
    [-5, 0, 0, 0, 0, 0, 0, -5],
    [-5, 0, 0, 0, 0, 0, 0, -5],
    [0, 0, 0, 5, 5, 0, 0, 0]
  ],
  "Q": [
    // Queens
    [-20, -10, -10, -5, -5, -10, -10, -20],
    [-10, 0, 0, 0, 0, 0, 0, -10],
    [-10, 0, 5, 5, 5, 5, 0, -10],
    [-5, 0, 5, 5, 5, 5, 0, -5],
    [0, 0, 5, 5, 5, 5, 0, -5],
    [-10, 5, 5, 5, 5, 5, 0, -10],
    [-10, 0, 5, 0, 0, 0, 0, -10],
    [-20, -10, -10, -5, -5, -10, -10, -20]
  ],
  "K": [
    // Kings
    [-30, -40, -40, -50, -50, -40, -40, -30],
    [-30, -40, -40, -50, -50, -40, -40, -30],
    [-30, -40, -40, -50, -50, -40, -40, -30],
    [-30, -40, -40, -50, -50, -40, -40, -30],
    [-20, -30, -30, -40, -40, -30, -30, -20],
    [-10, -20, -20, -20, -20, -20, -20, -10],
    [20, 20, 0, 0, 0, 0, 20, 20],
    [20, 30, 10, 0, 0, 10, 30, 20]
  ]
};
var AdvancedChessEngine = class {
  constructor() {
    this.board = this.initializeBoard();
    this.currentPlayer = "white";
    this.moveHistory = [];
  }
  initializeBoard() {
    const board = Array(8).fill(null).map(() => Array(8).fill(null));
    const initialSetup = {
      0: ["r", "n", "b", "q", "k", "b", "n", "r"],
      1: ["p", "p", "p", "p", "p", "p", "p", "p"],
      6: ["P", "P", "P", "P", "P", "P", "P", "P"],
      7: ["R", "N", "B", "Q", "K", "B", "N", "R"]
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
    }
  }
  findBestMove(movetime = 1200) {
    const fenKey = this.boardToFEN().split(" ")[0] + " " + this.currentPlayer[0];
    if (OPENING_MOVES[fenKey]) {
      const openingMove = OPENING_MOVES[fenKey][Math.floor(Math.random() * OPENING_MOVES[fenKey].length)];
      if (this.isLegalMove(openingMove)) {
        return openingMove;
      }
    }
    const legalMoves = this.getLegalMoves();
    if (legalMoves.length === 0)
      return null;
    let bestMove = legalMoves[0];
    let bestScore = -Infinity;
    const depth = Math.min(4, Math.floor(movetime / 300));
    for (const move of legalMoves) {
      this.makeMove(move);
      const score = -this.minimax(depth - 1, -Infinity, Infinity, false);
      this.undoMove(move);
      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
    }
    return this.moveToNotation(bestMove);
  }
  minimax(depth, alpha, beta, isMaximizing) {
    if (depth === 0) {
      return this.evaluatePosition();
    }
    const legalMoves = this.getLegalMoves();
    if (legalMoves.length === 0) {
      return this.isKingInCheck() ? -1e4 : 0;
    }
    if (isMaximizing) {
      let maxScore = -Infinity;
      for (const move of legalMoves) {
        this.makeMove(move);
        const score = this.minimax(depth - 1, alpha, beta, false);
        this.undoMove(move);
        maxScore = Math.max(maxScore, score);
        alpha = Math.max(alpha, score);
        if (beta <= alpha)
          break;
      }
      return maxScore;
    } else {
      let minScore = Infinity;
      for (const move of legalMoves) {
        this.makeMove(move);
        const score = this.minimax(depth - 1, alpha, beta, true);
        this.undoMove(move);
        minScore = Math.min(minScore, score);
        beta = Math.min(beta, score);
        if (beta <= alpha)
          break;
      }
      return minScore;
    }
  }
  evaluatePosition() {
    let score = 0;
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = this.board[row][col];
        if (!piece)
          continue;
        const isWhite = piece === piece.toUpperCase();
        const pieceType = piece.toUpperCase();
        const multiplier = isWhite ? 1 : -1;
        score += this.getPieceValue(pieceType) * multiplier;
        if (isWhite) {
          score += PIECE_SQUARE_TABLES[pieceType][row][col];
        } else {
          score += PIECE_SQUARE_TABLES[pieceType][7 - row][col];
        }
      }
    }
    const whiteMobility = this.getLegalMovesForPlayer("white").length;
    const blackMobility = this.getLegalMovesForPlayer("black").length;
    score += (whiteMobility - blackMobility) * 10;
    score += this.evaluateCenterControl();
    return score;
  }
  getPieceValue(piece) {
    const values = { "P": 100, "N": 320, "B": 330, "R": 500, "Q": 900, "K": 2e4 };
    return values[piece] || 0;
  }
  evaluateCenterControl() {
    let score = 0;
    const centerSquares = [[3, 3], [3, 4], [4, 3], [4, 4]];
    for (const [row, col] of centerSquares) {
      for (let drow = -1; drow <= 1; drow++) {
        for (let dcol = -1; dcol <= 1; dcol++) {
          const newRow = row + drow;
          const newCol = col + dcol;
          if (this.isValidPosition(newRow, newCol)) {
            const piece = this.board[newRow][newCol];
            if (piece) {
              const isWhite = piece === piece.toUpperCase();
              score += isWhite ? 5 : -5;
            }
          }
        }
      }
    }
    return score;
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
  getLegalMovesForPlayer(player) {
    const originalPlayer = this.currentPlayer;
    this.currentPlayer = player;
    const moves = this.getLegalMoves();
    this.currentPlayer = originalPlayer;
    return moves;
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
      if (this.isValidPosition(newRow, newCol) && this.board[newRow][newCol] && !this.isPieceOfPlayer(this.board[newRow][newCol], isWhite ? "white" : "black")) {
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
      if (this.isValidPosition(newRow, newCol) && (!this.board[newRow][newCol] || !this.isPieceOfPlayer(this.board[newRow][newCol], this.currentPlayer))) {
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
      if (this.isValidPosition(newRow, newCol) && (!this.board[newRow][newCol] || !this.isPieceOfPlayer(this.board[newRow][newCol], this.currentPlayer))) {
        moves.push({ from: [row, col], to: [newRow, newCol] });
      }
    }
    return moves;
  }
  getSlidingMoves(row, col, directions) {
    const moves = [];
    for (let [drow, dcol] of directions) {
      let newRow = row + drow;
      let newCol = col + dcol;
      while (this.isValidPosition(newRow, newCol)) {
        const targetPiece = this.board[newRow][newCol];
        if (!targetPiece) {
          moves.push({ from: [row, col], to: [newRow, newCol] });
        } else {
          if (!this.isPieceOfPlayer(targetPiece, this.currentPlayer)) {
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
  isLegalMove(moveNotation) {
    const move = this.notationToMove(moveNotation);
    if (!move)
      return false;
    this.makeMove(move);
    const isLegal = !this.isKingInCheck();
    this.undoMove(move);
    return isLegal;
  }
  makeMove(move) {
    const { from, to } = move;
    this.board[to[0]][to[1]] = this.board[from[0]][from[1]];
    this.board[from[0]][from[1]] = null;
    this.currentPlayer = this.currentPlayer === "white" ? "black" : "white";
  }
  undoMove(move) {
    const { from, to } = move;
    this.board[from[0]][from[1]] = this.board[to[0]][to[1]];
    this.board[to[0]][to[1]] = null;
    this.currentPlayer = this.currentPlayer === "white" ? "black" : "white";
  }
  isKingInCheck() {
    const kingPos = this.findKing(this.currentPlayer);
    if (!kingPos)
      return false;
    const opponent = this.currentPlayer === "white" ? "black" : "white";
    return this.isSquareUnderAttack(kingPos[0], kingPos[1], opponent);
  }
  findKing(player) {
    const kingPiece = player === "white" ? "K" : "k";
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        if (this.board[row][col] === kingPiece) {
          return [row, col];
        }
      }
    }
    return null;
  }
  isSquareUnderAttack(row, col, attackingPlayer) {
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = this.board[r][c];
        if (piece && this.isPieceOfPlayer(piece, attackingPlayer)) {
          const moves = this.getMovesForPiece(r, c, piece);
          if (moves.some((move) => move.to[0] === row && move.to[1] === col)) {
            return true;
          }
        }
      }
    }
    return false;
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
  notationToMove(notation) {
    if (notation.length !== 4)
      return null;
    const files = "abcdefgh";
    const ranks = "87654321";
    const fromCol = files.indexOf(notation[0]);
    const fromRow = ranks.indexOf(notation[1]);
    const toCol = files.indexOf(notation[2]);
    const toRow = ranks.indexOf(notation[3]);
    if (fromCol === -1 || fromRow === -1 || toCol === -1 || toRow === -1)
      return null;
    return { from: [fromRow, fromCol], to: [toRow, toCol] };
  }
  boardToFEN() {
    let fen = "";
    for (let row = 0; row < 8; row++) {
      let empty = 0;
      for (let col = 0; col < 8; col++) {
        const piece = this.board[row][col];
        if (!piece) {
          empty++;
        } else {
          if (empty > 0) {
            fen += empty;
            empty = 0;
          }
          fen += piece;
        }
      }
      if (empty > 0)
        fen += empty;
      if (row < 7)
        fen += "/";
    }
    fen += " " + (this.currentPlayer === "white" ? "w" : "b");
    fen += " - - 0 1";
    return fen;
  }
};
__name(AdvancedChessEngine, "AdvancedChessEngine");
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
      const engine = new AdvancedChessEngine();
      engine.setPositionFromFEN(fen);
      const bestmove = engine.findBestMove(movetime);
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
