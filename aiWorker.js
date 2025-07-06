// aiWorker.js - Simplified Chess AI for Intermediate Difficulty
self.onmessage = (e) => {
    const { board, difficulty, currentPlayer } = e.data;

    const PIECE_VALUES = {
        'p': 100, 'n': 320, 'b': 330, 'r': 500, 'q': 900, 'k': 20000
    };

    // Simple piece-square tables for positional evaluation
    const PIECE_SQUARE_TABLES = {
        'P': [ // White pawns
            [0,  0,  0,  0,  0,  0,  0,  0],
            [50, 50, 50, 50, 50, 50, 50, 50],
            [10, 10, 20, 30, 30, 20, 10, 10],
            [5,  5, 10, 25, 25, 10,  5,  5],
            [0,  0,  0, 20, 20,  0,  0,  0],
            [5, -5,-10,  0,  0,-10, -5,  5],
            [5, 10, 10,-20,-20, 10, 10,  5],
            [0,  0,  0,  0,  0,  0,  0,  0]
        ],
        'N': [ // Knights
            [-50,-40,-30,-30,-30,-30,-40,-50],
            [-40,-20,  0,  0,  0,  0,-20,-40],
            [-30,  0, 10, 15, 15, 10,  0,-30],
            [-30,  5, 15, 20, 20, 15,  5,-30],
            [-30,  0, 15, 20, 20, 15,  0,-30],
            [-30,  5, 10, 15, 15, 10,  5,-30],
            [-40,-20,  0,  5,  5,  0,-20,-40],
            [-50,-40,-30,-30,-30,-30,-40,-50]
        ],
        'B': [ // Bishops
            [-20,-10,-10,-10,-10,-10,-10,-20],
            [-10,  0,  0,  0,  0,  0,  0,-10],
            [-10,  0,  5, 10, 10,  5,  0,-10],
            [-10,  5,  5, 10, 10,  5,  5,-10],
            [-10,  0, 10, 10, 10, 10,  0,-10],
            [-10, 10, 10, 10, 10, 10, 10,-10],
            [-10,  5,  0,  0,  0,  0,  5,-10],
            [-20,-10,-10,-10,-10,-10,-10,-20]
        ],
        'R': [ // Rooks
            [0,  0,  0,  0,  0,  0,  0,  0],
            [5, 10, 10, 10, 10, 10, 10,  5],
            [-5,  0,  0,  0,  0,  0,  0, -5],
            [-5,  0,  0,  0,  0,  0,  0, -5],
            [-5,  0,  0,  0,  0,  0,  0, -5],
            [-5,  0,  0,  0,  0,  0,  0, -5],
            [-5,  0,  0,  0,  0,  0,  0, -5],
            [0,  0,  0,  5,  5,  0,  0,  0]
        ],
        'Q': [ // Queens
            [-20,-10,-10, -5, -5,-10,-10,-20],
            [-10,  0,  0,  0,  0,  0,  0,-10],
            [-10,  0,  5,  5,  5,  5,  0,-10],
            [-5,  0,  5,  5,  5,  5,  0, -5],
            [0,  0,  5,  5,  5,  5,  0, -5],
            [-10,  5,  5,  5,  5,  5,  0,-10],
            [-10,  0,  5,  0,  0,  0,  0,-10],
            [-20,-10,-10, -5, -5,-10,-10,-20]
        ],
        'K': [ // Kings
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

        if (!isValid) return false;
        if (checkForCheck && wouldMoveExposeCheck(startRow, startCol, endRow, endCol, color, board)) return false;
        return true;
    }

    function isValidPawnMove(color, startRow, startCol, endRow, endCol, board) {
        const direction = color === 'blue' ? -1 : 1;
        const startRank = color === 'blue' ? 6 : 1;
        const rowDiff = endRow - startRow;
        const colDiff = endCol - startCol;

        if (Math.abs(colDiff) === 1 && rowDiff === direction) {
            return board[endRow][endCol] && getPieceColor(board[endRow][endCol]) !== color;
        }
        if (colDiff !== 0 || board[endRow][endCol]) return false;
        if (rowDiff === direction) return true;
        if (startRow === startRank && rowDiff === 2 * direction && !board[startRow + direction][startCol]) return true;
        return false;
    }

    function isValidRookMove(startRow, startCol, endRow, endCol, board) {
        if (startRow !== endRow && startCol !== endCol) return false;
        return isPathClear(startRow, startCol, endRow, endCol, board);
    }

    function isValidKnightMove(startRow, startCol, endRow, endCol) {
        const rowDiff = Math.abs(endRow - startRow);
        const colDiff = Math.abs(endCol - startCol);
        return (rowDiff === 2 && colDiff === 1) || (rowDiff === 1 && colDiff === 2);
    }

    function isValidBishopMove(startRow, startCol, endRow, endCol, board) {
        const rowDiff = Math.abs(endRow - startRow);
        const colDiff = Math.abs(endCol - startCol);
        if (rowDiff !== colDiff) return false;
        return isPathClear(startRow, startCol, endRow, endCol, board);
    }

    function isValidQueenMove(startRow, startCol, endRow, endCol, board) {
        const rowDiff = Math.abs(endRow - startRow);
        const colDiff = Math.abs(endCol - startCol);
        if (rowDiff !== colDiff && startRow !== endRow && startCol !== endCol) return false;
        return isPathClear(startRow, startCol, endRow, endCol, board);
    }

    function isValidKingMove(startRow, startCol, endRow, endCol) {
        const rowDiff = Math.abs(endRow - startRow);
        const colDiff = Math.abs(endCol - startCol);
        return rowDiff <= 1 && colDiff <= 1;
    }

    function isPathClear(startRow, startCol, endRow, endCol, board) {
        const rowStep = Math.sign(endRow - startRow) || 0;
        const colStep = Math.sign(endCol - startCol) || 0;
        let currentRow = startRow + rowStep;
        let currentCol = startCol + colStep;
        while (currentRow !== endRow || currentCol !== endCol) {
            if (board[currentRow][currentCol]) return false;
            currentRow += rowStep;
            currentCol += colStep;
        }
        return true;
    }

    function wouldMoveExposeCheck(startRow, startCol, endRow, endCol, color, board) {
        const originalPiece = board[endRow][endCol];
        const movingPiece = board[startRow][startCol];
        board[endRow][endCol] = movingPiece;
        board[startRow][startCol] = null;
        const inCheck = isKingInCheck(color, board);
        board[startRow][startCol] = movingPiece;
        board[endRow][endCol] = originalPiece;
        return inCheck;
    }

    function isKingInCheck(color, board) {
        const kingPiece = color === 'blue' ? 'k' : 'K';
        let kingRow, kingCol;
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                if (board[row][col] === kingPiece) {
                    kingRow = row;
                    kingCol = col;
                    break;
                }
            }
            if (kingRow !== undefined) break;
        }
        return isSquareUnderAttack(kingRow, kingCol, color === 'blue' ? 'red' : 'blue', board);
    }

    function isSquareUnderAttack(row, col, attackingColor, board) {
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const piece = board[r][c];
                if (piece && getPieceColor(piece) === attackingColor) {
                    if (canPieceMove(piece, r, c, row, col, board, false)) {
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
                                const targetPiece = board[endRow][endCol];
                                const isCapture = targetPiece && getPieceColor(targetPiece) !== color;
                                const isCheck = isMoveCheck(piece, row, col, endRow, endCol, color, board);
                                moves.push({
                                    from: { row, col },
                                    to: { row: endRow, col: endCol },
                                    piece: piece,
                                    isCapture: isCapture,
                                    isCheck: isCheck,
                                    value: isCapture ? (PIECE_VALUES[targetPiece.toLowerCase()] || 0) : 0
                                });
                            }
                        }
                    }
                }
            }
        }
        return moves;
    }

    function isMoveCheck(piece, startRow, startCol, endRow, endCol, color, board) {
        const tempBoard = board.map(row => [...row]);
        tempBoard[endRow][endCol] = tempBoard[startRow][startCol];
        tempBoard[startRow][startCol] = null;
        return isKingInCheck(color === 'blue' ? 'red' : 'blue', tempBoard);
    }

    function evaluateBoard(board) {
        let score = 0;
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = board[row][col];
                if (piece) {
                    const color = getPieceColor(piece);
                    const pieceType = piece.toLowerCase();
                    const value = PIECE_VALUES[pieceType] || 0;
                    
                    // Add positional bonus
                    let positionalBonus = 0;
                    if (color === 'red') {
                        positionalBonus = PIECE_SQUARE_TABLES[piece.toUpperCase()]?.[row]?.[col] || 0;
                    } else {
                        positionalBonus = PIECE_SQUARE_TABLES[piece.toUpperCase()]?.[7-row]?.[col] || 0;
                    }
                    
                    const totalValue = value + positionalBonus;
                    score += color === 'red' ? totalValue : -totalValue;
                }
            }
        }
        return score;
    }

    function findBestMove(board, color, difficulty) {
        const moves = getAllLegalMoves(color, board);
        if (moves.length === 0) return null;

        // Sort moves by priority
        moves.sort((a, b) => {
            if (a.isCheck && !b.isCheck) return -1;
            if (!a.isCheck && b.isCheck) return 1;
            if (a.isCapture && !b.isCapture) return -1;
            if (!a.isCapture && b.isCapture) return 1;
            if (a.isCapture && b.isCapture) {
                return b.value - a.value;
            }
            return 0;
        });

        let bestMove = moves[0];
        let bestValue = color === 'red' ? -Infinity : Infinity;
        let nodesSearched = { count: 0 };

        // Adjust search depth based on difficulty
        const searchDepth = difficulty === 'intermediate' ? 4 : 2;
        
        for (const move of moves) {
            const tempBoard = board.map(row => [...row]);
            tempBoard[move.to.row][move.to.col] = tempBoard[move.from.row][move.from.col];
            tempBoard[move.from.row][move.from.col] = null;
            
            const value = minimax(tempBoard, searchDepth - 1, color === 'blue' ? 'red' : 'blue', color === 'red', 0, nodesSearched);
            
            if (color === 'red' && value > bestValue) {
                bestValue = value;
                bestMove = move;
            } else if (color === 'blue' && value < bestValue) {
                bestValue = value;
                bestMove = move;
            }
        }

        return { move: bestMove, nodes: nodesSearched.count };
    }

    function minimax(board, depth, color, isMaximizing, currentDepth, nodesSearched) {
        nodesSearched.count = (nodesSearched.count || 0) + 1;
        
        if (depth === 0) {
            return evaluateBoard(board);
        }

        const moves = getAllLegalMoves(color, board);
        if (moves.length === 0) {
            if (isKingInCheck(color, board)) {
                return isMaximizing ? -20000 : 20000; // Checkmate
            }
            return 0; // Stalemate
        }

        if (isMaximizing) {
            let maxEval = -Infinity;
            for (const move of moves) {
                const tempBoard = board.map(row => [...row]);
                tempBoard[move.to.row][move.to.col] = tempBoard[move.from.row][move.from.col];
                tempBoard[move.from.row][move.from.col] = null;
                
                const evaluation = minimax(tempBoard, depth - 1, color === 'blue' ? 'red' : 'blue', false, currentDepth + 1, nodesSearched);
                maxEval = Math.max(maxEval, evaluation);
            }
            return maxEval;
        } else {
            let minEval = Infinity;
            for (const move of moves) {
                const tempBoard = board.map(row => [...row]);
                tempBoard[move.to.row][move.to.col] = tempBoard[move.from.row][move.from.col];
                tempBoard[move.from.row][move.from.col] = null;
                
                const evaluation = minimax(tempBoard, depth - 1, color === 'blue' ? 'red' : 'blue', true, currentDepth + 1, nodesSearched);
                minEval = Math.min(minEval, evaluation);
            }
            return minEval;
        }
    }

    // Find and return the best move
    const result = findBestMove(board, currentPlayer, difficulty);
    if (result && result.move) {
        console.log('[AI DEBUG] Best move found:', {
            from: result.move.from,
            to: result.move.to,
            piece: result.move.piece,
            isCapture: result.move.isCapture,
            isCheck: result.move.isCheck,
            value: result.move.value,
            difficulty: difficulty,
            nodes: result.nodes
        });
        self.postMessage({ 
            move: {
                from: { row: result.move.from.row, col: result.move.from.col },
                to: { row: result.move.to.row, col: result.move.to.col }
            },
            nodes: result.nodes
        });
    } else {
        console.log('[AI DEBUG] No valid moves found');
        self.postMessage({ move: null });
    }
}; 