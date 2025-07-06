import { Chess } from 'chess.js';

// Stockfish WebAssembly integration for strong AI
let stockfish = null;
let stockfishReady = false;

// Initialize Stockfish
async function initStockfish() {
  if (stockfish) return;
  
  try {
    // Import Stockfish WASM
    const { default: Stockfish } = await import('stockfish');
    stockfish = Stockfish();
    
    stockfish.onmessage = (event) => {
      const message = event.data;
      if (message.includes('uciok')) {
        stockfishReady = true;
      }
    };
    
    // Initialize UCI
    stockfish.postMessage('uci');
    stockfish.postMessage('isready');
  } catch (error) {
    // console.error('Failed to load Stockfish:', error);
  }
}

// Generate strong move using Stockfish
async function generateStockfishMove(fen, timeLimit = 5000) {
  if (!stockfishReady) {
    await initStockfish();
    // Simple wait for Stockfish to be ready
    let attempts = 0;
    while (!stockfishReady && attempts < 50) {
      await new Promise(resolve => resolve());
      attempts++;
    }
  }
  
  return new Promise((resolve) => {
    let bestMove = null;
    
    stockfish.onmessage = (event) => {
      const message = event.data;
      
      if (message.startsWith('bestmove')) {
        const move = message.split(' ')[1];
        if (move && move !== '(none)') {
          bestMove = move;
        }
        resolve(bestMove);
      }
    };
    
    // Set up position and calculate
    stockfish.postMessage(`position fen ${fen}`);
    stockfish.postMessage(`go movetime ${timeLimit}`);
  });
}

// Fallback to chess.js for weaker difficulties
function generateMoveWithChessJS(fen, difficulty = 'intermediate') {
  try {
    const chess = new Chess(fen);
    const moves = chess.moves({ verbose: true });
    
    if (moves.length === 0) return null;
    
    // Different strategies based on difficulty
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
    } else {
      // World-class: more sophisticated
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
    const { fen, difficulty = 'master-class', movetime = 5000 } = JSON.parse(event.body || '{}');
    
    if (!fen) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'FEN string is required' })
      };
    }

    let move = null;
    
    // Use Stockfish for master-class, chess.js for others
    if (difficulty === 'master-class') {
      try {
        move = await generateStockfishMove(fen, movetime);
      } catch (error) {
        // console.error('Stockfish failed, falling back to chess.js:', error);
        const chessMove = generateMoveWithChessJS(fen, 'world-class');
        move = chessMove ? chessMove.from + chessMove.to : null;
      }
    } else {
      const chessMove = generateMoveWithChessJS(fen, difficulty);
      move = chessMove ? chessMove.from + chessMove.to : null;
    }
    
    if (!move) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'No valid moves available' })
      };
    }

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