// Cloudflare Worker for Stockfish Chess API
// This replaces the Node.js stockfish-api.cjs

// Simple chess engine implementation for Cloudflare Workers
class SimpleChessEngine {
  constructor() {
    this.board = this.initializeBoard();
    this.moveHistory = [];
  }

  initializeBoard() {
    // Initialize empty 8x8 board
    const board = Array(8).fill(null).map(() => Array(8).fill(null));
    
    // Set up initial piece positions (standard chess setup)
    const initialSetup = {
      0: ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'], // Black pieces
      1: ['p', 'p', 'p', 'p', 'p', 'p', 'p', 'p'], // Black pawns
      6: ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'], // White pawns
      7: ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R']  // White pieces
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
    const parts = fen.split(' ');
    const position = parts[0];
    const rows = position.split('/');
    
    // Clear board
    this.board = Array(8).fill(null).map(() => Array(8).fill(null));
    
    for (let row = 0; row < 8; row++) {
      let col = 0;
      for (let char of rows[row]) {
        if (char >= '1' && char <= '8') {
          col += parseInt(char);
        } else {
          this.board[row][col] = char;
          col++;
        }
      }
    }
    
    // Parse the side to move from FEN
    if (parts.length > 1) {
      this.currentPlayer = parts[1] === 'w' ? 'white' : 'black';
    } else {
      this.currentPlayer = 'white'; // Default
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
    return (player === 'white' && isWhite) || (player === 'black' && !isWhite);
  }

  getMovesForPiece(row, col, piece) {
    const moves = [];
    const isWhite = piece === piece.toUpperCase();
    const pieceType = piece.toLowerCase();
    
    switch (pieceType) {
      case 'p': // Pawn
        moves.push(...this.getPawnMoves(row, col, isWhite));
        break;
      case 'r': // Rook
        moves.push(...this.getRookMoves(row, col));
        break;
      case 'n': // Knight
        moves.push(...this.getKnightMoves(row, col));
        break;
      case 'b': // Bishop
        moves.push(...this.getBishopMoves(row, col));
        break;
      case 'q': // Queen
        moves.push(...this.getQueenMoves(row, col));
        break;
      case 'k': // King
        moves.push(...this.getKingMoves(row, col));
        break;
    }
    
    return moves;
  }

  getPawnMoves(row, col, isWhite) {
    const moves = [];
    const direction = isWhite ? -1 : 1;
    const startRow = isWhite ? 6 : 1;
    
    // Forward move
    if (this.isValidPosition(row + direction, col) && !this.board[row + direction][col]) {
      moves.push({ from: [row, col], to: [row + direction, col] });
      
      // Double move from starting position
      if (row === startRow && !this.board[row + 2 * direction][col]) {
        moves.push({ from: [row, col], to: [row + 2 * direction, col] });
      }
    }
    
    // Captures
    for (let dcol of [-1, 1]) {
      const newRow = row + direction;
      const newCol = col + dcol;
      if (this.isValidPosition(newRow, newCol) && 
          this.board[newRow][newCol] && 
          this.isPieceOfPlayer(this.board[newRow][newCol], isWhite ? 'black' : 'white')) {
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
      [-1, 0], [1, 0], [0, -1], [0, 1],
      [-1, -1], [-1, 1], [1, -1], [1, 1]
    ]);
  }

  getKnightMoves(row, col) {
    const moves = [];
    const knightMoves = [
      [-2, -1], [-2, 1], [-1, -2], [-1, 2],
      [1, -2], [1, 2], [2, -1], [2, 1]
    ];
    
    for (let [drow, dcol] of knightMoves) {
      const newRow = row + drow;
      const newCol = col + dcol;
      if (this.isValidPosition(newRow, newCol) && 
          (!this.board[newRow][newCol] || 
           !this.isPieceOfPlayer(this.board[newRow][newCol], this.getCurrentPlayer()))) {
        moves.push({ from: [row, col], to: [newRow, newCol] });
      }
    }
    
    return moves;
  }

  getKingMoves(row, col) {
    const moves = [];
    const kingMoves = [
      [-1, -1], [-1, 0], [-1, 1],
      [0, -1], [0, 1],
      [1, -1], [1, 0], [1, 1]
    ];
    
    for (let [drow, dcol] of kingMoves) {
      const newRow = row + drow;
      const newCol = col + dcol;
      if (this.isValidPosition(newRow, newCol) && 
          (!this.board[newRow][newCol] || 
           !this.isPieceOfPlayer(this.board[newRow][newCol], this.getCurrentPlayer()))) {
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
    
    // Simple evaluation: prefer captures and center control
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
    
    // Prefer captures
    if (targetPiece) {
      score += this.getPieceValue(targetPiece);
    }
    
    // Prefer center control
    const centerDistance = Math.abs(move.to[0] - 3.5) + Math.abs(move.to[1] - 3.5);
    score += (7 - centerDistance) * 0.1;
    
    // Add some randomness for variety
    score += Math.random() * 0.5;
    
    return score;
  }

  getPieceValue(piece) {
    const values = { 'p': 1, 'n': 3, 'b': 3, 'r': 5, 'q': 9, 'k': 0 };
    return values[piece.toLowerCase()] || 0;
  }

  moveToNotation(move) {
    const files = 'abcdefgh';
    const ranks = '87654321';
    
    const fromFile = files[move.from[1]];
    const fromRank = ranks[move.from[0]];
    const toFile = files[move.to[1]];
    const toRank = ranks[move.to[0]];
    
    return fromFile + fromRank + toFile + toRank;
  }
}

export default {
  async fetch(request) {
    // Handle CORS
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    // Only allow POST requests
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    try {
      const { fen, movetime = 1200 } = await request.json();

      if (!fen) {
        return new Response(JSON.stringify({ error: 'FEN position required' }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        });
      }

      // Initialize chess engine
      const engine = new SimpleChessEngine();
      engine.setPositionFromFEN(fen);
      
      // Find best move
      const bestmove = engine.findBestMove();
      
      if (!bestmove) {
        return new Response(JSON.stringify({ error: 'No legal moves found' }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        });
      }
      
      const response = {
        bestmove: bestmove,
        fen: fen,
        movetime: movetime
      };

      return new Response(JSON.stringify(response), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });

    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }
  },
}; 