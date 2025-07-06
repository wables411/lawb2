// @ts-ignore - Netlify Functions environment
// Netlify Function for Chess AI using Stockfish WASM
// Grand-master chess engine for maximum strength

// Enhanced Stockfish WASM implementation for Netlify Functions
class StockfishWasmEngine {
  constructor() {
    this.nodesSearched = 0;
    this.engine = null;
    this.isInitialized = false;
  }

  // Initialize Stockfish WASM with better error handling
  async init(skill = 20) {
    if (this.isInitialized) return;
    
    try {
      // Use a more reliable Stockfish import
      const Stockfish = await import('https://unpkg.com/stockfish@15.1.0/stockfish.js');
      this.engine = Stockfish();
      
      // Wait for engine to be ready
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Stockfish initialization timeout'));
        }, 10000);
        
        this.engine.addMessageListener((message) => {
          if (message === 'readyok') {
            clearTimeout(timeout);
            resolve();
          }
        });
        
        this.engine.postMessage('isready');
      });
      
      // Configure engine for maximum strength
      this.engine.postMessage(`setoption name Skill Level value ${skill}`);
      this.engine.postMessage('setoption name MultiPV value 1');
      this.engine.postMessage('setoption name Threads value 1'); // Single thread for serverless
      this.engine.postMessage('setoption name Hash value 256'); // More hash for better analysis
      this.engine.postMessage('setoption name Contempt value 0');
      this.engine.postMessage('setoption name Move Overhead value 0');
      this.engine.postMessage('setoption name Minimum Thinking Time value 0');
      this.engine.postMessage('setoption name Slow Mover value 100');
      this.engine.postMessage('setoption name UCI_Chess960 value false');
      
      this.isInitialized = true;
      console.log('[DEBUG] Stockfish initialized successfully with skill:', skill);
    } catch (error) {
      console.error('[DEBUG] Stockfish initialization failed:', error);
      throw new Error(`Stockfish initialization failed: ${error.message}`);
    }
  }

  // Get best move using Stockfish WASM with enhanced error handling
  async findBestMove(fen, movetime = 10000, skill = 20, depth = 25) {
    try {
      await this.init(skill);
      
      return new Promise((resolve, reject) => {
        let bestmove = null;
        let analysisComplete = false;
        
        // Set a timeout that's slightly longer than movetime
        const timeoutId = setTimeout(() => {
          if (!analysisComplete) {
            this.engine.postMessage('stop');
            if (bestmove) {
              console.log('[DEBUG] Stockfish timeout but got move:', bestmove);
              resolve(bestmove);
            } else {
              reject(new Error('Stockfish analysis timeout'));
            }
          }
        }, movetime + 3000);
        
        this.engine.addMessageListener((message) => {
          console.log('[DEBUG] Stockfish message:', message);
          
          if (message.startsWith('bestmove')) {
            bestmove = message.split(' ')[1];
            analysisComplete = true;
            clearTimeout(timeoutId);
            console.log('[DEBUG] Stockfish best move:', bestmove);
            resolve(bestmove);
          } else if (message.includes('nodes')) {
            const nodesMatch = message.match(/nodes (\d+)/);
            if (nodesMatch) {
              this.nodesSearched = parseInt(nodesMatch[1]);
            }
          } else if (message.includes('info') && message.includes('score')) {
            // Log evaluation info
            console.log('[DEBUG] Stockfish evaluation:', message);
          }
        });
        
        // Set position and start analysis
        this.engine.postMessage(`position fen ${fen}`);
        this.engine.postMessage(`go movetime ${movetime} depth ${depth}`);
      });
    } catch (error) {
      console.error('[DEBUG] Stockfish analysis failed:', error);
      throw error;
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
    
    const { fen, movetime = 5000, difficulty = 'grand-master' } = body;

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

    // Set Stockfish parameters by difficulty - MAXIMUM STRENGTH
    let skill = 20, depth = 50, moveTime = movetime;
    
    if (difficulty === 'novice') {
      skill = 1; depth = 4; moveTime = 1000;
    } else if (difficulty === 'intermediate') {
      skill = 5; depth = 8; moveTime = 2000;
    } else if (difficulty === 'master') {
      skill = 15; depth = 20; moveTime = 6000;
    } else if (difficulty === 'grand-master') {
      skill = 20; depth = 50; moveTime = 12000; // MAXIMUM STRENGTH
    }

    console.log('[DEBUG] Using parameters - skill:', skill, 'depth:', depth, 'movetime:', moveTime);

    const engine = new StockfishWasmEngine();
    let bestmove;

    try {
      bestmove = await engine.findBestMove(fen, moveTime, skill, depth);
      console.log('[DEBUG] Stockfish returned move:', bestmove, 'nodes:', engine.nodesSearched);
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

    if (!bestmove || bestmove === '(none)') {
      console.log('[DEBUG] No legal moves found');
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
      movetime: moveTime,
      skill,
      depth
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