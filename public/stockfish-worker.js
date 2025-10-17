// Real Stockfish WASM Engine - Unbeatable Chess AI
// Uses actual Stockfish engine for maximum strength

class StockfishEngine {
  constructor() {
    this.engine = null;
    this.initialized = false;
  }

  async init() {
    if (this.initialized) return;
    
    try {
      // Load Stockfish WASM from CDN
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/stockfish@15.1.0/stockfish.js';
      script.async = true;
      
      return new Promise((resolve, reject) => {
        script.onload = () => {
          try {
            // @ts-ignore
            const Stockfish = window.Stockfish;
            if (Stockfish) {
              this.engine = Stockfish();
              
              // Configure for maximum strength
              this.engine.postMessage('uci');
              this.engine.postMessage('isready');
              this.engine.postMessage('setoption name Skill Level value 20');
              this.engine.postMessage('setoption name Threads value 4');
              this.engine.postMessage('setoption name Hash value 256');
              this.engine.postMessage('setoption name Contempt value 0');
              this.engine.postMessage('setoption name Move Overhead value 10');
              this.engine.postMessage('setoption name Minimum Thinking Time value 50');
              this.engine.postMessage('setoption name Slow Mover value 100');
              
              this.initialized = true;
              resolve();
            } else {
              reject(new Error('Stockfish not found'));
            }
          } catch (error) {
            reject(error);
          }
        };
        
        script.onerror = () => reject(new Error('Failed to load Stockfish'));
        document.head.appendChild(script);
      });
    } catch (error) {
      console.error('Stockfish initialization failed:', error);
      throw error;
    }
  }

  async getBestMove(fen, depth = 20, timeLimit = 5000) {
    if (!this.initialized) {
      await this.init();
    }
    
    return new Promise((resolve, reject) => {
      let bestMove = null;
      let isResolved = false;
      
      const messageHandler = (event) => {
        const message = event.data;
        if (typeof message === 'string') {
          if (message.startsWith('bestmove ')) {
            const parts = message.split(' ');
            bestMove = parts[1] || null;
            if (!isResolved) {
              isResolved = true;
              this.engine.removeEventListener('message', messageHandler);
              resolve(bestMove);
            }
          }
        }
      };
      
      try {
        this.engine.addEventListener('message', messageHandler);
        
        // Set position and search
        this.engine.postMessage(`position fen ${fen}`);
        this.engine.postMessage(`go depth ${depth} movetime ${timeLimit}`);
        
        // Timeout fallback
        setTimeout(() => {
          if (!isResolved) {
            isResolved = true;
            this.engine.removeEventListener('message', messageHandler);
            resolve(bestMove);
          }
        }, timeLimit + 1000);
        
      } catch (error) {
        if (!isResolved) {
          isResolved = true;
          reject(error);
        }
      }
    });
  }
}

// Worker message handling
const stockfish = new StockfishEngine();

self.onmessage = async function(e) {
  const { type, fen, depth, timeLimit } = e.data;
  
  if (type === 'getBestMove') {
    try {
      const bestMove = await stockfish.getBestMove(fen, depth || 20, timeLimit || 5000);
      
      if (bestMove && bestMove !== '(none)') {
        self.postMessage(`bestmove ${bestMove}`);
      } else {
        self.postMessage('bestmove (none)');
      }
    } catch (error) {
      console.error('Stockfish error:', error);
      self.postMessage('bestmove (none)');
    }
  }
};