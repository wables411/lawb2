// Stockfish API using external chess engines
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

    // Use Chess.com API for actual chess engine moves
    const chessComUrl = `https://www.chess.com/callback/live/game/${Math.random().toString(36).substr(2, 9)}`;
    
    // Alternative: Use a free chess API
    const freeChessApiUrl = `https://chess-api.com/v1/stockfish`;
    
    console.log(`[DEBUG] Calling free chess API: ${freeChessApiUrl}`);
    
    const response = await fetch(freeChessApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        fen: fen,
        depth: difficulty === 'grand-master' ? 20 : difficulty === 'master' ? 15 : 10
      })
    });

    if (!response.ok) {
      // Fallback to Lichess API
      console.log('[DEBUG] Free chess API failed, trying Lichess API');
      return await getLichessMove(fen, difficulty, headers);
    }

    const data = await response.json();
    console.log('[DEBUG] Free chess API response:', data);

    const bestmove = data.bestmove || data.move || data.best_move;
    
    if (!bestmove) {
      console.log('[DEBUG] No moves from free chess API, trying Lichess');
      return await getLichessMove(fen, difficulty, headers);
    }

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

// Fallback to Lichess API
async function getLichessMove(fen, difficulty, headers) {
  try {
    const lichessUrl = `https://explorer.lichess.ovh/lichess?fen=${encodeURIComponent(fen)}&topGames=0&recentGames=0`;
    
    console.log(`[DEBUG] Calling Lichess API: ${lichessUrl}`);
    
    const response = await fetch(lichessUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'LawbChess/1.0'
      }
    });

    if (!response.ok) {
      throw new Error(`Lichess API failed with status ${response.status}`);
    }

    const data = await response.json();
    console.log('[DEBUG] Lichess API response:', data);

    // Get the best move from Lichess analysis
    let bestmove = null;
    
    if (data.moves && data.moves.length > 0) {
      // Sort moves by popularity/strength and pick the best one
      const sortedMoves = data.moves.sort((a, b) => (b.white + b.black) - (a.white + a.black));
      bestmove = sortedMoves[0].san;
      console.log(`[DEBUG] Lichess best move: ${bestmove}`);
    }

    if (!bestmove) {
      console.log('[DEBUG] No moves from Lichess API');
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'No valid moves available' })
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ bestmove: bestmove })
    };

  } catch (error) {
    console.log('[DEBUG] Lichess API error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'External chess API error' })
    };
  }
}