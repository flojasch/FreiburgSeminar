var socket = io();
let gameStarted = false;
let planets = [];
let projectiles = [];
let explosions = [];
let myId = 0;
let score = 0;
let lives = 4;
let fireBreak = 0;
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

// http://localhost:3000

function setup() {
  //bilder laden
  jupimg = loadImage('static/jupitermap.jpg');
  earthimg = loadImage('static/earth.jpg');
  sunimg = loadImage('static/sun.jpg');
  marsimg = loadImage('static/mars.jpg');
  mercuryimg = loadImage('static/mercury.jpg')
  venusimg = loadImage('static/venusmap.jpg');
  rocketimg = loadImage('static/metall.jpg')
  tie = loadModel('static/tie.obj', true);
  xwing = loadModel('static/xwing.obj', true);
  teapot = loadModel('static/teapot.obj', true);
  expimg = loadImage('static/explosion.jpg');
  lasersound = loadSound('static/laser.wav');
  bombsound = loadSound('static/bomb.wav');
  width = windowWidth - 30;
  height = windowHeight - 30;
  createCanvas(width, height, WEBGL);
  let sun = new Planet(0, 0, 400, sunimg);
  planets.push(sun);
  let earth = new Planet(2000, 0, 200, earthimg);
  planets.push(earth);
  let jupiter = new Planet(2000, TWO_PI / 5, 200, jupimg);
  planets.push(jupiter);
  let mercur = new Planet(2000, 2 * TWO_PI / 5, 200, mercuryimg);
  planets.push(mercur);
  let mars = new Planet(2000, 3 * TWO_PI / 5, 200, marsimg);
  planets.push(mars);
  let venus = new Planet(2000, 4 * TWO_PI / 5, 200, venusimg);
  planets.push(venus);
  ambientLight(50);
  directionalLight(255, 255, 255, -1, 1, -1);
  createP('Willkommen im Battle Royale!').position(100, 20);
  createP('Gib hier deinen Namen ein').position(100, 50);
  input = createInput().position(400, 70)
  createP('Steuerung mit w,s,a,d, space und Pfeiltasten').position(100, 80);
  createP('Welches Raumschiff möchtest du haben?').position(100, 110);
  xwingButton = createButton('X-Wing').position(200, height - 50);
  xwingButton.mousePressed(setXwing);
  tieButton = createButton('Tie').position(width / 2 + 200, height - 50);
  tieButton.mousePressed(setTie);
  playerstart = {};
}

function setXwing() {
  playerstart.spaceship = 'xwing';
  startGame();
}

function setTie() {
  playerstart.spaceship = 'tie';
  startGame();
}

function startGame() {
  playerstart.name = input.value();
  removeElements();
  text = createP().position(20, 20);
  gameStarted = true;
  socket.emit('new player', playerstart);
}

document.addEventListener('keydown', function (event) {
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
      if (fireBreak == 0) {
        movement.projectile = true;
        lasersound.play();
      } else {
        movement.projectile = false;
      }
  }
});
document.addEventListener('keyup', function (event) {
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

  }
});

socket.on('id', function (id) {
  if (myId === 0) {
    myId = id;
  }
});
socket.on('projectile', function (p) {
  let projectile = new Projectile(p.x, p.y, p.z, p.vx, p.vy, p.vz, p.id);
  projectiles.push(projectile);
  if (p.id == myId) {
    movement.projectile = false;
    fireBreak = 30;
  }
});

socket.on('state', function (players) {
  if (gameStarted) {
    background(0);
    me = players[myId] || {};
    socket.emit('movement', movement);
    showMe();
    camera(me.Z.x, me.Z.y, me.Z.z, 0, 0, 0, me.Y.x, me.Y.y, me.Y.z);
    translate(me.x, me.y, me.z);
    if (fireBreak != 0) fireBreak--;
    text.html('Score: ' + score + '   Lives: ' + lives);
    for (var id in players) {
      if (id != myId) {
        var player = players[id];
        showPlayers(player);
      }
    }
    for (let planet of planets) {
      planet.show();
      if (planet.hit(me)) {
        bombsound.play();
        explosions.push(new Explosion(me.x, me.y, me.z));
        IamHit();
      }
    }
    updateProjectiles(players);
    for (let i = 0; i < explosions.length; i++) {
      let exp = explosions[i];
      exp.update();
      exp.show();
      if (exp.time > 100) {
        explosions.splice(i, 1);
      }
    }
  } else showModels();
});


function updateProjectiles(players) {
  for (let i = 0; i < projectiles.length; i++) {
    let p = projectiles[i];
    p.update();
    p.show();
    for (let playerid in players) {
      let player = players[playerid];
      if (p.hit(player)) {
        if (playerid == myId && p.id != myId) {
          IamHit();
          deleteP(i, p);
        }
        if (p.id == myId && playerid != myId) {
          score += 100;
          deleteP(i, p);
        }
      }
    }
    for (let planet of planets) {
      if (p.hit(planet)) {
        deleteP(i, p)
      }
    }
    if (abs(p.x) > 6000 || abs(p.y) > 6000 || abs(p.z) > 6000) {
      projectiles.splice(i, 1);
    }
  }
}

function deleteP(i, p) {
  projectiles.splice(i, 1);
  bombsound.play();
  explosions.push(new Explosion(p.x, p.y, p.z));
}

function IamHit() {
  lives--;
  if (lives == 0) {
    let t = createP();
    t.position(width / 2 - 300, height / 2 - 100);
    t.style('font-size', '800%');
    t.style('color', 'ff0000');
    t.html('Game Over');
    socket.emit('deleteplayer', myId);
    gameStartet = false;
  }
}

function showMe() {
  camera(0, 0, 1, 0, 0, 0, 0, 1, 0);
  push();
  translate(0, height / 20, -width / 10);
  scale(0.6);
  noStroke();
  texture(rocketimg);
  switch (me.spaceship) {
    case 'xwing':
      rotateX(PI / 2);
      model(xwing);
      break;
    case 'tie':
      model(tie);
      break;
  }
  pop();
}

function showPlayers(p) {
  push();
  let pZ = p.Z;
  translate(-p.x, -p.y, -p.z);
  let r = sqrt(pZ.x * pZ.x + pZ.z * pZ.z);
  let xAngle = asin(pZ.y);
  let yAngle = acos(pZ.z / r);
  if (pZ.x < 0) yAngle *= -1;
  rotateY(yAngle);
  rotateX(-xAngle);
  rotateX(PI / 2);
  scale(0.2);
  texture(rocketimg);
  switch (p.spaceship) {
    case 'tie':
      model(tie);
      break;
    case 'xwing':
      model(xwing);
      break;
    case 'teapot':
      model(teapot);
      break;
  }
  pop();
}

function showModels() {
  camera(0, 0, 1, 0, 0, 0, 0, 1, 0);
  background(0);
  push();
  translate(-width / 3, 0, -width / 2);
  rotateY(millis() / 1000);
  rotateX(PI / 2);
  scale(1.5);
  texture(rocketimg);
  model(xwing);
  pop();
  push();
  translate(width / 3, 0, -width / 2);
  rotateY(millis() / 1000);
  rotateX(PI / 2);
  scale(1.5);
  texture(rocketimg);
  model(tie);
  pop();
}

// http://localhost:3000