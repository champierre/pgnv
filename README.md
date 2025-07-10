# PGN Viewer

A web-based chess PGN viewer that can display chess games and convert chess book notation to PGN format using ChatGPT API.

## Features

- **PGN Game Viewer**: Display chess games from standard PGN format
- **Interactive Chess Board**: Navigate through moves with controls or keyboard shortcuts
- **Chess Book Notation Conversion**: Convert chess book notation to PGN using ChatGPT API
- **Move Comments**: Display detailed commentary for each move
- **Game Information**: Show comprehensive game details from PGN headers
- **Multi-language Support**: Automatic language detection for commentary (10 languages supported)
- **Format Detection**: Automatically detect input format and switch UI accordingly

## Supported Languages

- Japanese (日本語)
- Spanish (Español)
- French (Français)
- German (Deutsch)
- Italian (Italiano)
- Portuguese (Português)
- Russian (Русский)
- Chinese (中文)
- Korean (한국어)
- English

## Usage

1. **Open the application** in your web browser
2. **Click "Load New PGN"** to open the input dialog
3. **Paste your content**:
   - Standard PGN format, or
   - Chess book notation text
4. **For chess book notation**: Enter your ChatGPT API key for automatic conversion
5. **Customize system prompt** (optional): Modify how ChatGPT converts notation
6. **Click "Load PGN" or "Load Text"** (button changes based on detected format)
7. **Navigate through the game** using:
   - Control buttons (⏮ ◀ ▶ ⏭)
   - Keyboard arrows (← →)
   - Home/End keys
   - Clicking on moves in the move list

## File Structure

```
pgn-viewer/
├── index.html          # Main HTML file
├── app.js              # Main application logic
├── styles.css          # Styling
├── sample.pgn          # Sample PGN file for testing
├── sample.txt          # Sample chess book notation
├── CLAUDE.md           # Development guidance
└── README.md           # This file
```

## Input Formats

### Standard PGN Format
```
[Event "Example Game"]
[Site "?"]
[Date "2024.01.01"]
[White "Player 1"]
[Black "Player 2"]
[Result "1-0"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 1-0
```

### Chess Book Notation
```
(1) Player1–Player2 City, 1900 Opening Name [C32] 
1.e4 e5 2.f4 d5 This move is characteristic of the old-time player...
```

## API Integration

The application uses OpenAI's ChatGPT API (gpt-4o-mini model) to convert chess book notation to standard PGN format with detailed commentary.

### API Key Setup
1. Get your API key from OpenAI
2. Enter it in the modal dialog
3. The key is stored locally in your browser for convenience

### System Prompt Customization
- Customize how ChatGPT converts notation
- Default prompts are language-aware based on browser settings
- Prompts are saved locally for persistence

## Technical Details

### Libraries Used
- **chess.js** (v0.10.3): Chess game logic and PGN parsing
- **chessboard.js** (v1.0.0): Interactive chess board display
- **jQuery** (v3.7.1): DOM manipulation and utilities

### Local Storage
The application stores the following data locally:
- `pgn-viewer-api-key`: ChatGPT API key
- `pgn-viewer-system-prompt`: Custom system prompt

### Browser Compatibility
- Modern browsers with ES6+ support
- Responsive design for mobile devices

## Development

### Running Locally
Simply open `index.html` in a web browser. No build process required.

### Code Structure
- `PGNViewer` class handles all application logic
- Modular methods for different functionalities
- Event-driven architecture for user interactions

## License

This project is open source and available under the MIT License.

## Contributing

Contributions are welcome! Please feel free to submit pull requests or open issues for bugs and feature requests.