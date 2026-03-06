// ===== 1. CORE VARIABLES =====
let isRunning = false;
let score = 0;
let highScore = parseInt(localStorage.getItem('dodgeBest')) || 0;
let level = 1;
let frameCount = 0;
let enemies = [];
let enemySpeed = 3.5;
let spawnRate = 50;
let keys = { left: false, right: false };
let touchLeft = false, touchRight = false;

// Audio
const gameMusic = new Audio('GameMusic.mp3');
gameMusic.loop = true;
gameMusic.volume = 0.4;
const crashSound = new Audio('crash.mp3');

// Canvas Setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 400; 
canvas.height = 600;

let playerX = canvas.width / 2 - 22.5;
let playerY = canvas.height - 75;

// ===== 2. DATA & ASSETS =====
let coins = parseInt(localStorage.getItem('dodgeCoins')) || 0;
let ownedSkins = JSON.parse(localStorage.getItem('ownedSkins')) || [0];
let currentSkin = parseInt(localStorage.getItem('currentSkin')) || 0;

const playerImg = new Image(); 
const enemyImg = new Image(); 
enemyImg.src = 'GameEnemy.png';

// Track total games played
let totalGames = parseInt(localStorage.getItem('totalGames')) || 0;

// Error handling for images
playerImg.onerror = () => console.log('Player image failed to load, using fallback');
enemyImg.onerror = () => console.log('Enemy image failed to load, using fallback');

// FIXED: Enhanced loadSkin function with onload event
function loadSkin() {
    const skinSrc = currentSkin === 0 ? 'GamePlayer.png' : `skin${currentSkin + 1}.png`;
    
    // Clear and set new image source
    playerImg.src = '';
    playerImg.src = skinSrc;
    
    // Add load event to ensure image is ready
    playerImg.onload = function() {
        console.log("Skin loaded:", skinSrc);
        // Force a redraw if game is running
        if (isRunning) {
            draw();
        }
    };
    
    // Update preview skin
    const previewSkin = document.getElementById('previewSkin');
    if (previewSkin) previewSkin.src = skinSrc;
    
    // Update the start button preview if exists
    const startPreview = document.querySelector('.current-skin-display img');
    if (startPreview) startPreview.src = skinSrc;
}
loadSkin();

// ===== 3. ENGINE FUNCTIONS =====
function startGame() {
    if (isRunning) return;
    
    console.log("Starting game...");
    
    // Update total games played
    totalGames++;
    localStorage.setItem('totalGames', totalGames);
    
    // Reset State
    score = 0; 
    level = 1; 
    enemySpeed = 3.5; 
    spawnRate = 50; 
    enemies = [];
    playerX = canvas.width / 2 - 22.5;
    playerY = canvas.height - 75;
    frameCount = 0;
    isRunning = true;
    
    // UI Update
    const instructions = document.getElementById('instructions');
    const scoreElement = document.getElementById('score');
    const levelTag = document.getElementById('levelTag');
    const levelBar = document.getElementById('levelBar');
    const highScoreElement = document.getElementById('highScore');
    const gameCoinsElement = document.getElementById('gameCoins');
    
    if (instructions) instructions.style.display = 'none';
    if (scoreElement) scoreElement.innerText = '0';
    if (levelTag) levelTag.innerText = 'LVL 1';
    if (levelBar) levelBar.style.width = '0%';
    if (highScoreElement) highScoreElement.innerText = highScore;
    if (gameCoinsElement) gameCoinsElement.innerText = coins;
    
    // Try to play music
    gameMusic.currentTime = 0;
    gameMusic.play().catch(e => console.log("Audio play failed:", e));
    
    gameLoop();
}

function gameOver() {
    if (!isRunning) return;
    
    isRunning = false;
    gameMusic.pause();
    crashSound.play().catch(() => {});
    
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('dodgeBest', highScore);
    }
    
    const earned = Math.floor(score / 2) + 1;
    coins += earned;
    localStorage.setItem('dodgeCoins', coins);
    
    // Show instructions/game over screen
    const instructions = document.getElementById('instructions');
    const title = document.getElementById('title');
    const desc = document.getElementById('desc');
    const previewSkin = document.getElementById('previewSkin');
    
    if (instructions) {
        instructions.style.display = 'block';
        if (title) title.innerText = 'GAME OVER';
        if (desc) desc.innerHTML = `Score: ${score} | Earned: ${earned} 🪙<br>Best: ${highScore}`;
    }
    
    // Update preview skin
    if (previewSkin) {
        previewSkin.src = currentSkin === 0 ? 'GamePlayer.png' : `skin${currentSkin + 1}.png`;
    }
    
    // Update menu coins
    const menuCoins = document.getElementById('menuCoins');
    if (menuCoins) menuCoins.innerText = coins;
    
    // Update shop coins if shop is open
    const shopCoins = document.getElementById('shopCoins');
    if (shopCoins) shopCoins.innerText = coins;
}

