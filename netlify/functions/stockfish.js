import { Chess } from 'chess.js';

// Strong move evaluation for master-class difficulty
function evaluatePosition(chess) {
  const moves = chess.moves({ verbose: true });
  if (moves.length === 0) return null;
  
  // Score each move based on multiple factors
  const scoredMoves = moves.map(move => {
    let score = 0;
    
    // Material gain (captures)
    if (move.flags.includes('c')) {
      const pieceValues = { 'p': 100, 'n': 320, 'b': 330, 'r': 500, 'q': 900, 'k': 20000 };
      const capturedValue = pieceValues[move.captured] || 0;
      const movingValue = pieceValues[move.piece] || 0;
      score += capturedValue * 10 - movingValue; // Prioritize good captures
    }
    
    // Checks
    if (move.san.includes('+')) {
      score += 500;
    }
    
    // Checkmate
    if (move.san.includes('#')) {
      score += 10000;
    }
    
    // Center control
    const centerSquares = ['e4', 'e5', 'd4', 'd5', 'c4', 'c5', 'f4', 'f5'];
    if (centerSquares.includes(move.to)) {
      score += 50;
    }
    
    // Pawn advancement
    if (move.piece === 'p') {
      const rank = parseInt(move.to[1]);
      if (rank >= 5) score += 30; // Advanced pawns
      if (rank >= 6) score += 50; // Very advanced pawns
    }
    
    // Piece development (knights and bishops to good squares)
    if ((move.piece === 'n' || move.piece === 'b') && move.from[1] === '1') {
      score += 20;
    }
    
    // King safety (avoid moving king in middle game)
    if (move.piece === 'k' && chess.history().length < 20) {
      score -= 100;
    }
    
    // Rook activity
    if (move.piece === 'r' && (move.to[0] === 'e' || move.to[0] === 'd')) {
      score += 30; // Rooks on open files
    }
    
    return { ...move, score };
  });
  
  // Sort by score (highest first)
  scoredMoves.sort((a, b) => b.score - a.score);
  
  // For master-class, pick from top 3 moves with some randomness
  const topMoves = scoredMoves.slice(0, 3);
  return topMoves[Math.floor(Math.random() * topMoves.length)];
}

// Generate moves based on difficulty
function generateMoveWithChessJS(fen, difficulty = 'intermediate') {
  try {
    const chess = new Chess(fen);
    const moves = chess.moves({ verbose: true });
    
    if (moves.length === 0) return null;
    
    if (difficulty === 'novice') {
      // Random moves for novice
      return moves[Math.floor(Math.random() * moves.length)];
    } else if (difficulty === 'intermediate') {
      // Basic strategy for intermediate
      const captures = moves.filter(move => move.flags.includes('c'));
      const checks = moves.filter(move => move.san.includes('+'));
      
      if (captures.length > 0) {
        return captures[Math.floor(Math.random() * captures.length)];
      } else if (checks.length > 0) {
        return checks[Math.floor(Math.random() * checks.length)];
      } else {
        return moves[Math.floor(Math.random() * moves.length)];
      }
    } else if (difficulty === 'world-class') {
      // Advanced strategy for world-class
      const captures = moves.filter(move => move.flags.includes('c'));
      const checks = moves.filter(move => move.san.includes('+'));
      const centerMoves = moves.filter(move => {
        const to = move.to;
        return (to === 'e4' || to === 'e5' || to === 'd4' || to === 'd5' || 
                to === 'c4' || to === 'c5' || to === 'f4' || to === 'f5');
      });
      
      if (captures.length > 0) {
        return captures[Math.floor(Math.random() * captures.length)];
      } else if (checks.length > 0) {
        return checks[Math.floor(Math.random() * checks.length)];
      } else if (centerMoves.length > 0) {
        return centerMoves[Math.floor(Math.random() * centerMoves.length)];
      } else {
        return moves[Math.floor(Math.random() * moves.length)];
      }
    } else {
      // Master-class: use strong evaluation
      return evaluatePosition(chess);
    }
  } catch (error) {
    return null;
  }
}

export async function handler(event) {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    const { fen, difficulty = 'master-class' } = JSON.parse(event.body || '{}');
    
    if (!fen) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'FEN string is required' })
      };
    }

    // Check if game is already over
    const chess = new Chess(fen);
    if (chess.isGameOver()) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Game is already over' })
      };
    }

    const chessMove = generateMoveWithChessJS(fen, difficulty);
    
    if (!chessMove) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'No valid moves available' })
      };
    }

    const move = chessMove.from + chessMove.to;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ move })
    };

  } catch (error) {
    // console.error('Function error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
} 