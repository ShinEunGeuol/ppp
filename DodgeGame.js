let isRunning = false, score = 0, level = 1, frameCount = 0;
let highScore = parseInt(localStorage.getItem('dodgeBest')) || 0;
let coins = parseInt(localStorage.getItem('dodgeCoins')) || 0;
let totalGames = parseInt(localStorage.getItem('totalGames')) || 0;
let ownedSkins = JSON.parse(localStorage.getItem('ownedSkins')) || [0];
let currentSkin = parseInt(localStorage.getItem('currentSkin')) || 0;

const skinFiles = ['67meme.jpg', 'kobe.png', 'lindawalker.jpg', 'skin3.png', 'skin4.png', 'skin5.png'];
let enemies = [], enemySpeed = 3.5, spawnRate = 50, playerX = 177, playerY = 525;
let keys = { left: false, right: false }, touchLeft = false, touchRight = false;

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const playerImg = new Image(); 
const enemyImg = new Image(); 
enemyImg.src = 'GameEnemy.png';

function loadSkin() {
    playerImg.src = skinFiles[currentSkin] || '67meme.jpg';
    if (document.getElementById('previewSkin')) document.getElementById('previewSkin').src = playerImg.src;
}

function switchScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.style.display = 'none');
    document.getElementById(id).style.display = 'flex';
    document.getElementById('gameUI').style.display = (id === 'gameScreen') ? 'flex' : 'none';

    if (id === 'menuScreen') {
        isRunning = false;
        document.getElementById('menuCoins').innerText = coins;
        document.getElementById('menuBest').innerText = highScore;
        loadSkin();
    }
    if (id === 'shopScreen') updateShopUI();
}

function beginGame() {
    isRunning = true; score = 0; level = 1; enemySpeed = 3.5; spawnRate = 50; enemies = [];
    totalGames++; localStorage.setItem('totalGames', totalGames);
    switchScreen('gameScreen');
    updateGameStats();
    gameLoop();
}

function updateGameStats() {
    document.getElementById('score').innerText = score;
    document.getElementById('gameCoins').innerText = coins;
    document.getElementById('highScore').innerText = highScore;
    document.getElementById('levelTag').innerText = `LVL ${level}`;
    document.getElementById('levelBar').style.width = (score % 10 * 10) + '%';
}

function gameOver() {
    isRunning = false;
    if (score > highScore) { highScore = score; localStorage.setItem('dodgeBest', highScore); }
    let earned = Math.floor(score / 2) + 1;
    coins += earned; localStorage.setItem('dodgeCoins', coins);
    document.getElementById('finalScore').innerText = score;
    document.getElementById('earnedCoins').innerText = earned;
    document.getElementById('finalBest').innerText = highScore;
    switchScreen('gameOverScreen');
}

function update() {
    if (!isRunning) return;
    if (++frameCount % spawnRate === 0) enemies.push({ x: Math.random() * (canvas.width - 40), y: -40 });
    
    for (let i = enemies.length - 1; i >= 0; i--) {
        enemies[i].y += enemySpeed;
        if (checkCollision(playerX + 5, playerY + 5, 35, 35, enemies[i].x + 5, enemies[i].y + 5, 30, 30)) { gameOver(); return; }
        if (enemies[i].y > canvas.height) {
            enemies.splice(i, 1); score++;
            if (score % 10 === 0) { level++; enemySpeed += 0.5; spawnRate = Math.max(20, spawnRate - 2); }
            updateGameStats();
        }
    }
    if (keys.left || touchLeft) playerX = Math.max(0, playerX - 7);
    if (keys.right || touchRight) playerX = Math.min(canvas.width - 45, playerX + 7);
}

function draw() {
    ctx.fillStyle = '#0a0a1a'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (playerImg.complete) ctx.drawImage(playerImg, playerX, playerY, 45, 45);
    enemies.forEach(e => {
        if (enemyImg.complete && enemyImg.naturalWidth !== 0) ctx.drawImage(enemyImg, e.x, e.y, 40, 40);
        else { ctx.fillStyle = '#ff4444'; ctx.fillRect(e.x, e.y, 40, 40); }
    });
}

function gameLoop() { 
    if (isRunning) { 
        update(); 
        draw(); 
        requestAnimationFrame(gameLoop); 
    } 
}

function updateShopUI() {
    const prices = [0, 100, 250, 500, 750, 1000];
    document.getElementById('shopCoins').innerText = coins;
    for (let i = 0; i < 6; i++) {
        const div = document.getElementById(`skin${i}`);
        if (!div) continue;
        if (currentSkin === i) div.innerHTML = '<b>ACTIVE</b>';
        else if (ownedSkins.includes(i)) div.innerHTML = `<button onclick="equipSkin(${i})" class="shop-btn">EQUIP</button>`;
        else div.innerHTML = `<button onclick="buySkin(${i},${prices[i]})" class="shop-btn">BUY ${prices[i]}</button>`;
    }
}

window.buySkin = (id, p) => {
    if (coins >= p) { 
        coins -= p; ownedSkins.push(id); 
        localStorage.setItem('dodgeCoins', coins); 
        localStorage.setItem('ownedSkins', JSON.stringify(ownedSkins)); 
        updateShopUI(); 
    }
};

window.equipSkin = (id) => { 
    currentSkin = id; 
    localStorage.setItem('currentSkin', id); 
    loadSkin(); 
    updateShopUI(); 
};

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('startGameBtn').onclick = () => switchScreen('instructionsScreen');
    document.getElementById('backFromInstructionsBtn').onclick = () => switchScreen('menuScreen');
    document.getElementById('proceedToGameBtn').onclick = beginGame;
    document.getElementById('openShopBtn').onclick = () => switchScreen('shopScreen');
    document.getElementById('backFromShopBtn').onclick = () => switchScreen('menuScreen');
    document.getElementById('restartBtn').onclick = beginGame;
    document.getElementById('gameoverToMenuBtn').onclick = () => switchScreen('menuScreen');
    document.getElementById('openAuthorBtn').onclick = () => {
        document.getElementById('totalGames').innerText = totalGames;
        document.getElementById('totalEarnings').innerText = coins;
        switchScreen('authorScreen');
    };
    document.getElementById('backFromAuthorBtn').onclick = () => switchScreen('menuScreen');
    document.getElementById('pauseBtn').onclick = () => { isRunning = false; document.getElementById('pauseMenu').style.display = 'flex'; };
    document.getElementById('resumeBtn').onclick = () => { isRunning = true; document.getElementById('pauseMenu').style.display = 'none'; gameLoop(); };
    document.getElementById('quitToMenuBtn').onclick = () => { document.getElementById('pauseMenu').style.display = 'none'; switchScreen('menuScreen'); };
    switchScreen('menuScreen');
});

window.onkeydown = e => { 
    if (e.key === 'ArrowLeft') keys.left = true; 
    if (e.key === 'ArrowRight') keys.right = true; 
};

window.onkeyup = e => { 
    if (e.key === 'ArrowLeft') keys.left = false; 
    if (e.key === 'ArrowRight') keys.right = false; 
};

canvas.ontouchstart = e => { 
    let x = e.touches[0].clientX - canvas.getBoundingClientRect().left; 
    if (x < 200) touchLeft = true; 
    else touchRight = true; 
};
canvas.ontouchend = () => { touchLeft = false; touchRight = false; };

function checkCollision(x1,y1,w1,h1,x2,y2,w2,h2) { 
    return x1 < x2 + w2 && x1 + w1 > x2 && y1 < y2 + h2 && y1 + h1 > y2; 
}
