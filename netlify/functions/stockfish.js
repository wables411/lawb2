import { Chess } from 'chess.js';

// Use chess.js for move generation (reliable and fast)
function generateMoveWithChessJS(fen) {
  try {
    const chess = new Chess(fen);
    const moves = chess.moves({ verbose: true });
    
    if (moves.length === 0) return null;
    
    // Improved AI: prioritize better moves
    const captures = moves.filter(move => move.flags.includes('c'));
    const checks = moves.filter(move => move.san.includes('+'));
    const pawnMoves = moves.filter(move => move.piece === 'p');
    const centerMoves = moves.filter(move => {
      const to = move.to;
      return (to === 'e4' || to === 'e5' || to === 'd4' || to === 'd5' || 
              to === 'c4' || to === 'c5' || to === 'f4' || to === 'f5');
    });
    
    // Priority order: captures > checks > center moves > pawn moves > others
    if (captures.length > 0) {
      return captures[Math.floor(Math.random() * captures.length)];
    } else if (checks.length > 0) {
      return checks[Math.floor(Math.random() * checks.length)];
    } else if (centerMoves.length > 0) {
      return centerMoves[Math.floor(Math.random() * centerMoves.length)];
    } else if (pawnMoves.length > 0) {
      return pawnMoves[Math.floor(Math.random() * pawnMoves.length)];
    } else {
      return moves[Math.floor(Math.random() * moves.length)];
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
    const { fen } = JSON.parse(event.body || '{}');
    
    if (!fen) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'FEN string is required' })
      };
    }

    // Generate move using chess.js
    const chessMove = generateMoveWithChessJS(fen);
    
    if (!chessMove) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'No valid moves available' })
      };
    }

    // Return move in the format expected by the frontend
    const move = chessMove.from + chessMove.to;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ move })
    };

  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
} 