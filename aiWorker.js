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
        return score;
    }

    function minimax(board, depth, alpha, beta, maximizingPlayer) {
        if (depth === 0) {
            return evaluateBoard(board);
        }

        const color = maximizingPlayer ? 'blue' : 'red';
        const moves = getAllLegalMoves(color, board);

        if (moves.length === 0) {
            // Checkmate or stalemate
            if (isInCheck(color, board)) {
                return maximizingPlayer ? -20000 : 20000; // Checkmate
            }
            return 0; // Stalemate
        }

        if (maximizingPlayer) {
            let maxEval = -Infinity;
            for (const move of moves) {
                const newBoard = board.map(row => [...row]);
                newBoard[move.to.row][move.to.col] = newBoard[move.from.row][move.from.col];
                newBoard[move.from.row][move.from.col] = null;
                
                const evaluation = minimax(newBoard, depth - 1, alpha, beta, false);
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
                
                const evaluation = minimax(newBoard, depth - 1, alpha, beta, true);
                minEval = Math.min(minEval, evaluation);
                beta = Math.min(beta, evaluation);
                if (beta <= alpha) break;
            }
            return minEval;
        }
    }

    function findBestMove(board, color, difficulty) {
        const moves = getAllLegalMoves(color, board);
        if (moves.length === 0) return null;

        const depth = difficulty === 'hard' ? 4 : 2;
        let bestMove = null;
        let bestValue = color === 'blue' ? -Infinity : Infinity;

        for (const move of moves) {
            const newBoard = board.map(row => [...row]);
            newBoard[move.to.row][move.to.col] = newBoard[move.from.row][move.from.col];
            newBoard[move.from.row][move.from.col] = null;
            
            const value = minimax(newBoard, depth - 1, -Infinity, Infinity, color === 'red');
            
            if (color === 'blue' && value > bestValue) {
                bestValue = value;
                bestMove = move;
            } else if (color === 'red' && value < bestValue) {
                bestValue = value;
                bestMove = move;
            }
        }

        return bestMove;
    }

    // Find and return the best move
    const bestMove = findBestMove(board, currentPlayer, difficulty);
    self.postMessage({ move: bestMove });
}; 