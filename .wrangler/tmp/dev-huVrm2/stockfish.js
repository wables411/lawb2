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
    this.transpositionTable = /* @__PURE__ */ new Map();
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
      const moveObj = this.notationToMove(openingMove);
      if (moveObj && this.isLegalMove(moveObj)) {
        return openingMove;
      }
    }
    const legalMoves = this.getLegalMoves();
    if (legalMoves.length === 0)
      return null;
    let bestMove = legalMoves[0];
    const startTime = Date.now();
    const maxDepth = Math.min(6, Math.floor(movetime / 200));
    const sortedMoves = this.sortMoves(legalMoves);
    for (let depth = 1; depth <= maxDepth; depth++) {
      if (Date.now() - startTime > movetime * 0.8)
        break;
      let alpha = -Infinity;
      let beta = Infinity;
      let currentBestMove = sortedMoves[0];
      let currentBestScore = -Infinity;
      for (const move of sortedMoves) {
        this.makeMove(move);
        const score = -this.negamax(depth - 1, -beta, -alpha, false, startTime, movetime);
        this.undoMove(move);
        if (score > currentBestScore) {
          currentBestScore = score;
          currentBestMove = move;
        }
        alpha = Math.max(alpha, score);
        if (alpha >= beta)
          break;
      }
      bestMove = currentBestMove;
    }
    return this.moveToNotation(bestMove);
  }
  sortMoves(moves) {
    return moves.sort((a, b) => {
      const aIsCapture = this.board[a.to[0]][a.to[1]] !== null;
      const bIsCapture = this.board[b.to[0]][b.to[1]] !== null;
      if (aIsCapture && !bIsCapture)
        return -1;
      if (!aIsCapture && bIsCapture)
        return 1;
      if (aIsCapture && bIsCapture) {
        const aValue = this.getPieceValue(this.board[a.to[0]][a.to[1]]);
        const bValue = this.getPieceValue(this.board[b.to[0]][b.to[1]]);
        return bValue - aValue;
      }
      this.makeMove(a);
      const aIsCheck = this.isKingInCheck();
      this.undoMove(a);
      this.makeMove(b);
      const bIsCheck = this.isKingInCheck();
      this.undoMove(b);
      if (aIsCheck && !bIsCheck)
        return -1;
      if (!aIsCheck && bIsCheck)
        return 1;
      return 0;
    });
  }
  negamax(depth, alpha, beta, isMaximizing, startTime, movetime) {
    if (Date.now() - startTime > movetime * 0.8) {
      return 0;
    }
    const hash = this.getPositionHash();
    if (this.transpositionTable.has(hash)) {
      const entry = this.transpositionTable.get(hash);
      if (entry.depth >= depth) {
        return entry.score;
      }
    }
    if (depth === 0) {
      return this.quiescence(alpha, beta, isMaximizing, startTime, movetime);
    }
    const legalMoves = this.getLegalMoves();
    if (legalMoves.length === 0) {
      if (this.isKingInCheck()) {
        return -1e4;
      }
      return 0;
    }
    const sortedMoves = this.sortMoves(legalMoves);
    let bestScore = -Infinity;
    for (const move of sortedMoves) {
      this.makeMove(move);
      const score = -this.negamax(depth - 1, -beta, -alpha, !isMaximizing, startTime, movetime);
      this.undoMove(move);
      bestScore = Math.max(bestScore, score);
      alpha = Math.max(alpha, score);
      if (alpha >= beta)
        break;
    }
    this.transpositionTable.set(hash, { depth, score: bestScore });
    return bestScore;
  }
  quiescence(alpha, beta, isMaximizing, startTime, movetime) {
    if (Date.now() - startTime > movetime * 0.8) {
      return 0;
    }
    const standPat = this.evaluatePosition();
    if (standPat >= beta)
      return beta;
    if (alpha < standPat)
      alpha = standPat;
    const captures = this.getLegalMoves().filter(
      (move) => this.board[move.to[0]][move.to[1]] !== null
    );
    for (const move of captures) {
      this.makeMove(move);
      const score = -this.quiescence(-beta, -alpha, !isMaximizing, startTime, movetime);
      this.undoMove(move);
      if (score >= beta)
        return beta;
      if (score > alpha)
        alpha = score;
    }
    return alpha;
  }
  getPositionHash() {
    let hash = 0;
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = this.board[row][col];
        if (piece) {
          hash = hash * 31 + piece.charCodeAt(0) + row * 8 + col;
        }
      }
    }
    return hash;
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
        const value = this.getPieceValue(piece);
        score += isWhite ? value : -value;
        const table = PIECE_SQUARE_TABLES[pieceType];
        if (table) {
          const tableRow = isWhite ? row : 7 - row;
          const positionalValue = table[tableRow][col];
          score += isWhite ? positionalValue : -positionalValue;
        }
      }
    }
    const whiteMobility = this.getLegalMovesForPlayer("white").length;
    const blackMobility = this.getLegalMovesForPlayer("black").length;
    score += (whiteMobility - blackMobility) * 10;
    score += this.evaluateCenterControl();
    score += this.evaluateKingSafety();
    score += this.evaluatePawnStructure();
    return score;
  }
  getPieceValue(piece) {
    const values = { "P": 100, "N": 320, "B": 330, "R": 500, "Q": 900, "K": 2e4 };
    return values[piece.toUpperCase()] || 0;
  }
  evaluateCenterControl() {
    let score = 0;
    const centerSquares = [[3, 3], [3, 4], [4, 3], [4, 4], [2, 3], [2, 4], [5, 3], [5, 4]];
    for (const [row, col] of centerSquares) {
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          const piece = this.board[r][c];
          if (piece && this.canPieceAttack(r, c, row, col)) {
            const isWhite = piece === piece.toUpperCase();
            score += isWhite ? 5 : -5;
          }
        }
      }
    }
    return score;
  }
  evaluateKingSafety() {
    let score = 0;
    const whiteKing = this.findKing("white");
    const blackKing = this.findKing("black");
    if (whiteKing) {
      const [row, col] = whiteKing;
      if (row >= 3 && row <= 4 && col >= 3 && col <= 4) {
        score -= 50;
      }
      if (row === 7 && (col === 1 || col === 6)) {
        score += 30;
      }
    }
    if (blackKing) {
      const [row, col] = blackKing;
      if (row >= 3 && row <= 4 && col >= 3 && col <= 4) {
        score += 50;
      }
      if (row === 0 && (col === 1 || col === 6)) {
        score -= 30;
      }
    }
    return score;
  }
  evaluatePawnStructure() {
    let score = 0;
    for (let col = 0; col < 8; col++) {
      let whitePawns = 0, blackPawns = 0;
      for (let row = 0; row < 8; row++) {
        if (this.board[row][col] === "P")
          whitePawns++;
        if (this.board[row][col] === "p")
          blackPawns++;
      }
      if (whitePawns > 1)
        score -= 20 * (whitePawns - 1);
      if (blackPawns > 1)
        score += 20 * (blackPawns - 1);
    }
    return score;
  }
  canPieceAttack(fromRow, fromCol, toRow, toCol) {
    const piece = this.board[fromRow][fromCol];
    if (!piece)
      return false;
    const pieceType = piece.toUpperCase();
    const isWhite = piece === piece.toUpperCase();
    switch (pieceType) {
      case "P":
        return this.canPawnAttack(fromRow, fromCol, toRow, toCol, isWhite);
      case "N":
        return this.canKnightAttack(fromRow, fromCol, toRow, toCol);
      case "B":
        return this.canBishopAttack(fromRow, fromCol, toRow, toCol);
      case "R":
        return this.canRookAttack(fromRow, fromCol, toRow, toCol);
      case "Q":
        return this.canQueenAttack(fromRow, fromCol, toRow, toCol);
      case "K":
        return this.canKingAttack(fromRow, fromCol, toRow, toCol);
      default:
        return false;
    }
  }
  canPawnAttack(fromRow, fromCol, toRow, toCol, isWhite) {
    const direction = isWhite ? -1 : 1;
    return Math.abs(fromCol - toCol) === 1 && toRow - fromRow === direction;
  }
  canKnightAttack(fromRow, fromCol, toRow, toCol) {
    const rowDiff = Math.abs(fromRow - toRow);
    const colDiff = Math.abs(fromCol - toCol);
    return rowDiff === 2 && colDiff === 1 || rowDiff === 1 && colDiff === 2;
  }
  canBishopAttack(fromRow, fromCol, toRow, toCol) {
    if (Math.abs(fromRow - toRow) !== Math.abs(fromCol - toCol))
      return false;
    return this.isPathClear(fromRow, fromCol, toRow, toCol);
  }
  canRookAttack(fromRow, fromCol, toRow, toCol) {
    if (fromRow !== toRow && fromCol !== toCol)
      return false;
    return this.isPathClear(fromRow, fromCol, toRow, toCol);
  }
  canQueenAttack(fromRow, fromCol, toRow, toCol) {
    return this.canRookAttack(fromRow, fromCol, toRow, toCol) || this.canBishopAttack(fromRow, fromCol, toRow, toCol);
  }
  canKingAttack(fromRow, fromCol, toRow, toCol) {
    return Math.abs(fromRow - toRow) <= 1 && Math.abs(fromCol - toCol) <= 1;
  }
  isPathClear(fromRow, fromCol, toRow, toCol) {
    const rowDir = fromRow === toRow ? 0 : toRow > fromRow ? 1 : -1;
    const colDir = fromCol === toCol ? 0 : toCol > fromCol ? 1 : -1;
    let currentRow = fromRow + rowDir;
    let currentCol = fromCol + colDir;
    while (currentRow !== toRow || currentCol !== toCol) {
      if (this.board[currentRow][currentCol] !== null)
        return false;
      currentRow += rowDir;
      currentCol += colDir;
    }
    return true;
  }
  getLegalMoves() {
    return this.getLegalMovesForPlayer(this.currentPlayer);
  }
  getLegalMovesForPlayer(player) {
    const moves = [];
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = this.board[row][col];
        if (piece && this.isPieceOfPlayer(piece, player)) {
          const pieceMoves = this.getMovesForPiece(row, col, piece);
          moves.push(...pieceMoves);
        }
      }
    }
    return moves;
  }
  isPieceOfPlayer(piece, player) {
    const isWhite = piece === piece.toUpperCase();
    return player === "white" && isWhite || player === "black" && !isWhite;
  }
  getMovesForPiece(row, col, piece) {
    const pieceType = piece.toUpperCase();
    const isWhite = piece === piece.toUpperCase();
    switch (pieceType) {
      case "P":
        return this.getPawnMoves(row, col, isWhite);
      case "N":
        return this.getKnightMoves(row, col);
      case "B":
        return this.getBishopMoves(row, col);
      case "R":
        return this.getRookMoves(row, col);
      case "Q":
        return this.getQueenMoves(row, col);
      case "K":
        return this.getKingMoves(row, col);
      default:
        return [];
    }
  }
  getPawnMoves(row, col, isWhite) {
    const moves = [];
    const direction = isWhite ? -1 : 1;
    const startRank = isWhite ? 6 : 1;
    const newRow = row + direction;
    if (this.isValidPosition(newRow, col) && this.board[newRow][col] === null) {
      if (this.isLegalMove({ from: [row, col], to: [newRow, col] })) {
        moves.push({ from: [row, col], to: [newRow, col] });
      }
      if (row === startRank) {
        const doubleRow = row + 2 * direction;
        if (this.isValidPosition(doubleRow, col) && this.board[doubleRow][col] === null) {
          if (this.isLegalMove({ from: [row, col], to: [doubleRow, col] })) {
            moves.push({ from: [row, col], to: [doubleRow, col] });
          }
        }
      }
    }
    for (const colOffset of [-1, 1]) {
      const newCol = col + colOffset;
      if (this.isValidPosition(newRow, newCol)) {
        const targetPiece = this.board[newRow][newCol];
        if (targetPiece && this.isPieceOfPlayer(targetPiece, isWhite ? "black" : "white")) {
          if (this.isLegalMove({ from: [row, col], to: [newRow, newCol] })) {
            moves.push({ from: [row, col], to: [newRow, newCol] });
          }
        }
      }
    }
    return moves;
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
    for (const [rowOffset, colOffset] of knightMoves) {
      const newRow = row + rowOffset;
      const newCol = col + colOffset;
      if (this.isValidPosition(newRow, newCol)) {
        const targetPiece = this.board[newRow][newCol];
        if (!targetPiece || !this.isPieceOfPlayer(targetPiece, this.currentPlayer)) {
          if (this.isLegalMove({ from: [row, col], to: [newRow, newCol] })) {
            moves.push({ from: [row, col], to: [newRow, newCol] });
          }
        }
      }
    }
    return moves;
  }
  getBishopMoves(row, col) {
    return this.getSlidingMoves(row, col, [[-1, -1], [-1, 1], [1, -1], [1, 1]]);
  }
  getRookMoves(row, col) {
    return this.getSlidingMoves(row, col, [[-1, 0], [1, 0], [0, -1], [0, 1]]);
  }
  getQueenMoves(row, col) {
    return this.getSlidingMoves(row, col, [
      [-1, -1],
      [-1, 1],
      [1, -1],
      [1, 1],
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1]
    ]);
  }
  getKingMoves(row, col) {
    const moves = [];
    for (let rowOffset = -1; rowOffset <= 1; rowOffset++) {
      for (let colOffset = -1; colOffset <= 1; colOffset++) {
        if (rowOffset === 0 && colOffset === 0)
          continue;
        const newRow = row + rowOffset;
        const newCol = col + colOffset;
        if (this.isValidPosition(newRow, newCol)) {
          const targetPiece = this.board[newRow][newCol];
          if (!targetPiece || !this.isPieceOfPlayer(targetPiece, this.currentPlayer)) {
            if (this.isLegalMove({ from: [row, col], to: [newRow, newCol] })) {
              moves.push({ from: [row, col], to: [newRow, newCol] });
            }
          }
        }
      }
    }
    return moves;
  }
  getSlidingMoves(row, col, directions) {
    const moves = [];
    for (const [rowDir, colDir] of directions) {
      let currentRow = row + rowDir;
      let currentCol = col + colDir;
      while (this.isValidPosition(currentRow, currentCol)) {
        const targetPiece = this.board[currentRow][currentCol];
        if (targetPiece === null) {
          if (this.isLegalMove({ from: [row, col], to: [currentRow, currentCol] })) {
            moves.push({ from: [row, col], to: [currentRow, currentCol] });
          }
        } else {
          if (!this.isPieceOfPlayer(targetPiece, this.currentPlayer)) {
            if (this.isLegalMove({ from: [row, col], to: [currentRow, currentCol] })) {
              moves.push({ from: [row, col], to: [currentRow, currentCol] });
            }
          }
          break;
        }
        currentRow += rowDir;
        currentCol += colDir;
      }
    }
    return moves;
  }
  isValidPosition(row, col) {
    return row >= 0 && row < 8 && col >= 0 && col < 8;
  }
  isLegalMove(move) {
    if (typeof move === "string") {
      const moveObj = this.notationToMove(move);
      if (!moveObj)
        return false;
      move = moveObj;
    }
    if (!move || !this.isValidPosition(move.from[0], move.from[1]) || !this.isValidPosition(move.to[0], move.to[1])) {
      return false;
    }
    const piece = this.board[move.from[0]][move.from[1]];
    if (!piece || !this.isPieceOfPlayer(piece, this.currentPlayer)) {
      return false;
    }
    const targetPiece = this.board[move.to[0]][move.to[1]];
    if (targetPiece && this.isPieceOfPlayer(targetPiece, this.currentPlayer)) {
      return false;
    }
    const pieceType = piece.toUpperCase();
    let isValidMove = false;
    switch (pieceType) {
      case "P":
        isValidMove = this.isValidPawnMove(move.from[0], move.from[1], move.to[0], move.to[1], piece === piece.toUpperCase());
        break;
      case "N":
        isValidMove = this.canKnightAttack(move.from[0], move.from[1], move.to[0], move.to[1]);
        break;
      case "B":
        isValidMove = this.canBishopAttack(move.from[0], move.from[1], move.to[0], move.to[1]);
        break;
      case "R":
        isValidMove = this.canRookAttack(move.from[0], move.from[1], move.to[0], move.to[1]);
        break;
      case "Q":
        isValidMove = this.canQueenAttack(move.from[0], move.from[1], move.to[0], move.to[1]);
        break;
      case "K":
        isValidMove = this.canKingAttack(move.from[0], move.from[1], move.to[0], move.to[1]);
        break;
    }
    if (!isValidMove)
      return false;
    this.makeMove(move);
    const isLegal = !this.isKingInCheck();
    this.undoMove(move);
    return isLegal;
  }
  isValidPawnMove(fromRow, fromCol, toRow, toCol, isWhite) {
    const direction = isWhite ? -1 : 1;
    const startRank = isWhite ? 6 : 1;
    if (fromCol === toCol && toRow === fromRow + direction && this.board[toRow][toCol] === null) {
      return true;
    }
    if (fromCol === toCol && fromRow === startRank && toRow === fromRow + 2 * direction && this.board[fromRow + direction][fromCol] === null && this.board[toRow][toCol] === null) {
      return true;
    }
    if (Math.abs(fromCol - toCol) === 1 && toRow === fromRow + direction) {
      return this.board[toRow][toCol] !== null && !this.isPieceOfPlayer(this.board[toRow][toCol], isWhite ? "white" : "black");
    }
    return false;
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
          if (this.canPieceAttack(r, c, row, col)) {
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
