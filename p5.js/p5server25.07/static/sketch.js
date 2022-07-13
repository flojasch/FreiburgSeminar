const socket = io();
let score = 0;
let lives = 4;
let text;
let tienumber = 0;
let xwingnumber = 0;

let entities = {};

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
let img, xwing, metall, fire, tie, lasersound, bombsound;
let alphax = 0,
  alphay = 0,
  speed = 0;
let start = false;
const amax = Math.PI / 4;
const da = 0.1;


function setup() {
  fire = loadImage('static/images/explosion.jpg');
  img = loadImage('static/images/earth.jpg');
  xwing = loadModel('static/models/xwing.obj', true);
  tie = loadModel('static/models/tie.obj', true);
  metall = loadImage('static/images/metall.jpg');
  lasersound = loadSound('static/sounds/laser.wav');
  bombsound = loadSound('static/sounds/bomb.wav');

  createCanvas(windowWidth - 20, windowHeight - 20, WEBGL);

  socket.emit('new_player');

  text = createP().position(20, 20);
  text.style('font-size', '200%');
  text.style('color', 'bbbbbb');

  ambientLight(100);
  directionalLight(200, 200, 200, 1, -1, -1);
  start = true;
}

function windowResized() {
  resizeCanvas(windowWidth - 20, windowHeight - 20);
}

socket.on('state', (data) => {
  if (start) {
    text.html('Score: ' + score + '   Lives: ' + lives +
      '  ties: ' + tienumber + '  xwings: ' + xwingnumber);
    socket.emit('movement', movement);
    background(0);

    let player = data.players[socket.id] || {};
    let pos = player.pos || {};
    Z = player.Z || {};
    Y = player.Y || {};

    let cpos = new Vec(pos.x, pos.y, pos.z);
    cpos.trans(Z, 140);
    cpos.trans(Y, -30);
    let clook = new Vec(pos.x, pos.y, pos.z);
    clook.trans(Y, -30);
    camera(cpos.x, cpos.y, cpos.z, clook.x, clook.y, clook.z, Y.x, Y.y, Y.z);

    entities['players'] = new Players(data.players);
    entities['planets'] = new Planets(data.planets);
    entities['explosions'] = new Explosions(data.explosions);
    entities['projectiles'] = new Projectiles(data.projectiles);

    for (let entity in entities) {
      entities[entity].show();
    }
  }
});

function transform(pos, Z, Y) {
  translate(pos.x, pos.y, pos.z);
  let alpha = 0;
  let beta = 0;
  let gamma = -PI;
  let r = sqrt(Z.x ** 2 + Z.y ** 2);
  if (r != 0) {
    beta = acos(Z.z);
    let ca = Z.x / r;
    let sa = Z.y / r;
    alpha = acos(ca);
    gamma = acos(Y.x * sa - Y.y * ca);
    if (Z.y < 0) {
      alpha = 2 * PI - alpha;
    }
    if (Y.z > 0) {
      gamma = 2 * PI - gamma;
    }
  }
  rotateZ(alpha);
  rotateY(beta);
  rotateZ(gamma);
  rotateZ(PI);
  rotateX(PI / 2);
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