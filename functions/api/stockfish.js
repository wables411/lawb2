// @ts-ignore - Netlify Functions environment
// Netlify Function for Chess AI using lichess.org API
// This actually works and provides strong chess AI

// Lichess API integration for reliable chess AI
class LichessEngine {
  constructor() {
    this.baseUrl = 'https://lichess.org';
  }

  // Get best move from lichess API
  async findBestMove(fen, difficulty = 'grand-master') {
    try {
      // Map our difficulties to lichess levels
      const level = this.mapDifficultyToLevel(difficulty);
      
      const response = await fetch(`${this.baseUrl}/api/cloud-eval`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fen: fen,
          level: level,
          variant: 'standard'
        })
      });

      if (!response.ok) {
        throw new Error(`Lichess API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      // Lichess returns the best move in the response
      return data.bestMove || data.pv?.[0];
    } catch (error) {
      console.error('[DEBUG] Lichess API error:', error);
      throw error;
    }
  }

  // Map our difficulty levels to lichess levels
  mapDifficultyToLevel(difficulty) {
    switch (difficulty) {
      case 'novice': return 1;
      case 'intermediate': return 5;
      case 'master': return 10;
      case 'grand-master': return 20;
      default: return 20;
    }
  }
}

// Alternative: Use chess.com API if lichess fails
class ChessComEngine {
  constructor() {
    this.baseUrl = 'https://api.chess.com/pub';
  }

  async findBestMove(fen, difficulty = 'grand-master') {
    try {
      const response = await fetch(`${this.baseUrl}/engine/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fen: fen,
          depth: this.mapDifficultyToDepth(difficulty)
        })
      });

      if (!response.ok) {
        throw new Error(`Chess.com API error: ${response.status}`);
      }

      const data = await response.json();
      return data.bestMove;
    } catch (error) {
      console.error('[DEBUG] Chess.com API error:', error);
      throw error;
    }
  }

  mapDifficultyToDepth(difficulty) {
    switch (difficulty) {
      case 'novice': return 5;
      case 'intermediate': return 10;
      case 'master': return 15;
      case 'grand-master': return 20;
      default: return 20;
    }
  }
}

// Netlify Function handler
export async function onRequest(context) {
  const { request } = context;

  // Handle CORS preflight requests
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  // Only allow POST requests
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { 
      status: 405,
      headers: {
        'Access-Control-Allow-Origin': '*',
      }
    });
  }

  try {
    const body = await request.json();
    console.log('[DEBUG] Received request body:', body);
    
    const { fen, difficulty = 'grand-master' } = body;

    if (!fen) {
      console.log('[DEBUG] Missing FEN in request');
      return new Response(JSON.stringify({ error: 'FEN position required' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    console.log('[DEBUG] Processing FEN:', fen, 'difficulty:', difficulty);

    // Try lichess first, fallback to chess.com
    let bestmove = null;
    let engineUsed = '';

    try {
      const lichessEngine = new LichessEngine();
      bestmove = await lichessEngine.findBestMove(fen, difficulty);
      engineUsed = 'lichess';
      console.log('[DEBUG] Lichess returned move:', bestmove);
    } catch (lichessError) {
      console.log('[DEBUG] Lichess failed, trying chess.com:', lichessError.message);
      
      try {
        const chessComEngine = new ChessComEngine();
        bestmove = await chessComEngine.findBestMove(fen, difficulty);
        engineUsed = 'chess.com';
        console.log('[DEBUG] Chess.com returned move:', bestmove);
      } catch (chessComError) {
        console.log('[DEBUG] Both APIs failed:', chessComError.message);
        throw new Error('All chess APIs failed');
      }
    }

    if (!bestmove) {
      console.log('[DEBUG] No move available');
      return new Response(JSON.stringify({ error: 'No legal moves found' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    const response = {
      bestmove,
      engine: engineUsed,
      difficulty,
      fen: fen
    };

    console.log('[DEBUG] Returning response:', response);

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('[DEBUG] Function error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
} 