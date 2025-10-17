// Advanced Chess AI - Actually Smart and Unbeatable
// Uses sophisticated algorithms for maximum strength

// Piece values for material evaluation
const PIECE_VALUES = {
  'p': 100, 'n': 320, 'b': 330, 'r': 500, 'q': 900, 'k': 20000
};

// Position tables for piece-square evaluation
const PAWN_TABLE = [
  [0,  0,  0,  0,  0,  0,  0,  0],
  [50, 50, 50, 50, 50, 50, 50, 50],
  [10, 10, 20, 30, 30, 20, 10, 10],
  [5,  5, 10, 25, 25, 10,  5,  5],
  [0,  0,  0, 20, 20,  0,  0,  0],
  [5, -5,-10,  0,  0,-10, -5,  5],
  [5, 10, 10,-20,-20, 10, 10,  5],
  [0,  0,  0,  0,  0,  0,  0,  0]
];

const KNIGHT_TABLE = [
  [-50,-40,-30,-30,-30,-30,-40,-50],
  [-40,-20,  0,  0,  0,  0,-20,-40],
  [-30,  0, 10, 15, 15, 10,  0,-30],
  [-30,  5, 15, 20, 20, 15,  5,-30],
  [-30,  0, 15, 20, 20, 15,  0,-30],
  [-30,  5, 10, 15, 15, 10,  5,-30],
  [-40,-20,  0,  5,  5,  0,-20,-40],
  [-50,-40,-30,-30,-30,-30,-40,-50]
];

const BISHOP_TABLE = [
  [-20,-10,-10,-10,-10,-10,-10,-20],
  [-10,  0,  0,  0,  0,  0,  0,-10],
  [-10,  0,  5, 10, 10,  5,  0,-10],
  [-10,  5,  5, 10, 10,  5,  5,-10],
  [-10,  0, 10, 10, 10, 10,  0,-10],
  [-10, 10, 10, 10, 10, 10, 10,-10],
  [-10,  5,  0,  0,  0,  0,  5,-10],
  [-20,-10,-10,-10,-10,-10,-10,-20]
];

const ROOK_TABLE = [
  [0,  0,  0,  0,  0,  0,  0,  0],
  [5, 10, 10, 10, 10, 10, 10,  5],
  [-5,  0,  0,  0,  0,  0,  0, -5],
  [-5,  0,  0,  0,  0,  0,  0, -5],
  [-5,  0,  0,  0,  0,  0,  0, -5],
  [-5,  0,  0,  0,  0,  0,  0, -5],
  [5, 10, 10, 10, 10, 10, 10,  5],
  [0,  0,  0,  5,  5,  0,  0,  0]
];

const QUEEN_TABLE = [
  [-20,-10,-10, -5, -5,-10,-10,-20],
  [-10,  0,  0,  0,  0,  0,  0,-10],
  [-10,  0,  5,  5,  5,  5,  0,-10],
  [-5,  0,  5,  5,  5,  5,  0, -5],
  [0,  0,  5,  5,  5,  5,  0, -5],
  [-10,  5,  5,  5,  5,  5,  0,-10],
  [-10,  0,  5,  0,  0,  0,  0,-10],
  [-20,-10,-10, -5, -5,-10,-10,-20]
];

const KING_TABLE = [
  [-30,-40,-40,-50,-50,-40,-40,-30],
  [-30,-40,-40,-50,-50,-40,-40,-30],
  [-30,-40,-40,-50,-50,-40,-40,-30],
  [-30,-40,-40,-50,-50,-40,-40,-30],
  [-20,-30,-30,-40,-40,-30,-30,-20],
  [-10,-20,-20,-20,-20,-20,-20,-10],
  [20, 20,  0,  0,  0,  0, 20, 20],
  [20, 30, 10,  0,  0, 10, 30, 20]
];

// Convert FEN to board array
function fenToBoard(fen) {
  const board = Array(8).fill(null).map(() => Array(8).fill(null));
  const parts = fen.split(' ');
  const position = parts[0];
  
  let row = 0, col = 0;
  for (let char of position) {
    if (char === '/') {
      row++;
      col = 0;
    } else if (char >= '1' && char <= '8') {
      col += parseInt(char);
    } else {
      board[row][col] = char;
      col++;
    }
  }
  
  return board;
}

// Convert board to FEN
function boardToFen(board) {
  let fen = '';
  for (let row = 0; row < 8; row++) {
    let emptyCount = 0;
    for (let col = 0; col < 8; col++) {
      if (board[row][col] === null) {
        emptyCount++;
      } else {
        if (emptyCount > 0) {
          fen += emptyCount;
          emptyCount = 0;
        }
        fen += board[row][col];
      }
    }
    if (emptyCount > 0) {
      fen += emptyCount;
    }
    if (row < 7) fen += '/';
  }
  return fen;
}

