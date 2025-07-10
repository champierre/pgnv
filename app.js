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
        this.apiKeyInput = document.getElementById('api-key-input');
        this.systemPromptInput = document.getElementById('system-prompt-input');
        this.loadButton = document.getElementById('load-pgn');
        this.cancelButton = document.getElementById('cancel-pgn');
        this.openDialogButton = document.getElementById('open-pgn-dialog');
        this.viewerSection = document.querySelector('.viewer-section');
        
        this.btnText = document.querySelector('.btn-text');
        this.btnLoading = document.querySelector('.btn-loading');
        
        this.gameInfoElement = document.getElementById('game-info');
        this.moveListElement = document.getElementById('move-list');
        this.statusElement = document.getElementById('status');
        this.moveCommentElement = document.getElementById('move-comment');
        
        this.btnStart = document.getElementById('btn-start');
        this.btnPrev = document.getElementById('btn-prev');
        this.btnNext = document.getElementById('btn-next');
        this.btnEnd = document.getElementById('btn-end');
        
        // Load saved settings and set initial values
        this.loadApiKey();
        this.loadSystemPrompt();
        this.pgnInput.placeholder = this.getDefaultPlaceholder();
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
        this.apiKeyInput.addEventListener('input', () => this.saveApiKey());
        this.systemPromptInput.addEventListener('input', () => this.saveSystemPrompt());
        this.pgnInput.addEventListener('input', () => this.onInputChange());
        
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
        this.onInputChange(); // Check format when opening modal
    }
    
    closeModal() {
        this.pgnModal.classList.add('hidden');
    }
    
    
    loadApiKey() {
        const savedApiKey = localStorage.getItem('pgn-viewer-api-key');
        if (savedApiKey) {
            this.apiKeyInput.value = savedApiKey;
        }
    }
    
    saveApiKey() {
        const apiKey = this.apiKeyInput.value.trim();
        if (apiKey) {
            localStorage.setItem('pgn-viewer-api-key', apiKey);
        } else {
            localStorage.removeItem('pgn-viewer-api-key');
        }
    }
    
    loadSystemPrompt() {
        const savedPrompt = localStorage.getItem('pgn-viewer-system-prompt');
        if (savedPrompt) {
            this.systemPromptInput.value = savedPrompt;
        } else {
            // Set default system prompt based on browser language
            this.systemPromptInput.value = this.getDefaultSystemPrompt();
        }
    }
    
    saveSystemPrompt() {
        const prompt = this.systemPromptInput.value.trim();
        if (prompt) {
            localStorage.setItem('pgn-viewer-system-prompt', prompt);
        } else {
            localStorage.removeItem('pgn-viewer-system-prompt');
        }
    }
    
    getDefaultSystemPrompt() {
        // Detect browser language
        const language = navigator.language || navigator.userLanguage || 'en';
        const languageCode = language.toLowerCase().substring(0, 2);
        
        let languageName;
        let sampleComment;
        
        switch (languageCode) {
            case 'ja':
                languageName = 'Japanese';
                sampleComment = '白は中心を支配し、攻撃的な展開を狙う。';
                break;
            case 'es':
                languageName = 'Spanish';
                sampleComment = 'Las blancas dominan el centro y buscan desarrollo agresivo.';
                break;
            case 'fr':
                languageName = 'French';
                sampleComment = 'Les blancs dominent le centre et cherchent un développement agressif.';
                break;
            case 'de':
                languageName = 'German';
                sampleComment = 'Weiß dominiert das Zentrum und strebt aggressive Entwicklung an.';
                break;
            case 'it':
                languageName = 'Italian';
                sampleComment = 'Il bianco domina il centro e cerca uno sviluppo aggressivo.';
                break;
            case 'pt':
                languageName = 'Portuguese';
                sampleComment = 'As brancas dominam o centro e buscam desenvolvimento agressivo.';
                break;
            case 'ru':
                languageName = 'Russian';
                sampleComment = 'Белые доминируют в центре и стремятся к агрессивному развитию.';
                break;
            case 'zh':
                languageName = 'Chinese';
                sampleComment = '白方控制中心，寻求积极发展。';
                break;
            case 'ko':
                languageName = 'Korean';
                sampleComment = '백은 중앙을 지배하고 공격적인 전개를 추구한다.';
                break;
            default:
                languageName = 'English';
                sampleComment = 'White dominates the center and seeks aggressive development.';
        }
        
        return `You are a chess expert who converts chess game notation into properly formatted PGN with detailed commentary. You must add insightful comments after every single move explaining the strategic purpose and chess theory behind each move.

IMPORTANT: Write all move comments in ${languageName}. Each comment should explain the move's purpose, strategy, or positional considerations in ${languageName}.

Example comment format: {${sampleComment}}

Focus on making the comments educational and accessible to chess players who speak ${languageName}.`;
    }
    
    isChessBookNotation(text) {
        // If it starts with standard PGN headers, it's likely PGN
        if (text.startsWith('[Event') || text.match(/^\[.+\]\s*\[/)) {
            return false;
        }
        
        // Check if text contains patterns typical of chess book notation
        const notationPatterns = [
            /\(\d+\).*–.*\d{4}/, // (1) Player1–Player2 City, 1900
            /^[A-Z][a-z]+–[A-Z][a-z]+/, // Player1–Player2 at start
            /\d+\.[a-zA-Z0-9+#=\-]+.*[a-z]{20,}/, // Move followed by long text
            /This move|The game|White|Black.*[a-z]{15,}/, // Commentary phrases
            /\d+\.[a-zA-Z0-9+#=\-]+.*\d+\..*[a-z]{10,}/ // Multiple moves with text
        ];
        
        // Count how many patterns match
        const matchCount = notationPatterns.filter(pattern => pattern.test(text)).length;
        
        // If 2 or more patterns match, likely chess book notation
        return matchCount >= 2;
    }
    
    setLoadingState(isLoading, message = 'Converting...') {
        if (isLoading) {
            this.btnText.style.display = 'none';
            this.btnLoading.style.display = 'inline';
            this.btnLoading.textContent = message;
            this.loadButton.disabled = true;
        } else {
            this.btnText.style.display = 'inline';
            this.btnLoading.style.display = 'none';
            this.btnLoading.textContent = 'Converting...';
            this.loadButton.disabled = false;
        }
    }
    
    async convertNotationToPGN(notationText) {
        const apiKey = this.apiKeyInput.value.trim();
        if (!apiKey) {
            alert('Please enter your ChatGPT API key to convert chess notation');
            return null;
        }
        
        const prompt = `Convert the following chess notation text into a standard PGN format with comprehensive commentary. Follow this EXACT format:

[Event "Game Title"]
[Site "Location"]  
[Date "YYYY.MM.DD"]
[White "White Player"]
[Black "Black Player"]
[Result "1-0"]

1. e4 {Comment for white's move} e5 {Comment for black's move}
2. Nf3 {Comment for white's move} Nc6 {Comment for black's move}

CRITICAL FORMATTING REQUIREMENTS:
1. Headers must be followed by exactly ONE blank line before the moves
2. Extract proper PGN headers from the original text (Event, Site, Date, White, Black, Result)
3. Add a detailed comment in curly braces {} after EVERY SINGLE MOVE (both white and black)
4. Comments should be based on the original text but expand with chess knowledge
5. Use Japanese for comments if the original text contains Japanese, otherwise use English
6. Each comment should explain the move's purpose, strategy, or positional considerations
7. White moves should explain white's intentions, black moves should explain black's intentions
8. Use standard algebraic notation (SAN) for all moves
9. End with the proper game result
10. Do not include any text before or after the PGN
11. Format: [Headers] + blank line + [Moves with comments] + [Result]

Original chess notation text:
${notationText}

Return ONLY the PGN format with comments after every move:`;

        try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: 'gpt-4o-mini',
                    messages: [
                        {
                            role: 'system',
                            content: 'You are a chess expert who converts chess game notation into properly formatted PGN with detailed commentary. You must add insightful comments after every single move explaining the strategic purpose and chess theory behind each move.'
                        },
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    max_tokens: 4000,
                    temperature: 0.2
                })
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`API Error: ${errorData.error?.message || response.statusText}`);
            }
            
            const data = await response.json();
            let convertedPGN = data.choices[0].message.content.trim();
            
            // Clean up the response - remove any markdown formatting or extra text
            convertedPGN = convertedPGN.replace(/```pgn\s*/g, '').replace(/```\s*/g, '');
            
            // If it starts with [Site] instead of [Event], add a missing [Event] header
            if (convertedPGN.startsWith('[Site')) {
                convertedPGN = '[Event "Historical Game"]\n' + convertedPGN;
            }
            
            // Ensure proper separation between headers and moves
            convertedPGN = this.ensureProperPGNFormat(convertedPGN);
            
            console.log('Converted PGN from API:', convertedPGN);
            return convertedPGN;
            
        } catch (error) {
            console.error('Error calling ChatGPT API:', error);
            alert(`Error converting notation: ${error.message}`);
            return null;
        }
    }
    
    cleanUpPGN(pgn) {
        // Split into lines and process
        let lines = pgn.split('\n');
        let cleanedLines = [];
        let inMoves = false;
        
        for (let line of lines) {
            line = line.trim();
            
            // Skip empty lines in headers
            if (!line && !inMoves) continue;
            
            // Check if we've reached the moves section
            if (line.match(/^\d+\./)) {
                inMoves = true;
            }
            
            // Clean up move lines
            if (inMoves && line) {
                // Fix specific issues with move formatting
                line = line.replace(/(\d+)\.\s*([a-zA-Z0-9+#=\-]+)\s+(\d+)\.\.\./g, '$1.$2 $3...');
                // Remove extra spaces
                line = line.replace(/\s+/g, ' ');
            }
            
            cleanedLines.push(line);
        }
        
        return cleanedLines.join('\n');
    }
    
    ensureProperPGNFormat(pgn) {
        const lines = pgn.split('\n');
        const headers = [];
        const moveLines = [];
        let inMoves = false;
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            if (!line) continue; // Skip empty lines
            
            if (line.startsWith('[') && line.endsWith(']')) {
                if (!inMoves) {
                    headers.push(line);
                }
            } else if (line.match(/^\d+\./)) {
                inMoves = true;
                moveLines.push(line);
            } else if (inMoves && line) {
                moveLines.push(line);
            }
        }
        
        // Reconstruct with proper formatting
        let result = headers.join('\n');
        if (headers.length > 0 && moveLines.length > 0) {
            result += '\n\n'; // Ensure double newline between headers and moves
        }
        result += moveLines.join(' ');
        
        return result.trim();
    }
    
    removePGNComments(pgn) {
        console.log('Original PGN:', pgn.substring(0, 200) + '...');
        
        // Split into headers and moves sections
        const sections = pgn.split(/\n\s*\n/);
        const headers = [];
        const movesLines = [];
        
        for (const section of sections) {
            if (section.trim().startsWith('[')) {
                headers.push(section.trim());
            } else if (section.trim() && section.match(/\d+\./)) {
                movesLines.push(section.trim());
            }
        }
        
        // Process moves section
        let movesText = movesLines.join(' ');
        
        // Remove comments in curly braces {like this}
        movesText = movesText.replace(/\{[^}]*\}/g, '');
        
        // Remove NAG annotations like $1, $2, etc.
        movesText = movesText.replace(/\$\d+/g, '');
        
        // Remove parenthetical variations (18. Nxe7+ Rxe7 19. Nh4)
        movesText = movesText.replace(/\([^)]*\)/g, '');
        
        // Clean up extra whitespace
        movesText = movesText.replace(/\s+/g, ' ').trim();
        
        // Reconstruct PGN with proper format
        const cleanPGN = headers.join('\n') + '\n\n' + movesText;
        
        console.log('Cleaned PGN:', cleanPGN);
        
        return cleanPGN.trim();
    }
    

    async loadPGN() {
        const inputText = this.pgnInput.value.trim();
        if (!inputText) {
            alert('Please enter a PGN or chess notation text to load');
            return;
        }

        let pgnText = inputText;
        
        // Check if this is chess book notation that needs conversion
        if (this.isChessBookNotation(inputText)) {
            this.setLoadingState(true, 'Converting to PGN with commentary...');
            
            try {
                pgnText = await this.convertNotationToPGN(inputText);
                if (!pgnText) {
                    this.setLoadingState(false);
                    return;
                }
                this.setLoadingState(true, 'Processing comments...');
                // Give a moment for UI update
                await new Promise(resolve => setTimeout(resolve, 500));
            } catch (error) {
                this.setLoadingState(false);
                alert('Error converting notation: ' + error.message);
                return;
            }
            
            this.setLoadingState(false);
        }

        try {
            // Reset game
            this.game.reset();
            
            // Store the original PGN with comments for display
            this.originalPGN = pgnText;
            
            // Create a version without comments for chess.js
            const pgnWithoutComments = this.removePGNComments(pgnText);
            console.log('Attempting to load PGN without comments:', pgnWithoutComments.substring(0, 200) + '...');
            
            // Load PGN without comments
            console.log('Attempting to load cleaned PGN:', pgnWithoutComments);
            const result = this.game.load_pgn(pgnWithoutComments);
            if (!result) {
                console.error('Failed to load PGN:', pgnWithoutComments);
                alert('Invalid PGN format. Check console for details.');
                return;
            }
            
            // Store PGN data
            this.pgn = pgnText;
            this.moves = this.game.history({ verbose: true });
            
            // Extract comments from original PGN for display
            this.moveComments = this.extractCommentsFromPGN(this.originalPGN || pgnText);
            
            // If we converted from chess notation, update the textarea with the converted PGN
            if (inputText !== pgnText) {
                this.pgnInput.value = pgnText;
            }
            
            // Reset to starting position
            this.game.reset();
            this.currentMoveIndex = -1;
            this.board.position(this.game.fen());
            
            // Display game info and moves
            this.displayGameInfo();
            this.displayMoveList();
            this.updateStatus();
            this.updateNavigationButtons();
            this.updateMoveComment();
            
            // Close modal and show viewer
            this.closeModal();
            this.viewerSection.style.display = 'grid';
            
        } catch (error) {
            alert('Error loading PGN: ' + error.message);
        }
    }

    displayGameInfo() {
        // Extract headers from the original PGN text for more comprehensive info
        const headers = this.extractPGNHeaders(this.originalPGN || this.pgn);
        
        let infoHtml = '<h3>Game Information</h3>';
        
        // Primary game info
        if (headers.Event) {
            infoHtml += `<p><strong>Event:</strong> ${headers.Event}</p>`;
        }
        
        if (headers.Site) {
            infoHtml += `<p><strong>Site:</strong> ${headers.Site}</p>`;
        }
        
        if (headers.Date) {
            infoHtml += `<p><strong>Date:</strong> ${headers.Date}</p>`;
        }
        
        if (headers.Round) {
            infoHtml += `<p><strong>Round:</strong> ${headers.Round}</p>`;
        }
        
        // Players
        if (headers.White && headers.Black) {
            infoHtml += `<p><strong>White:</strong> ${headers.White}</p>`;
            if (headers.WhiteElo) {
                infoHtml += `<p><strong>White Elo:</strong> ${headers.WhiteElo}</p>`;
            }
            infoHtml += `<p><strong>Black:</strong> ${headers.Black}</p>`;
            if (headers.BlackElo) {
                infoHtml += `<p><strong>Black Elo:</strong> ${headers.BlackElo}</p>`;
            }
        }
        
        // Game result
        if (headers.Result) {
            infoHtml += `<p><strong>Result:</strong> ${this.formatResult(headers.Result)}</p>`;
        }
        
        // Opening information
        if (headers.Opening) {
            infoHtml += `<p><strong>Opening:</strong> ${headers.Opening}</p>`;
        }
        
        if (headers.ECO) {
            infoHtml += `<p><strong>ECO:</strong> ${headers.ECO}</p>`;
        }
        
        if (headers.Variation) {
            infoHtml += `<p><strong>Variation:</strong> ${headers.Variation}</p>`;
        }
        
        // Time control
        if (headers.TimeControl) {
            infoHtml += `<p><strong>Time Control:</strong> ${this.formatTimeControl(headers.TimeControl)}</p>`;
        }
        
        // Additional information
        if (headers.Annotator) {
            infoHtml += `<p><strong>Annotator:</strong> ${headers.Annotator}</p>`;
        }
        
        if (headers.Source) {
            infoHtml += `<p><strong>Source:</strong> ${headers.Source}</p>`;
        }
        
        if (headers.PlyCount) {
            const moveCount = Math.ceil(parseInt(headers.PlyCount) / 2);
            infoHtml += `<p><strong>Moves:</strong> ${moveCount} (${headers.PlyCount} plies)</p>`;
        }
        
        this.gameInfoElement.innerHTML = infoHtml;
    }
    
    extractPGNHeaders(pgn) {
        const headers = {};
        if (!pgn) return headers;
        
        // Split into lines and find header lines
        const lines = pgn.split('\n');
        
        for (const line of lines) {
            const trimmedLine = line.trim();
            if (trimmedLine.startsWith('[') && trimmedLine.endsWith(']')) {
                const match = trimmedLine.match(/\[(\w+)\s+"([^"]*)"\]/);
                if (match) {
                    headers[match[1]] = match[2];
                }
            }
        }
        
        return headers;
    }
    
    formatResult(result) {
        switch (result) {
            case '1-0':
                return '1-0 (White wins)';
            case '0-1':
                return '0-1 (Black wins)';
            case '1/2-1/2':
                return '1/2-1/2 (Draw)';
            case '*':
                return '* (Game in progress)';
            default:
                return result;
        }
    }
    
    formatTimeControl(timeControl) {
        // Parse common time control formats
        if (timeControl.includes('+')) {
            const parts = timeControl.split('+');
            if (parts.length === 2) {
                const baseTime = parseInt(parts[0]);
                const increment = parseInt(parts[1]);
                const baseMinutes = Math.floor(baseTime / 60);
                const baseSeconds = baseTime % 60;
                
                if (baseSeconds === 0) {
                    return `${baseMinutes} minutes + ${increment} seconds per move`;
                } else {
                    return `${baseMinutes}:${baseSeconds.toString().padStart(2, '0')} + ${increment} seconds per move`;
                }
            }
        }
        
        // Try to parse as seconds
        const seconds = parseInt(timeControl);
        if (!isNaN(seconds)) {
            const minutes = Math.floor(seconds / 60);
            const remainingSeconds = seconds % 60;
            
            if (remainingSeconds === 0) {
                return `${minutes} minutes`;
            } else {
                return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
            }
        }
        
        return timeControl; // Return as-is if we can't parse it
    }

    displayMoveList() {
        let moveListHtml = '<h3>Moves</h3><div class="moves">';
        
        // Use pre-extracted comments
        const comments = this.moveComments || {};
        
        for (let i = 0; i < this.moves.length; i++) {
            if (i % 2 === 0) {
                moveListHtml += `<span class="move-number">${Math.floor(i/2) + 1}.</span> `;
            }
            
            const moveText = this.moves[i].san;
            const comment = comments[i] || '';
            const title = comment ? `title="${comment.substring(0, 100)}${comment.length > 100 ? '...' : ''}"` : '';
            
            moveListHtml += `<span class="move${comment ? ' has-comment' : ''}" data-index="${i}" ${title}>${moveText}</span> `;
            
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
    
    extractCommentsFromPGN(pgn) {
        const comments = {};
        if (!pgn) return comments;
        
        console.log('Extracting comments from PGN:', pgn.substring(0, 300) + '...');
        
        // Split PGN into tokens to process sequentially
        const movesSection = pgn.split('\n\n').slice(1).join('\n\n');
        if (!movesSection) return comments;
        
        // Use a more robust approach: find patterns like "1.e4 {comment}"
        const tokens = movesSection.split(/(\{[^}]*\})/);
        let currentMoveIndex = -1;
        let moveCounter = 0;
        
        for (let i = 0; i < tokens.length; i++) {
            const token = tokens[i].trim();
            
            if (token.startsWith('{') && token.endsWith('}')) {
                // This is a comment
                const comment = token.slice(1, -1).trim();
                if (currentMoveIndex >= 0) {
                    comments[currentMoveIndex] = comment;
                    console.log(`Found comment for move ${currentMoveIndex}: ${comment}`);
                }
            } else {
                // Look for moves in this token
                const moveMatches = token.match(/(\d+\.{1,3})?([a-zA-Z0-9+#=\-]+)/g);
                if (moveMatches) {
                    for (const moveMatch of moveMatches) {
                        if (moveMatch.match(/^\d+\./)) {
                            // This starts a new move number
                            const moveNum = parseInt(moveMatch.match(/^(\d+)/)[1]);
                            moveCounter = (moveNum - 1) * 2;
                            currentMoveIndex = moveCounter;
                        } else if (moveMatch.match(/^[a-zA-Z]/)) {
                            // This is a move
                            currentMoveIndex = moveCounter;
                            moveCounter++;
                        }
                    }
                }
            }
        }
        
        console.log('Extracted comments:', comments);
        return comments;
    }

    goToStart() {
        this.game.reset();
        this.currentMoveIndex = -1;
        this.board.position(this.game.fen());
        this.updateStatus();
        this.updateNavigationButtons();
        this.highlightCurrentMove();
        this.updateMoveComment();
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
        this.updateMoveComment();
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
            this.updateMoveComment();
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
        this.updateMoveComment();
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
    
    updateMoveComment() {
        let commentHtml = '';
        
        if (this.currentMoveIndex >= 0 && this.moveComments && this.moveComments[this.currentMoveIndex]) {
            const comment = this.moveComments[this.currentMoveIndex];
            commentHtml = `<div class="comment-content">
                <strong>Comment:</strong> ${comment}
            </div>`;
        } else if (this.currentMoveIndex === -1) {
            commentHtml = '<div class="comment-content"><em>Starting position</em></div>';
        }
        
        this.moveCommentElement.innerHTML = commentHtml;
    }
    
    onInputChange() {
        const inputText = this.pgnInput.value.trim();
        
        if (!inputText) {
            // Reset to default state
            this.btnText.textContent = 'Load PGN';
            this.loadButton.className = 'btn-primary';
            this.pgnInput.placeholder = this.getDefaultPlaceholder();
            return;
        }
        
        // Check if this is chess book notation that needs conversion
        if (this.isChessBookNotation(inputText)) {
            this.btnText.textContent = 'Load Text';
            this.loadButton.className = 'btn-primary convert-mode';
            this.loadButton.title = 'Convert chess notation to PGN using ChatGPT API';
        } else {
            this.btnText.textContent = 'Load PGN';
            this.loadButton.className = 'btn-primary';
            this.loadButton.title = 'Load PGN directly';
        }
    }
    
    getDefaultPlaceholder() {
        return `Standard PGN format:
[Event "Example Game"]
[Site "?"]
[Date "2024.01.01"]
[White "Player 1"]
[Black "Player 2"]
[Result "1-0"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 1-0

OR Chess book notation with commentary:
(1) Player1–Player2 City, 1900 Opening Name [C32] 1.e4 e5 2.f4 d5 This move...`;
    }
}

// Initialize the viewer when page loads
$(document).ready(() => {
    new PGNViewer();
});