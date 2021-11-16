var socket = io();
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
  projectile: false,
  spaceship: 'teapot',
}

// http://localhost:5000

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
  let v = createVector(0, 0, 0);
  let r = createVector(0, 0, 0);
  let sun = new Planet(r, v, 200, 33400, sunimg);
  planets.push(sun);
  r = createVector(1000, 0, 0);
  v = createVector(0, 0, 0.7 * sqrt(500 / r.x));
  let earth = new Planet(r, v, 30, 1, earthimg);
  planets.push(earth);
  r = createVector(2500, 0, 0);
  v = createVector(0, 0, 0.7 * sqrt(500 / r.x));
  let jupiter = new Planet(r, v, 100, 318, jupimg);
  planets.push(jupiter);
  r = createVector(400, 0, 0);
  v = createVector(0, 0, 0.7 * sqrt(500 / r.x));
  let mercur = new Planet(r, v, 30, 1, mercuryimg);
  planets.push(mercur);
  r = createVector(1500, 0, 0);
  v = createVector(0, 0, 0.7 * sqrt(500 / r.x));
  let mars = new Planet(r, v, 30, 1, marsimg);
  planets.push(mars);
  r = createVector(700, 0, 0);
  v = createVector(0, 0, 0.7 * sqrt(500 / r.x));
  let venus = new Planet(r, v, 30, 1, venusimg);
  planets.push(venus);
  ambientLight(50);
  directionalLight(255, 255, 255, -1, 1, -1);
  createP('Willkommen im Battle Royale!').position(100, 50);
  createP('Steuerung mit w,s,a,d, space und Pfeiltasten').position(100, 80);
  createP('Welches Raumschiff möchtest du haben?').position(100, 110);
  xwingButton = createButton('X-Wing').position(200, height - 50);
  xwingButton.mousePressed(setXwing);
  tieButton = createButton('Tie').position(width / 2 + 200, height - 50);
  tieButton.mousePressed(setTie);
  gameStarted = false;
}

function setXwing() {
  movement.spaceship = 'xwing';
  startGame();
}

function setTie() {
  movement.spaceship = 'tie';
  startGame();
}

function startGame() {
  removeElements();
  text = createP().position(20, 20);
  gameStarted = true;
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
    case 87: //w
      movement.forward = true;
      break;
    case 83: //d
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

socket.emit('new player');
socket.on('id', function (id) {
  if (myId === 0) {
    myId = id;
  }
});
socket.on('projectile', function (p) {
  let projectile = new Projectile(p.x, p.y, p.z, p.xAngle, p.yAngle, p.id);
  projectiles.push(projectile);
  if (p.id == myId) {
    movement.projectile = false;
    fireBreak = 30;
  }
});

socket.on('state', function (players) {
  socket.emit('movement', movement);
  background(0);
  me = players[myId] || {};
  if (!gameStarted) showModels();
  else {
    push();
    showMe();
    if (fireBreak != 0) fireBreak--;
    text.html('Score: ' + score + '   Lives: ' + lives);
    setMe();
    for (var id in players) {
      if (id != myId) {
        var player = players[id];
        showPlayers(player);
      }
    }
    Planet.update(planets);
    for (let planet of planets) {
      planet.show();
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
    pop();
  }
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

  }
}

function setMe() {
  rotateX(me.xAngle);
  rotateY(me.yAngle);
  translate(me.x, me.y, me.z);
}

function showMe() {
  texture(rocketimg);
  translate(0, height/10, width/4);
  push();
  scale(0.6);
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

function showPlayers(player) {
  push();
  translate(-player.x, -player.y, -player.z);
  rotateY(-player.yAngle);
  rotateX(-player.xAngle);
  rotateX(PI / 2);
  scale(0.2);
  noStroke();
  texture(rocketimg);
  switch (player.spaceship) {
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
  push();
  translate(-width / 4, 0, 0);
  rotateY(millis() / 1000);
  rotateX(PI / 2);
  scale(1);
  texture(rocketimg);
  model(xwing);
  pop();
  push();
  translate(width / 4, 0, 0);
  rotateY(millis() / 1000);
  rotateX(PI / 2);
  scale(1);
  texture(rocketimg);
  model(tie);
  pop();
}

// http://localhost:5000