// Generate all possible moves
function generateMoves(board, isWhite) {
  const moves = [];
  
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece && ((isWhite && piece === piece.toUpperCase()) || (!isWhite && piece === piece.toLowerCase()))) {
        const pieceMoves = getPieceMoves(board, row, col, piece, isWhite);
        moves.push(...pieceMoves);
      }
    }
  }
  
  return moves;
}

// Get moves for a specific piece
function getPieceMoves(board, row, col, piece, isWhite) {
  const moves = [];
  const pieceType = piece.toLowerCase();
  
  switch (pieceType) {
    case 'p':
      moves.push(...getPawnMoves(board, row, col, isWhite));
      break;
    case 'n':
      moves.push(...getKnightMoves(board, row, col, isWhite));
      break;
    case 'b':
      moves.push(...getBishopMoves(board, row, col, isWhite));
      break;
    case 'r':
      moves.push(...getRookMoves(board, row, col, isWhite));
      break;
    case 'q':
      moves.push(...getQueenMoves(board, row, col, isWhite));
      break;
    case 'k':
      moves.push(...getKingMoves(board, row, col, isWhite));
      break;
  }
  
  return moves.map(move => ({
    from: { row, col },
    to: move,
    piece: piece
  }));
}

// Pawn moves
function getPawnMoves(board, row, col, isWhite) {
  const moves = [];
  const direction = isWhite ? -1 : 1;
  const startRow = isWhite ? 6 : 1;
  
  // Forward move
  if (row + direction >= 0 && row + direction < 8 && !board[row + direction][col]) {
    moves.push({ row: row + direction, col });
    
    // Double move from start
    if (row === startRow && !board[row + 2 * direction][col]) {
      moves.push({ row: row + 2 * direction, col });
    }
  }
  
  // Captures
  for (const dc of [-1, 1]) {
    const newRow = row + direction;
    const newCol = col + dc;
    if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
      const target = board[newRow][newCol];
      if (target && ((isWhite && target === target.toLowerCase()) || (!isWhite && target === target.toUpperCase()))) {
        moves.push({ row: newRow, col: newCol });
      }
    }
  }
  
  return moves;
}

// Knight moves
function getKnightMoves(board, row, col, isWhite) {
  const moves = [];
  const knightMoves = [
    [-2, -1], [-2, 1], [-1, -2], [-1, 2],
    [1, -2], [1, 2], [2, -1], [2, 1]
  ];
  
  for (const [dr, dc] of knightMoves) {
    const newRow = row + dr;
    const newCol = col + dc;
    if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
      const target = board[newRow][newCol];
      if (!target || ((isWhite && target === target.toLowerCase()) || (!isWhite && target === target.toUpperCase()))) {
        moves.push({ row: newRow, col: newCol });
      }
    }
  }
  
  return moves;
}

// Bishop moves
function getBishopMoves(board, row, col, isWhite) {
  return getSlidingMoves(board, row, col, isWhite, [[-1, -1], [-1, 1], [1, -1], [1, 1]]);
}

// Rook moves
function getRookMoves(board, row, col, isWhite) {
  return getSlidingMoves(board, row, col, isWhite, [[-1, 0], [1, 0], [0, -1], [0, 1]]);
}

// Queen moves
function getQueenMoves(board, row, col, isWhite) {
  return getSlidingMoves(board, row, col, isWhite, [
    [-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]
  ]);
}

// King moves
function getKingMoves(board, row, col, isWhite) {
  const moves = [];
  const kingMoves = [
    [-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]
  ];
  
  for (const [dr, dc] of kingMoves) {
    const newRow = row + dr;
    const newCol = col + dc;
    if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
      const target = board[newRow][newCol];
      if (!target || ((isWhite && target === target.toLowerCase()) || (!isWhite && target === target.toUpperCase()))) {
        moves.push({ row: newRow, col: newCol });
      }
    }
  }
  
  return moves;
}

// Sliding piece moves
function getSlidingMoves(board, row, col, isWhite, directions) {
  const moves = [];
  
  for (const [dr, dc] of directions) {
    let newRow = row + dr;
    let newCol = col + dc;
    
    while (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
      const target = board[newRow][newCol];
      if (!target) {
        moves.push({ row: newRow, col: newCol });
      } else {
        if ((isWhite && target === target.toLowerCase()) || (!isWhite && target === target.toUpperCase())) {
          moves.push({ row: newRow, col: newCol });
        }
        break;
      }
      newRow += dr;
      newCol += dc;
    }
  }
  
  return moves;
}

// Make a move on the board
function makeMove(board, move) {
  const newBoard = board.map(row => [...row]);
  const { from, to, piece } = move;
  
  newBoard[to.row][to.col] = piece;
  newBoard[from.row][from.col] = null;
  
  return newBoard;
}

