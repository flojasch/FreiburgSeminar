//und noch ein test
let planets = [];
let r;
let spaceship;
let playerpos = 500;
let aX;
let aY;
let aZ;

function preload() {
  img = loadImage('earth.jpg');
  spaceship = loadModel('teapot.obj', true);
}

function setup() {
  createCanvas(windowWidth - 30, windowHeight - 30, WEBGL);
  aX = new Vec(1, 0, 0);
  aY = new Vec(0, 1, 0);
  aZ = new Vec(0, 0, 1);
  r = new Vec(0, 0, 0);
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
  let da = 0.01;
  if (keyCode == UP_ARROW) {
    aZ.rot(aX, -da);
    aY.rot(aX, -da);
  }
  if (keyCode == DOWN_ARROW) {
    aZ.rot(aX, da);
    aY.rot(aX, da);
  }
  if (keyCode == RIGHT_ARROW) {
    aZ.rot(aY, -da);
    aX.rot(aY, -da);
  }
  if (keyCode == LEFT_ARROW) {
    aZ.rot(aY, da);
    aX.rot(aY, da);
  }
  if (key == 'e') {
    r.add(Vec.mult(2, aZ));
  }
  if (key == 'd') {
    r.add(Vec.mult(-2, aZ));
  }
  console.log(aY);
}

setInterval(function () {
  background(0);
  camera(aZ.x, aZ.y, aZ.z, 0, 0, 0, aY.x, aY.y, aY.z);
  translate(r.x, r.y, r.z);
  if (keyIsPressed) {
    steering();
  }
  noStroke();
  for (let planet of planets) {
    planet.show();
  }
}, 1000 / 40);

function showPlayer() {
  push();
  rotateX(PI);
  rotateY(-PI / 2);
  scale(0.2);
  normalMaterial();
  model(spaceship);
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
  static mult(t, v) {
    let res = {};
    res.x = v.x * t;
    res.y = v.y * t;
    res.z = v.z * t;
    return res;
  }
  add(v) {
    this.x += v.x;
    this.y += v.y;
    this.z += v.z;
  }
}