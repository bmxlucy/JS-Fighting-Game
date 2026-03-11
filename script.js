/* =============================================================================
   FIGHTING GAME - Main Script
   ============================================================================= */

// -----------------------------------------------------------------------------
// CANVAS SETUP
// -----------------------------------------------------------------------------

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

const CONFIG = {
  canvas: { width: 1440, height: 980 },
  gravity: 0.7,
  game: {
    roundTime: 80,
    maxHealth: 100,
    roundsToWin: 3,
    baseDamage: 10,
    critChance: 0.2,
    critMultiplier: { min: 1.1, max: 2.5 },
    blockDamageReduction: 0.1,
    healAmount: 35,
    attackDuration: 100,
  },
  movement: {
    playerSpeed: 5,
    jumpForce: 20,
    rocketJumpForce: 25,
  },
  background: {
    layerPaths: [
      'img/map1/Sky.png',
      'img/map1/BG_Decor.png',
      'img/map1/Middle_Decor.png',
      'img/map1/Foreground.png',
    ],
    parallaxSpeeds: [0.15, 0.3, 0.4],
  },
};

canvas.width = CONFIG.canvas.width;
canvas.height = CONFIG.canvas.height;

// -----------------------------------------------------------------------------
// BACKGROUND / PARALLAX
// -----------------------------------------------------------------------------

const backgroundLayers = CONFIG.background.layerPaths.map((src) => {
  const img = new Image();
  img.src = src;
  return img;
});

const parallaxOffsets = CONFIG.background.parallaxSpeeds.map(() => 0);

backgroundLayers.forEach((img) => {
  img.onload = () => drawBackground();
});

function drawCoverFromSprite(image, sx, sy, sw, sh, dx, dy, dw, dh) {
  if (!image.complete || !image.naturalWidth || !image.naturalHeight) return;

  const scale = Math.max(dw / sw, dh / sh);
  const newWidth = sw * scale;
  const newHeight = sh * scale;
  const offsetX = dx + (dw - newWidth) / 2;
  const offsetY = dy + (dh - newHeight) / 2;

  ctx.drawImage(image, sx, sy, sw, sh, offsetX, offsetY, newWidth, newHeight);
}

function drawBackground() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const { width, height } = canvas;

  backgroundLayers.forEach((img, i) => {
    const offsetX = i === 0 ? 0 : parallaxOffsets[i - 1];
    drawCoverFromSprite(img, 0, 0, 1920, 1080, offsetX, 0, width, height);
  });
}

function updateParallax(playerVelocityX) {
  if (playerVelocityX > 0) {
    parallaxOffsets.forEach((_, i) => (parallaxOffsets[i] -= CONFIG.background.parallaxSpeeds[i]));
  } else if (playerVelocityX < 0) {
    parallaxOffsets.forEach((_, i) => (parallaxOffsets[i] += CONFIG.background.parallaxSpeeds[i]));
  }
}

// -----------------------------------------------------------------------------
// GAME STATE
// -----------------------------------------------------------------------------

const gameState = {
  currentTime: CONFIG.game.roundTime,
  playerHealth: CONFIG.game.maxHealth,
  enemyHealth: CONFIG.game.maxHealth,
  playerScore: 0,
  enemyScore: 0,
  playerWon: false,
  enemyWon: false,
  rocketPackActive: false,
  timerInterval: null,
};

// -----------------------------------------------------------------------------
// UI ELEMENTS
// -----------------------------------------------------------------------------

const ui = {
  playerHealthBar: document.querySelector('.player1-health-bar'),
  enemyHealthBar: document.querySelector('.player2-health-bar'),
  playerScore: document.querySelector('.player2-score'),
  enemyScore: document.querySelector('.player1-score'),
  timer: document.querySelector('.timer'),
};

function updateUI() {
  ui.playerHealthBar.style.width = `${gameState.playerHealth}%`;
  ui.enemyHealthBar.style.width = `${gameState.enemyHealth}%`;
  ui.playerScore.textContent = gameState.playerScore;
  ui.enemyScore.textContent = gameState.enemyScore;
  ui.timer.textContent = gameState.currentTime;
}

// -----------------------------------------------------------------------------
// TIMER
// -----------------------------------------------------------------------------

const POWERUP_SPAWN_CHANCE = 0.1;

