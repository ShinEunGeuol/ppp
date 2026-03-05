const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startBtn = document.getElementById('startBtn');

// --- 1. ASSETS (Images & Audio) ---
const playerImg = new Image(); playerImg.src = 'GamePlayer.png';
const enemyImg = new Image(); enemyImg.src = 'GameEnemy.png';

const bgMusic = new Audio('GameMusic.mp3'); 
bgMusic.loop = true; 
bgMusic.volume = 0.4;

const crashSound = new Audio('crash.mp3');

// --- 2. GAME VARIABLES ---
const PLAYER_SIZE = 45;
const ENEMY_SIZE = 40;
let isRunning = false;
let score = 0;
let highScore = localStorage.getItem('dodgeBest') || 0;
let level = 1;
let frameCount = 0;

let playerX, playerY;
let enemies = [];
let enemySpeed = 3.5;
let spawnRate = 50; 

// Input States
let keys = { left: false, right: false };
let touchLeft = false, touchRight = false;

// Initialize High Score UI
document.getElementById('highScore').innerText = `Best: ${highScore}`;

// --- 3. GAME FUNCTIONS ---

function startGame() {
    if (isRunning) return;
    
    // Reset Stats
    score = 0;
    level = 1;
    enemySpeed = 3.5;
    spawnRate = 50;
    enemies = [];
    playerX = canvas.width / 2 - PLAYER_SIZE / 2;
    playerY = canvas.height - PLAYER_SIZE - 30;
    isRunning = true;

    // UI Updates
    document.getElementById('instructions').style.display = 'none';
    updateUI();

    // Start Music
    bgMusic.play().catch(() => console.warn("Interaction needed for audio"));
    
    gameLoop();
}

function gameOver() {
    isRunning = false;
    bgMusic.pause();
    bgMusic.currentTime = 0;
    crashSound.play().catch(() => {});

    if (score > highScore) {
        highScore = score;
        localStorage.setItem('dodgeBest', highScore);
    }

    document.getElementById('title').innerText = "GAME OVER";
    document.getElementById('desc').innerHTML = `Score: ${score}<br>Best: ${highScore}`;
    document.getElementById('highScore').innerText = `Best: ${highScore}`;
    document.getElementById('instructions').style.display = 'block';
}

function updateDifficulty() {
    // Level up every 10 points
    let currentLevel = Math.floor(score / 10) + 1;
    if (currentLevel > level) {
        level = currentLevel;
        enemySpeed += 0.8;
        spawnRate = Math.max(15, spawnRate - 5);
    }
}

function update() {
    frameCount++;
    
    // Spawn Logic
    if (frameCount % spawnRate === 0) {
        enemies.push({ x: Math.random() * (canvas.width - ENEMY_SIZE), y: -ENEMY_SIZE });
    }

    // Move & Collision
    for (let i = 0; i < enemies.length; i++) {
        enemies[i].y += enemySpeed;

        if (checkCollision(playerX + 5, playerY + 5, PLAYER_SIZE - 10, PLAYER_SIZE - 10, 
                           enemies[i].x + 5, enemies[i].y + 5, ENEMY_SIZE - 10, ENEMY_SIZE - 10)) {
            gameOver();
            return;
        }

        if (enemies[i].y > canvas.height) {
            enemies.splice(i, 1);
            score++;
            updateDifficulty();
            updateUI();
            i--;
        }
    }

    // Movement
    if (keys.left || touchLeft) playerX -= 7;
    if (keys.right || touchRight) playerX += 7;
    playerX = Math.max(0, Math.min(canvas.width - PLAYER_SIZE, playerX));
}

function draw() {
    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.drawImage(playerImg, playerX, playerY, PLAYER_SIZE, PLAYER_SIZE);

    for (let e of enemies) {
        ctx.drawImage(enemyImg, e.x, e.y, ENEMY_SIZE, ENEMY_SIZE);
    }
}

function updateUI() {
    document.getElementById('score').innerText = score;
    document.getElementById('levelTag').innerText = `LVL ${level}`;
    let progress = (score % 10) * 10;
    document.getElementById('levelBar').style.width = progress + "%";
}

function checkCollision(x1, y1, w1, h1, x2, y2, w2, h2) {
    return x1 < x2 + w2 && x1 + w1 > x2 && y1 < y2 + h2 && y1 + h1 > y2;
}

function gameLoop() {
    if (!isRunning) return;
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// --- 4. EVENT LISTENERS ---

startBtn.addEventListener('click', startGame);

window.addEventListener('keydown', e => { 
    if(e.key === 'ArrowLeft') keys.left = true; 
    if(e.key === 'ArrowRight') keys.right = true; 
});
window.addEventListener('keyup', e => { 
    if(e.key === 'ArrowLeft') keys.left = false; 
    if(e.key === 'ArrowRight') keys.right = false; 
});

canvas.addEventListener('touchstart', e => {
    e.preventDefault();
    const x = e.touches[0].clientX - canvas.getBoundingClientRect().left;
    if (x < canvas.width / 2) touchLeft = true; else touchRight = true;
});
canvas.addEventListener('touchend', () => { touchLeft = false; touchRight = false; });

// Initial setup
playerX = canvas.width / 2 - PLAYER_SIZE / 2;
playerY = canvas.height - PLAYER_SIZE - 30;
