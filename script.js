const canvas = document.getElementById('canvas');
const c = canvas.getContext('2d');
canvas.width = 1440;
canvas.height = 980;
c.fillRect(0, 0, canvas.width, canvas.height);
const gravity = 0.7;

//UI Elements

const playerHealthBar = document.querySelector('.player1-health-bar');
const enemyHealthBar = document.querySelector('.player2-health-bar');
const playerScoreElement = document.querySelector('.player2-score');
const enemyScoreElement = document.querySelector('.player1-score');
const currentTimeElement = document.querySelector('.timer');
currentTime = 180;
playerHealth = 100;
enemyHealth = 100;
playerScore = 0;
enemyScore = 0;
playerScoreElement.textContent = playerScore;
enemyScoreElement.textContent = enemyScore;
currentTimeElement.innerText = currentTime;
playerIsWon = false;
enemyIsWon = false;

//Timer
const runEverySecond = setInterval(() => {
  currentTime--;
  currentTimeElement.innerText = currentTime;
  
  if (currentTime <= 0) {
    clearInterval(runEverySecond);
  }
}, 1000);


function won() {
  if (playerIsWon) {
    alert('Player Won');
    playerIsWon = false;
  } else if (enemyIsWon) {
    alert('Enemy Won');
    enemyIsWon = false;
  }
  playerScore = 0;
  enemyScore = 0;
  playerHealth = 100;
  enemyHealth = 100;
  playerScoreElement.textContent = playerScore;
  enemyScoreElement.textContent = enemyScore;
}


class Sprite {
  constructor({position, velocity, color, offset}) {
    this.position = position;
    this.velocity = velocity;
    this.height = 150;
    this.width = 50;
    this.lastKey = '';
    this.color = color;
    this.attackBox = {
      position: {
        x: this.position.x,
        y: this.position.y
      },
      offset,
      width: 100,
      height: 50,
    }
    this.isAttacking = false;
  }

  draw() {
    c.fillStyle = this.color;
    c.fillRect(this.position.x, this.position.y, this.width, this.height)

    //attack box
    if (this.isAttacking) {
      c.fillStyle = 'green';
      c.fillRect(
        this.attackBox.position.x, 
        this.attackBox.position.y, 
        this.attackBox.width, 
        this.attackBox.height
      )
    }
  }

  update() {
    this.draw();
    this.attackBox.position.x = this.position.x + this.attackBox.offset.x;
    this.attackBox.position.y = this.position.y - this.attackBox.offset.y;
    this.position.y += this.velocity.y;
    this.position.x += this.velocity.x;
    enemyHealthBar.style.width = `${enemyHealth}%`;
    playerHealthBar.style.width = `${playerHealth}%`;
    if (this.position.y + this.height >= canvas.height) {
      this.position.y = canvas.height - this.height;
      this.velocity.y = 0;
    } else {
      this.velocity.y += gravity;
    }
    if (this.position.x + this.width >= canvas.width || this.position.x <= 0) {
      this.position.x = Math.max(0, Math.min(canvas.width - this.width, this.position.x));
      this.velocity.x = 0;
    }
  }
  attack() {
    this.isAttacking = true;
    setTimeout(() => {
      this.isAttacking = false;
    }, 100)
  }
}

const player = new Sprite({
  position: { x: 0+100, y: 0 },
  velocity: { x: 0, y: 0 },
  color: 'blue',
  offset: { x: 0, y: 0 }
});

const enemy = new Sprite({
  position: { x: 1440-150, y: 100},
  velocity: { x: 0, y: 0 },
  color: 'red',
  offset: { x: -50, y: 0 }
});

player.draw();
enemy.draw();

