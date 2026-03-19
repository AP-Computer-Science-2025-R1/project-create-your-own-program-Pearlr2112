// script.js
let gameBoard = document.getElementById('game-board');
let scoreElement = document.getElementById('score');
let isProcessingMove = false;

// Preload images for better performance
const imageCache = {};
function preloadImages() {
    const imagePaths = [
        'assets/optimized/1.png',
        'assets/optimized/2.png',
        'assets/optimized/3.png',
        'assets/optimized/4.png',
        'assets/optimized/5.png',
        'assets/optimized/6.png',
        'assets/optimized/7.png',
        'assets/optimized/8.png'
    ];

    imagePaths.forEach(path => {
        const img = new Image();
        img.src = path;
        imageCache[path] = img;
    });
}

// Initialize the game
async function initGame() {
    try {
        preloadImages(); // Preload images on startup
        await updateBoard();
    } catch (error) {
        console.error('Error initializing game:', error);
        showError('Failed to load game. Please refresh the page.');
    }
}

// Update the game board display
async function updateBoard() {
    try {
        const gameState = await eel.get_game_state();
        const boardData = gameState.matrix;
        const score = gameState.score;

        // Update score with animation
        if (scoreElement.textContent !== score.toString()) {
            scoreElement.style.transform = 'scale(1.1)';
            scoreElement.textContent = score;
            setTimeout(() => {
                scoreElement.style.transform = 'scale(1)';
            }, 150);
        } else {
            scoreElement.textContent = score;
        }

        // Clear existing board
        gameBoard.innerHTML = '';

        // Create grid
        for (let i = 0; i < 4; i++) {
            const row = document.createElement('div');
            row.className = 'grid-row';

            for (let j = 0; j < 4; j++) {
                const cell = document.createElement('div');
                cell.className = 'grid-cell';
                row.appendChild(cell);
            }

            gameBoard.appendChild(row);
        }

        // Add tiles with smooth animation
        const gridCells = gameBoard.querySelectorAll('.grid-cell');
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                const imgPath = boardData[i][j];
                if (imgPath !== "") {
                    const tile = document.createElement('div');
                    tile.className = 'tile new-tile';

                    const img = document.createElement('img');
                    img.src = imgPath;
                    img.alt = 'Pokemon tile';
                    img.onload = () => {
                        tile.classList.remove('new-tile');
                    };
                    tile.appendChild(img);

                    // Position the tile
                    const cell = gridCells[i * 4 + j];
                    const rect = cell.getBoundingClientRect();
                    const boardRect = gameBoard.getBoundingClientRect();

                    tile.style.left = (rect.left - boardRect.left) + 'px';
                    tile.style.top = (rect.top - boardRect.top) + 'px';

                    gameBoard.appendChild(tile);
                }
            }
        }
    } catch (error) {
        console.error('Error updating board:', error);
        showError('Failed to update game board.');
    }
}

// Handle keyboard input
document.addEventListener('keydown', async function(event) {
    // Prevent default behavior for arrow keys
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
        event.preventDefault();
    }

    // Don't process moves if already processing one
    if (isProcessingMove) return;

    let direction = null;

    switch(event.key) {
        case 'ArrowUp':
            direction = 'ArrowUp';
            break;
        case 'ArrowDown':
            direction = 'ArrowDown';
            break;
        case 'ArrowLeft':
            direction = 'ArrowLeft';
            break;
        case 'ArrowRight':
            direction = 'ArrowRight';
            break;
        case 'r':
        case 'R':
            // Restart game with R key
            if (confirm('Restart the game?')) {
                restartGame();
            }
            return;
    }

    if (direction) {
        isProcessingMove = true;
        showLoading();

        try {
            const newState = await eel.handle_move(direction);
            await updateBoard();

            // Check for game over
            if (newState.gameOver) {
                setTimeout(() => {
                    alert(`Game Over! Final Score: ${newState.score}\nPress R to restart.`);
                }, 300);
            }
        } catch (error) {
            console.error('Error handling move:', error);
            showError('Failed to make move. Please try again.');
        } finally {
            isProcessingMove = false;
            hideLoading();
        }
    }
});

// Restart game function
async function restartGame() {
    try {
        showLoading();
        await eel.restart();
        await updateBoard();
    } catch (error) {
        console.error('Error restarting game:', error);
        showError('Failed to restart game.');
    } finally {
        hideLoading();
    }
}

// Loading indicator functions
function showLoading() {
    let loader = document.getElementById('loading-indicator');
    if (!loader) {
        loader = document.createElement('div');
        loader.id = 'loading-indicator';
        loader.innerHTML = 'Processing...';
        loader.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0,0,0,0.8);
            color: white;
            padding: 10px 20px;
            border-radius: 5px;
            z-index: 1000;
        `;
        document.body.appendChild(loader);
    }
    loader.style.display = 'block';
}

function hideLoading() {
    const loader = document.getElementById('loading-indicator');
    if (loader) {
        loader.style.display = 'none';
    }
}

// Error display function
function showError(message) {
    let errorDiv = document.getElementById('error-message');
    if (!errorDiv) {
        errorDiv = document.createElement('div');
        errorDiv.id = 'error-message';
        errorDiv.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: #e74c3c;
            color: white;
            padding: 10px 20px;
            border-radius: 5px;
            z-index: 1000;
        `;
        document.body.appendChild(errorDiv);
    }
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    setTimeout(() => {
        errorDiv.style.display = 'none';
    }, 3000);
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', initGame);