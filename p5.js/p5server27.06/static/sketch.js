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



function setup() {
  img = loadImage('static/images/earth.jpg');
  xwing = loadModel('static/models/xwing.obj', true);
  metall = loadImage('static/images/metall.jpg');
  lasersound = loadSound('static/laser.wav');
  bombsound = loadSound('static/bomb.wav');

  createCanvas(windowWidth - 20, windowHeight - 20, WEBGL);

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
      movement.projectile = false;
      break;

  }
});

socket.on('projectile', (proj) => {
  let projectile = new Projectile(proj);
  projectiles.push(projectile);
});

socket.on('state', (players) => {
  if (start) {
    text.html('Score: ' + score + '   Lives: ' + lives);
    socket.emit('movement', movement);
    background(0);
    let player = players[socket.id] || {};
    let pos = player.pos || {};
    Z = player.Z || {};
    Y = player.Y || {};

    let cpos = new Vec(pos.x, pos.y, pos.z);
    cpos.trans(Z, 140);
    cpos.trans(Y, -30);
    let clook = new Vec(pos.x, pos.y, pos.z);
    clook.trans(Y, -30);
    camera(cpos.x, cpos.y, cpos.z, clook.x, clook.y, clook.z, Y.x, Y.y, Y.z);

    for (let i = 0; i < planets.length; i++) {
      planets[i].update();
      if (planets[i].isHit()) {
        bombsound.play();
        planets.splice(i, 1);
      }
    }
    for (let projectile of projectiles) {
      projectile.update();
    }

    updatePlayers(players);
  }
});

function updatePlayers(players) {
  rotateModel();
  for (let id in players) {
    push();
    transform(players[id].pos, players[id].Z);
    scale(0.5);
    texture(metall);
    if (id == socket.id) {
      rotateX(alphax);
      rotateY(alphay);
    }
    model(xwing);
    pop();
  }
}

function transform(pos, Z) {
  translate(pos.x, pos.y, pos.z);
  let r = sqrt(Z.x * Z.x + Z.z * Z.z);
  let R = sqrt(Z.x * Z.x + Z.y * Z.y + Z.z * Z.z);
  let xAngle = acos(r / R);
  if (Z.y < 0) xAngle *= -1;
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

class Planet {
  constructor(x, y, z, r) {
    this.pos = new Vec(x, y, z);
    this.r = r;
  }
  show() {
    push();
    translate(this.pos.x, this.pos.y, this.pos.z);
    rotateY(millis() / 1000);
    texture(img);
    noStroke();
    sphere(this.r);
    pop();
  }
  update() {
    this.show();
  }
  isHit() {
    for (let projectile of projectiles) {
      if (this.pos.dist(projectile.pos) < this.r)
        return true;
    }
    return false;
  }
}

class Projectile {
  constructor(proj) {
    this.pos = new Vec(proj.pos.x, proj.pos.y, proj.pos.z);
    this.speed = -20;
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
    this.pos.trans(this.Z, this.speed);
    this.show();
  }
}

class Vec {
  constructor(x, y, z) {
    this.x = x;
    this.y = y;
    this.z = z;
  }
  //rotation um einen kleinen Winkel da
  rot(n, da) {
    let dx = (n.y * this.z - n.z * this.y) * da;
    let dy = (n.z * this.x - n.x * this.z) * da;
    let dz = (n.x * this.y - n.y * this.x) * da;
    this.x += dx;
    this.y += dy;
    this.z += dz;
  }
  trans(v, t) {
    this.x += v.x * t;
    this.y += v.y * t;
    this.z += v.z * t;
  }
  copy() {
    return new Vec(this.x, this.y, this.z);
  }
  dist(v) {
    let rr = (this.x - v.x) * (this.x - v.x) + (this.y - v.y) * (this.y - v.y) + (this.z - v.z) * (this.z - v.z);
    return Math.sqrt(rr)
  }
}