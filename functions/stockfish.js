import { Chess } from 'chess.js';

// Smart AI implementation using Chess.js
function generateSmartMove(fen, difficulty = 'intermediate') {
  try {
    const chess = new Chess(fen);
    
    if (chess.isGameOver()) {
      console.log('[DEBUG] Game is already over');
      return null;
    }
    
    const moves = chess.moves({ verbose: true });
    if (moves.length === 0) {
      console.log('[DEBUG] No moves available');
      return null;
    }
    
    let bestMove = null;
    
    // Check for checkmate first
    const checkmateMoves = moves.filter(move => move.san.includes('#'));
    if (checkmateMoves.length > 0) {
      bestMove = checkmateMoves[0];
    }
    // Check for check
    else if (moves.filter(move => move.san.includes('+')).length > 0) {
      const checkMoves = moves.filter(move => move.san.includes('+'));
      bestMove = checkMoves[0];
    }
    // Prioritize captures
    else if (moves.filter(move => move.flags.includes('c')).length > 0) {
      const captures = moves.filter(move => move.flags.includes('c'));
      // Choose best capture based on piece values
      const pieceValues = { 'p': 1, 'n': 3, 'b': 3, 'r': 5, 'q': 9, 'k': 0 };
      bestMove = captures.reduce((best, current) => {
        const currentValue = pieceValues[current.captured?.toLowerCase()] || 0;
        const bestValue = pieceValues[best.captured?.toLowerCase()] || 0;
        return currentValue > bestValue ? current : best;
      });
    }
    // Center control for opening/middlegame
    else if (moves.filter(move => {
      const to = move.to;
      return (to === 'e4' || to === 'e5' || to === 'd4' || to === 'd5' || 
              to === 'c4' || to === 'c5' || to === 'f4' || to === 'f5');
    }).length > 0) {
      const centerMoves = moves.filter(move => {
        const to = move.to;
        return (to === 'e4' || to === 'e5' || to === 'd4' || to === 'd5' || 
                to === 'c4' || to === 'c5' || to === 'f4' || to === 'f5');
      });
      bestMove = centerMoves[Math.floor(Math.random() * centerMoves.length)];
    }
    // Random move as fallback
    else {
      bestMove = moves[Math.floor(Math.random() * moves.length)];
    }
    
    if (!bestMove) {
      bestMove = moves[Math.floor(Math.random() * moves.length)];
    }
    
    console.log(`[DEBUG] Selected move: ${bestMove.san} (${bestMove.from}${bestMove.to})`);
    return { from: bestMove.from, to: bestMove.to };
    
  } catch (error) {
    console.log('[DEBUG] Error generating move:', error);
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
    const { fen, difficulty = 'intermediate' } = JSON.parse(event.body || '{}');
    
    // Debug logging
    console.log('[DEBUG] Received FEN:', fen);
    console.log('[DEBUG] Difficulty:', difficulty);
    
    if (!fen) {
      console.log('[DEBUG] No FEN provided');
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'FEN string is required' })
      };
    }

    // Generate smart move using Chess.js
    const move = generateSmartMove(fen, difficulty);
    
    if (!move) {
      console.log('[DEBUG] No valid moves available');
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'No valid moves available' })
      };
    }

    const bestmove = move.from + move.to;
    console.log('[DEBUG] Returning move:', bestmove);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ bestmove: bestmove })
    };

  } catch (error) {
    console.log('[DEBUG] Internal server error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
}