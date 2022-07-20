const socket = io();
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
let start = false;

function setup() {
  fire = loadImage('static/images/explosion.jpg');
  img = loadImage('static/images/earth.jpg');
  xwing = loadModel('static/models/xwing.obj', true);
  tie = loadModel('static/models/tie.obj', true);
  metall = loadImage('static/images/metall.jpg');
  lasersound = loadSound('static/sounds/laser.wav');
  bombsound = loadSound('static/sounds/bomb.wav');

  createCanvas(windowWidth - 20, windowHeight - 20, WEBGL);
  text = createP().position(20, 20);

  ambientLight(100);
  directionalLight(200, 200, 200, 1, -1, -1);
  entities['players'].push(new Players());
  entities['planets'].push(new Planets());
  entities['explosions'].push(new Explosions());
  entities['projectiles'].push(new Projectiles());
  socket.emit('new_player');
  start = true;
}

function windowResized() {
  resizeCanvas(windowWidth - 20, windowHeight - 20);
}

socket.on('state', (data) => {
  if (start) {
    background(0);
    for (let entity in entities) {
      entities[entity].update(data[entity]);
      entities[entity].show();
    }
    let player = entities['players'].get(socket.id);
    if (player != undefined) {
      Z = player.Z;
      Y = player.Y;

      let cpos = player.pos.copy();
      cpos.trans(Z, 140);
      cpos.trans(Y, -30);
      let clook = player.pos.copy();
      clook.trans(Y, -30);
      camera(cpos.x, cpos.y, cpos.z, clook.x, clook.y, clook.z, Y.x, Y.y, Y.z);

      setText(player);

      socket.emit('movement', movement);
    }

  }
});

function setText(player) {
  if (player.lives <= 0) {
    text.style('font-size', '600%');
    text.style('color', 'bb0000');
    text.html('Game Over');
  } else {
    text.style('font-size', '200%');
    text.style('color', 'bbbbbb');
    text.html('Score: ' + player.score + '   Health: ' + player.lives +
      '  ties: ' + entities['players'].tienum + '  xwings: ' + entities['players'].xwingnum);

  }
}

function transform(pos, Z, Y) {
  translate(pos.x, pos.y, pos.z);
  let alpha = 0;
  let beta = 0;
  let gamma = -PI;
  let r = Math.sqrt(Z.x ** 2 + Z.y ** 2);
  if (r != 0) {
    beta = Math.acos(Z.z);
    let ca = Z.x / r;
    let sa = Z.y / r;
    alpha = Math.acos(ca);
    gamma = Math.acos(Y.x * sa - Y.y * ca);
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