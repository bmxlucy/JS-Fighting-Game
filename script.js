const canvas = document.getElementById('canvas');
const c = canvas.getContext('2d');
canvas.width = 1024;
canvas.height = 576;
c.fillRect(0, 0, canvas.width, canvas.height);
const gravity = 0.2;

class Sprite {
  constructor({position, velocity}) {
    this.position = position;
    this.velocity = velocity;
    this.height = 150;
    this.width = 50;
    this.lastKey = '';
  }
  draw() {
    c.fillStyle = 'red';
    c.fillRect(this.position.x, this.position.y, this.width, this.height)
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
  velocity: { x: 0, y: 10 }
});

const enemy = new Sprite({
  position: { x: 400, y: 100},
  velocity: { x: 0, y: 0 }
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
    player.velocity.x = -1;
  } 
  else if (keys.d.pressed && player.lastKey === 'd') {
    player.velocity.x = 1;
  } else {
    player.velocity.x = 0;
  }
  //Enemy movement
  if (keys.ArrowRight.pressed && enemy.lastKey === 'ArrowRight') {
    enemy.velocity.x = 1;
  } 
  else if (keys.ArrowLeft.pressed && enemy.lastKey === 'ArrowLeft') {
    enemy.velocity.x = -1;
  } else {
    enemy.velocity.x = 0;
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
let lastKey = '';

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
      player.velocity.y = -10
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
      enemy.velocity.y = -10
      break
  }
  console.log(event.key);
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