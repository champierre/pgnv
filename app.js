class PGNViewer {
    constructor() {
        this.game = new Chess();
        this.board = null;
        this.pgn = null;
        this.currentMoveIndex = -1;
        this.moves = [];
        
        this.initializeElements();
        this.initializeBoard();
        this.attachEventListeners();
    }

    initializeElements() {
        this.pgnModal = document.getElementById('pgn-modal');
        this.pgnInput = document.getElementById('pgn-input');
        this.loadButton = document.getElementById('load-pgn');
        this.cancelButton = document.getElementById('cancel-pgn');
        this.openDialogButton = document.getElementById('open-pgn-dialog');
        this.viewerSection = document.querySelector('.viewer-section');
        
        this.gameInfoElement = document.getElementById('game-info');
        this.moveListElement = document.getElementById('move-list');
        this.statusElement = document.getElementById('status');
        
        this.btnStart = document.getElementById('btn-start');
        this.btnPrev = document.getElementById('btn-prev');
        this.btnNext = document.getElementById('btn-next');
        this.btnEnd = document.getElementById('btn-end');
    }

    initializeBoard() {
        const config = {
            draggable: false,
            position: 'start',
            pieceTheme: 'https://chessboardjs.com/img/chesspieces/wikipedia/{piece}.png'
        };
        
        this.board = Chessboard('chess-board', config);
        
        // Resize board on window resize
        $(window).resize(() => this.board.resize());
    }

    attachEventListeners() {
        this.loadButton.addEventListener('click', () => this.loadPGN());
        this.cancelButton.addEventListener('click', () => this.closeModal());
        this.openDialogButton.addEventListener('click', () => this.openModal());
        
        this.btnStart.addEventListener('click', () => this.goToStart());
        this.btnPrev.addEventListener('click', () => this.previousMove());
        this.btnNext.addEventListener('click', () => this.nextMove());
        this.btnEnd.addEventListener('click', () => this.goToEnd());
        
        // Close modal on outside click
        this.pgnModal.addEventListener('click', (e) => {
            if (e.target === this.pgnModal) {
                this.closeModal();
            }
        });
        
        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            // Don't handle navigation keys when modal is open
            if (!this.pgnModal.classList.contains('hidden')) {
                if (e.key === 'Escape') {
                    this.closeModal();
                }
                return;
            }
            
            switch(e.key) {
                case 'ArrowLeft':
                    e.preventDefault();
                    this.previousMove();
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    this.nextMove();
                    break;
                case 'Home':
                    e.preventDefault();
                    this.goToStart();
                    break;
                case 'End':
                    e.preventDefault();
                    this.goToEnd();
                    break;
            }
        });
    }
    
    openModal() {
        this.pgnModal.classList.remove('hidden');
        this.pgnInput.focus();
    }
    
    closeModal() {
        this.pgnModal.classList.add('hidden');
    }

    loadPGN() {
        const pgnText = this.pgnInput.value.trim();
        if (!pgnText) {
            alert('Please enter a PGN to load');
            return;
        }

        try {
            // Reset game
            this.game.reset();
            
            // Load PGN
            const result = this.game.load_pgn(pgnText);
            if (!result) {
                alert('Invalid PGN format');
                return;
            }
            
            // Store PGN data
            this.pgn = pgnText;
            this.moves = this.game.history({ verbose: true });
            
            // Reset to starting position
            this.game.reset();
            this.currentMoveIndex = -1;
            this.board.position(this.game.fen());
            
            // Display game info and moves
            this.displayGameInfo();
            this.displayMoveList();
            this.updateStatus();
            this.updateNavigationButtons();
            
            // Close modal and show viewer
            this.closeModal();
            this.viewerSection.style.display = 'grid';
            
        } catch (error) {
            alert('Error loading PGN: ' + error.message);
        }
    }

    displayGameInfo() {
        const headers = this.game.header();
        let infoHtml = '<h3>Game Information</h3>';
        
        if (headers.White && headers.Black) {
            infoHtml += `<p><strong>White:</strong> ${headers.White}</p>`;
            infoHtml += `<p><strong>Black:</strong> ${headers.Black}</p>`;
        }
        
        if (headers.Event) {
            infoHtml += `<p><strong>Event:</strong> ${headers.Event}</p>`;
        }
        
        if (headers.Date) {
            infoHtml += `<p><strong>Date:</strong> ${headers.Date}</p>`;
        }
        
        if (headers.Result) {
            infoHtml += `<p><strong>Result:</strong> ${headers.Result}</p>`;
        }
        
        if (headers.ECO) {
            infoHtml += `<p><strong>ECO:</strong> ${headers.ECO}</p>`;
        }
        
        if (headers.Opening) {
            infoHtml += `<p><strong>Opening:</strong> ${headers.Opening}</p>`;
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
        this.game.reset();
        this.currentMoveIndex = -1;
        this.board.position(this.game.fen());
        this.updateStatus();
        this.updateNavigationButtons();
        this.highlightCurrentMove();
    }

    goToEnd() {
        this.game.reset();
        for (let i = 0; i < this.moves.length; i++) {
            this.game.move(this.moves[i]);
        }
        this.currentMoveIndex = this.moves.length - 1;
        this.board.position(this.game.fen());
        this.updateStatus();
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
            this.game.move(this.moves[this.currentMoveIndex]);
            this.board.position(this.game.fen());
            this.updateStatus();
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
        this.game.reset();
        for (let i = 0; i <= moveIndex; i++) {
            this.game.move(this.moves[i]);
        }
        this.board.position(this.game.fen());
        this.updateStatus();
        this.updateNavigationButtons();
        this.highlightCurrentMove();
    }

    highlightCurrentMove() {
        this.moveListElement.querySelectorAll('.move').forEach((el, index) => {
            if (index === this.currentMoveIndex) {
                el.classList.add('current-move');
                // Scroll into view if needed
                el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
            } else {
                el.classList.remove('current-move');
            }
        });
    }

    updateStatus() {
        let status = '';
        
        if (this.currentMoveIndex >= 0 && this.currentMoveIndex < this.moves.length) {
            const move = this.moves[this.currentMoveIndex];
            const moveNum = Math.floor(this.currentMoveIndex / 2) + 1;
            const isWhite = this.currentMoveIndex % 2 === 0;
            status = `Move ${moveNum}${isWhite ? '' : '...'} ${move.san}`;
        } else if (this.currentMoveIndex === -1) {
            status = 'Starting position';
        }
        
        if (this.game.in_checkmate()) {
            status += ' - Checkmate!';
        } else if (this.game.in_draw()) {
            status += ' - Draw!';
        } else if (this.game.in_check()) {
            status += ' - Check!';
        }
        
        this.statusElement.textContent = status;
    }

    updateNavigationButtons() {
        this.btnStart.disabled = this.currentMoveIndex < 0;
        this.btnPrev.disabled = this.currentMoveIndex < 0;
        this.btnNext.disabled = this.currentMoveIndex >= this.moves.length - 1;
        this.btnEnd.disabled = this.currentMoveIndex >= this.moves.length - 1;
    }
}

// Initialize the viewer when page loads
$(document).ready(() => {
    new PGNViewer();
});