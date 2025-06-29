// aiWorker.js
self.onmessage = (e) => {
    const { board, difficulty, currentPlayer } = e.data;

    const PIECE_VALUES = {
        'p': 100, 'n': 320, 'b': 330, 'r': 500, 'q': 900, 'k': 20000
    };

    const POSITION_WEIGHTS = {
        pawn: [
            [0,  0,  0,  0,  0,  0,  0,  0],
            [50, 50, 50, 50, 50, 50, 50, 50],
            [10, 10, 20, 30, 30, 20, 10, 10],
            [5,  5, 10, 25, 25, 10,  5,  5],
            [0,  0,  0, 20, 20,  0,  0,  0],
            [5, -5,-10,  0,  0,-10, -5,  5],
            [5, 10, 10,-20,-20, 10, 10,  5],
            [0,  0,  0,  0,  0,  0,  0,  0]
        ],
        knight: [
            [-50,-40,-30,-30,-30,-30,-40,-50],
            [-40,-20,  0,  0,  0,  0,-20,-40],
            [-30,  0, 10, 15, 15, 10,  0,-30],
            [-30,  5, 15, 20, 20, 15,  5,-30],
            [-30,  0, 15, 20, 20, 15,  0,-30],
            [-30,  5, 10, 15, 15, 10,  5,-30],
            [-40,-20,  0,  5,  5,  0,-20,-40],
            [-50,-40,-30,-30,-30,-30,-40,-50]
        ],
        bishop: [
            [-20,-10,-10,-10,-10,-10,-10,-20],
            [-10,  0,  0,  0,  0,  0,  0,-10],
            [-10,  0,  5, 10, 10,  5,  0,-10],
            [-10,  5,  5, 10, 10,  5,  5,-10],
            [-10,  0, 10, 10, 10, 10,  0,-10],
            [-10, 10, 10, 10, 10, 10, 10,-10],
            [-10,  5,  0,  0,  0,  0,  5,-10],
            [-20,-10,-10,-10,-10,-10,-10,-20]
        ],
        king: [
            [-30,-40,-40,-50,-50,-40,-40,-30],
            [-30,-40,-40,-50,-50,-40,-40,-30],
            [-30,-40,-40,-50,-50,-40,-40,-30],
            [-30,-40,-40,-50,-50,-40,-40,-30],
            [-20,-30,-30,-40,-40,-30,-30,-20],
            [-10,-20,-20,-20,-20,-20,-20,-10],
            [20, 20,  0,  0,  0,  0, 20, 20],
            [20, 30, 10,  0,  0, 10, 30, 20]
        ]
    };

    function getPieceColor(piece) {
        if (!piece) return null;
        return piece === piece.toUpperCase() ? 'red' : 'blue';
    }

    function isWithinBoard(row, col) {
        return row >= 0 && row < 8 && col >= 0 && col < 8;
    }

    function canPieceMove(piece, startRow, startCol, endRow, endCol, board, checkForCheck = true) {
        if (!piece) return false;
        const pieceType = piece.toLowerCase();
        const color = getPieceColor(piece);
        if (!isWithinBoard(endRow, endCol) || (startRow === endRow && startCol === endCol)) return false;
        const targetPiece = board[endRow][endCol];
        if (targetPiece && getPieceColor(targetPiece) === color) return false;

        let isValid = false;
        switch (pieceType) {
            case 'p': isValid = isValidPawnMove(color, startRow, startCol, endRow, endCol, board); break;
            case 'r': isValid = isValidRookMove(startRow, startCol, endRow, endCol, board); break;
            case 'n': isValid = isValidKnightMove(startRow, startCol, endRow, endCol); break;
            case 'b': isValid = isValidBishopMove(startRow, startCol, endRow, endCol, board); break;
            case 'q': isValid = isValidQueenMove(startRow, startCol, endRow, endCol, board); break;
            case 'k': isValid = isValidKingMove(startRow, startCol, endRow, endCol); break;
        }

        if (isValid && checkForCheck) {
            const newBoard = board.map(row => [...row]);
            newBoard[endRow][endCol] = newBoard[startRow][startCol];
            newBoard[startRow][startCol] = null;
            return !isInCheck(color, newBoard);
        }
        return isValid;
    }

    function isValidPawnMove(color, startRow, startCol, endRow, endCol, board) {
        const direction = color === 'blue' ? -1 : 1;
        const startRank = color === 'blue' ? 6 : 1;
        
        // Forward move
        if (startCol === endCol && endRow === startRow + direction && !board[endRow][endCol]) {
            return true;
        }
        
        // Initial two-square move
        if (startCol === endCol && startRow === startRank && 
            endRow === startRow + 2 * direction && 
            !board[startRow + direction][startCol] && !board[endRow][endCol]) {
            return true;
        }
        
        // Capture
        if (Math.abs(startCol - endCol) === 1 && endRow === startRow + direction) {
            return board[endRow][endCol] && getPieceColor(board[endRow][endCol]) !== color;
        }
        
        return false;
    }

    function isValidRookMove(startRow, startCol, endRow, endCol, board) {
        if (startRow !== endRow && startCol !== endCol) return false;
        
        const rowDir = startRow === endRow ? 0 : (endRow > startRow ? 1 : -1);
        const colDir = startCol === endCol ? 0 : (endCol > startCol ? 1 : -1);
        
        let currentRow = startRow + rowDir;
        let currentCol = startCol + colDir;
        
        while (currentRow !== endRow || currentCol !== endCol) {
            if (board[currentRow][currentCol]) return false;
            currentRow += rowDir;
            currentCol += colDir;
        }
        
        return true;
    }

    function isValidKnightMove(startRow, startCol, endRow, endCol) {
        const rowDiff = Math.abs(startRow - endRow);
        const colDiff = Math.abs(startCol - endCol);
        return (rowDiff === 2 && colDiff === 1) || (rowDiff === 1 && colDiff === 2);
    }

    function isValidBishopMove(startRow, startCol, endRow, endCol, board) {
        if (Math.abs(startRow - endRow) !== Math.abs(startCol - endCol)) return false;
        
        const rowDir = endRow > startRow ? 1 : -1;
        const colDir = endCol > startCol ? 1 : -1;
        
        let currentRow = startRow + rowDir;
        let currentCol = startCol + colDir;
        
        while (currentRow !== endRow && currentCol !== endCol) {
            if (board[currentRow][currentCol]) return false;
            currentRow += rowDir;
            currentCol += colDir;
        }
        
        return true;
    }

    function isValidQueenMove(startRow, startCol, endRow, endCol, board) {
        return isValidRookMove(startRow, startCol, endRow, endCol, board) ||
               isValidBishopMove(startRow, startCol, endRow, endCol, board);
    }

    function isValidKingMove(startRow, startCol, endRow, endCol) {
        return Math.abs(startRow - endRow) <= 1 && Math.abs(startCol - endCol) <= 1;
    }

    function isInCheck(color, board) {
        // Find king position
        const kingPiece = color === 'blue' ? 'k' : 'K';
        let kingRow = -1, kingCol = -1;
        
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                if (board[row][col] === kingPiece) {
                    kingRow = row;
                    kingCol = col;
                    break;
                }
            }
            if (kingRow !== -1) break;
        }
        
        if (kingRow === -1) return false;
        
        // Check if any opponent piece can attack the king
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = board[row][col];
                if (piece && getPieceColor(piece) !== color) {
                    if (canPieceMove(piece, row, col, kingRow, kingCol, board, false)) {
                        return true;
                    }
                }
            }
        }
        
        return false;
    }

    function getAllLegalMoves(color, board) {
        const moves = [];
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = board[row][col];
                if (piece && getPieceColor(piece) === color) {
                    for (let endRow = 0; endRow < 8; endRow++) {
                        for (let endCol = 0; endCol < 8; endCol++) {
                            if (canPieceMove(piece, row, col, endRow, endCol, board)) {
                                moves.push({
                                    from: { row, col },
                                    to: { row: endRow, col: endCol },
                                    piece: piece
                                });
                            }
                        }
                    }
                }
            }
        }
        return moves;
    }

    function evaluateBoard(board) {
        let score = 0;
        
        // Material and positional evaluation
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = board[row][col];
                if (piece) {
                    const color = getPieceColor(piece);
                    const pieceType = piece.toLowerCase();
                    const value = PIECE_VALUES[pieceType];
                    const multiplier = color === 'blue' ? 1 : -1;
                    
                    score += value * multiplier;
                    
                    // Add positional bonus
                    if (pieceType === 'p' && POSITION_WEIGHTS.pawn) {
                        const weightRow = color === 'blue' ? 7 - row : row;
                        score += POSITION_WEIGHTS.pawn[weightRow][col] * multiplier;
                    } else if (pieceType === 'n' && POSITION_WEIGHTS.knight) {
                        const weightRow = color === 'blue' ? 7 - row : row;
                        score += POSITION_WEIGHTS.knight[weightRow][col] * multiplier;
                    } else if (pieceType === 'b' && POSITION_WEIGHTS.bishop) {
                        const weightRow = color === 'blue' ? 7 - row : row;
                        score += POSITION_WEIGHTS.bishop[weightRow][col] * multiplier;
                    } else if (pieceType === 'k' && POSITION_WEIGHTS.king) {
                        const weightRow = color === 'blue' ? 7 - row : row;
                        score += POSITION_WEIGHTS.king[weightRow][col] * multiplier;
                    }
                }
            }
        }

        // Additional strategic evaluations
        score += evaluatePawnStructure(board);
        score += evaluateKingSafety(board);
        score += evaluateCenterControl(board);
        score += evaluatePieceMobility(board);

        return score;
    }

    function evaluatePawnStructure(board) {
        let score = 0;
        
        // Evaluate doubled pawns, isolated pawns, and pawn chains
        for (let col = 0; col < 8; col++) {
            let bluePawns = 0, redPawns = 0;
            for (let row = 0; row < 8; row++) {
                if (board[row][col] === 'p') bluePawns++;
                if (board[row][col] === 'P') redPawns++;
            }
            
            // Penalize doubled pawns
            if (bluePawns > 1) score -= 30 * (bluePawns - 1);
            if (redPawns > 1) score += 30 * (redPawns - 1);
            
            // Bonus for pawns in center files (d, e)
            if (col >= 3 && col <= 4) {
                score += bluePawns * 10;
                score -= redPawns * 10;
            }
        }
        
        return score;
    }

    function evaluateKingSafety(board) {
        let score = 0;
        
        // Find kings
        let blueKingRow = -1, blueKingCol = -1;
        let redKingRow = -1, redKingCol = -1;
        
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                if (board[row][col] === 'k') {
                    blueKingRow = row;
                    blueKingCol = col;
                } else if (board[row][col] === 'K') {
                    redKingRow = row;
                    redKingCol = col;
                }
            }
        }
        
        // Penalize kings in center during middlegame
        if (blueKingRow >= 3 && blueKingRow <= 4 && blueKingCol >= 3 && blueKingCol <= 4) {
            score -= 50;
        }
        if (redKingRow >= 3 && redKingRow <= 4 && redKingCol >= 3 && redKingCol <= 4) {
            score += 50;
        }
        
        return score;
    }

    function evaluateCenterControl(board) {
        let score = 0;
        
        // Bonus for pieces controlling center squares
        const centerSquares = [
            [3, 3], [3, 4], [4, 3], [4, 4], // d4, e4, d5, e5
            [2, 3], [2, 4], [5, 3], [5, 4]  // d3, e3, d6, e6
        ];
        
        for (const [row, col] of centerSquares) {
            for (let r = 0; r < 8; r++) {
                for (let c = 0; c < 8; c++) {
                    const piece = board[r][c];
                    if (piece) {
                        const color = getPieceColor(piece);
                        const pieceType = piece.toLowerCase();
                        
                        if (canPieceMove(piece, r, c, row, col, board, false)) {
                            const value = PIECE_VALUES[pieceType] / 100;
                            if (color === 'blue') {
                                score += value;
                            } else {
                                score -= value;
                            }
                        }
                    }
                }
            }
        }
        
        return score;
    }

    function evaluatePieceMobility(board) {
        let score = 0;
        
        const blueMoves = getAllLegalMoves('blue', board).length;
        const redMoves = getAllLegalMoves('red', board).length;
        
        score += (blueMoves - redMoves) * 5;
        
        return score;
    }

    function findBestMove(board, color, difficulty) {
        const moves = getAllLegalMoves(color, board);
        if (moves.length === 0) return null;

        // Enhanced difficulty settings with timeout protection
        let depth;
        let useRandomness;
        let timeout;
        let evalFn = evaluateBoard;
        switch (difficulty) {
            case 'novice':
                depth = 1;
                useRandomness = 0.7; // High randomness for novice
                timeout = 1000; // 1 second
                break;
            case 'intermediate':
                depth = 2;
                useRandomness = 0.3;
                timeout = 2000; // 2 seconds
                break;
            case 'world-class':
                depth = 3;
                useRandomness = 0;
                timeout = 3000; // 3 seconds
                // Use a more aggressive evaluation for world-class mode
                evalFn = function(board, lastMove) {
                  let score = 2 * evaluateBoard(board);
                  score += 2 * evaluateCenterControl(board);
                  score += 2 * evaluateKingSafety(board);
                  // Bonus for recent capture
                  if (lastMove && board[lastMove.to.row][lastMove.to.col] && getPieceColor(board[lastMove.to.row][lastMove.to.col]) === 'red') {
                    score += 400; // Big bonus for capturing a blue piece
                  }
                  // Bonus for threatening blue pieces
                  for (let row = 0; row < 8; row++) {
                    for (let col = 0; col < 8; col++) {
                      const piece = board[row][col];
                      if (piece && getPieceColor(piece) === 'red') {
                        for (let r = 0; r < 8; r++) {
                          for (let c = 0; c < 8; c++) {
                            if (getPieceColor(board[r][c]) === 'blue' && canPieceMove(piece, row, col, r, c, board, false)) {
                              score += 30; // Bonus for threatening a blue piece
                            }
                          }
                        }
                      }
                    }
                  }
                  return score;
                };
                break;
            default:
                depth = 2;
                useRandomness = 0.1;
                timeout = 2000;
        }

        // Add randomness for more human-like play (not in world-class mode)
        if (useRandomness > 0 && Math.random() < useRandomness) {
            const randomMove = moves[Math.floor(Math.random() * moves.length)];
            return randomMove;
        }

        let bestMove = null;
        let bestValue = color === 'blue' ? -Infinity : Infinity;
        let startTime = Date.now();

        // Sort moves to improve alpha-beta pruning efficiency
        const sortedMoves = moves.sort((a, b) => {
            // Prioritize captures and checks
            const aIsCapture = board[a.to.row][a.to.col] !== null;
            const bIsCapture = board[b.to.row][b.to.col] !== null;
            if (aIsCapture && !bIsCapture) return -1;
            if (!aIsCapture && bIsCapture) return 1;
            return 0;
        });

        function minimaxCustom(board, depth, alpha, beta, maximizingPlayer, lastMove) {
            if (depth === 0) {
                return evalFn(board, lastMove);
            }
            const color = maximizingPlayer ? 'blue' : 'red';
            const moves = getAllLegalMoves(color, board);
            if (moves.length === 0) {
                if (isInCheck(color, board)) {
                    return maximizingPlayer ? -20000 : 20000;
                }
                return 0;
            }
            if (maximizingPlayer) {
                let maxEval = -Infinity;
                for (const move of moves) {
                    const newBoard = board.map(row => [...row]);
                    newBoard[move.to.row][move.to.col] = newBoard[move.from.row][move.from.col];
                    newBoard[move.from.row][move.from.col] = null;
                    const evaluation = minimaxCustom(newBoard, depth - 1, alpha, beta, false, move);
                    maxEval = Math.max(maxEval, evaluation);
                    alpha = Math.max(alpha, evaluation);
                    if (beta <= alpha) break;
                }
                return maxEval;
            } else {
                let minEval = Infinity;
                for (const move of moves) {
                    const newBoard = board.map(row => [...row]);
                    newBoard[move.to.row][move.to.col] = newBoard[move.from.row][move.from.col];
                    newBoard[move.from.row][move.from.col] = null;
                    const evaluation = minimaxCustom(newBoard, depth - 1, alpha, beta, true, move);
                    minEval = Math.min(minEval, evaluation);
                    beta = Math.min(beta, evaluation);
                    if (beta <= alpha) break;
                }
                return minEval;
            }
        }

        for (const move of sortedMoves) {
            if (Date.now() - startTime > timeout) {
                console.log('AI timeout, returning best move so far');
                break;
            }
            const newBoard = board.map(row => [...row]);
            newBoard[move.to.row][move.to.col] = newBoard[move.from.row][move.from.col];
            newBoard[move.from.row][move.from.col] = null;
            const value = minimaxCustom(newBoard, depth - 1, -Infinity, Infinity, color === 'red', move);
            if (color === 'blue' && value > bestValue) {
                bestValue = value;
                bestMove = move;
            } else if (color === 'red' && value < bestValue) {
                bestValue = value;
                bestMove = move;
            }
        }
        if (!bestMove && moves.length > 0) {
            bestMove = moves[0];
        }
        return bestMove;
    }

    // Find and return the best move
    const bestMove = findBestMove(board, currentPlayer, difficulty);
    self.postMessage({ move: bestMove });
}; 