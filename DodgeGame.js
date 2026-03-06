// ===== 1. CORE VARIABLES =====
let isRunning = false, score = 0, level = 1, frameCount = 0;
let highScore = parseInt(localStorage.getItem('dodgeBest')) || 0;
let coins = parseInt(localStorage.getItem('dodgeCoins')) || 0;
let totalGames = parseInt(localStorage.getItem('totalGames')) || 0;
let ownedSkins = JSON.parse(localStorage.getItem('ownedSkins')) || [0];
let currentSkin = parseInt(localStorage.getItem('currentSkin')) || 0;

let enemies = [], enemySpeed = 3.5, spawnRate = 50;
let keys = { left: false, right: false };
let touchLeft = false, touchRight = false;

// Audio
const gameMusic = new Audio('GameMusic.mp3');
const crashSound = new Audio('fahh.mp3');
gameMusic.loop = true;
gameMusic.volume = 0.4;

// Canvas
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 400; canvas.height = 600;
let playerX = canvas.width / 2 - 22.5;
let playerY = canvas.height - 75;

// Images
const playerImg = new Image(); 
const enemyImg = new Image(); 
enemyImg.src = 'GameEnemy.png';

// ===== 2. SKIN SYSTEM =====
function loadSkin() {
    const skinSrc = currentSkin === 0 ? 'GamePlayer.png' : `skin${currentSkin + 1}.png`;
    playerImg.src = skinSrc;
    
    const preview = document.getElementById('previewSkin');
    if (preview) preview.src = skinSrc;
}
loadSkin();

// ===== 3. GAME FUNCTIONS =====
function startGame() {
    switchScreen('instructionsScreen');
}

function beginGame() {
    if (isRunning) return;
    
    totalGames++;
    localStorage.setItem('totalGames', totalGames);
    
    // Reset game state
    score = 0; level = 1; enemySpeed = 3.5; spawnRate = 50;
    enemies = [];
    playerX = canvas.width / 2 - 22.5;
    frameCount = 0;
    isRunning = true;
    
    // Update UI
    switchScreen('gameScreen');
    document.getElementById('score').innerText = '0';
    document.getElementById('levelTag').innerText = 'LVL 1';
    document.getElementById('levelBar').style.width = '0%';
    document.getElementById('highScore').innerText = highScore;
    document.getElementById('gameCoins').innerText = coins;
    
    gameMusic.currentTime = 0;
    gameMusic.play().catch(() => {});
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
    
    // Update game over screen
    document.getElementById('finalScore').innerText = score;
    document.getElementById('earnedCoins').innerText = earned;
    document.getElementById('finalBest').innerText = highScore;
    document.getElementById('menuCoins').innerText = coins;
    if (document.getElementById('shopCoins')) document.getElementById('shopCoins').innerText = coins;
    
    switchScreen('gameOverScreen');
}

function restartGame() {
    switchScreen('instructionsScreen');
}

function update() {
    if (!isRunning) return;
    
    frameCount++;
    if (frameCount % spawnRate === 0) {
        enemies.push({ x: Math.random() * (canvas.width - 40), y: -40 });
    }
    
    for (let i = enemies.length - 1; i >= 0; i--) {
        enemies[i].y += enemySpeed;
        
        if (checkCollision(playerX+5, playerY+5, 35, 35, enemies[i].x+5, enemies[i].y+5, 30, 30)) {
            gameOver(); return;
        }
        
        if (enemies[i].y > canvas.height) {
            enemies.splice(i, 1);
            score++;
            
            if (score % 10 === 0 && score > 0) {
                level++; enemySpeed += 0.5; spawnRate = Math.max(20, spawnRate - 3);
            }
            
            document.getElementById('score').innerText = score;
            document.getElementById('levelTag').innerText = `LVL ${level}`;
            document.getElementById('levelBar').style.width = ((score % 10) * 10) + '%';
        }
    }
    
    if (keys.left || touchLeft) playerX = Math.max(0, playerX - 7);
    if (keys.right || touchRight) playerX = Math.min(canvas.width - 45, playerX + 7);
}

function draw() {
    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw player
    if (playerImg.complete && playerImg.naturalWidth !== 0) {
        ctx.drawImage(playerImg, playerX, playerY, 45, 45);
    } else {
        ctx.fillStyle = '#00d2ff';
        ctx.fillRect(playerX, playerY, 45, 45);
    }
    
    // Draw enemies
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
        update(); draw(); requestAnimationFrame(gameLoop); 
    } 
}

// ===== 4. SCREEN NAVIGATION =====
function switchScreen(screen) {
    const screens = ['menuScreen', 'instructionsScreen', 'gameScreen', 'shopScreen', 'authorScreen', 'gameOverScreen'];
    screens.forEach(s => {
        const el = document.getElementById(s);
        if (el) el.style.display = 'none';
    });
    
    const target = document.getElementById(screen);
    if (target) target.style.display = 'flex';
    
    // Update UI based on screen
    if (screen === 'menuScreen') {
        document.getElementById('menuCoins').innerText = coins;
        document.getElementById('menuBest').innerText = highScore;
        isRunning = false;
        gameMusic.pause();
        const pauseMenu = document.getElementById('pauseMenu');
        if (pauseMenu) pauseMenu.style.display = 'none';
    }
    
    if (screen === 'shopScreen') {
        updateShopUI();
        document.getElementById('shopCoins').innerText = coins;
    }
    
    if (screen === 'authorScreen') {
        document.getElementById('totalGames').innerText = totalGames;
        document.getElementById('totalEarnings').innerText = coins;
    }
}

