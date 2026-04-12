export interface ChessPieceSet {
  id: string;
  name: string;
  description: string;
  folder: string;
  pieceImages: {
    [key: string]: string;
  };
}

export const CHESS_PIECE_SETS: ChessPieceSet[] = [
  {
    id: 'lawbstation',
    name: 'Lawbstation Chess Pieces',
    description: 'Classic Lawbstation themed chess pieces',
    folder: 'lawbstation',
    pieceImages: {
      // Blue pieces (lowercase)
      'p': '/images/lawbstation/bluepawn.png',
      'r': '/images/lawbstation/bluerook.png',
      'n': '/images/lawbstation/blueknight.png',
      'b': '/images/lawbstation/bluebishop.png',
      'q': '/images/lawbstation/bluequeen.png',
      'k': '/images/lawbstation/blueking.png',
      // Red pieces (uppercase)
      'P': '/images/lawbstation/redpawn.png',
      'R': '/images/lawbstation/redrook.png',
      'N': '/images/lawbstation/redknight.png',
      'B': '/images/lawbstation/redbishop.png',
      'Q': '/images/lawbstation/redqueen.png',
      'K': '/images/lawbstation/redking.png',
    }
  },
  {
    id: 'pixelawbs',
    name: 'Pixelawbs Chess Pieces',
    description: 'Pixel art style Lawb themed chess pieces',
    folder: 'pixelawbs',
    pieceImages: {
      // Blue pieces (lowercase)
      'p': '/images/pixelawbs/bluepawn.png',
      'r': '/images/pixelawbs/bluerook.png',
      'n': '/images/pixelawbs/blueknight.png',
      'b': '/images/pixelawbs/bluebishop.png',
      'q': '/images/pixelawbs/bluequeen.png',
      'k': '/images/pixelawbs/blueking.png',
      // Red pieces (uppercase)
      'P': '/images/pixelawbs/redpawn.png',
      'R': '/images/pixelawbs/redrook.png',
      'N': '/images/pixelawbs/redknight.png',
      'B': '/images/pixelawbs/redbishop.png',
      'Q': '/images/pixelawbs/redqueen.png',
      'K': '/images/pixelawbs/redking.png',
    }
  }
];

/** Lawbstation + Pixelawbs piece PNGs for decorative layers (e.g. OS desktop canvas). */
export const DESKTOP_CHESS_BACKDROP_PIECE_URLS: readonly string[] = (() => {
  const ls = CHESS_PIECE_SETS.find((s) => s.id === 'lawbstation');
  const px = CHESS_PIECE_SETS.find((s) => s.id === 'pixelawbs');
  return [
    ...Object.values(ls?.pieceImages ?? {}),
    ...Object.values(px?.pieceImages ?? {}),
  ];
})();

export const getPieceSetById = (id: string): ChessPieceSet | undefined => {
  return CHESS_PIECE_SETS.find(set => set.id === id);
};

export const getDefaultPieceSet = (): ChessPieceSet => {
  return CHESS_PIECE_SETS[0]; // lawbstation is default
};

export const getPixelawbsPieceSet = (): ChessPieceSet => {
  return CHESS_PIECE_SETS[1]; // Return Pixelawbs
}; 