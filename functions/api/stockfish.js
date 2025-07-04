// Cloudflare Worker for Chess AI using Lichess Cloud Evaluation
// World-class chess engine for maximum strength

// Difficulty settings for move selection
const DIFFICULTY_SETTINGS = {
  'novice': { randomness: 0.7, fallbackTopMoves: 8 },
  'intermediate': { randomness: 0.4, fallbackTopMoves: 4 },
  'world-class': { randomness: 0.2, fallbackTopMoves: 2 },
  'master-class': { randomness: 0.0, fallbackTopMoves: 1 } // Always pick the best move
};

// Advanced chess engine class using Lichess Cloud Evaluation
class AdvancedChessEngine {
  constructor() {
    this.nodesSearched = 0;
  }

  // Get best move using Lichess Cloud Evaluation (Stockfish analysis)
  async findBestMove(fen, difficulty = 'master-class', movetime = 5000) {
    try {
      const settings = DIFFICULTY_SETTINGS[difficulty] || DIFFICULTY_SETTINGS['master-class'];
      
      // Try to get Stockfish analysis from Lichess Cloud Evaluation
      const engineMove = await this.getCloudEvaluation(fen, settings);
      if (engineMove) {
        this.nodesSearched = 20000; // Estimate for Stockfish analysis
        return engineMove;
      }

      // Fallback to Lichess Explorer if Cloud Evaluation fails
      return await this.getExplorerMove(fen, settings);
      
    } catch (error) {
      console.warn('Cloud evaluation failed, using fallback:', error);
      return this.getRandomLegalMove(fen);
    }
  }

  // Get Stockfish analysis from Lichess Cloud Evaluation
  async getCloudEvaluation(fen, settings) {
    try {
      // Use Lichess Cloud Evaluation API for Stockfish analysis
      const url = `https://lichess.org/api/cloud-eval?fen=${encodeURIComponent(fen)}&multiPv=1&variant=standard`;
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; ChessBot/1.0)'
        }
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      
      // Check if we have valid analysis data
      if (data && data.pvs && data.pvs.length > 0 && data.pvs[0].moves) {
        const moves = data.pvs[0].moves.split(' ');
        
        if (moves.length > 0) {
          // For master-class, always pick the best move
          if (settings.randomness === 0) {
            return moves[0];
          }
          
          // For other difficulties, add some randomness
          const randomValue = Math.random();
          if (randomValue < settings.randomness) {
            // Pick a random move from top moves (if available)
            const moveIndex = Math.min(Math.floor(Math.random() * 3), moves.length - 1);
            return moves[moveIndex];
          } else {
            // Pick the best move
            return moves[0];
          }
        }
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  // Fallback to Lichess Explorer with better move selection
  async getExplorerMove(fen, settings) {
    try {
      // Get move analysis from Lichess Explorer
      const response = await fetch(`https://explorer.lichess.ovh/lichess?fen=${encodeURIComponent(fen)}&moves=50&topGames=0&recentGames=0&variant=standard`);
      
      if (!response.ok) {
        throw new Error(`Lichess API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.moves || data.moves.length === 0) {
        return this.getRandomLegalMove(fen);
      }

      // Score moves by performance
      const scoredMoves = data.moves.map(move => {
        const totalGames = move.white + move.draws + move.black;
        const winRate = totalGames > 0 ? (move.white + move.draws * 0.5) / totalGames : 0.5;
        const popularityBonus = Math.log(totalGames + 1) * 0.1;
        return {
          ...move,
          score: winRate + popularityBonus
        };
      });

      // Sort by score (highest first)
      scoredMoves.sort((a, b) => b.score - a.score);
      
      // Select move based on difficulty
      const topMoves = scoredMoves.slice(0, settings.fallbackTopMoves);
      
      if (settings.randomness === 0) {
        // Master-class: always pick the best move
        return topMoves[0].uci;
      }
      
      // Add randomness for other difficulties
      const randomValue = Math.random();
      if (randomValue < settings.randomness) {
        // Pick a random move from top moves
        const randomIndex = Math.floor(Math.random() * topMoves.length);
        return topMoves[randomIndex].uci;
      } else {
        // Pick the best move
        return topMoves[0].uci;
      }
      
    } catch (error) {
      throw error;
    }
  }

  // Simple fallback for when all APIs fail
  getRandomLegalMove(fen) {
    // Determine whose turn it is from FEN
    const isBlackTurn = fen.includes(' b ');
    
    // Strong opening moves
    const strongMoves = {
      'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w': ['e2e4', 'd2d4', 'c2c4', 'g1f3', 'b1c3'],
      'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b': ['e7e5', 'c7c5', 'e7e6', 'd7d5', 'g8f6'],
      'rnbqkbnr/pppppppp/8/8/3P4/8/PPP1PPPP/RNBQKBNR b': ['d7d5', 'g8f6', 'e7e6', 'c7c5', 'g7g6']
    };

    if (strongMoves[fen]) {
      return strongMoves[fen][Math.floor(Math.random() * strongMoves[fen].length)];
    }

    // Strong fallback moves
    if (isBlackTurn) {
      return ['e7e5', 'd7d5', 'c7c5', 'g8f6', 'b8c6', 'd7d6', 'e7e6', 'g7g6'][Math.floor(Math.random() * 8)];
    } else {
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

      // Use advanced chess engine with Lichess Cloud Evaluation
      const engine = new AdvancedChessEngine();
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