function startTimer() {
  gameState.currentTime = CONFIG.game.roundTime;
  gameState.timerInterval = setInterval(() => {
    gameState.currentTime--;
    ui.timer.textContent = gameState.currentTime;

    if (Math.random() < POWERUP_SPAWN_CHANCE && !healBox.visible) {
      healBox.position.x = Math.random() * (canvas.width - healBox.width);
      healBox.visible = true;
    }
    if (Math.random() < POWERUP_SPAWN_CHANCE && !rocketPack.visible) {
      rocketPack.position.x = Math.random() * (canvas.width - rocketPack.width);
      rocketPack.visible = true;
    }

    if (gameState.currentTime <= 0) {
      endRound();
    }
  }, 1000);
}

function endRound() {
  clearInterval(gameState.timerInterval);

  if (gameState.playerHealth < gameState.enemyHealth) {
    gameState.playerScore++;
    reset();
  } else if (gameState.enemyHealth < gameState.playerHealth) {
    gameState.enemyScore++;
    reset();
  } else {
    setTimeout(reset, 1000);
  }
}

function reset() {
  clearInterval(gameState.timerInterval);
  gameState.playerHealth = CONFIG.game.maxHealth;
  gameState.enemyHealth = CONFIG.game.maxHealth;
  gameState.currentTime = CONFIG.game.roundTime;

  player.position.x = 50 + player.width;
  player.position.y = canvas.height - player.height;
  enemy.position.x = canvas.width - enemy.width - 100;
  enemy.position.y = canvas.height - enemy.height;
  player.velocity.x = 0;
  player.velocity.y = 0;
  enemy.velocity.x = 0;
  enemy.velocity.y = 0;
  player.reset();
  enemy.reset();

  updateUI();
  ui.timer.textContent = gameState.currentTime;

  if (gameState.playerScore < CONFIG.game.roundsToWin && gameState.enemyScore < CONFIG.game.roundsToWin) {
    setTimeout(startTimer, 0);
  }
}

function checkGameOver() {
  if (gameState.playerScore >= CONFIG.game.roundsToWin) {
    gameState.playerWon = true;
    showWinner();
  } else if (gameState.enemyScore >= CONFIG.game.roundsToWin) {
    gameState.enemyWon = true;
    showWinner();
  }
}

function showWinner() {
  clearInterval(gameState.timerInterval);
  alert(gameState.playerWon ? 'Player Won' : 'Enemy Won');
  gameState.playerWon = false;
  gameState.enemyWon = false;
  updateUI();
  reset();
}

// -----------------------------------------------------------------------------
// COMBAT HELPERS
// -----------------------------------------------------------------------------

function rollCrit() {
  return Math.random() < CONFIG.game.critChance
    ? CONFIG.game.critMultiplier.min + Math.random() * (CONFIG.game.critMultiplier.max - CONFIG.game.critMultiplier.min)
    : 1;
}

function applyDamage(attacker, defender, healthKey, scoreKey, scoreElement) {
  let damage = CONFIG.game.baseDamage * rollCrit();

  if (defender.isBlocking) {
    damage *= CONFIG.game.blockDamageReduction;
  } else {
    gameState[healthKey] -= damage;
  }

  if (gameState[healthKey] <= 0) {
    gameState[scoreKey]++;
    scoreElement.textContent = gameState[scoreKey];
    reset();
    checkGameOver();
  }
}

// -----------------------------------------------------------------------------
// SPRITE CLASS
// -----------------------------------------------------------------------------

class Sprite {
  constructor({ position, velocity, color, offset = { x: 0, y: 0 }, width, height }) {
    this.position = { x: position.x, y: position.y };
    this.velocity = { x: velocity.x, y: velocity.y };
    this.width = width;
    this.height = height;
    this.color = color;
    this.lastKey = '';
    this.isAttacking = false;
    this.isBlocking = false;

    this.attackBox = {
      position: { x: 0, y: 0 },
      offset: { x: offset.x, y: offset.y },
      width: 100,
      height: 50,
    };
  }

  draw() {
    ctx.fillStyle = this.color;
    ctx.fillRect(this.position.x, this.position.y, this.width, this.height);

    if (this.isAttacking) {
      ctx.fillStyle = 'green';
      ctx.fillRect(
        this.attackBox.position.x,
        this.attackBox.position.y,
        this.attackBox.width,
        this.attackBox.height
      );
    }
  }

