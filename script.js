const canvas = document.getElementById('canvas');
const c = canvas.getContext('2d');
canvas.width = 1024;
canvas.height = 576;
c.fillRect(0, 0, canvas.width, canvas.height);
const gravity = 0.7;

class Sprite {
  constructor({position, velocity, color}) {
    this.position = position;
    this.velocity = velocity;
    this.height = 150;
    this.width = 50;
    this.lastKey = '';
    this.color = color;
    this.attackBox = {
      position: this.position,
      width: 100,
      height: 50,
    }
  }
  draw() {
    c.fillStyle = this.color;
    c.fillRect(this.position.x, this.position.y, this.width, this.height)

    //attack box
    c.fillStyle = 'green';
    c.fillRect(
      this.attackBox.position.x, 
      this.attackBox.position.y, 
      this.attackBox.width, 
      this.attackBox.height
    )
  }
  update() {
    this.draw();
    this.position.y += this.velocity.y;
    this.position.x += this.velocity.x;
    if (this.position.y + this.height >= canvas.height) {
      this.velocity.y = 0;
    } else {
      this.velocity.y += gravity;
    }
  }
}

const player = new Sprite({
  position: { x: 0, y: 0 },
  velocity: { x: 0, y: 0 },
  color: 'blue'
});

const enemy = new Sprite({
  position: { x: 400, y: 100},
  velocity: { x: 0, y: 0 },
  color: 'red'
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
    player.velocity.x = -5;
  } 
  else if (keys.d.pressed && player.lastKey === 'd') {
    player.velocity.x = 5;
  } else {
    player.velocity.x = 0;
  }
  //Enemy movement
  if (keys.ArrowRight.pressed && enemy.lastKey === 'ArrowRight') {
    enemy.velocity.x = 5;
  } 
  else if (keys.ArrowLeft.pressed && enemy.lastKey === 'ArrowLeft') {
    enemy.velocity.x = -5;
  } else {
    enemy.velocity.x = 0;
  }

  //detect collision
  if (
    player.attackBox.position.x + player.attackBox.width >= enemy.position.x &&
    enemy.position.x + enemy.width >= player.attackBox.position.x &&
    player.attackBox.position.y + player.attackBox.height >= enemy.position.y &&
    enemy.position.y + enemy.height >= player.attackBox.position.y
  ) 
  {
    console.log('hit');
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

animate();
window.addEventListener('keydown', (event) => {
  switch (event.key) {
    //Player keys
    case 'd':
      keys.d.pressed = true
      player.lastKey = 'd';
      break
    case 'a':
      keys.a.pressed = true
      player.lastKey = 'a';
      break
    case 'w':
      player.velocity.y = -20
      break

    //Enemy keys
    case 'ArrowRight':
      keys.ArrowRight.pressed = true
      enemy.lastKey = 'ArrowRight';
      break
    case 'ArrowLeft':
      keys.ArrowLeft.pressed = true
      enemy.lastKey = 'ArrowLeft';
      break
    case 'ArrowUp':
      enemy.velocity.y = -20
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
  console.log(event.key);
})