// ===== 5. SHOP SYSTEM =====
function updateShopUI() {
    const prices = [0, 100, 250, 500, 750, 1000];
    
    for (let i = 0; i < 6; i++) {
        const div = document.getElementById(`skin${i}`);
        if (!div) continue;
        
        if (currentSkin === i) {
            div.innerHTML = '<span class="equipped-tag">EQUIPPED</span>';
        } else if (ownedSkins.includes(i)) {
            div.innerHTML = `<button class="equip-btn" data-skin="${i}">EQUIP</button>`;
        } else {
            div.innerHTML = `<button class="buy-btn" data-skin="${i}" data-price="${prices[i]}">BUY ${prices[i]} 🪙</button>`;
        }
    }
    
    attachShopEvents();
}

function attachShopEvents() {
    document.querySelectorAll('.buy-btn').forEach(btn => {
        btn.onclick = (e) => {
            e.stopPropagation();
            const id = parseInt(e.target.dataset.skin);
            const price = parseInt(e.target.dataset.price);
            
            if (coins >= price) {
                coins -= price;
                ownedSkins.push(id);
                localStorage.setItem('dodgeCoins', coins);
                localStorage.setItem('ownedSkins', JSON.stringify(ownedSkins));
                document.getElementById('shopCoins').innerText = coins;
                document.getElementById('menuCoins').innerText = coins;
                updateShopUI();
            } else {
                alert("Not enough coins!");
            }
        };
    });
    
    document.querySelectorAll('.equip-btn').forEach(btn => {
        btn.onclick = (e) => {
            e.stopPropagation();
            const id = parseInt(e.target.dataset.skin);
            currentSkin = id;
            localStorage.setItem('currentSkin', id);
            loadSkin();
            if (isRunning) draw();
            updateShopUI();
        };
    });
}

// ===== 6. EVENT LISTENERS =====
document.addEventListener('DOMContentLoaded', function() {
    // Menu buttons
    document.getElementById('startGameBtn').addEventListener('click', () => switchScreen('instructionsScreen'));
    document.getElementById('openShopBtn').addEventListener('click', () => switchScreen('shopScreen'));
    document.getElementById('openAuthorBtn').addEventListener('click', () => switchScreen('authorScreen'));
    
    // Instructions buttons
    document.getElementById('proceedToGameBtn').addEventListener('click', beginGame);
    document.getElementById('backFromInstructionsBtn').addEventListener('click', () => switchScreen('menuScreen'));
    
    // Game over buttons
    document.getElementById('restartBtn').addEventListener('click', restartGame);
    document.getElementById('gameoverToMenuBtn').addEventListener('click', () => switchScreen('menuScreen'));
    
    // Back buttons
    document.getElementById('backFromShopBtn').addEventListener('click', (e) => {
        e.preventDefault();
        switchScreen('menuScreen');
    });
    
    document.getElementById('backFromAuthorBtn').addEventListener('click', (e) => {
        e.preventDefault();
        switchScreen('menuScreen');
    });
    
    // Pause buttons
    document.getElementById('pauseBtn').addEventListener('click', () => {
        if (isRunning) {
            isRunning = false;
            document.getElementById('pauseMenu').style.display = 'flex';
        }
    });
    
    document.getElementById('resumeBtn').addEventListener('click', () => {
        document.getElementById('pauseMenu').style.display = 'none';
        if (!isRunning) {
            isRunning = true;
            gameLoop();
            gameMusic.play().catch(() => {});
        }
    });
    
    document.getElementById('quitToMenuBtn').addEventListener('click', () => {
        document.getElementById('pauseMenu').style.display = 'none';
        isRunning = false;
        gameMusic.pause();
        switchScreen('menuScreen');
    });
    
    // Initialize
    document.getElementById('menuCoins').innerText = coins;
    document.getElementById('menuBest').innerText = highScore;
    switchScreen('menuScreen');
});

// ===== 7. CONTROLS =====
window.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft') { keys.left = true; e.preventDefault(); }
    if (e.key === 'ArrowRight') { keys.right = true; e.preventDefault(); }
});

window.addEventListener('keyup', e => {
    if (e.key === 'ArrowLeft') keys.left = false;
    if (e.key === 'ArrowRight') keys.right = false;
});

canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const touchX = touch.clientX - rect.left;
    
    if (touchX < canvas.width / 2) touchLeft = true;
    else touchRight = true;
});

canvas.addEventListener('touchend', () => {
    touchLeft = false; touchRight = false;
});

// ===== 8. HELPER =====
function checkCollision(x1,y1,w1,h1,x2,y2,w2,h2) {
    return x1 < x2 + w2 && x1 + w1 > x2 && y1 < y2 + h2 && y1 + h1 > y2;
}
