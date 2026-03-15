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
  floorOffset: 15,
  gravity: 0.7,
  game: {
    roundTime: 80,
    maxHealth: 100,
    roundsToWin: 3,
    baseDamage: 10,
    critChance: 0.2,
    critMultiplier: { min: 1.1, max: 2.5 },
    blockDamageReduction: 0.9,
    healAmount: 35,
    attackDuration: 200,
  },
  animation: {
    frameCount: 6,
    frameInterval: 220,  // ms per frame (lower = faster)
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
    maxParallaxOffset: 400,
  },
};

canvas.width = CONFIG.canvas.width;
canvas.height = CONFIG.canvas.height;

const floorY = () => canvas.height - CONFIG.floorOffset;

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

function updateParallax(player) {
  const atLeftBorder = player.position.x <= 0;
  const atRightBorder = player.position.x >= canvas.width - player.width;
  if (atLeftBorder || atRightBorder) return;

  const maxOffset = CONFIG.background.maxParallaxOffset ?? 400;
  const clamp = (v) => Math.max(-maxOffset, Math.min(maxOffset, v));

  if (player.velocity.x > 0) {
    parallaxOffsets.forEach((_, i) => (parallaxOffsets[i] = clamp(parallaxOffsets[i] - CONFIG.background.parallaxSpeeds[i])));
  } else if (player.velocity.x < 0) {
    parallaxOffsets.forEach((_, i) => (parallaxOffsets[i] = clamp(parallaxOffsets[i] + CONFIG.background.parallaxSpeeds[i])));
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
  boostCooldownRemaining: 0,
};

const BOOST_COOLDOWN_SECONDS = 10;

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

const POWERUP_SPAWN_CHANCE = 0.8;

function startTimer() {
  gameState.currentTime = CONFIG.game.roundTime;
  gameState.timerInterval = setInterval(() => {
    gameState.currentTime--;
    ui.timer.textContent = gameState.currentTime;

    if (gameState.boostCooldownRemaining > 0) {
      gameState.boostCooldownRemaining--;
    } else {
      if (Math.random() < POWERUP_SPAWN_CHANCE && !healBox.visible) {
        healBox.position.x = Math.random() * (canvas.width - healBox.width);
        healBox.visible = true;
      }
      if (Math.random() < POWERUP_SPAWN_CHANCE && !rocketPack.visible) {
        rocketPack.position.x = Math.random() * (canvas.width - rocketPack.width);
        rocketPack.visible = true;
      }
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
  player.position.y = floorY() - player.height;
  enemy.position.x = canvas.width - enemy.width - 100;
  enemy.position.y = floorY() - enemy.height;
  player.velocity.x = 0;
  player.velocity.y = 0;
  enemy.velocity.x = 0;
  enemy.velocity.y = 0;
  player.reset();
  enemy.reset();

  healBox.visible = false;
  rocketPack.visible = false;
  gameState.boostCooldownRemaining = BOOST_COOLDOWN_SECONDS;

  updateUI();
  ui.timer.textContent = gameState.currentTime;

  if (gameState.playerScore < CONFIG.game.roundsToWin && gameState.enemyScore < CONFIG.game.roundsToWin) {
    setTimeout(startTimer, 0);
  }

  parallaxOffsets.forEach((_, i) => (parallaxOffsets[i] = 0));
  
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
    damage *= (1 - CONFIG.game.blockDamageReduction);
  }

  gameState[healthKey] -= damage;

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
  constructor({
    position,
    velocity,
    color,
    offset = { x: 0, y: 0 },
    width,
    height,
    imgSrc,
    imageSrc,
    totalFrames,
    frameWidth,
    frameHeight,
    cropLeft = 0,
    cropRight = 0,
    cropTop = 0,
    cropBottom = 0,
    frameOffsetX = 0,
    frameOffsetY = 0,
    animationSpeed,
    displayWidth,
    displayHeight,
    drawScale = 1.2,
    fitInBox = false,
    verticalAlign = 'bottom',
    defaultFacing = 'right',
  }) {
    this.position = { x: position.x, y: position.y };
    this.velocity = { x: velocity.x, y: velocity.y };
    this.width = width;
    this.height = height;
    this.color = color;
    this.lastKey = '';
    this.isAttacking = false;
    this.isBlocking = false;
    this.displayWidth = displayWidth;
    this.displayHeight = displayHeight;
    this.drawScale = drawScale;
    this.fitInBox = fitInBox;
    this.verticalAlign = verticalAlign;
    this.defaultFacing = defaultFacing;

    this.attackBox = {
      position: { x: 0, y: 0 },
      offset: { x: offset.x, y: offset.y },
      width: 200,
      height: 100,
    };

    const src = imgSrc || imageSrc;
    if (src) {
      this.image = new Image();
      this.image.src = src;

      // Original frame dimensions (used for stepping - never use cropped width for frame index)
      this.originalFrameWidth = frameWidth ?? null;
      this.originalFrameHeight = frameHeight ?? null;

      // Cropping applied per frame
      this.cropLeft = cropLeft;
      this.cropRight = cropRight;
      this.cropTop = cropTop;
      this.cropBottom = cropBottom;

      // Shift crop region within frame (e.g. frameOffsetX: 10 = move visible area 10px right)
      this.frameOffsetX = frameOffsetX;
      this.frameOffsetY = frameOffsetY;

      // Derived: offset of crop within frame, and cropped dimensions
      this.croppedOffsetX = cropLeft;
      this.croppedOffsetY = cropTop;
      if (this.originalFrameWidth != null && this.originalFrameHeight != null) {
        this.croppedFrameWidth = this.originalFrameWidth - cropLeft - cropRight;
        this.croppedFrameHeight = this.originalFrameHeight - cropTop - cropBottom;
      }

      // Animation
      this.totalFrames = totalFrames ?? 6;
      this.currentFrame = 0;
      this.frameTimer = 0;
      this.frameInterval = animationSpeed != null ? 1000 / animationSpeed : CONFIG.animation?.frameInterval ?? 100;
    } else {
      this.image = null;
    }
  }

  draw() {
    if (this.image?.complete && this.image?.naturalWidth) {
      // Lazy-init frame dimensions when image loads (if not provided in constructor)
      if (!this.originalFrameWidth) {
        this.originalFrameWidth = Math.floor(this.image.naturalWidth / this.totalFrames);
        this.originalFrameHeight = this.image.naturalHeight;
        this.croppedFrameWidth = this.originalFrameWidth - this.cropLeft - this.cropRight;
        this.croppedFrameHeight = this.originalFrameHeight - this.cropTop - this.cropBottom;
      }

      // Step by ORIGINAL frame width - never use cropped width for frame indexing
      const frameBaseX = this.currentFrame * this.originalFrameWidth;
      const frameBaseY = 0;

      // Cropped source rect within current frame (+ frameOffset shifts the visible area)
      const sx = frameBaseX + this.croppedOffsetX + (this.frameOffsetX ?? 0);
      const sy = frameBaseY + this.croppedOffsetY + (this.frameOffsetY ?? 0);
      const sw = this.croppedFrameWidth;
      const sh = this.croppedFrameHeight;

      const boxWidth = this.displayWidth ?? this.width;
      const boxHeight = this.displayHeight ?? this.height;

      const scale = Math.min(boxWidth / sw, boxHeight / sh);
      const drawScale = this.drawScale ?? 1.2;
      let drawWidth = sw * scale * drawScale;
      let drawHeight = sh * scale * drawScale;
      if (this.fitInBox) {
        const maxScale = Math.min(boxWidth / drawWidth, boxHeight / drawHeight, 1);
        if (maxScale < 1) {
          drawWidth *= maxScale;
          drawHeight *= maxScale;
        }
      }
      const dx = this.position.x + (boxWidth - drawWidth) / 2;
      const dy = this.verticalAlign === 'center'
        ? this.position.y + (boxHeight - drawHeight) / 2
        : this.position.y + boxHeight - drawHeight;

      const facingLeft = this.lastKey === 'a' || this.lastKey === 'ArrowLeft' ||
        (this.lastKey === '' && this.defaultFacing === 'left');
      ctx.save();

      if (facingLeft) {
        const centerX = dx + drawWidth / 2;
        const centerY = dy + drawHeight / 2;
        ctx.translate(centerX, centerY);
        ctx.scale(-1, 1);
        ctx.translate(-centerX, -centerY);
      }

      ctx.drawImage(this.image, sx, sy, sw, sh, dx, dy, drawWidth, drawHeight);
      ctx.restore();
    } else {
      ctx.fillStyle = this.color;
      ctx.fillRect(this.position.x, this.position.y, this.width, this.height);
    }

    ctx.strokeStyle = 'white';
    ctx.lineWidth = 1;
    ctx.strokeRect(this.position.x, this.position.y, this.width, this.height);

    if (this.isAttacking) {
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 2;
      ctx.strokeRect(
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

    if (this.position.y + this.height >= floorY()) {
      this.position.y = floorY() - this.height;
      this.velocity.y = 0;
    } else {
      this.velocity.y += CONFIG.gravity;
    }

    this.position.x = Math.max(0, Math.min(canvas.width - this.width, this.position.x));
    if (this.position.x <= 0 || this.position.x + this.width >= canvas.width) {
      this.velocity.x = 0;
    }

    if (this.image?.complete && this.totalFrames != null) {
      this.frameTimer = (this.frameTimer ?? 0) + 16;
      if (this.frameTimer >= this.frameInterval) {
        this.frameTimer = 0;
        this.currentFrame = ((this.currentFrame ?? 0) + 1) % this.totalFrames;
      }
    }
    updateUI();
  }

  attack() {
    this.isAttacking = true;
    this.attackHitRegistered = false;
    setTimeout(() => {
      this.isAttacking = false;
      this.attackHitRegistered = false;
    }, CONFIG.game.attackDuration);
  }

  block() {
    this.isBlocking = true;
  }

  reset() {
    this.isAttacking = false;
    this.attackHitRegistered = false;
    this.isBlocking = false;
    this.lastKey = '';
  }
}

// -----------------------------------------------------------------------------
// FIGHTER - Player/Enemy with attack box
// Per-instance crop/animation overrides supported
// -----------------------------------------------------------------------------

class Fighter extends Sprite {
  static defaultImageSettings = {
    totalFrames: 6,
    frameWidth: 128,
    frameHeight: 128,
    cropLeft: 30,
    cropRight: 25,
    cropTop: 10,
    cropBottom: 0,
    frameOffsetX: 0,
    frameOffsetY: 0,
    animationSpeed: 6,
  };

  constructor(props) {
    super({ ...Fighter.defaultImageSettings, ...props });
    this.defaultAttackOffsetX = props.offset?.x ?? 0;

    if (props.jumpImgSrc) {
      this.jumpImage = new Image();
      this.jumpImage.src = props.jumpImgSrc;
      this.jumpTotalFrames = props.jumpTotalFrames ?? 10;
      this.jumpFrameWidth = props.jumpFrameWidth ?? props.frameWidth ?? 128;
      this.jumpFrameHeight = props.jumpFrameHeight ?? props.frameHeight ?? 128;
      this.jumpAnimationSpeed = props.jumpAnimationSpeed ?? 11;
      this.jumpCurrentFrame = 0;
      this.jumpFrameTimer = 0;
    } else {
      this.jumpImage = null;
    }

    if (props.walkImgSrc) {
      this.walkImage = new Image();
      this.walkImage.src = props.walkImgSrc;
      this.walkTotalFrames = props.walkTotalFrames ?? 8;
      this.walkFrameWidth = props.walkFrameWidth ?? props.frameWidth ?? 128;
      this.walkFrameHeight = props.walkFrameHeight ?? props.frameHeight ?? 128;
      this.walkAnimationSpeed = props.walkAnimationSpeed ?? 10;
      this.walkFrameOffsetX = props.walkFrameOffsetX ?? props.frameOffsetX ?? 0;
      this.walkFrameOffsetY = props.walkFrameOffsetY ?? props.frameOffsetY ?? 0;
      this.walkCurrentFrame = 0;
      this.walkFrameTimer = 0;
    } else {
      this.walkImage = null;
    }

    if (props.attackImgSrc) {
      this.attackImage = new Image();
      this.attackImage.src = props.attackImgSrc;
      this.attackTotalFrames = props.attackTotalFrames ?? 6;
      this.attackFrameWidth = props.attackFrameWidth ?? props.frameWidth ?? 128;
      this.attackFrameHeight = props.attackFrameHeight ?? props.frameHeight ?? 128;
      this.attackAnimationSpeed = props.attackAnimationSpeed ?? 60;
      this.attackFrameOffsetX = props.attackFrameOffsetX ?? props.frameOffsetX ?? 0;
      this.attackFrameOffsetY = props.attackFrameOffsetY ?? props.frameOffsetY ?? 0;
      this.attackCurrentFrame = 0;
      this.attackFrameTimer = 0;
    } else {
      this.attackImage = null;
    }
  }

  isWalking() {
    return !this.isInAir() && this.velocity.x !== 0;
  }

  isInAir() {
    return this.velocity.y !== 0 || this.position.y + this.height < floorY();
  }

  draw() {
    if (this.attackImage?.complete && this.attackImage?.naturalWidth && this.isAttacking) {
      const prevImage = this.image;
      const prevTotalFrames = this.totalFrames;
      const prevOriginalFrameWidth = this.originalFrameWidth;
      const prevOriginalFrameHeight = this.originalFrameHeight;
      const prevCroppedFrameWidth = this.croppedFrameWidth;
      const prevCroppedFrameHeight = this.croppedFrameHeight;
      const prevCurrentFrame = this.currentFrame;
      const prevFrameTimer = this.frameTimer;
      const prevFrameOffsetX = this.frameOffsetX;
      const prevFrameOffsetY = this.frameOffsetY;

      this.image = this.attackImage;
      this.totalFrames = this.attackTotalFrames;
      this.originalFrameWidth = this.attackFrameWidth;
      this.originalFrameHeight = this.attackFrameHeight;
      this.croppedFrameWidth = this.attackFrameWidth - this.cropLeft - this.cropRight;
      this.croppedFrameHeight = this.attackFrameHeight - this.cropTop - this.cropBottom;
      this.currentFrame = this.attackCurrentFrame ?? 0;
      this.frameTimer = this.attackFrameTimer ?? 0;
      this.frameOffsetX = this.attackFrameOffsetX;
      this.frameOffsetY = this.attackFrameOffsetY;

      super.draw();

      this.attackCurrentFrame = this.currentFrame;
      this.attackFrameTimer = this.frameTimer;
      this.image = prevImage;
      this.totalFrames = prevTotalFrames;
      this.originalFrameWidth = prevOriginalFrameWidth;
      this.originalFrameHeight = prevOriginalFrameHeight;
      this.croppedFrameWidth = prevCroppedFrameWidth;
      this.croppedFrameHeight = prevCroppedFrameHeight;
      this.currentFrame = prevCurrentFrame;
      this.frameTimer = prevFrameTimer;
      this.frameOffsetX = prevFrameOffsetX;
      this.frameOffsetY = prevFrameOffsetY;
    } else if (this.jumpImage?.complete && this.jumpImage?.naturalWidth && this.isInAir()) {
      const prevImage = this.image;
      const prevTotalFrames = this.totalFrames;
      const prevOriginalFrameWidth = this.originalFrameWidth;
      const prevOriginalFrameHeight = this.originalFrameHeight;
      const prevCroppedFrameWidth = this.croppedFrameWidth;
      const prevCroppedFrameHeight = this.croppedFrameHeight;
      const prevCurrentFrame = this.currentFrame;
      const prevFrameTimer = this.frameTimer;

      this.image = this.jumpImage;
      this.totalFrames = this.jumpTotalFrames;
      this.originalFrameWidth = this.jumpFrameWidth;
      this.originalFrameHeight = this.jumpFrameHeight;
      this.croppedFrameWidth = this.jumpFrameWidth - this.cropLeft - this.cropRight;
      this.croppedFrameHeight = this.jumpFrameHeight - this.cropTop - this.cropBottom;
      this.currentFrame = this.jumpCurrentFrame ?? 0;
      this.frameTimer = this.jumpFrameTimer ?? 0;

      super.draw();

      this.jumpCurrentFrame = this.currentFrame;
      this.jumpFrameTimer = this.frameTimer;
      this.image = prevImage;
      this.totalFrames = prevTotalFrames;
      this.originalFrameWidth = prevOriginalFrameWidth;
      this.originalFrameHeight = prevOriginalFrameHeight;
      this.croppedFrameWidth = prevCroppedFrameWidth;
      this.croppedFrameHeight = prevCroppedFrameHeight;
      this.currentFrame = prevCurrentFrame;
      this.frameTimer = prevFrameTimer;
    } else if (this.walkImage?.complete && this.walkImage?.naturalWidth && this.isWalking()) {
      const prevImage = this.image;
      const prevTotalFrames = this.totalFrames;
      const prevOriginalFrameWidth = this.originalFrameWidth;
      const prevOriginalFrameHeight = this.originalFrameHeight;
      const prevCroppedFrameWidth = this.croppedFrameWidth;
      const prevCroppedFrameHeight = this.croppedFrameHeight;
      const prevCurrentFrame = this.currentFrame;
      const prevFrameTimer = this.frameTimer;
      const prevFrameOffsetX = this.frameOffsetX;
      const prevFrameOffsetY = this.frameOffsetY;

      this.image = this.walkImage;
      this.totalFrames = this.walkTotalFrames;
      this.originalFrameWidth = this.walkFrameWidth;
      this.originalFrameHeight = this.walkFrameHeight;
      this.croppedFrameWidth = this.walkFrameWidth - this.cropLeft - this.cropRight;
      this.croppedFrameHeight = this.walkFrameHeight - this.cropTop - this.cropBottom;
      this.currentFrame = this.walkCurrentFrame ?? 0;
      this.frameTimer = this.walkFrameTimer ?? 0;
      this.frameOffsetX = this.walkFrameOffsetX;
      this.frameOffsetY = this.walkFrameOffsetY;

      super.draw();

      this.walkCurrentFrame = this.currentFrame;
      this.walkFrameTimer = this.frameTimer;
      this.image = prevImage;
      this.totalFrames = prevTotalFrames;
      this.originalFrameWidth = prevOriginalFrameWidth;
      this.originalFrameHeight = prevOriginalFrameHeight;
      this.croppedFrameWidth = prevCroppedFrameWidth;
      this.croppedFrameHeight = prevCroppedFrameHeight;
      this.currentFrame = prevCurrentFrame;
      this.frameTimer = prevFrameTimer;
      this.frameOffsetX = prevFrameOffsetX;
      this.frameOffsetY = prevFrameOffsetY;
    } else {
      super.draw();
    }
  }

  update() {
    super.update();

    if (this.jumpImage?.complete && this.jumpTotalFrames != null && this.isInAir()) {
      this.jumpFrameTimer = (this.jumpFrameTimer ?? 0) + 16;
      const jumpInterval = 1000 / this.jumpAnimationSpeed;
      if (this.jumpFrameTimer >= jumpInterval) {
        this.jumpFrameTimer = 0;
        const next = (this.jumpCurrentFrame ?? 0) + 1;
        this.jumpCurrentFrame = Math.min(next, this.jumpTotalFrames - 1);
      }
    } else {
      this.jumpCurrentFrame = 0;
      this.jumpFrameTimer = 0;
    }

    if (this.walkImage?.complete && this.walkTotalFrames != null && this.isWalking()) {
      this.walkFrameTimer = (this.walkFrameTimer ?? 0) + 16;
      const walkInterval = 1000 / this.walkAnimationSpeed;
      if (this.walkFrameTimer >= walkInterval) {
        this.walkFrameTimer = 0;
        this.walkCurrentFrame = ((this.walkCurrentFrame ?? 0) + 1) % this.walkTotalFrames;
      }
    } else {
      this.walkCurrentFrame = 0;
      this.walkFrameTimer = 0;
    }

    if (this.attackImage?.complete && this.attackTotalFrames != null && this.isAttacking) {
      this.attackFrameTimer = (this.attackFrameTimer ?? 0) + 16;
      const attackInterval = 1000 / this.attackAnimationSpeed;
      if (this.attackFrameTimer >= attackInterval) {
        this.attackFrameTimer = 0;
        const next = (this.attackCurrentFrame ?? 0) + 1;
        this.attackCurrentFrame = Math.min(next, this.attackTotalFrames - 1);
      }
    } else {
      this.attackCurrentFrame = 0;
      this.attackFrameTimer = 0;
    }
  }

  reset() {
    super.reset();
    this.attackBox.offset.x = this.defaultAttackOffsetX;
    this.jumpCurrentFrame = 0;
    this.jumpFrameTimer = 0;
    this.walkCurrentFrame = 0;
    this.walkFrameTimer = 0;
    this.attackCurrentFrame = 0;
    this.attackFrameTimer = 0;
  }
}

// -----------------------------------------------------------------------------
// BOOST - Powerup items (heal, rocket pack)
// Per-instance crop/animation overrides supported
// -----------------------------------------------------------------------------

class Boost extends Sprite {
  static defaultImageSettings = {
    totalFrames: 8,
    frameWidth: 128,
    frameHeight: 32,
    cropLeft: 0,
    cropRight: 0,
    cropTop: 0,
    cropBottom: 0,
    frameOffsetX: 0,
    frameOffsetY: -10,
    animationSpeed: 8,
    drawScale: 3,
    fitInBox: true,
    verticalAlign: 'center',
  };

  constructor(props) {
    super({ ...Boost.defaultImageSettings, ...props });
  }

  update() {
    this.draw();
    // Boost only advances animation, no physics
    if (this.image?.complete && this.totalFrames != null) {
      this.frameTimer = (this.frameTimer ?? 0) + 16;
      if (this.frameTimer >= this.frameInterval) {
        this.frameTimer = 0;
        this.currentFrame = ((this.currentFrame ?? 0) + 1) % this.totalFrames;
      }
    }
  }
}

// -----------------------------------------------------------------------------
// GAME ENTITIES
// -----------------------------------------------------------------------------

// No image - uses color fallback
const rocketPack = new Boost({
  position: { x: 0, y: floorY() - 50 },
  velocity: { x: 0, y: 0 },
  color: 'yellow',
  width: 50,
  height: 50,
  displayWidth: 50,
  displayHeight: 50,
  imgSrc: 'img/rocket-jump/idle.png',
  totalFrames: 8,
  frameWidth: 128,
  frameHeight: 50,
  drawScale: 3,
  fitInBox: false,
});
rocketPack.visible = false;

const healBox = new Boost({
  position: { x: 0, y: floorY() - 50 },
  velocity: { x: 0, y: 0 },
  color: 'green',
  width: 50,
  height: 50,
  displayWidth: 50,
  displayHeight: 50,
  imgSrc: 'img/healbox/idle.png',
  totalFrames: 8,
  frameWidth: 128,
  frameHeight: 50,
  drawScale: 3,
  fitInBox: false,
});

const player = new Fighter({
  position: { x: 100, y: 0 },
  velocity: { x: 0, y: 0 },
  color: 'blue',
  offset: { x: 0, y: 0 },
  width: 130,
  height: 250,
  drawScale: 1.8,
  imgSrc: 'img/Samurai/idle.png',
  jumpImgSrc: 'img/Samurai/Jump.png',
  jumpTotalFrames: 10,
  walkImgSrc: 'img/Samurai/Run.png',
  walkFrameOffsetX: -15,
  attackImgSrc: 'img/Samurai/Attack_1.png',
  attackTotalFrames: 6,
  attackAnimationSpeed: 200,
  attackFrameOffsetX: 0,
  attackFrameOffsetY: 0,
});

const enemy = new Fighter({
  position: { x: canvas.width - 190, y: 100 },
  velocity: { x: 0, y: 0 },
  color: 'red',
  offset: { x: -110, y: 0 },
  width: 130,
  height: 250,
  drawScale: 1.8,
  imgSrc: 'img/Fighter/idle.png',
  jumpImgSrc: 'img/Fighter/Jump.png',
  jumpTotalFrames: 10,
  walkImgSrc: 'img/Fighter/Run.png',
  attackImgSrc: 'img/Fighter/Attack_1.png',
  attackTotalFrames: 4,
  attackAnimationSpeed: 200,
  attackFrameOffsetX: -5,
  attackFrameOffsetY: 0,
  frameOffsetX: -5,
  frameOffsetY: 0,
  defaultFacing: 'left',
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
  if (rectsOverlap(player, enemy, true) && player.isAttacking && !player.attackHitRegistered) {
    player.attackHitRegistered = true;
    applyDamage(player, enemy, 'enemyHealth', 'playerScore', ui.playerScore);
  }

  if (rectsOverlap(enemy, player, true) && enemy.isAttacking && !enemy.attackHitRegistered) {
    enemy.attackHitRegistered = true;
    applyDamage(enemy, player, 'playerHealth', 'enemyScore', ui.enemyScore);
  }
}

function animate() {
  requestAnimationFrame(animate);

  updateParallax(player);

  if (backgroundLayers[0].complete && backgroundLayers[0].naturalHeight) {
    drawBackground();
  } else {
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  player.update();
  enemy.update();

  if (rocketPack.visible) rocketPack.update();
  if (healBox.visible) healBox.update();

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
