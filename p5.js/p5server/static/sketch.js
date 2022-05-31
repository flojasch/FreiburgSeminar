const socket = io();
let score = 0;
let lives = 4;
let text;

let planets = [];
let projectiles = [];
let movement = {
  up: false,
  down: false,
  left: false,
  right: false,
  forward: false,
  backward: false,
  tleft: false,
  tright: false,
  projectile: false,
}
let img, xwing, metall;
let alphax = 0,
  alphay = 0,
  speed = 0;
let start = false;
const amax = Math.PI / 4;
const da = 0.1;
let yoffset, zoffset;


function setup() {
  img = loadImage('static/images/earth.jpg');
  xwing = loadModel('static/models/xwing.obj', true);
  metall = loadImage('static/images/metall.jpg');
  lasersound = loadSound('static/laser.wav');
  createCanvas(windowWidth - 20, windowHeight - 20, WEBGL);
  yoffset=0;
  zoffset=-width/10;
  socket.emit('new_player');
  text = createP().position(20, 20);
  text.style('font-size', '200%');
  text.style('color', 'bbbbbb');
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      for (let k = 0; k < 4; k++) {
        let shift = 250;
        let earth = new Planet(300 * i - shift, 300 * j - shift, 300 * k - shift, 30);
        planets.push(earth);
      }
    }
  }
  ambientLight(100);
  directionalLight(200, 200, 200, 1, -1, -1);
  start = true;
}

function windowResized() {
  resizeCanvas(windowWidth - 20, windowHeight - 20);
}

document.addEventListener('keydown', (event) => {
  switch (event.keyCode) {
    case 37: // keyleft
      movement.left = true;
      break;
    case 38: // keyup
      movement.up = true;
      break;
    case 39: // keyright
      movement.right = true;
      break;
    case 40: // keydown
      movement.down = true;
      break;
    case 65: // a
      movement.tleft = true;
      break;
    case 68: //d
      movement.tright = true;
      break;
    case 87: //w
      movement.forward = true;
      break;
    case 83: //s
      movement.backward = true;
      break;
    case 32: //space
      movement.projectile = true;
      lasersound.play();
      break;
  }
});
document.addEventListener('keyup', (event) => {
  switch (event.keyCode) {
    case 37: // keyleft
      movement.left = false;
      break;
    case 38: // keyup
      movement.up = false;
      break;
    case 39: // keyright
      movement.right = false;
      break;
    case 40: // keydown
      movement.down = false;
      break;
    case 65: // a
      movement.tleft = false;
      break;
    case 68: //d
      movement.tright = false;
      break;
    case 87: //w
      movement.forward = false;
      break;
    case 83: //s
      movement.backward = false;
      break;
    case 32: //space
      movement.projectile = true;
      break;

  }
});

socket.on('projectile', (proj) => {
  let projectile = new Projectile(proj);
  projectiles.push(projectile);
  movement.projectile = false;
});

socket.on('state', (players) => {
  if (start) {
    text.html('Score: ' + score + '   Lives: ' + lives);
    socket.emit('movement', movement);
    background(0);
    showPlayer();
    rotateModel();
    const player = players[socket.id] || {};
    const pos = player.pos || {};
    const Z = player.Z || {};
    const Y = player.Y || {};
    camera(Z.x, Z.y, Z.z, 0, 0, 0, Y.x, Y.y, Y.z);
    translate(pos.x, pos.y, pos.z);
    for (let planet of planets) {
      planet.show();
    }
    updateProjectiles();
    showOthers(players);
  }
});

function updateProjectiles() {
  for (let i = 0; i < projectiles.length; i++) {
    let p = projectiles[i];
    p.update();
    p.show();
  }
}

function showOthers(players) {
  for (let id in players) {
    if (id != socket.id) {
      const pos = players[id].pos;
      const Z = players[id].Z;
      push();
      transform(pos, Z);
      scale(0.5);
      texture(metall);
      model(xwing);
      pop();
    }
  }
}

function transform(pos, Z) {
  translate(-pos.x, -pos.y, -pos.z);
  let r = sqrt(Z.x * Z.x + Z.z * Z.z);
  let xAngle = asin(Z.y);
  let yAngle = acos(Z.z / r);
  if (Z.x < 0) yAngle *= -1;
  rotateY(yAngle);
  rotateX(-xAngle);
  rotateX(PI / 2);
}

function rotateModel() {
  if (movement.left)
    if (alphay > -amax) alphay -= da;
  if (movement.right)
    if (alphay < amax) alphay += da;
  if (movement.up)
    if (alphax > -amax) alphax -= da;
  if (movement.down)
    if (alphax < amax) alphax += da;
  if (!movement.up && !movement.down) alphax *= 0.85;
  if (!movement.left && !movement.right) alphay *= 0.85;
}

function showPlayer() {
  camera(0, 0, 1, 0, 0, 0, 0, 1, 0);
  push();
  translate(0, yoffset, zoffset);
  scale(0.2);
  texture(metall);
  rotateX(PI / 2);
  rotateX(alphax);
  rotateY(alphay);
  model(xwing);
  pop();
}

class Planet {
  constructor(x, y, z, r) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.r = r;
  }
  show() {
    push();
    translate(this.x, this.y, this.z);
    rotateY(millis() / 1000);
    texture(img);
    noStroke();
    sphere(this.r);
    pop();
  }
}

class Projectile {
  constructor(proj) {
    this.pos = proj.pos;
    this.speed = 20;
    this.Z = proj.Z;
    this.id = proj.id;
  }
  show() {
    push();
    transform(this.pos, this.Z);
    noStroke();
    fill(color('magenta'));
    cylinder(1, 80);
    pop();
  }
  update() {
    this.pos.x += this.speed * this.Z.x;
    this.pos.y += this.speed * this.Z.y;
    this.pos.z += this.speed * this.Z.z;
  }
}