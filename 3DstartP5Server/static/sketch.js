const socket = io();
let planets = [];
let X, Y, Z, pos, coords;
let img, xwing, metall;
let alphax = 0,
  alphay = 0,
  speed = 0;


function setup() {
  img = loadImage('static/images/earth.jpg');
  xwing = loadModel('static/models/xwing.obj', true);
  metall = loadImage('static/images/metall.jpg');
  createCanvas(windowWidth - 30, windowHeight - 30, WEBGL);
  X = new Vec(1, 0, 0);
  Y = new Vec(0, 1, 0);
  Z = new Vec(0, 0, 1);
  pos = new Vec(0, 0, 0);
  coords = {
    X: X,
    Y: Y,
    Z: Z,
    pos: pos,
  };
  socket.emit('new_player', coords);
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
}

function steering() {
  if (keyIsPressed) {
    let da = 0.02;
    let amax = PI / 4;
    if (keyCode == UP_ARROW) {
      if (alphax > -amax) alphax -= 3 * da;
      Z.rot(X, -da);
      Y.rot(X, -da);
    }
    if (keyCode == DOWN_ARROW) {
      if (alphax < amax) alphax += 3 * da;
      Z.rot(X, da);
      Y.rot(X, da);
    }
    if (keyCode == RIGHT_ARROW) {
      if (alphay < amax) alphay += 3 * da;
      Z.rot(Y, -da);
      X.rot(Y, -da);
    }
    if (keyCode == LEFT_ARROW) {
      if (alphay > -amax) alphay -= 3 * da; 
      Z.rot(Y, da);
      X.rot(Y, da);
    }
    if (key == 'a') {
      Y.rot(Z, da);
      X.rot(Z, da);
    }
    if (key == 'd') {
      Y.rot(Z, -da);
      X.rot(Z, -da);
    }
    if (key == 'w') {
      if (speed < 8) speed += 0.1;
    }
    if (key == 's') {
      if (speed > -1) speed -= 0.1;
    }

  } else {
    alphax *= 0.85;
    alphay *= 0.85;
    speed *= 0.98;
  }
  pos.update(Z, speed);
  socket.emit('update_player', coords);
}

socket.on('state', function (players) {
  background(0);
  showPlayer();
  camera(Z.x, Z.y, Z.z, 0, 0, 0, Y.x, Y.y, Y.z);
  translate(pos.x, pos.y, pos.z);
  steering();
  for (let planet of planets) {
    planet.show();
  }
  for (let id in players) {
    if (id != socket.id) {
      showOther(players[id]);
    }
  }
});

function showOther(coord) {
  push();
  translate(coord.pos.x, coord.pos.y, coord.pos.z);
  scale(0.3);
  texture(metall);
  rotateX(PI / 2);
  model(xwing);
  pop();
}

function showPlayer() {
  camera(0, 0, 1, 0, 0, 0, 0, 1, 0);
  push();
  translate(0, height / 20, -width / 10);
  scale(0.3);
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
  update(dir, speed) {
    this.x += dir.x * speed;
    this.y += dir.y * speed;
    this.z += dir.z * speed;
  }
}