function update() {
    if (!isRunning) return;
    
    frameCount++;
    if (frameCount % spawnRate === 0) {
        enemies.push({ x: Math.random() * (canvas.width - 40), y: -40 });
    }
    
    for (let i = enemies.length - 1; i >= 0; i--) {
        enemies[i].y += enemySpeed;
        
        // Collision Check
        if (checkCollision(playerX+5, playerY+5, 35, 35, enemies[i].x+5, enemies[i].y+5, 30, 30)) {
            gameOver(); 
            return;
        }
        
        if (enemies[i].y > canvas.height) {
            enemies.splice(i, 1);
            score++;
            
            // Level up every 10 points
            if (score % 10 === 0 && score > 0) {
                level++; 
                enemySpeed += 0.5; 
                spawnRate = Math.max(20, spawnRate - 3);
            }
            
            // Update UI
            const scoreElement = document.getElementById('score');
            const levelTag = document.getElementById('levelTag');
            const levelBar = document.getElementById('levelBar');
            
            if (scoreElement) scoreElement.innerText = score;
            if (levelTag) levelTag.innerText = `LVL ${level}`;
            if (levelBar) levelBar.style.width = ((score % 10) * 10) + '%';
        }
    }
    
    // Player movement
    if (keys.left || touchLeft) playerX = Math.max(0, playerX - 7);
    if (keys.right || touchRight) playerX = Math.min(canvas.width - 45, playerX + 7);
}

function draw() {
    if (!ctx) return;
    
    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Player - FIXED: Always use current skin
    if (playerImg.complete && playerImg.naturalWidth !== 0) {
        ctx.drawImage(playerImg, playerX, playerY, 45, 45);
    } else {
        // Fallback colors based on current skin
        ctx.fillStyle = currentSkin === 0 ? '#00d2ff' : 
                       currentSkin === 1 ? '#3366ff' :
                       currentSkin === 2 ? '#ff0055' : 
                       currentSkin === 3 ? '#ffaa00' :
                       currentSkin === 4 ? '#00ff88' : '#ff66aa'; // Added more colors
        ctx.fillRect(playerX, playerY, 45, 45);
    }
    
    // Enemies
    enemies.forEach(e => {
        if (enemyImg.complete && enemyImg.naturalWidth !== 0) {
            ctx.drawImage(enemyImg, e.x, e.y, 40, 40);
        } else {
            ctx.fillStyle = '#ff4444';
            ctx.fillRect(e.x, e.y, 40, 40);
        }
    });
}

function gameLoop() { 
    if (isRunning) { 
        update(); 
        draw(); 
        requestAnimationFrame(gameLoop); 
    } 
}

// ===== 4. NAVIGATION =====
function switchScreen(screen) {
    console.log("Switching to screen:", screen);
    
    // Hide all screens
    const screens = ['menuScreen', 'shopScreen', 'gameScreen', 'authorScreen'];
    screens.forEach(s => {
        const element = document.getElementById(s);
        if (element) element.style.display = 'none';
    });
    
    // Show selected screen
    const targetScreen = document.getElementById(screen);
    if (targetScreen) {
        targetScreen.style.display = 'flex';
    } else {
        console.error("Screen not found:", screen);
    }
    
    // Update UI based on screen
    if(screen === 'menuScreen') {
        const menuCoins = document.getElementById('menuCoins');
        const menuBest = document.getElementById('menuBest');
        if (menuCoins) menuCoins.innerText = coins;
        if (menuBest) menuBest.innerText = highScore;
        
        // Make sure game is stopped
        isRunning = false;
        gameMusic.pause();
        
        // Hide pause menu if visible
        const pauseMenu = document.getElementById('pauseMenu');
        if (pauseMenu) pauseMenu.style.display = 'none';
    }
    
    if(screen === 'shopScreen') {
        updateShopUI();
        const shopCoins = document.getElementById('shopCoins');
        if (shopCoins) shopCoins.innerText = coins;
    }
    
    if(screen === 'authorScreen') {
        updateAuthorStats();
    }
    
    if(screen === 'gameScreen') {
        // Make sure game UI is ready
        const instructions = document.getElementById('instructions');
        if (instructions) instructions.style.display = 'block';
        const title = document.getElementById('title');
        if (title) title.innerText = 'DODGE';
        const desc = document.getElementById('desc');
        if (desc) desc.innerText = 'Use Arrows or Tap Sides to move';
        
        // Update highscore display
        const highScoreElement = document.getElementById('highScore');
        if (highScoreElement) highScoreElement.innerText = highScore;
        
        // Update coins display
        const gameCoins = document.getElementById('gameCoins');
        if (gameCoins) gameCoins.innerText = coins;
        
        // Update preview skin
        const previewSkin = document.getElementById('previewSkin');
        if (previewSkin) previewSkin.src = currentSkin === 0 ? 'GamePlayer.png' : `skin${currentSkin + 1}.png`;
    }
}