function animate() {
  window.requestAnimationFrame(animate);
  c.fillStyle = 'black';
  c.fillRect(0, 0, canvas.width, canvas.height);
  player.update();
  enemy.update();
  //Player movement
  if (keys.a.pressed && player.lastKey === 'a') {
    player.attackBox.offset.x = -player.attackBox.width + player.width;
    player.velocity.x = -5;
  } 
  else if (keys.d.pressed && player.lastKey === 'd') {
    player.attackBox.offset.x = 0;
    player.velocity.x = 5;
  } else {
    player.velocity.x = 0;
  }
  //Enemy movement
  if (keys.ArrowRight.pressed && enemy.lastKey === 'ArrowRight') {
    enemy.attackBox.offset.x = 0;
    enemy.velocity.x = 5;
  } 
  else if (keys.ArrowLeft.pressed && enemy.lastKey === 'ArrowLeft') {
    enemy.attackBox.offset.x = -enemy.attackBox.width + enemy.width;
    enemy.velocity.x = -5;
  } else {
    enemy.velocity.x = 0;
  }

  //player attack boxdetect collision
  if (
    rectangleCollision({rectangle1: player, rectangle2: enemy}) &&
    player.isAttacking
  ) 
  {
    player.isAttacking = false;
    console.log('enemy hit');
    enemyHealth -= 10;
    if (enemyHealth <= 0) {
      enemyScore++;
      enemyScoreElement.textContent = enemyScore;
      if (enemyScore >= 3) {
        playerIsWon = true;
        won();
      }
      console.log('Enemy Score: ', enemyScore);
      enemyHealth = 100;
    }
  }
  //enemy attack box detect collision
  if (
    rectangleCollision({rectangle1: enemy, rectangle2: player}) &&
    enemy.isAttacking
  ) 
  {
    enemy.isAttacking = false;
    console.log('player hit');
    playerHealth -= 10;
    if (playerHealth <= 0) {
      playerScore++;
      playerScoreElement.textContent = playerScore;
      if (playerScore >= 3) {
        enemyIsWon = true;
        won();
      }
      console.log('Player Score: ', playerScore);
      playerHealth = 100;
    }
  }
}



const keys = {
  a: {
    pressed: false
  },
  d: {
    pressed: false
  },
  w: {
    pressed: false
  },
  ArrowRight: {
    pressed: false
  },
  ArrowLeft: {
    pressed: false
  },
  ArrowUp: {
    pressed: false
  }
}

function rectangleCollision({ rectangle1, rectangle2 }) {
  return (
    rectangle1.attackBox.position.x + rectangle1.attackBox.width >= rectangle2.position.x &&
    rectangle2.position.x + rectangle2.width >= rectangle1.attackBox.position.x &&
    rectangle1.attackBox.position.y + rectangle1.attackBox.height >= rectangle2.position.y &&
    rectangle2.position.y + rectangle2.height >= rectangle1.attackBox.position.y
  )
}

animate();
window.addEventListener('keydown', (event) => {
  switch (event.key) {
    //Player keys
    case ' ':
      player.attack();
      break
    case 'd':
      keys.d.pressed = true
      player.lastKey = 'd';
      break
    case 'a':
      keys.a.pressed = true
      player.lastKey = 'a';
      break
    case 'w':
      if (player.velocity.y === 0) {
        player.velocity.y = -20
      }
      break

    //Enemy keys
    case 'ArrowDown':
      enemy.attack();
      break
    case 'ArrowRight':
      keys.ArrowRight.pressed = true
      enemy.lastKey = 'ArrowRight';
      break
    case 'ArrowLeft':
      keys.ArrowLeft.pressed = true
      enemy.lastKey = 'ArrowLeft';
      break
    case 'ArrowUp':
      if (enemy.velocity.y === 0) {
        enemy.velocity.y = -20
      }
      break
  }
})
window.addEventListener('keyup', (event) => {
  switch (event.key) {
    //Player keys
    case 'd':
      keys.d.pressed = false
      break
    case 'a':
      keys.a.pressed = false
      break

    //Enemy keys
    case 'ArrowRight':
      keys.ArrowRight.pressed = false
      break
    case 'ArrowLeft':
      keys.ArrowLeft.pressed = false
      break
  }
})


