const canvas = document.getElementById('canvas');
const c = canvas.getContext('2d');
const gravity = 0.7;
canvas.width = 1440;
canvas.height = 980;
c.fillRect(0, 0, canvas.width, canvas.height);
//UI Elements
const playerHealthBar = document.querySelector('.player1-health-bar');
const enemyHealthBar = document.querySelector('.player2-health-bar');
const playerScoreElement = document.querySelector('.player2-score');
const enemyScoreElement = document.querySelector('.player1-score');
const currentTimeElement = document.querySelector('.timer');
const initialTime = 80;
currentTime = initialTime;
playerHealth = 100;
enemyHealth = 100;
playerScore = 0;
enemyScore = 0;
playerScoreElement.textContent = playerScore;
enemyScoreElement.textContent = enemyScore;
currentTimeElement.innerText = currentTime;
playerIsWon = false;
enemyIsWon = false;
roketPackActive = false;

//Timer
let runEverySecond;
function startTimer() {
  currentTime = initialTime;
  runEverySecond = setInterval(() => {
    currentTime--;
    currentTimeElement.innerText = currentTime;
    if ( Math.random() < 0.1 && healBox.visible === false) {
      healBox.position.x = Math.random() * (canvas.width - 25);
      healBox.visible = true;
    }
    if ( Math.random() < 0.1 && roketPack.visible === false) {
      roketPack.position.x = Math.random() * (canvas.width - 30);
      roketPack.visible = true;
    }
    if (currentTime <= 0) {
      clearInterval(runEverySecond);
      if (playerHealth < enemyHealth) {
        playerScore++;
        playerScoreElement.textContent = playerScore;
        reset();
      } else if (enemyHealth < playerHealth) {
        enemyScore++;
        enemyScoreElement.textContent = enemyScore;
        reset();
      } else {
        setTimeout(() => {
          console.log('Tie');
          reset();
        }, 1000);
        
      }
      clearInterval(runEverySecond);
    }
  }, 1000);
}

startTimer();

function reset() {
  clearInterval(runEverySecond);
  playerHealth = 100;
  enemyHealth = 100;
  currentTime = initialTime;
  player.position.x = 0 + player.width + 50;
  player.position.y = canvas.height - player.height;
  enemy.position.x = canvas.width - enemy.width - 100;
  enemy.position.y = canvas.height - enemy.height;
  player.velocity.x = 0;
  enemy.velocity.x = 0;
  player.isAttacking = false;
  enemy.isAttacking = false;
  player.attackBox.offset.x = 0;
  enemy.attackBox.offset.x = 0;
  player.lastKey = '';
  enemy.lastKey = '';
  currentTimeElement.innerText = currentTime;
  if (playerScore < 3 && enemyScore < 3)  {
    setTimeout(() => startTimer(), 0);  // Defer to next event loop tick
  } else {
    clearInterval(runEverySecond);
  }
}


function won() {
  clearInterval(runEverySecond);
  if (playerIsWon) {
    alert('Player Won');
    playerIsWon = false;
  } else if (enemyIsWon) {
    alert('Enemy Won');
    enemyIsWon = false;
  }
  playerScoreElement.textContent = playerScore;
  enemyScoreElement.textContent = enemyScore;
  reset();
}

function critChance() {
  let crit = Math.random() < 0.2 ? (1.1 + Math.random() * 1.4) : 1;
  console.log('dmg ', crit);
  return crit;
}


