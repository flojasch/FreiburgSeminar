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
  movement.projectile = false;
});
socket.on('score', (id) => {
  if (id == socket.id) score += 100;
})

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

    showPlanets();
    showProjectiles();
    showPlayers(players);

  }
});

function showPlanets() {
  for (let i = 0; i < planets.length; i++) {
    planets[i].show();
    if (planets[i].isHit()) {
      planets.splice(i, 1);
    }
  }
}

function showProjectiles() {
  for (let i = 0; i < projectiles.length; i++) {
    let p = projectiles[i];
    p.update();
    p.show();
  }
}

function showPlayers(players) {
  rotateModel();
  for (let id in players) {
    push();
    transform(players[id].pos, players[id].Z, players[id].Y);
    scale(0.5);
    texture(metall);
    if (id == socket.id) {
      if (isHit(players[id])) {
        lives--;
        if (lives <= 0) {
          socket.emit('playerdied');
          start = false;
          text.style('font-size', '600%');
          text.style('color', 'bb0000');
          text.html('Game Over');
        }
      }
      rotateX(alphax);
      rotateY(alphay);
    }
    model(xwing);
    pop();
  }
}

function isHit(player) {
  for (let proj of projectiles) {
    let pos = new Vec(player.pos.x, player.pos.y, player.pos.z);
    if (pos.dist(proj.pos) < 10) {
      bombsound.play();
      socket.emit('score', proj.id);
      return true;
    }
  }
  return false;
}

function transform(pos, Z, Y) {
  translate(pos.x, pos.y, pos.z);
  let rr = (Z.x ** 2 + Z.z ** 2);
  let r = sqrt(rr);
  let Ry=sqrt(Y.x**2+Y.y**2+Y.z**2);
  let rh = r*sqrt(Z.y**2 + rr);
  let sp = (Y.y * rr-(Z.x * Y.x + Z.z * Y.z)*Z.y);
  let zAngle = acos(min(1,sp / (Ry * rh)));
  console.log(zAngle / PI, sp/(Ry*rh));

  if (Y.x > 0) zAngle *= -1;

  let R = sqrt(Z.x ** 2 + Z.y ** 2 + Z.z ** 2);
  let xAngle = acos(r / R);
  if (Z.y > 0) xAngle *= -1;
  let yAngle = acos(Z.z / r);
  if (Z.x < 0) yAngle *= -1;
  rotateY(yAngle);
  rotateX(xAngle);
  rotateZ(zAngle);
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
  isHit() {
    for (let proj of projectiles) {
      if (this.pos.dist(proj.pos) < this.r) {
        bombsound.play();
        return true;
      }
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
    transform(this.pos, this.Z, new Vec(0, 1, 0));
    noStroke();
    fill(color('magenta'));
    cylinder(1, 80);
    pop();
  }
  update() {
    this.pos.trans(this.Z, this.speed);
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
  dist(v) {
    let rr = (v.x - this.x) ** 2 + (v.y - this.y) ** 2 + (v.z - this.z) ** 2;
    return Math.sqrt(rr);
  }
  copy() {
    return new Vec(this.x, this.y, this.z);
  }
}