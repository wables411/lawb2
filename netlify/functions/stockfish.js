import { Chess } from 'chess.js';

// Novice AI - Very easy to beat
function generateNoviceMove(chess) {
  const moves = chess.moves({ verbose: true });
  if (moves.length === 0) return null;
  
  // Novice makes many mistakes:
  // - Random moves 70% of the time
  // - Sometimes makes obvious blunders
  // - Rarely sees simple tactics
  
  const random = Math.random();
  
  if (random < 0.7) {
    // 70% random moves
    return moves[Math.floor(Math.random() * moves.length)];
  } else if (random < 0.85) {
    // 15% - sometimes captures if available
    const captures = moves.filter(move => move.flags.includes('c'));
    if (captures.length > 0) {
      return captures[Math.floor(Math.random() * captures.length)];
    }
    return moves[Math.floor(Math.random() * moves.length)];
  } else {
    // 15% - occasionally makes a reasonable move
    const reasonableMoves = moves.filter(move => {
      // Avoid moving king unless necessary
      if (move.piece === 'k' && !chess.inCheck()) return false;
      return true;
    });
    return reasonableMoves[Math.floor(Math.random() * reasonableMoves.length)];
  }
}

// Intermediate AI - Moderate challenge
function generateIntermediateMove(chess) {
  const moves = chess.moves({ verbose: true });
  if (moves.length === 0) return null;
  
  // Intermediate plays reasonably but makes mistakes:
  // - Prioritizes captures and checks
  // - Basic positional understanding
  // - Still misses complex tactics
  
  const captures = moves.filter(move => move.flags.includes('c'));
  const checks = moves.filter(move => move.san.includes('+'));
  const centerMoves = moves.filter(move => {
    const to = move.to;
    return (to === 'e4' || to === 'e5' || to === 'd4' || to === 'd5' || 
            to === 'c4' || to === 'c5' || to === 'f4' || to === 'f5');
  });
  
  // Prioritize captures and checks
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

// Master AI - Very strong, hard to beat
function generateMasterMove(chess) {
  const moves = chess.moves({ verbose: true });
  if (moves.length === 0) return null;
  
  // Master plays very well:
  // - Strong tactical awareness
  // - Good positional understanding
  // - Advanced strategies
  // - Still makes occasional mistakes
  
  const scoredMoves = moves.map(move => {
    let score = 0;
    
    // Tactical advantages
    if (move.san.includes('#')) {
      score += 50000; // Checkmate
    } else if (move.san.includes('+')) {
      score += 2000; // Check
    }
    
    // Material gain
    if (move.flags.includes('c')) {
      const pieceValues = { 'p': 100, 'n': 320, 'b': 330, 'r': 500, 'q': 900, 'k': 20000 };
      const capturedValue = pieceValues[move.captured] || 0;
      const movingValue = pieceValues[move.piece] || 0;
      
      if (capturedValue > movingValue) {
        score += capturedValue * 10; // Winning captures
      } else if (capturedValue === movingValue) {
        score += 50; // Equal trades
      } else {
        score -= movingValue; // Losing trades
      }
    }
    
    // Positional advantages
    const centerSquares = ['e4', 'e5', 'd4', 'd5', 'c4', 'c5', 'f4', 'f5'];
    if (centerSquares.includes(move.to)) {
      score += 60;
    }
    
    // Pawn advancement
    if (move.piece === 'p') {
      const rank = parseInt(move.to[1]);
      if (rank >= 5) score += 80;
      if (rank >= 6) score += 150;
    }
    
    // Piece development
    if ((move.piece === 'n' || move.piece === 'b') && move.from[1] === '1') {
      score += 80;
    }
    
    // King safety
    if (move.piece === 'k' && chess.history().length < 20) {
      score -= 500;
    }
    
    // Add some randomness to make it beatable
    score += Math.random() * 100;
    
    return { ...move, score };
  });
  
  scoredMoves.sort((a, b) => b.score - a.score);
  
  // Pick from top 3 moves with some randomness
  const topMoves = scoredMoves.slice(0, 3);
  return topMoves[Math.floor(Math.random() * topMoves.length)];
}

// Grand-Master AI - Virtually unbeatable
function generateGrandMasterMove(chess) {
  const moves = chess.moves({ verbose: true });
  if (moves.length === 0) return null;
  
  // Advanced piece-square tables for grand-master play
  const pieceSquareTables = {
    'p': [ // Pawn
      [0,  0,  0,  0,  0,  0,  0,  0],
      [50, 50, 50, 50, 50, 50, 50, 50],
      [10, 10, 20, 30, 30, 20, 10, 10],
      [5,  5, 10, 25, 25, 10,  5,  5],
      [0,  0,  0, 20, 20,  0,  0,  0],
      [5, -5,-10,  0,  0,-10, -5,  5],
      [5, 10, 10,-20,-20, 10, 10,  5],
      [0,  0,  0,  0,  0,  0,  0,  0]
    ],
    'n': [ // Knight
      [-50,-40,-30,-30,-30,-30,-40,-50],
      [-40,-20,  0,  0,  0,  0,-20,-40],
      [-30,  0, 10, 15, 15, 10,  0,-30],
      [-30,  5, 15, 20, 20, 15,  5,-30],
      [-30,  0, 15, 20, 20, 15,  0,-30],
      [-30,  5, 10, 15, 15, 10,  5,-30],
      [-40,-20,  0,  5,  5,  0,-20,-40],
      [-50,-40,-30,-30,-30,-30,-40,-50]
    ],
    'b': [ // Bishop
      [-20,-10,-10,-10,-10,-10,-10,-20],
      [-10,  0,  0,  0,  0,  0,  0,-10],
      [-10,  0,  5, 10, 10,  5,  0,-10],
      [-10,  5,  5, 10, 10,  5,  5,-10],
      [-10,  0, 10, 10, 10, 10,  0,-10],
      [-10, 10, 10, 10, 10, 10, 10,-10],
      [-10,  5,  0,  0,  0,  0,  5,-10],
      [-20,-10,-10,-10,-10,-10,-10,-20]
    ],
    'r': [ // Rook
      [0,  0,  0,  0,  0,  0,  0,  0],
      [5, 10, 10, 10, 10, 10, 10,  5],
      [-5,  0,  0,  0,  0,  0,  0, -5],
      [-5,  0,  0,  0,  0,  0,  0, -5],
      [-5,  0,  0,  0,  0,  0,  0, -5],
      [-5,  0,  0,  0,  0,  0,  0, -5],
      [-5,  0,  0,  0,  0,  0,  0, -5],
      [0,  0,  0,  5,  5,  0,  0,  0]
    ],
    'q': [ // Queen
      [-20,-10,-10, -5, -5,-10,-10,-20],
      [-10,  0,  0,  0,  0,  0,  0,-10],
      [-10,  0,  5,  5,  5,  5,  0,-10],
      [-5,  0,  5,  5,  5,  5,  0, -5],
      [0,  0,  5,  5,  5,  5,  0, -5],
      [-10,  5,  5,  5,  5,  5,  0,-10],
      [-10,  0,  5,  0,  0,  0,  0,-10],
      [-20,-10,-10, -5, -5,-10,-10,-20]
    ],
    'k': [ // King
      [-30,-40,-40,-50,-50,-40,-40,-30],
      [-30,-40,-40,-50,-50,-40,-40,-30],
      [-30,-40,-40,-50,-50,-40,-40,-30],
      [-30,-40,-40,-50,-50,-40,-40,-30],
      [-20,-30,-30,-40,-40,-30,-30,-20],
      [-10,-20,-20,-20,-20,-20,-20,-10],
      [20, 20,  0,  0,  0,  0, 20, 20],
      [20, 30, 10,  0,  0, 10, 30, 20]
    ]
  };

  // Count pieces to determine game phase
  const board = chess.board();
  let totalPieces = 0;
  let queens = 0;
  
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece) {
        totalPieces++;
        if (piece.toLowerCase() === 'q') queens++;
      }
    }
  }
  
  const isEndgame = totalPieces <= 12 || queens === 0;
  const isLateEndgame = totalPieces <= 6;

  // Score each move with grand-master precision
  const scoredMoves = moves.map(move => {
    let score = 0;
    
    // 1. IMMEDIATE TACTICAL ADVANTAGES (highest priority)
    if (move.san.includes('#')) {
      score += 1000000; // Checkmate
    } else if (move.san.includes('+')) {
      score += 10000; // Check
    }
    
    // 2. MATERIAL GAIN (with advanced evaluation)
    if (move.flags.includes('c')) {
      const pieceValues = { 'p': 100, 'n': 320, 'b': 330, 'r': 500, 'q': 900, 'k': 20000 };
      const capturedValue = pieceValues[move.captured] || 0;
      const movingValue = pieceValues[move.piece] || 0;
      
      if (capturedValue > movingValue) {
        score += capturedValue * 20; // Winning captures
      } else if (capturedValue === movingValue) {
        score += 100; // Equal trades
      } else {
        score -= movingValue * 3; // Losing trades
      }
    }
    
    // 3. POSITIONAL ADVANTAGES (piece-square tables)
    const piece = move.piece;
    const toRow = parseInt(move.to[1]) - 1;
    const toCol = move.to.charCodeAt(0) - 97;
    
    if (pieceSquareTables[piece] && toRow >= 0 && toRow < 8 && toCol >= 0 && toCol < 8) {
      score += pieceSquareTables[piece][toRow][toCol];
    }
    
    // 4. ADVANCED STRATEGIC EVALUATION
    if (piece === 'p') {
      const rank = parseInt(move.to[1]);
      if (rank >= 5) score += 150;
      if (rank >= 6) score += 300;
      if (rank >= 7) score += 1000;
      
      // Doubled pawns penalty
      const file = move.to[0];
      const pawnsInFile = chess.board().filter(row => 
        row[file.charCodeAt(0) - 97] === 'p'
      ).length;
      if (pawnsInFile > 1) score -= 100;
    }
    
    // 5. PIECE DEVELOPMENT AND ACTIVITY
    if ((piece === 'n' || piece === 'b') && move.from[1] === '1') {
      score += 150;
    }
    
    // 6. KING SAFETY
    if (piece === 'k') {
      const gamePhase = chess.history().length;
      if (gamePhase < 15) {
        score -= 2000;
      } else if (gamePhase < 30) {
        score -= 1000;
      }
      
      if (move.san.includes('O-O') || move.san.includes('O-O-O')) {
        score += 500;
      }
      
      if (isEndgame) {
        score += 200;
      }
    }
    
    // 7. ROOK ACTIVITY
    if (piece === 'r') {
      const file = move.to[0];
      const centerFiles = ['d', 'e'];
      if (centerFiles.includes(file)) {
        score += 250;
      }
      
      if (parseInt(move.to[1]) === 7) {
        score += 300;
      }
      
      const rooksOnFile = chess.board().filter(row => 
        row[file.charCodeAt(0) - 97] === 'r'
      ).length;
      if (rooksOnFile > 1) score += 200;
    }
    
    // 8. QUEEN ACTIVITY
    if (piece === 'q') {
      const gamePhase = chess.history().length;
      if (gamePhase < 10) {
        score -= 300;
      } else {
        score += 100;
      }
      
      if (isEndgame) {
        score += 300;
      }
    }
    
    // 9. CENTER CONTROL
    const centerSquares = ['e4', 'e5', 'd4', 'd5', 'c4', 'c5', 'f4', 'f5'];
    if (centerSquares.includes(move.to)) {
      score += 120;
    }
    
    // 10. TEMPO AND INITIATIVE
    if (chess.inCheck()) {
      score += 500;
    }
    
    // 11. TACTICAL OPPORTUNITIES
    const tempChess = new Chess(chess.fen());
    tempChess.move(move);
    
    const opponentMoves = tempChess.moves({ verbose: true });
    const tacticalMoves = opponentMoves.filter(m => 
      m.flags.includes('c') || m.san.includes('+')
    );
    score += tacticalMoves.length * 100;
    
    // 12. ENDGAME SPECIFIC EVALUATION
    if (isEndgame) {
      if (piece === 'p') {
        const rank = parseInt(move.to[1]);
        score += rank * 50;
        
        const file = move.to[0];
        const isPassedPawn = !chess.board().some((row, r) => {
          if (r === toRow) return false;
          const enemyPawn = row[file.charCodeAt(0) - 97];
          return enemyPawn === 'p' && r > toRow;
        });
        if (isPassedPawn) score += 500;
      }
      
      if (piece === 'k' && isLateEndgame) {
        score += 400;
      }
      
      if (piece === 'r' && isEndgame) {
        score += 200;
      }
    }
    
    // 13. STALEMATE PREVENTION
    if (isEndgame && totalPieces <= 8) {
      const tempChess2 = new Chess(chess.fen());
      tempChess2.move(move);
      
      const opponentMovesAfter = tempChess2.moves();
      if (opponentMovesAfter.length === 0 && !tempChess2.inCheck()) {
        score -= 10000;
      }
    }
    
    // 14. AGGRESSIVE PLAY IN WINNING POSITIONS
    const materialAdvantage = calculateMaterialAdvantage(chess);
    if (materialAdvantage > 200) {
      score += 300;
    }
    
    return { ...move, score };
  });
  
  // Sort by score and pick the absolute best move (no randomness for grand-master)
  scoredMoves.sort((a, b) => b.score - a.score);
  return scoredMoves[0];
}