// ===== 5. SHOP LOGIC =====
// UPDATED: Added more skins (up to 6)
function updateShopUI() {
    const prices = [0, 100, 250, 500, 750, 1000]; // Prices for skins 0-5
    
    // Loop through all skins (change this number to add more skins)
    const totalSkins = 6; // Changed from 4 to 6
    
    for (let i = 0; i < totalSkins; i++) {
        const statusDiv = document.getElementById(`skin${i}`);
        if (!statusDiv) {
            // If skin element doesn't exist in HTML, we need to create it
            console.log(`Skin ${i} element not found in HTML`);
            continue;
        }
        
        const isOwned = ownedSkins.includes(i);
        const isEquipped = currentSkin === i;
        
        if (isEquipped) {
            statusDiv.innerHTML = '<span class="equipped-tag">EQUIPPED</span>';
        } else if (isOwned) {
            statusDiv.innerHTML = `<button class="equip-btn" data-skin="${i}">EQUIP</button>`;
        } else {
            statusDiv.innerHTML = `<button class="buy-btn" data-skin="${i}" data-price="${prices[i]}">BUY ${prices[i]} 🪙</button>`;
        }
    }
    
    // Re-attach event listeners
    attachShopEvents();
}

function attachShopEvents() {
    // Buy buttons
    document.querySelectorAll('.buy-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const skinId = parseInt(e.target.dataset.skin);
            const price = parseInt(e.target.dataset.price);
            
            if (coins >= price) {
                coins -= price;
                ownedSkins.push(skinId);
                localStorage.setItem('dodgeCoins', coins);
                localStorage.setItem('ownedSkins', JSON.stringify(ownedSkins));
                
                // Update UI
                const shopCoins = document.getElementById('shopCoins');
                if (shopCoins) shopCoins.innerText = coins;
                const menuCoins = document.getElementById('menuCoins');
                if (menuCoins) menuCoins.innerText = coins;
                updateShopUI();
            } else {
                alert("Not enough coins!");
            }
        });
    });
    
    // Equip buttons
    document.querySelectorAll('.equip-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const skinId = parseInt(e.target.dataset.skin);
            equipSkin(skinId);
        });
    });
}

// FIXED: Enhanced equipSkin function
window.equipSkin = (i) => {
    currentSkin = i;
    localStorage.setItem('currentSkin', i);
    loadSkin(); // This now has onload event to redraw
    
    // Force an immediate redraw if game is running
    if (isRunning) {
        draw(); // Force one draw call
    }
    
    // Update all skin previews
    const previewSkin = document.getElementById('previewSkin');
    if (previewSkin) previewSkin.src = currentSkin === 0 ? 'GamePlayer.png' : `skin${currentSkin + 1}.png`;
    
    const startPreview = document.querySelector('.current-skin-display img');
    if (startPreview) startPreview.src = currentSkin === 0 ? 'GamePlayer.png' : `skin${currentSkin + 1}.png`;
    
    updateShopUI();
    
    console.log("Skin equipped:", i, "Current skin:", currentSkin);
};

window.buySkin = (i, price) => {
    if (coins >= price) {
        coins -= price;
        ownedSkins.push(i);
        localStorage.setItem('dodgeCoins', coins);
        localStorage.setItem('ownedSkins', JSON.stringify(ownedSkins));
        updateShopUI();
    } else alert("Need more coins!");
};

// ===== 6. AUTHOR SCREEN =====
function updateAuthorStats() {
    const totalGamesElement = document.getElementById('totalGames');
    const totalEarningsElement = document.getElementById('totalEarnings');
    
    if (totalGamesElement) totalGamesElement.innerText = totalGames;
    if (totalEarningsElement) totalEarningsElement.innerText = coins;
}