  update() {
    this.draw();

    this.attackBox.position.x = this.position.x + this.attackBox.offset.x;
    this.attackBox.position.y = this.position.y - this.attackBox.offset.y;

    this.position.x += this.velocity.x;
    this.position.y += this.velocity.y;

    if (this.position.y + this.height >= canvas.height) {
      this.position.y = canvas.height - this.height;
      this.velocity.y = 0;
    } else {
      this.velocity.y += CONFIG.gravity;
    }

    this.position.x = Math.max(0, Math.min(canvas.width - this.width, this.position.x));
    if (this.position.x <= 0 || this.position.x + this.width >= canvas.width) {
      this.velocity.x = 0;
    }

    updateUI();
  }

  attack() {
    this.isAttacking = true;
    setTimeout(() => (this.isAttacking = false), CONFIG.game.attackDuration);
  }

  block() {
    this.isBlocking = true;
  }

  reset() {
    this.isAttacking = false;
    this.isBlocking = false;
    this.lastKey = '';
  }
}

// Fighter extends Sprite with proper attackBox offset reset
class Fighter extends Sprite {
  constructor(props) {
    super(props);
    this.defaultAttackOffsetX = props.offset?.x ?? 0;
  }

  reset() {
    super.reset();
    this.attackBox.offset.x = this.defaultAttackOffsetX;
  }
}

// -----------------------------------------------------------------------------
// GAME ENTITIES
// -----------------------------------------------------------------------------

const rocketPack = new Sprite({
  position: { x: 0, y: canvas.height - 70 },
  velocity: { x: 0, y: 0 },
  color: 'yellow',
  width: 60,
  height: 70,
});
rocketPack.visible = false;

const healBox = new Sprite({
  position: { x: 0, y: canvas.height - 50 },
  velocity: { x: 0, y: 0 },
  color: 'green',
  width: 50,
  height: 50,
});
healBox.visible = false;

const player = new Fighter({
  position: { x: 100, y: 0 },
  velocity: { x: 0, y: 0 },
  color: 'blue',
  offset: { x: 0, y: 0 },
  width: 50,
  height: 150,
});

const enemy = new Fighter({
  position: { x: canvas.width - 150, y: 100 },
  velocity: { x: 0, y: 0 },
  color: 'red',
  offset: { x: -50, y: 0 },
  width: 50,
  height: 150,
});

// -----------------------------------------------------------------------------
// COLLISION DETECTION
// -----------------------------------------------------------------------------

function rectsOverlap(attacker, defender, useAttackBox = false) {
  const r1 = useAttackBox && attacker.attackBox
    ? { x: attacker.attackBox.position.x, y: attacker.attackBox.position.y, w: attacker.attackBox.width, h: attacker.attackBox.height }
    : { x: attacker.position.x, y: attacker.position.y, w: attacker.width, h: attacker.height };
  const r2 = { x: defender.position.x, y: defender.position.y, w: defender.width, h: defender.height };

  return (
    r1.x + r1.w >= r2.x &&
    r2.x + r2.w >= r1.x &&
    r1.y + r1.h >= r2.y &&
    r2.y + r2.h >= r1.y
  );
}

// -----------------------------------------------------------------------------
// INPUT HANDLING
// -----------------------------------------------------------------------------

const keys = {
  a: { pressed: false },
  d: { pressed: false },
  w: { pressed: false },
  s: { pressed: false },
  ArrowRight: { pressed: false },
  ArrowLeft: { pressed: false },
  ArrowUp: { pressed: false },
  slash: { pressed: false },
};

