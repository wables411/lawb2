// Advanced Chess AI Worker - Grand Master Level
// Implements sophisticated chess algorithms for maximum strength

class AdvancedChessAI {
  constructor() {
    this.pieceValues = {
      'p': 1, 'n': 3, 'b': 3, 'r': 5, 'q': 9, 'k': 0
    };
    
    // Piece-square tables for positional evaluation
    this.pieceSquareTables = {
      'p': [
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5],
        [0.1, 0.1, 0.2, 0.3, 0.3, 0.2, 0.1, 0.1],
        [0.05, 0.05, 0.1, 0.25, 0.25, 0.1, 0.05, 0.05],
        [0, 0, 0, 0.2, 0.2, 0, 0, 0],
        [0.05, -0.05, -0.1, 0, 0, -0.1, -0.05, 0.05],
        [0.05, 0.1, 0.1, -0.2, -0.2, 0.1, 0.1, 0.05],
        [0, 0, 0, 0, 0, 0, 0, 0]
      ],
      'n': [
        [-0.5, -0.4, -0.3, -0.3, -0.3, -0.3, -0.4, -0.5],
        [-0.4, -0.2, 0, 0, 0, 0, -0.2, -0.4],
        [-0.3, 0, 0.1, 0.15, 0.15, 0.1, 0, -0.3],
        [-0.3, 0.05, 0.15, 0.2, 0.2, 0.15, 0.05, -0.3],
        [-0.3, 0, 0.15, 0.2, 0.2, 0.15, 0, -0.3],
        [-0.3, 0.05, 0.1, 0.15, 0.15, 0.1, 0.05, -0.3],
        [-0.4, -0.2, 0, 0.05, 0.05, 0, -0.2, -0.4],
        [-0.5, -0.4, -0.3, -0.3, -0.3, -0.3, -0.4, -0.5]
      ],
      'b': [
        [-0.2, -0.1, -0.1, -0.1, -0.1, -0.1, -0.1, -0.2],
        [-0.1, 0, 0, 0, 0, 0, 0, -0.1],
        [-0.1, 0, 0.05, 0.1, 0.1, 0.05, 0, -0.1],
        [-0.1, 0.05, 0.05, 0.1, 0.1, 0.05, 0.05, -0.1],
        [-0.1, 0, 0.1, 0.1, 0.1, 0.1, 0, -0.1],
        [-0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, -0.1],
        [-0.1, 0.05, 0, 0, 0, 0, 0.05, -0.1],
        [-0.2, -0.1, -0.1, -0.1, -0.1, -0.1, -0.1, -0.2]
      ],
      'r': [
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0.05, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.05],
        [-0.05, 0, 0, 0, 0, 0, 0, -0.05],
        [-0.05, 0, 0, 0, 0, 0, 0, -0.05],
        [-0.05, 0, 0, 0, 0, 0, 0, -0.05],
        [-0.05, 0, 0, 0, 0, 0, 0, -0.05],
        [0.05, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.05],
        [0, 0, 0, 0.05, 0.05, 0, 0, 0]
      ],
      'q': [
        [-0.2, -0.1, -0.1, -0.05, -0.05, -0.1, -0.1, -0.2],
        [-0.1, 0, 0, 0, 0, 0, 0, -0.1],
        [-0.1, 0, 0.05, 0.05, 0.05, 0.05, 0, -0.1],
        [-0.05, 0, 0.05, 0.05, 0.05, 0.05, 0, -0.05],
        [0, 0, 0, 0.05, 0.05, 0, 0, 0],
        [-0.1, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05, -0.1],
        [-0.1, 0, 0.05, 0, 0, 0.05, 0, -0.1],
        [-0.2, -0.1, -0.1, -0.05, -0.05, -0.1, -0.1, -0.2]
      ],
      'k': [
        [-0.3, -0.4, -0.4, -0.5, -0.5, -0.4, -0.4, -0.3],
        [-0.3, -0.4, -0.4, -0.5, -0.5, -0.4, -0.4, -0.3],
        [-0.3, -0.4, -0.4, -0.5, -0.5, -0.4, -0.4, -0.3],
        [-0.3, -0.4, -0.4, -0.5, -0.5, -0.4, -0.4, -0.3],
        [-0.2, -0.3, -0.3, -0.4, -0.4, -0.3, -0.3, -0.2],
        [-0.1, -0.2, -0.2, -0.2, -0.2, -0.2, -0.2, -0.1],
        [0.2, 0.2, 0, 0, 0, 0, 0.2, 0.2],
        [0.2, 0.3, 0.1, 0, 0, 0.1, 0.3, 0.2]
      ]
    };
  }

  // Parse FEN string to board representation
  parseFEN(fen) {
    const parts = fen.split(' ');
    const board = [];
    const rows = parts[0].split('/');
    
    for (let row of rows) {
      const boardRow = [];
      for (let char of row) {
        if (isNaN(char)) {
          boardRow.push(char);
        } else {
          for (let i = 0; i < parseInt(char); i++) {
            boardRow.push(null);
          }
        }
      }
      board.push(boardRow);
    }
    
    return board;
  }

  // Evaluate position using advanced algorithms
  evaluatePosition(board) {
    let score = 0;
    
    // Material evaluation
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = board[row][col];
        if (piece) {
          const pieceType = piece.toLowerCase();
          const isWhite = piece === piece.toUpperCase();
          const pieceValue = this.pieceValues[pieceType] || 0;
          
          // Material value
          score += isWhite ? pieceValue : -pieceValue;
          
          // Piece-square table evaluation
          if (this.pieceSquareTables[pieceType]) {
            const tableRow = isWhite ? row : 7 - row;
            const tableCol = isWhite ? col : 7 - col;
            const pstValue = this.pieceSquareTables[pieceType][tableRow][tableCol];
            score += isWhite ? pstValue : -pstValue;
          }
        }
      }
    }
    
    // Center control bonus
    const centerSquares = [[3, 3], [3, 4], [4, 3], [4, 4]];
    for (let [row, col] of centerSquares) {
      const piece = board[row][col];
      if (piece) {
        const isWhite = piece === piece.toUpperCase();
        score += isWhite ? 0.2 : -0.2;
      }
    }
    
    // King safety evaluation
    score += this.evaluateKingSafety(board);
    
    // Pawn structure evaluation
    score += this.evaluatePawnStructure(board);
    
    // Mobility evaluation
    score += this.evaluateMobility(board);
    
    // Tactical evaluation
    score += this.evaluateTactics(board);
    
    // Endgame evaluation
    score += this.evaluateEndgame(board);
    
    return score;
  }

  // Evaluate piece mobility
  evaluateMobility(board) {
    let score = 0;
    
    // Count legal moves for each side
    const whiteMoves = this.generateMoves(board, true).length;
    const blackMoves = this.generateMoves(board, false).length;
    
    score += (whiteMoves - blackMoves) * 0.1;
    
    return score;
  }

  // Evaluate tactical patterns
  evaluateTactics(board) {
    let score = 0;
    
    // Look for forks, pins, skewers
    score += this.findTacticalPatterns(board);
    
    return score;
  }

  // Find tactical patterns
  findTacticalPatterns(board) {
    let score = 0;
    
    // Simple fork detection (knight attacking two pieces)
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = board[row][col];
        if (piece && piece.toLowerCase() === 'n') {
          const isWhite = piece === piece.toUpperCase();
          const knightMoves = this.getKnightMoves(board, row, col, isWhite);
          let attackedPieces = 0;
          
          for (const move of knightMoves) {
            const target = board[move.to[0]][move.to[1]];
            if (target && (target === target.toUpperCase()) !== isWhite) {
              attackedPieces++;
            }
          }
          
          if (attackedPieces >= 2) {
            score += isWhite ? 0.5 : -0.5;
          }
        }
      }
    }
    
    return score;
  }

  // Evaluate endgame
  evaluateEndgame(board) {
    let score = 0;
    
    // Count remaining pieces
    let whitePieces = 0, blackPieces = 0;
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = board[row][col];
        if (piece) {
          if (piece === piece.toUpperCase()) whitePieces++;
          else blackPieces++;
        }
      }
    }
    
    // If endgame (few pieces), activate king
    if (whitePieces + blackPieces <= 8) {
      score += this.evaluateKingActivity(board);
    }
    
    return score;
  }

  // Evaluate king activity in endgame
  evaluateKingActivity(board) {
    let score = 0;
    
    // Find kings and evaluate their activity
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = board[row][col];
        if (piece && piece.toLowerCase() === 'k') {
          const isWhite = piece === piece.toUpperCase();
          const kingMoves = this.getKingMoves(board, row, col, isWhite);
          const activity = kingMoves.length;
          score += isWhite ? activity * 0.1 : -activity * 0.1;
        }
      }
    }
    
    return score;
  }

  // Evaluate king safety
  evaluateKingSafety(board) {
    let score = 0;
    
    // Find kings
    let whiteKing = null, blackKing = null;
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        if (board[row][col] === 'K') whiteKing = [row, col];
        if (board[row][col] === 'k') blackKing = [row, col];
      }
    }
    
    if (whiteKing) {
      score += this.getKingSafetyScore(board, whiteKing, true);
    }
    if (blackKing) {
      score -= this.getKingSafetyScore(board, blackKing, false);
    }
    
    return score;
  }

  // Get king safety score
  getKingSafetyScore(board, kingPos, isWhite) {
    const [row, col] = kingPos;
    let safety = 0;
    
    // Count friendly pieces around king
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const newRow = row + dr;
        const newCol = col + dc;
        if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
          const piece = board[newRow][newCol];
          if (piece && (piece === piece.toUpperCase()) === isWhite) {
            safety += 0.1;
          }
        }
      }
    }
    
    return safety;
  }

  // Evaluate pawn structure
  evaluatePawnStructure(board) {
    let score = 0;
    
    // Count pawns on each file
    const whitePawns = [0, 0, 0, 0, 0, 0, 0, 0];
    const blackPawns = [0, 0, 0, 0, 0, 0, 0, 0];
    
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = board[row][col];
        if (piece === 'P') whitePawns[col]++;
        if (piece === 'p') blackPawns[col]++;
      }
    }
    
    // Penalize doubled pawns
    for (let col = 0; col < 8; col++) {
      if (whitePawns[col] > 1) score -= 0.2 * (whitePawns[col] - 1);
      if (blackPawns[col] > 1) score += 0.2 * (blackPawns[col] - 1);
    }
    
    return score;
  }

  // Generate all legal moves
  generateMoves(board, isWhite) {
    const moves = [];
    
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = board[row][col];
        if (piece && (piece === piece.toUpperCase()) === isWhite) {
          const pieceMoves = this.getPieceMoves(board, row, col, piece);
          moves.push(...pieceMoves);
        }
      }
    }
    
    return moves;
  }

  // Get moves for a specific piece
  getPieceMoves(board, row, col, piece) {
    const moves = [];
    const pieceType = piece.toLowerCase();
    const isWhite = piece === piece.toUpperCase();
    
    switch (pieceType) {
      case 'p':
        moves.push(...this.getPawnMoves(board, row, col, isWhite));
        break;
      case 'n':
        moves.push(...this.getKnightMoves(board, row, col, isWhite));
        break;
      case 'b':
        moves.push(...this.getBishopMoves(board, row, col, isWhite));
        break;
      case 'r':
        moves.push(...this.getRookMoves(board, row, col, isWhite));
        break;
      case 'q':
        moves.push(...this.getQueenMoves(board, row, col, isWhite));
        break;
      case 'k':
        moves.push(...this.getKingMoves(board, row, col, isWhite));
        break;
    }
    
    return moves;
  }

  // Get pawn moves
  getPawnMoves(board, row, col, isWhite) {
    const moves = [];
    const direction = isWhite ? -1 : 1;
    const startRow = isWhite ? 6 : 1;
    
    // Forward move
    const newRow = row + direction;
    if (newRow >= 0 && newRow < 8 && !board[newRow][col]) {
      moves.push({ from: [row, col], to: [newRow, col] });
      
      // Double move from starting position
      if (row === startRow) {
        const doubleRow = row + 2 * direction;
        if (doubleRow >= 0 && doubleRow < 8 && !board[doubleRow][col]) {
          moves.push({ from: [row, col], to: [doubleRow, col] });
        }
      }
    }
    
    // Diagonal captures
    for (const dc of [-1, 1]) {
      const newCol = col + dc;
      const newRow = row + direction;
      if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
        const target = board[newRow][newCol];
        if (target && (target === target.toUpperCase()) !== isWhite) {
          moves.push({ from: [row, col], to: [newRow, newCol] });
        }
      }
    }
    
    return moves;
  }

  // Get knight moves
  getKnightMoves(board, row, col, isWhite) {
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
        if (!target || (target === target.toUpperCase()) !== isWhite) {
          moves.push({ from: [row, col], to: [newRow, newCol] });
        }
      }
    }
    
    return moves;
  }

  // Get bishop moves
  getBishopMoves(board, row, col, isWhite) {
    return this.getSlidingMoves(board, row, col, isWhite, [
      [-1, -1], [-1, 1], [1, -1], [1, 1]
    ]);
  }

  // Get rook moves
  getRookMoves(board, row, col, isWhite) {
    return this.getSlidingMoves(board, row, col, isWhite, [
      [-1, 0], [1, 0], [0, -1], [0, 1]
    ]);
  }

  // Get queen moves
  getQueenMoves(board, row, col, isWhite) {
    return this.getSlidingMoves(board, row, col, isWhite, [
      [-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]
    ]);
  }

  // Get king moves
  getKingMoves(board, row, col, isWhite) {
    const moves = [];
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const newRow = row + dr;
        const newCol = col + dc;
        if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
          const target = board[newRow][newCol];
          if (!target || (target === target.toUpperCase()) !== isWhite) {
            moves.push({ from: [row, col], to: [newRow, newCol] });
          }
        }
      }
    }
    return moves;
  }

  // Get sliding piece moves
  getSlidingMoves(board, row, col, isWhite, directions) {
    const moves = [];
    
    for (const [dr, dc] of directions) {
      let newRow = row + dr;
      let newCol = col + dc;
      
      while (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
        const target = board[newRow][newCol];
        if (!target) {
          moves.push({ from: [row, col], to: [newRow, newCol] });
        } else {
          if ((target === target.toUpperCase()) !== isWhite) {
            moves.push({ from: [row, col], to: [newRow, newCol] });
          }
          break;
        }
        newRow += dr;
        newCol += dc;
      }
    }
    
    return moves;
  }

  // Minimax with alpha-beta pruning and advanced features
  minimax(board, depth, isMaximizing, alpha = -Infinity, beta = Infinity) {
    if (depth === 0) {
      return this.evaluatePosition(board);
    }
    
    const moves = this.generateMoves(board, isMaximizing);
    if (moves.length === 0) {
      return isMaximizing ? -1000 : 1000; // Checkmate
    }
    
    // Sort moves for better alpha-beta pruning
    const sortedMoves = this.sortMoves(board, moves);
    
    if (isMaximizing) {
      let maxEval = -Infinity;
      for (const move of sortedMoves) {
        const newBoard = this.makeMove(board, move);
        const eval = this.minimax(newBoard, depth - 1, false, alpha, beta);
        maxEval = Math.max(maxEval, eval);
        alpha = Math.max(alpha, eval);
        if (beta <= alpha) break; // Alpha-beta pruning
      }
      return maxEval;
    } else {
      let minEval = Infinity;
      for (const move of sortedMoves) {
        const newBoard = this.makeMove(board, move);
        const eval = this.minimax(newBoard, depth - 1, true, alpha, beta);
        minEval = Math.min(minEval, eval);
        beta = Math.min(beta, eval);
        if (beta <= alpha) break; // Alpha-beta pruning
      }
      return minEval;
    }
  }

  // Make a move on the board
  makeMove(board, move) {
    const newBoard = board.map(row => [...row]);
    const [fromRow, fromCol] = move.from;
    const [toRow, toCol] = move.to;
    newBoard[toRow][toCol] = newBoard[fromRow][fromCol];
    newBoard[fromRow][fromCol] = null;
    return newBoard;
  }

  // Get best move using advanced algorithms
  getBestMove(fen, depth = 6) {
    const board = this.parseFEN(fen);
    const moves = this.generateMoves(board, false); // Black to move
    
    if (moves.length === 0) return null;
    
    let bestMove = null;
    let bestScore = -Infinity;
    
    // Sort moves for better alpha-beta pruning (captures first, then center moves)
    const sortedMoves = this.sortMoves(board, moves);
    
    for (const move of sortedMoves) {
      const newBoard = this.makeMove(board, move);
      const score = this.minimax(newBoard, depth - 1, true, -Infinity, Infinity);
      
      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
    }
    
    return bestMove;
  }

  // Sort moves for better alpha-beta pruning
  sortMoves(board, moves) {
    return moves.sort((a, b) => {
      // Prioritize captures
      const aCapture = board[a.to[0]][a.to[1]] !== null;
      const bCapture = board[b.to[0]][b.to[1]] !== null;
      if (aCapture && !bCapture) return -1;
      if (!aCapture && bCapture) return 1;
      
      // Then prioritize center moves
      const aCenter = this.isCenterMove(a.to);
      const bCenter = this.isCenterMove(b.to);
      if (aCenter && !bCenter) return -1;
      if (!aCenter && bCenter) return 1;
      
      return 0;
    });
  }

  // Check if move is to center
  isCenterMove(to) {
    const [row, col] = to;
    return (row >= 2 && row <= 5) && (col >= 2 && col <= 5);
  }
}

// Worker message handling
const ai = new AdvancedChessAI();

self.onmessage = function(e) {
  const { type, fen, depth } = e.data;
  
  if (type === 'getBestMove') {
    const bestMove = ai.getBestMove(fen, depth || 4);
    
    if (bestMove) {
      const fromSquare = String.fromCharCode(97 + bestMove.from[1]) + (8 - bestMove.from[0]);
      const toSquare = String.fromCharCode(97 + bestMove.to[1]) + (8 - bestMove.to[0]);
      const moveString = fromSquare + toSquare;
      
      self.postMessage(`bestmove ${moveString}`);
    } else {
      self.postMessage('bestmove (none)');
    }
  }
};