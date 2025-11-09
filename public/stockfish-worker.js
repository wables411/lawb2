// Stockfish WASM Worker - Uses actual Stockfish engine
// Load Stockfish WASM module
importScripts('stockfish.js');

// Initialize Stockfish engine
// Stockfish is a function that returns the module
let stockfish = null;
let engineReady = false;
let currentFen = '';

// Wait for Stockfish to be ready, then initialize
Stockfish().then((sf) => {
  stockfish = sf;
  console.log('[STOCKFISH WORKER] Stockfish module loaded');
  
  // Set up message listener for UCI responses
  stockfish.addMessageListener((message) => {
    if (message === 'uciok') {
      // Engine is ready, configure for maximum strength
      stockfish.postMessage('setoption name Skill Level value 20');
      stockfish.postMessage('setoption name MultiPV value 1');
      stockfish.postMessage('setoption name Threads value 4');
      stockfish.postMessage('setoption name Hash value 128');
      stockfish.postMessage('setoption name Contempt value 0');
      stockfish.postMessage('setoption name Move Overhead value 10');
      stockfish.postMessage('setoption name Minimum Thinking Time value 20');
      stockfish.postMessage('setoption name Slow Mover value 100');
      stockfish.postMessage('setoption name UCI_Chess960 value false');
      stockfish.postMessage('isready');
    } else if (message === 'readyok') {
      engineReady = true;
      console.log('[STOCKFISH WORKER] Engine configured and ready');
      }
  });
  
  // Initialize UCI - this will trigger uciok response
  stockfish.postMessage('uci');
}).catch((error) => {
  console.error('[STOCKFISH WORKER] Failed to load Stockfish:', error);
});

// Worker message handler
self.onmessage = function(event) {
  let command, fen, timeLimit, depth;
  
  // Handle both string messages (current format) and object messages
  if (typeof event.data === 'string') {
    command = event.data;
    fen = currentFen;
    timeLimit = 5000;
    depth = 8;
    
    // Extract FEN from position command
    if (command.startsWith('position fen ')) {
      currentFen = command.substring(13).split(' ')[0];
      return;
}

    // Extract timeLimit and depth from go command
    if (command.startsWith('go ')) {
      const movetimeMatch = command.match(/movetime (\d+)/);
      if (movetimeMatch) {
        timeLimit = parseInt(movetimeMatch[1]);
      }
      const depthMatch = command.match(/depth (\d+)/);
      if (depthMatch) {
        depth = parseInt(depthMatch[1]);
  }
    }
  } else if (typeof event.data === 'object' && event.data !== null) {
    command = event.data.command;
    fen = event.data.fen;
    timeLimit = event.data.timeLimit || 5000;
    depth = event.data.depth || 8;
  } else {
    console.error('[STOCKFISH WORKER] Invalid message format:', event.data);
    return;
  }
  
  // Safety check for command
  if (!command || typeof command !== 'string') {
    console.error('[STOCKFISH WORKER] Invalid command:', command);
    return;
}

  // Handle UCI commands
  if (command === 'uci') {
    // Already handled in initialization
    return;
  } else if (command === 'isready') {
    // Engine will respond with readyok
    return;
  } else if (command.startsWith('position fen ')) {
    // Store FEN for later use
    currentFen = command.substring(13).split(' ')[0];
    if (stockfish) {
      stockfish.postMessage(command);
    }
    return;
  } else if (command.startsWith('go ')) {
    // Use stored FEN if not provided
    const fenToUse = fen || currentFen;
    if (!fenToUse) {
      console.error('[STOCKFISH WORKER] No FEN available for move calculation');
      self.postMessage('bestmove (none)');
      return;
    }
    
    // Set position if not already set
    if (fenToUse !== currentFen) {
      stockfish.postMessage(`position fen ${fenToUse}`);
      currentFen = fenToUse;
    }
    
    // Set up message listener for this calculation
    let bestMove = null;
    let isResolved = false;
    
    const messageHandler = (message) => {
      if (message.startsWith('bestmove ')) {
        const parts = message.split(' ');
        bestMove = parts[1] || null;
        if (!isResolved) {
          isResolved = true;
          stockfish.removeMessageListener(messageHandler);
          self.postMessage(`bestmove ${bestMove || '(none)'}`);
        }
      }
    };
    
    stockfish.addMessageListener(messageHandler);
    
    // Start calculation with depth and time limit
    // For Hard mode, use higher depth (up to 20 for strong play)
    const searchDepth = Math.min(20, Math.max(8, depth || 8));
    stockfish.postMessage(`go movetime ${timeLimit} depth ${searchDepth}`);
    
    // Timeout fallback
    setTimeout(() => {
      if (!isResolved) {
        isResolved = true;
        stockfish.removeMessageListener(messageHandler);
        stockfish.postMessage('stop');
        self.postMessage(`bestmove ${bestMove || '(none)'}`);
      }
    }, timeLimit + 2000);
    
    return;
  }
};
