import { Chess } from 'chess.js';

const fen = 'rnbqkbnr/pppppppp/8/8/3N4/4P3/PPPP1PPP/RNBQKB1R b - - 0 1';
const chess = new Chess(fen);

console.log('FEN:', chess.fen());
console.log('Moves available:', chess.moves({ verbose: true }).length);
console.log('Is game over:', chess.isGameOver());
console.log('Current turn:', chess.turn());
console.log('Sample moves:', chess.moves({ verbose: true }).slice(0, 3)); 