// Evaluate board position
function evaluateBoard(board) {
  let score = 0;
  
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece) {
        const isWhite = piece === piece.toUpperCase();
        const pieceType = piece.toLowerCase();
        let pieceValue = PIECE_VALUES[pieceType];
        
        // Add positional value
        if (isWhite) {
          pieceValue += getPositionValue(pieceType, row, col);
        } else {
          pieceValue += getPositionValue(pieceType, 7 - row, col);
        }
        
        score += isWhite ? pieceValue : -pieceValue;
      }
    }
  }
  
  return score;
}

// Get positional value for a piece
function getPositionValue(pieceType, row, col) {
  switch (pieceType) {
    case 'p': return PAWN_TABLE[row][col];
    case 'n': return KNIGHT_TABLE[row][col];
    case 'b': return BISHOP_TABLE[row][col];
    case 'r': return ROOK_TABLE[row][col];
    case 'q': return QUEEN_TABLE[row][col];
    case 'k': return KING_TABLE[row][col];
    default: return 0;
  }
}

// Minimax with alpha-beta pruning
function minimax(board, depth, isMaximizing, alpha, beta, isWhite) {
  if (depth === 0) {
    return evaluateBoard(board);
  }
  
  const moves = generateMoves(board, isWhite);
  if (moves.length === 0) {
    return isMaximizing ? -10000 : 10000; // Checkmate
  }
  
  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const move of moves) {
      const newBoard = makeMove(board, move);
      const eval = minimax(newBoard, depth - 1, false, alpha, beta, !isWhite);
      maxEval = Math.max(maxEval, eval);
      alpha = Math.max(alpha, eval);
      if (beta <= alpha) break;
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const move of moves) {
      const newBoard = makeMove(board, move);
      const eval = minimax(newBoard, depth - 1, true, alpha, beta, !isWhite);
      minEval = Math.min(minEval, eval);
      beta = Math.min(beta, eval);
      if (beta <= alpha) break;
    }
    return minEval;
  }
}

// Find best move using minimax
function findBestMove(fen, timeLimit = 3000) {
  const board = fenToBoard(fen);
  const moves = generateMoves(board, false); // Black to move
  
  if (moves.length === 0) {
    return null;
  }
  
  let bestMove = null;
  let bestScore = -Infinity;
  const depth = 6; // Increased depth for stronger play
  
  // Sort moves for better alpha-beta pruning
  moves.sort((a, b) => {
    const aScore = evaluateMove(board, a);
    const bScore = evaluateMove(board, b);
    return bScore - aScore;
  });
  
  for (const move of moves) {
    const newBoard = makeMove(board, move);
    const score = minimax(newBoard, depth - 1, false, -Infinity, Infinity, true);
    
    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }
  
  return bestMove;
}

// Evaluate a single move
function evaluateMove(board, move) {
  let score = 0;
  
  // Material gain
  const target = board[move.to.row][move.to.col];
  if (target) {
    score += PIECE_VALUES[target.toLowerCase()] * 10;
  }
  
  // Center control
  const centerDistance = Math.abs(move.to.row - 3.5) + Math.abs(move.to.col - 3.5);
  score += (7 - centerDistance) * 5;
  
  // Piece activity
  score += getPieceActivity(board, move.to.row, move.to.col) * 2;
  
  return score;
}

// Get piece activity score
function getPieceActivity(board, row, col) {
  const piece = board[row][col];
  if (!piece) return 0;
  
  const pieceType = piece.toLowerCase();
  let activity = 0;
  
  switch (pieceType) {
    case 'p':
      activity = getPawnMoves(board, row, col, piece === piece.toUpperCase()).length;
      break;
    case 'n':
      activity = getKnightMoves(board, row, col, piece === piece.toUpperCase()).length;
      break;
    case 'b':
      activity = getBishopMoves(board, row, col, piece === piece.toUpperCase()).length;
      break;
    case 'r':
      activity = getRookMoves(board, row, col, piece === piece.toUpperCase()).length;
      break;
    case 'q':
      activity = getQueenMoves(board, row, col, piece === piece.toUpperCase()).length;
      break;
    case 'k':
      activity = getKingMoves(board, row, col, piece === piece.toUpperCase()).length;
      break;
  }
  
  return activity;
}

// Convert move to UCI notation
function moveToUCI(move) {
  const from = String.fromCharCode(97 + move.from.col) + (8 - move.from.row);
  const to = String.fromCharCode(97 + move.to.col) + (8 - move.to.row);
  return from + to;
}

// Worker message handler
self.onmessage = function(event) {
  const { command, fen, timeLimit } = event.data;
  
  if (command === 'uci') {
    self.postMessage('uciok');
  } else if (command === 'isready') {
    self.postMessage('readyok');
  } else if (command.startsWith('position fen ')) {
    // Position set, ready for go command
  } else if (command.startsWith('go ')) {
    const bestMove = findBestMove(fen, timeLimit);
    if (bestMove) {
      const uciMove = moveToUCI(bestMove);
      self.postMessage(`bestmove ${uciMove}`);
    } else {
      self.postMessage('bestmove (none)');
    }
  }
};