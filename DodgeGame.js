const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const instructions = document.getElementById('instructions');

const PLAYER_SIZE = 35;
const ENEMY_SIZE = 30;
const PLAYER_SPEED = 7;

/** 2. GAME STATE **/
let isRunning = false;
let score = 0;
let enemySpeed = 4;
let enemies = [];
let playerX = canvas.width / 2 - PLAYER_SIZE / 2;
let playerY = canvas.height - PLAYER_SIZE - 20;

// Inputs
let keys = { left: false, right: false };
let touchLeft = false, touchRight = false;

// Audio
const bgMusic = new Audio('music.mp3');
bgMusic.loop = true;
const crashSound = new Audio('crash.mp3');

/** 3. CORE FUNCTIONS **/
function startGame() { ... }
function gameOver() { ... }
function gameLoop() { ... }
function update() { ... }
function draw() { ... }
function checkCollision(x1, y1, w1, h1, x2, y2, w2, h2) { ... }

/** 4. EVENT LISTENERS **/
window.addEventListener('keydown', e => { ... });
canvas.addEventListener('touchstart', e => { ... });
// etc...

// Initialize
draw();
