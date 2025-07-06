importScripts('stockfish.js');
const stockfish = self;

onmessage = function(e) {
  const { fen, movetime } = e.data;
  stockfish.postMessage('uci');
  stockfish.postMessage('ucinewgame');
  stockfish.postMessage('position fen ' + fen);
  stockfish.postMessage('go movetime ' + (movetime || 1000));
  stockfish.onmessage = (event) => {
    if (typeof event.data === 'string' && event.data.startsWith('bestmove')) {
      const parts = event.data.split(' ');
      postMessage({ bestmove: parts[1] });
    }
  };
}; 