// ===== 7. EVENT LISTENERS =====
document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM loaded, setting up event listeners...");
    
    // Menu buttons
    const startGameBtn = document.getElementById('startGameBtn');
    const openShopBtn = document.getElementById('openShopBtn');
    const openAuthorBtn = document.getElementById('openAuthorBtn');
    const startBtn = document.getElementById('startBtn');
    const pauseBtn = document.getElementById('pauseBtn');
    const menuBtn = document.getElementById('menuBtn');
    const resumeBtn = document.getElementById('resumeBtn');
    const quitToMenuBtn = document.getElementById('quitToMenuBtn');
    
    // BACK BUTTONS
    const backFromShopBtn = document.getElementById('backFromShopBtn');
    const backFromAuthorBtn = document.getElementById('backFromAuthorBtn');
    
    console.log("Back buttons found:", backFromShopBtn, backFromAuthorBtn);
    
    if (startGameBtn) {
        startGameBtn.addEventListener('click', () => {
            switchScreen('gameScreen');
            startGame();
        });
    }
    
    if (openShopBtn) {
        openShopBtn.addEventListener('click', () => switchScreen('shopScreen'));
    }
    
    if (openAuthorBtn) {
        openAuthorBtn.addEventListener('click', () => switchScreen('authorScreen'));
    }
    
    // Back button for shop
    if (backFromShopBtn) {
        backFromShopBtn.addEventListener('click', (e) => {
            e.preventDefault();
            console.log("Back from shop clicked");
            switchScreen('menuScreen');
        });
    } else {
        console.error("Back from shop button not found!");
    }
    
    // Back button for author
    if (backFromAuthorBtn) {
        backFromAuthorBtn.addEventListener('click', (e) => {
            e.preventDefault();
            console.log("Back from author clicked");
            switchScreen('menuScreen');
        });
    } else {
        console.error("Back from author button not found!");
    }
    
    if (startBtn) {
        startBtn.addEventListener('click', () => {
            switchScreen('gameScreen');
            startGame();
        });
    }
    
    // Pause functionality
    if (pauseBtn) {
        pauseBtn.addEventListener('click', () => {
            if (isRunning) {
                isRunning = false;
                const pauseMenu = document.getElementById('pauseMenu');
                if (pauseMenu) pauseMenu.style.display = 'flex';
            }
        });
    }
    
    if (menuBtn) {
        menuBtn.addEventListener('click', () => {
            if (isRunning) {
                isRunning = false;
                gameMusic.pause();
            }
            switchScreen('menuScreen');
        });
    }
    
    if (resumeBtn) {
        resumeBtn.addEventListener('click', () => {
            const pauseMenu = document.getElementById('pauseMenu');
            if (pauseMenu) pauseMenu.style.display = 'none';
            if (!isRunning) {
                isRunning = true;
                gameLoop();
                gameMusic.play().catch(() => {});
            }
        });
    }
    
    if (quitToMenuBtn) {
        quitToMenuBtn.addEventListener('click', () => {
            const pauseMenu = document.getElementById('pauseMenu');
            if (pauseMenu) pauseMenu.style.display = 'none';
            isRunning = false;
            gameMusic.pause();
            switchScreen('menuScreen');
        });
    }
    
    // Initialize menu values
    const menuCoins = document.getElementById('menuCoins');
    const menuBest = document.getElementById('menuBest');
    if (menuCoins) menuCoins.innerText = coins;
    if (menuBest) menuBest.innerText = highScore;
    
    // Show menu screen by default
    switchScreen('menuScreen');
});

// Keyboard controls
window.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft') {
        keys.left = true;
        e.preventDefault();
    }
    if (e.key === 'ArrowRight') {
        keys.right = true;
        e.preventDefault();
    }
});

window.addEventListener('keyup', e => {
    if (e.key === 'ArrowLeft') keys.left = false;
    if (e.key === 'ArrowRight') keys.right = false;
});

// Touch controls for canvas
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const touchX = touch.clientX - rect.left;
    
    if (touchX < canvas.width / 2) {
        touchLeft = true;
    } else {
        touchRight = true;
    }
});

canvas.addEventListener('touchend', (e) => {
    e.preventDefault();
    touchLeft = false;
    touchRight = false;
});

canvas.addEventListener('touchcancel', (e) => {
    e.preventDefault();
    touchLeft = false;
    touchRight = false;
});

// Helper function
function checkCollision(x1,y1,w1,h1,x2,y2,w2,h2) {
    return x1 < x2 + w2 && x1 + w1 > x2 && y1 < y2 + h2 && y1 + h1 > y2;
}
