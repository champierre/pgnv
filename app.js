class PGNViewer {
    constructor() {
        this.chess = new Chess();
        this.moves = [];
        this.currentMoveIndex = -1;
        this.gameInfo = {};
        
        this.initializeElements();
        this.initializeBoard();
        this.attachEventListeners();
    }

    initializeElements() {
        this.pgnInput = document.getElementById('pgn-input');
        this.loadButton = document.getElementById('load-pgn');
        this.boardElement = document.getElementById('chess-board');
        this.gameInfoElement = document.getElementById('game-info');
        this.moveListElement = document.getElementById('move-list');
        
        this.btnStart = document.getElementById('btn-start');
        this.btnPrev = document.getElementById('btn-prev');
        this.btnNext = document.getElementById('btn-next');
        this.btnEnd = document.getElementById('btn-end');
    }

    initializeBoard() {
        this.boardElement.innerHTML = this.createBoardSVG();
        this.updateBoard();
    }

    createBoardSVG() {
        const size = 400;
        const squareSize = size / 8;
        
        let svg = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">`;
        
        // Draw squares
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const x = col * squareSize;
                const y = row * squareSize;
                const isLight = (row + col) % 2 === 0;
                const color = isLight ? '#f0d9b5' : '#b58863';
                
                svg += `<rect x="${x}" y="${y}" width="${squareSize}" height="${squareSize}" fill="${color}" />`;
            }
        }
        
        // File labels (a-h)
        const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
        files.forEach((file, i) => {
            svg += `<text x="${i * squareSize + squareSize/2}" y="${size - 2}" 
                    text-anchor="middle" font-size="12" fill="#666">${file}</text>`;
        });
        
        // Rank labels (1-8)
        for (let i = 0; i < 8; i++) {
            svg += `<text x="2" y="${(7-i) * squareSize + squareSize/2 + 4}" 
                    font-size="12" fill="#666">${i + 1}</text>`;
        }
        
        svg += '</svg>';
        return svg;
    }

    attachEventListeners() {
        this.loadButton.addEventListener('click', () => this.loadPGN());
        this.btnStart.addEventListener('click', () => this.goToStart());
        this.btnPrev.addEventListener('click', () => this.previousMove());
        this.btnNext.addEventListener('click', () => this.nextMove());
        this.btnEnd.addEventListener('click', () => this.goToEnd());
        
        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            switch(e.key) {
                case 'ArrowLeft':
                    this.previousMove();
                    break;
                case 'ArrowRight':
                    this.nextMove();
                    break;
                case 'Home':
                    this.goToStart();
                    break;
                case 'End':
                    this.goToEnd();
                    break;
            }
        });
    }

    loadPGN() {
        const pgn = this.pgnInput.value.trim();
        if (!pgn) return;

        try {
            // Parse PGN
            this.chess.reset();
            
            // Extract game info from headers
            this.gameInfo = this.extractGameInfo(pgn);
            this.displayGameInfo();
            
            // Load the game
            const loaded = this.chess.loadPgn(pgn);
            if (!loaded) {
                alert('Invalid PGN format');
                return;
            }
            
            // Get all moves
            this.moves = this.chess.history({ verbose: true });
            
            // Reset to starting position
            this.chess.reset();
            this.currentMoveIndex = -1;
            
            // Update display
            this.updateBoard();
            this.displayMoveList();
            this.updateNavigationButtons();
            
        } catch (error) {
            alert('Error loading PGN: ' + error.message);
        }
    }

    extractGameInfo(pgn) {
        const info = {};
        const headerRegex = /\[(\w+)\s+"([^"]+)"\]/g;
        let match;
        
        while ((match = headerRegex.exec(pgn)) !== null) {
            info[match[1]] = match[2];
        }
        
        return info;
    }

    displayGameInfo() {
        let infoHtml = '<h3>Game Information</h3>';
        
        if (this.gameInfo.White && this.gameInfo.Black) {
            infoHtml += `<p><strong>White:</strong> ${this.gameInfo.White}</p>`;
            infoHtml += `<p><strong>Black:</strong> ${this.gameInfo.Black}</p>`;
        }
        
        if (this.gameInfo.Event) {
            infoHtml += `<p><strong>Event:</strong> ${this.gameInfo.Event}</p>`;
        }
        
        if (this.gameInfo.Date) {
            infoHtml += `<p><strong>Date:</strong> ${this.gameInfo.Date}</p>`;
        }
        
        if (this.gameInfo.Result) {
            infoHtml += `<p><strong>Result:</strong> ${this.gameInfo.Result}</p>`;
        }
        
        this.gameInfoElement.innerHTML = infoHtml;
    }

    displayMoveList() {
        let moveListHtml = '<h3>Moves</h3><div class="moves">';
        
        for (let i = 0; i < this.moves.length; i++) {
            if (i % 2 === 0) {
                moveListHtml += `<span class="move-number">${Math.floor(i/2) + 1}.</span> `;
            }
            
            moveListHtml += `<span class="move" data-index="${i}">${this.moves[i].san}</span> `;
            
            if (i % 2 === 1 || i === this.moves.length - 1) {
                moveListHtml += '<br>';
            }
        }
        
        moveListHtml += '</div>';
        this.moveListElement.innerHTML = moveListHtml;
        
        // Add click handlers to moves
        this.moveListElement.querySelectorAll('.move').forEach(moveElement => {
            moveElement.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.index);
                this.goToMove(index);
            });
        });
    }

    goToStart() {
        this.chess.reset();
        this.currentMoveIndex = -1;
        this.updateBoard();
        this.updateNavigationButtons();
        this.highlightCurrentMove();
    }

    goToEnd() {
        this.chess.reset();
        for (let i = 0; i < this.moves.length; i++) {
            this.chess.move(this.moves[i]);
        }
        this.currentMoveIndex = this.moves.length - 1;
        this.updateBoard();
        this.updateNavigationButtons();
        this.highlightCurrentMove();
    }

    previousMove() {
        if (this.currentMoveIndex >= 0) {
            this.currentMoveIndex--;
            this.replayToMove(this.currentMoveIndex);
        }
    }

    nextMove() {
        if (this.currentMoveIndex < this.moves.length - 1) {
            this.currentMoveIndex++;
            this.chess.move(this.moves[this.currentMoveIndex]);
            this.updateBoard();
            this.updateNavigationButtons();
            this.highlightCurrentMove();
        }
    }

    goToMove(index) {
        if (index >= -1 && index < this.moves.length) {
            this.currentMoveIndex = index;
            this.replayToMove(index);
        }
    }

    replayToMove(moveIndex) {
        this.chess.reset();
        for (let i = 0; i <= moveIndex; i++) {
            this.chess.move(this.moves[i]);
        }
        this.updateBoard();
        this.updateNavigationButtons();
        this.highlightCurrentMove();
    }

    highlightCurrentMove() {
        this.moveListElement.querySelectorAll('.move').forEach((el, index) => {
            if (index === this.currentMoveIndex) {
                el.classList.add('current-move');
            } else {
                el.classList.remove('current-move');
            }
        });
    }

    updateBoard() {
        const svg = this.boardElement.querySelector('svg');
        // Remove existing pieces
        svg.querySelectorAll('.piece').forEach(el => el.remove());
        
        const board = this.chess.board();
        const squareSize = 400 / 8;
        
        board.forEach((row, rowIndex) => {
            row.forEach((piece, colIndex) => {
                if (piece) {
                    const x = colIndex * squareSize + squareSize / 2;
                    const y = rowIndex * squareSize + squareSize / 2;
                    
                    const pieceSymbol = this.getPieceUnicode(piece);
                    const pieceElement = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                    pieceElement.setAttribute('x', x);
                    pieceElement.setAttribute('y', y + 10);
                    pieceElement.setAttribute('text-anchor', 'middle');
                    pieceElement.setAttribute('font-size', '36');
                    pieceElement.setAttribute('class', 'piece');
                    pieceElement.setAttribute('fill', piece.color === 'w' ? '#fff' : '#000');
                    pieceElement.setAttribute('stroke', piece.color === 'w' ? '#000' : '#fff');
                    pieceElement.setAttribute('stroke-width', '1');
                    pieceElement.textContent = pieceSymbol;
                    
                    svg.appendChild(pieceElement);
                }
            });
        });
    }

    getPieceUnicode(piece) {
        const unicodePieces = {
            'w': {
                'k': '♔',
                'q': '♕',
                'r': '♖',
                'b': '♗',
                'n': '♘',
                'p': '♙'
            },
            'b': {
                'k': '♚',
                'q': '♛',
                'r': '♜',
                'b': '♝',
                'n': '♞',
                'p': '♟'
            }
        };
        
        return unicodePieces[piece.color][piece.type];
    }

    updateNavigationButtons() {
        this.btnStart.disabled = this.currentMoveIndex < 0;
        this.btnPrev.disabled = this.currentMoveIndex < 0;
        this.btnNext.disabled = this.currentMoveIndex >= this.moves.length - 1;
        this.btnEnd.disabled = this.currentMoveIndex >= this.moves.length - 1;
    }
}

// Initialize the viewer when page loads
document.addEventListener('DOMContentLoaded', () => {
    new PGNViewer();
});