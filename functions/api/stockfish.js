// @ts-ignore - Cloudflare Pages environment
// Cloudflare Pages Function for Chess AI using Stockfish WASM
// Master-class chess engine for maximum strength

// Stockfish WASM implementation for Cloudflare Pages
class StockfishWasmEngine {
  constructor() {
    this.nodesSearched = 0;
    this.engine = null;
  }

  // Initialize Stockfish WASM
  async init(skill = 20) {
    if (this.engine) return;
    try {
      const Stockfish = await import('https://unpkg.com/stockfish@15.1.0/stockfish.js');
      this.engine = Stockfish();
      await new Promise((resolve) => {
        this.engine.addMessageListener((message) => {
          if (message === 'readyok') resolve();
        });
        this.engine.postMessage('isready');
      });
      // Configure engine for selected skill
      this.engine.postMessage(`setoption name Skill Level value ${skill}`);
      this.engine.postMessage('setoption name MultiPV value 1');
      this.engine.postMessage('setoption name Threads value 4');
      this.engine.postMessage('setoption name Hash value 128');
      this.engine.postMessage('setoption name Contempt value 0');
      this.engine.postMessage('setoption name Move Overhead value 10');
      this.engine.postMessage('setoption name Minimum Thinking Time value 20');
      this.engine.postMessage('setoption name Slow Mover value 100');
      this.engine.postMessage('setoption name UCI_Chess960 value false');
    } catch (error) {
      console.error('Stockfish initialization failed:', error);
      throw error;
    }
  }

  // Get best move using Stockfish WASM
  async findBestMove(fen, movetime = 10000, skill = 20, depth = 25) {
    try {
      await this.init(skill);
      return new Promise((resolve, reject) => {
        let bestmove = null;
        let timeoutId = null;
        timeoutId = setTimeout(() => {
          if (!bestmove) {
            this.engine.postMessage('stop');
            reject(new Error('Stockfish timeout'));
          }
        }, movetime + 2000);
        this.engine.addMessageListener((message) => {
          if (message.startsWith('bestmove')) {
            bestmove = message.split(' ')[1];
            clearTimeout(timeoutId);
            resolve(bestmove);
          } else if (message.includes('nodes')) {
            const nodesMatch = message.match(/nodes (\d+)/);
            if (nodesMatch) {
              this.nodesSearched = parseInt(nodesMatch[1]);
            }
          }
        });
        this.engine.postMessage(`position fen ${fen}`);
        this.engine.postMessage(`go movetime ${movetime} depth ${depth}`);
      });
    } catch (error) {
      console.error('Stockfish analysis failed:', error);
      throw error;
    }
  }
}

// Cloudflare Pages Function handler
export async function onRequest(context) {
  const { request } = context;

  // Handle CORS preflight requests
  if (request.method === 'OPTIONS') {
    // @ts-ignore - Response is available in Cloudflare Pages
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
    // @ts-ignore - Response is available in Cloudflare Pages
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
    const { fen, movetime = 5000, difficulty = 'master-class' } = body;
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
    console.log('[DEBUG] Processing FEN:', fen, 'difficulty:', difficulty, 'movetime:', movetime);
    // Set Stockfish parameters by difficulty
    let skill = 20, depth = 25, moveTime = movetime;
    if (difficulty === 'novice') {
      skill = 1; depth = 4; moveTime = 1000;
    } else if (difficulty === 'intermediate') {
      skill = 5; depth = 8; moveTime = 2000;
    } else if (difficulty === 'master') {
      skill = 10; depth = 15; moveTime = 5000;
    } else if (difficulty === 'grand-master') {
      skill = 20; depth = 25; moveTime = 15000;
    }
    const engine = new StockfishWasmEngine();
    let bestmove;
    try {
      bestmove = await engine.findBestMove(fen, moveTime, skill, depth);
      console.log('[DEBUG] Stockfish returned move:', bestmove);
    } catch (error) {
      console.log('[DEBUG] Stockfish error:', error.message);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }
    if (!bestmove) {
      console.log('[DEBUG] No move available, returning error');
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
      nodes: engine.nodesSearched,
      difficulty,
      movetime: moveTime
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
} 