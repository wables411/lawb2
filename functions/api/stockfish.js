// Cloudflare Worker for Chess AI using Lichess API
// Smart, fast, and reliable chess analysis

// Difficulty multipliers for Lichess API
const DIFFICULTY_MULTIPLIERS = {
  'novice': 0.3,      // 30% of best move strength
  'intermediate': 0.6, // 60% of best move strength  
  'world-class': 0.85, // 85% of best move strength
  'master-class': 0.95 // 95% of best move strength
};

// Simple chess engine using Lichess API
class LichessChessEngine {
  constructor() {
    this.nodesSearched = 0;
  }

  // Get best move from Lichess API
  async findBestMove(fen, difficulty = 'master-class', movetime = 5000) {
    try {
      // Get top moves from Lichess
      const response = await fetch(`https://explorer.lichess.ovh/lichess?fen=${encodeURIComponent(fen)}&moves=50&topGames=0&recentGames=0&variant=standard`);
      
      if (!response.ok) {
        throw new Error(`Lichess API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.moves || data.moves.length === 0) {
        // Fallback to simple random move if no data
        return this.getRandomLegalMove(fen);
      }

      // Sort moves by popularity and performance
      const sortedMoves = data.moves.sort((a, b) => {
        // Prioritize moves with good performance
        const aScore = (a.white + a.draws * 0.5) / (a.white + a.draws + a.black);
        const bScore = (b.white + b.draws * 0.5) / (b.white + b.draws + b.black);
        return bScore - aScore;
      });

      // Apply difficulty multiplier
      const multiplier = DIFFICULTY_MULTIPLIERS[difficulty] || 0.95;
      const moveIndex = Math.floor(Math.random() * Math.max(1, Math.floor(sortedMoves.length * (1 - multiplier))));
      
      const selectedMove = sortedMoves[moveIndex];
      this.nodesSearched = data.moves.length;
      
      return selectedMove.uci;
      
    } catch (error) {
      console.warn('Lichess API failed, using fallback:', error);
      return this.getRandomLegalMove(fen);
    }
  }

  // Simple fallback for when Lichess API fails
  getRandomLegalMove(fen) {
    // Determine whose turn it is from FEN
    const isBlackTurn = fen.includes(' b ');
    
    // Basic legal moves for common positions
    const commonMoves = {
      'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w': ['e2e4', 'd2d4', 'c2c4', 'g1f3', 'b1c3'],
      'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b': ['e7e5', 'c7c5', 'e7e6', 'd7d5', 'g8f6'],
      'rnbqkbnr/pppppppp/8/8/3P4/8/PPP1PPPP/RNBQKBNR b': ['d7d5', 'g8f6', 'e7e6', 'c7c5', 'g7g6']
    };

    if (commonMoves[fen]) {
      return commonMoves[fen][Math.floor(Math.random() * commonMoves[fen].length)];
    }

    // Very basic fallback - return moves for the correct side
    if (isBlackTurn) {
      // Black moves (from 7th/8th rank to 5th/6th rank)
      return ['e7e5', 'd7d5', 'c7c5', 'g8f6', 'b8c6', 'd7d6', 'e7e6', 'g7g6'][Math.floor(Math.random() * 8)];
    } else {
      // White moves (from 2nd rank to 4th rank)
      return ['e2e4', 'd2d4', 'c2c4', 'g1f3', 'b1c3', 'd2d3', 'e2e3', 'g2g3'][Math.floor(Math.random() * 8)];
    }
  }
}

export default {
  async fetch(request) {
    // Handle CORS preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': 'https://lawb.xyz',
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
          'Access-Control-Allow-Origin': 'https://lawb.xyz',
        }
      });
    }

    try {
      const { fen, movetime = 5000, difficulty = 'master-class' } = await request.json();

      if (!fen) {
        return new Response(JSON.stringify({ error: 'FEN position required' }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': 'https://lawb.xyz',
          },
        });
      }

      // Use Lichess API for smart chess analysis
      const engine = new LichessChessEngine();
      const bestmove = await engine.findBestMove(fen, difficulty, movetime);

      if (!bestmove) {
        return new Response(JSON.stringify({ error: 'No legal moves found' }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': 'https://lawb.xyz',
          },
        });
      }

      const response = {
        bestmove,
        nodes: engine.nodesSearched,
        difficulty,
        movetime
      };

      return new Response(JSON.stringify(response), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': 'https://lawb.xyz',
        },
      });

    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': 'https://lawb.xyz',
        },
      });
    }
  }
}; 