const socket = io();
let planets = [];
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
  createCanvas(windowWidth - 30, windowHeight - 30, WEBGL);
  socket.emit('new_player');
  
  for (let i = 0; i < 6; i++) {
    for (let j = 0; j < 6; j++) {
      for (let k = 0; k < 6; k++) {
        let shift = 250;
        let earth = new Planet(100 * i - shift, 100 * j - shift, 100 * k - shift, 30);
        planets.push(earth);
      }
    }
  }
  ambientLight(100);
  directionalLight(200, 200, 200, 1, -1, -1);
  start = true;
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
      break;

  }
});

socket.on('state', (players) => {
  if (start) {
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
    showOthers(players);
  }
});

function showOthers(players) {
  for (let id in players) {
    if (id != socket.id) {
      const c = players[id];
      push();
      translate(-c.pos.x, -c.pos.y, -c.pos.z);
      const r = sqrt(c.Z.x * c.Z.x + c.Z.z * c.Z.z);
      const xAngle = asin(c.Z.y);
      let yAngle = acos(c.Z.z / r);
      if (c.Z.x < 0) yAngle *= -1;
      rotateY(yAngle);
      rotateX(-xAngle);
      scale(0.3);
      texture(metall);
      rotateX(PI / 2);
      model(xwing);
      pop();
    }
  }
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
  translate(0, height / 20, -width / 10);
  scale(0.6);
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