// Helper function to calculate material advantage
function calculateMaterialAdvantage(chess) {
  const pieceValues = { 'p': 100, 'n': 320, 'b': 330, 'r': 500, 'q': 900, 'k': 20000 };
  let advantage = 0;
  
  const board = chess.board();
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece) {
        const value = pieceValues[piece.toLowerCase()] || 0;
        if (piece === piece.toUpperCase()) {
          advantage += value; // Red pieces (uppercase)
        } else {
          advantage -= value; // Blue pieces (lowercase)
        }
      }
    }
  }
  
  return advantage;
}

// Generate moves based on difficulty
function generateMoveWithChessJS(fen, difficulty = 'intermediate') {
  try {
    const chess = new Chess(fen);
    const moves = chess.moves({ verbose: true });
    
    console.log('[DEBUG] generateMoveWithChessJS - moves available:', moves.length);
    console.log('[DEBUG] generateMoveWithChessJS - difficulty:', difficulty);
    
    if (moves.length === 0) return null;
    
    let result;
    switch (difficulty) {
      case 'novice':
        result = generateNoviceMove(chess);
        break;
      case 'intermediate':
        result = generateIntermediateMove(chess);
        break;
      case 'master':
        result = generateMasterMove(chess);
        break;
      case 'grand-master':
        result = generateGrandMasterMove(chess);
        break;
      default:
        result = generateIntermediateMove(chess);
    }
    
    console.log('[DEBUG] generateMoveWithChessJS - result:', result);
    return result;
  } catch (error) {
    console.log('[DEBUG] generateMoveWithChessJS - ERROR:', error);
    console.log('[DEBUG] generateMoveWithChessJS - ERROR stack:', error.stack);
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

    // Check if game is already over
    const chess = new Chess(fen);
    console.log('[DEBUG] Parsed board:', chess.board());
    const moves = chess.moves({ verbose: true });
    console.log('[DEBUG] Number of moves available:', moves.length);
    if (chess.isGameOver()) {
      console.log('[DEBUG] Game is already over');
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Game is already over' })
      };
    }

    const chessMove = generateMoveWithChessJS(fen, difficulty);
    
    if (!chessMove) {
      console.log('[DEBUG] No valid moves available for FEN:', fen);
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'No valid moves available' })
      };
    }

    const move = chessMove.from + chessMove.to;
    console.log('[DEBUG] Selected move:', move);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ move })
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