class Sprite {
  constructor({position, velocity, color, offset, height, width  }) {
    this.position = position;
    this.velocity = velocity;
    this.height = height;
    this.width = width;
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
  block() {
    this.isBlocking = true;
  }
}

const roketPack = new Sprite({
  position: { x: Math.random() * (canvas.width - 60), y: canvas.height - 70 },
  velocity: { x: 0, y: 0 },
  color: 'yellow',
  height: 70,
  width: 60
});
roketPack.visible = false;

const healBox = new Sprite({
  position: { x: Math.random() * (canvas.width - 50), y: canvas.height - 50 },
  velocity: { x: 0, y: 0 },
  color: 'green',
  height: 50,
  width: 50,
});
healBox.visible = false;

const player = new Sprite({
  position: { x: 0+100, y: 0 },
  velocity: { x: 0, y: 0 },
  color: 'blue',
  offset: { x: 0, y: 0 },
  height: 150,
  width: 50,
});

const enemy = new Sprite({
  position: { x: 1440-150, y: 100},
  velocity: { x: 0, y: 0 },
  color: 'red',
  offset: { x: -50, y: 0 },
  height: 150,
  width: 50,
});

healBox.draw();
player.draw();
enemy.draw();
roketPack.draw();

function animate() {
  window.requestAnimationFrame(animate);
  c.fillStyle = 'black';
  c.fillRect(0, 0, canvas.width, canvas.height);
  player.update();
  enemy.update();
  if (roketPack.visible) {
    roketPack.draw();
  }
  if (healBox.visible) {
    healBox.draw();
  }
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


  if (roketPack.visible && roketPackCollision({ rectangle1: player, rectangle2: roketPack })) {
    console.log('roket pack hit by Player');
    roketPack.visible = false;
    roketPackActive = true;
  }
  if (roketPack.visible && roketPackCollision({ rectangle1: enemy, rectangle2: roketPack })) {
    console.log('roket pack hit by Enemy');
    roketPack.visible = false;
    roketPackActive = true;
  }

  if (healBox.visible && healBoxCollision({ rectangle1: player, rectangle2: healBox })) {
    console.log('heal box hit by Player');
    playerHealth = Math.min(playerHealth + 35, 100);
    healBox.visible = false;
  }
  if (healBox.visible && healBoxCollision({ rectangle1: enemy, rectangle2: healBox })) {
    console.log('heal box hit by Enemy');
    enemyHealth = Math.min(enemyHealth + 35, 100);
    healBox.visible = false;
  }
  

  //player attack boxdetect collision
  if (
    rectangleCollision({rectangle1: player, rectangle2: enemy}) &&
    player.isAttacking
  ) 
  {
    player.isAttacking = false;
    console.log('enemy hit');
    let damage = 10 * critChance();
    if (enemy.isBlocking) {
      damage *= 0.1;
      console.log('enemy is blocking, damage reduced to ', damage);
    } else {
      enemyHealth -= damage;
      console.log('enemy hit for ', damage, 'damage');
    }
    
    if (enemyHealth <= 0) {
      enemyScore++;
      enemyScoreElement.textContent = enemyScore;
      reset();
      if (enemyScore >= 3) {
        playerIsWon = true;
        won();
      } 
      console.log('Enemy Score: ', enemyScore);
      
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
    let damage = 10 * critChance();
    if (player.isBlocking) {
      damage *= 0.1;
      console.log('player is blocking, damage reduced to ', damage);
    } else {
      playerHealth -= damage;
      console.log('player hit for ', damage, 'damage');
    }
    playerHealth -= damage;
    if (playerHealth <= 0) {
      playerScore++;
      playerScoreElement.textContent = playerScore;
      reset();
      if (playerScore >= 3) {
        enemyIsWon = true;
        won();
      }
      console.log('Player Score: ', playerScore);
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
  s: {
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
  },
  slash: {
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

function roketPackCollision({ rectangle1, rectangle2 }) {
  return (
    rectangle1.position.x + rectangle1.width >= rectangle2.position.x &&
    rectangle2.position.x + rectangle2.width >= rectangle1.position.x &&
    rectangle1.position.y + rectangle1.height >= rectangle2.position.y &&
    rectangle2.position.y + rectangle2.height >= rectangle1.position.y
  )
}

function healBoxCollision({ rectangle1, rectangle2 }) {
  return (
    rectangle1.position.x + rectangle1.width >= rectangle2.position.x &&
    rectangle2.position.x + rectangle2.width >= rectangle1.position.x &&
    rectangle1.position.y + rectangle1.height >= rectangle2.position.y &&
    rectangle2.position.y + rectangle2.height >= rectangle1.position.y
  )
}

animate();
window.addEventListener('keydown', (event) => {
  switch (event.key) {
    //Player keys
    case 's':
      player.block();
      console.log('player is blocking');
      break
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
      } else if (roketPackActive) {
        player.velocity.y = -25;
        roketPackActive = false;
      }
      break

    //Enemy keys
    case '/':
      enemy.attack();
      break
    case 'ArrowDown':
      enemy.block();
      console.log('enemy is blocking');
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
      } else if (roketPackActive) {
        enemy.velocity.y = -25;
        roketPackActive = false;   
      }
      break
  }
})
window.addEventListener('keyup', (event) => {
  switch (event.key) {
    //Player keys
    case 's':
      player.isBlocking = false;
      console.log('player is not blocking');
      break
    case 'd':
      keys.d.pressed = false
      break
    case 'a':
      keys.a.pressed = false
      break

    //Enemy keys
    case 'ArrowDown':
      enemy.isBlocking = false;
      console.log('enemy is not blocking');
      break
    case 'ArrowRight':
      keys.ArrowRight.pressed = false
      break
    case 'ArrowLeft':
      keys.ArrowLeft.pressed = false
      break
  }
})