function handleKeyDown(e) {
  switch (e.key) {
    case 's':
      player.block();
      break;
    case ' ':
      player.attack();
      break;
    case 'd':
      keys.d.pressed = true;
      player.lastKey = 'd';
      break;
    case 'a':
      keys.a.pressed = true;
      player.lastKey = 'a';
      break;
    case 'w':
      if (player.velocity.y === 0) player.velocity.y = -CONFIG.movement.jumpForce;
      else if (gameState.rocketPackActive) {
        player.velocity.y = -CONFIG.movement.rocketJumpForce;
        gameState.rocketPackActive = false;
      }
      break;

    case '/':
      enemy.attack();
      break;
    case 'ArrowDown':
      enemy.block();
      break;
    case 'ArrowRight':
      keys.ArrowRight.pressed = true;
      enemy.lastKey = 'ArrowRight';
      break;
    case 'ArrowLeft':
      keys.ArrowLeft.pressed = true;
      enemy.lastKey = 'ArrowLeft';
      break;
    case 'ArrowUp':
      if (enemy.velocity.y === 0) enemy.velocity.y = -CONFIG.movement.jumpForce;
      else if (gameState.rocketPackActive) {
        enemy.velocity.y = -CONFIG.movement.rocketJumpForce;
        gameState.rocketPackActive = false;
      }
      break;
  }
}

function handleKeyUp(e) {
  switch (e.key) {
    case 's':
      player.isBlocking = false;
      break;
    case 'd':
      keys.d.pressed = false;
      break;
    case 'a':
      keys.a.pressed = false;
      break;
    case 'ArrowDown':
      enemy.isBlocking = false;
      break;
    case 'ArrowRight':
      keys.ArrowRight.pressed = false;
      break;
    case 'ArrowLeft':
      keys.ArrowLeft.pressed = false;
      break;
  }
}

// -----------------------------------------------------------------------------
// GAME LOOP
// -----------------------------------------------------------------------------

function handlePlayerInput() {
  if (keys.a.pressed && player.lastKey === 'a') {
    player.attackBox.offset.x = -player.attackBox.width + player.width;
    player.velocity.x = -CONFIG.movement.playerSpeed;
  } else if (keys.d.pressed && player.lastKey === 'd') {
    player.attackBox.offset.x = 0;
    player.velocity.x = CONFIG.movement.playerSpeed;
  } else {
    player.velocity.x = 0;
  }

  if (keys.ArrowRight.pressed && enemy.lastKey === 'ArrowRight') {
    enemy.attackBox.offset.x = 0;
    enemy.velocity.x = CONFIG.movement.playerSpeed;
  } else if (keys.ArrowLeft.pressed && enemy.lastKey === 'ArrowLeft') {
    enemy.attackBox.offset.x = -enemy.attackBox.width + enemy.width;
    enemy.velocity.x = -CONFIG.movement.playerSpeed;
  } else {
    enemy.velocity.x = 0;
  }
}

function handlePowerupCollisions() {
  if (rocketPack.visible && rectsOverlap(player, rocketPack)) {
    rocketPack.visible = false;
    gameState.rocketPackActive = true;
  }
  if (rocketPack.visible && rectsOverlap(enemy, rocketPack)) {
    rocketPack.visible = false;
    gameState.rocketPackActive = true;
  }

  if (healBox.visible && rectsOverlap(player, healBox)) {
    gameState.playerHealth = Math.min(gameState.playerHealth + CONFIG.game.healAmount, CONFIG.game.maxHealth);
    healBox.visible = false;
  }
  if (healBox.visible && rectsOverlap(enemy, healBox)) {
    gameState.enemyHealth = Math.min(gameState.enemyHealth + CONFIG.game.healAmount, CONFIG.game.maxHealth);
    healBox.visible = false;
  }
}

function handleCombatCollisions() {
  if (rectsOverlap(player, enemy, true) && player.isAttacking) {
    player.isAttacking = false;
    applyDamage(player, enemy, 'enemyHealth', 'playerScore', ui.playerScore);
  }

  if (rectsOverlap(enemy, player, true) && enemy.isAttacking) {
    enemy.isAttacking = false;
    applyDamage(enemy, player, 'playerHealth', 'enemyScore', ui.enemyScore);
  }
}

function animate() {
  requestAnimationFrame(animate);

  updateParallax(player.velocity.x);

  if (backgroundLayers[0].complete && backgroundLayers[0].naturalHeight) {
    drawBackground();
  } else {
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  player.update();
  enemy.update();

  if (rocketPack.visible) rocketPack.draw();
  if (healBox.visible) healBox.draw();

  handlePlayerInput();
  handlePowerupCollisions();
  handleCombatCollisions();
}

// -----------------------------------------------------------------------------
// INIT
// -----------------------------------------------------------------------------

updateUI();
startTimer();
animate();

window.addEventListener('keydown', handleKeyDown);
window.addEventListener('keyup', handleKeyUp);
