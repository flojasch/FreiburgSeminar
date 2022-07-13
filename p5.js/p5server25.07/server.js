function rand() {
  return 400 - Math.random() * 800;
}

class Vec {
  constructor(x, y, z) {
    this.x = x;
    this.y = y;
    this.z = z;
  }
  //rotation um einen kleinen Winkel da um den Vektor n
  rot(n, da) {
    let dx = (n.y * this.z - n.z * this.y) * da;
    let dy = (n.z * this.x - n.x * this.z) * da;
    let dz = (n.x * this.y - n.y * this.x) * da;
    this.x += dx;
    this.y += dy;
    this.z += dz;
    let R = Math.sqrt(this.x ** 2 + this.y ** 2 + this.z ** 2)
    this.x /= R;
    this.y /= R;
    this.z /= R;
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
    let rr = (v.x - this.x) ** 2 + (v.y - this.y) ** 2 + (v.z - this.z) ** 2;
    return Math.sqrt(rr);
  }
}

class Player {
  constructor(id) {
    this.lives=4;
    this.score=0;
    this.id = id;
    this.pos = new Vec(rand(), rand(), rand());
    this.X = new Vec(1, 0, 0);
    this.Y = new Vec(0, 1, 0);
    this.Z = new Vec(0, 0, 1);
    this.speed = 0;
    let models = ['tie', 'xwing'];
    let index = Math.floor(models.length * Math.random());
    this.model = models[index];
  }
  update() {
    this.pos.trans(this.Z, -this.speed);
    this.speed *= 0.98;
  }
}

class Projectiles {
  constructor() {
    this.list = [];
  }
  update() {
    let remove = false;
    for (let projectile of this.list) {
      projectile.update();
      if (projectile.time > 100) remove = true;
      if (projectile.hit(planets.list)) remove = true;
      //if (projectile.hit(players.list)) remove = true;
      if (remove) this.list.splice(this.list.indexOf(projectile), 1);
    }
  }
  add(projectile) {
    this.list.push(projectile);
  }

}

class Projectile {
  constructor(player) {
    this.pos = player.pos.copy();
    this.speed = -20;
    this.Z = player.Z.copy();
    this.id = player.id;
    this.time = 0;
    this.maxtime = 100;
  }
  update() {
    this.pos.trans(this.Z, this.speed);
    this.time++;
  }
  hit(objlist) {
    let remove = false;
    for (let j = 0; j < objlist.length; j++) {
      let obj = objlist[j];
      if (this.pos.dist(obj.pos) < obj.r) {
        explosions.list.push(new Explosion(obj.pos));
        objlist.splice(j, 1);
        remove = true;
      }
    }
    return remove;
  }
}

class Planets {
  constructor() {
    this.list = [];
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        for (let k = 0; k < 4; k++) {
          let shift = 250;
          let planet = new Planet(300 * i - shift, 300 * j - shift, 300 * k - shift, 30);
          this.list.push(planet);
        }
      }
    }
  }
}

class Planet {
  constructor(x, y, z, r) {
    this.pos = new Vec(x, y, z);
    this.r = r;
  }
}

class Explosion {
  constructor(pos) {
    this.pos = pos;
    this.time = 0;
    this.r = 0;
    this.maxtime = 100;
  }
  update() {
    let t = this.time;
    this.r = 0.05 * t * (100 - t);
    this.time += 1;
  }
}

class Explosions {
  constructor() {
    this.list = [];
  }
  update() {
    for (let explosion of this.list) {
      explosion.update();
      if (explosion.time > 100) {
        this.list.splice(this.list.indexOf(explosion), 1);
      }
    }
  }

}

var express = require('express');
var http = require('http');
var socketIO = require('socket.io');

var app = express();
var server = http.createServer(app);
var io = socketIO(server);

app.use('/static', express.static(__dirname + '/static'));
// Routing
app.get('/', function (request, response) {
  response.sendFile(__dirname + '/index.html');
});

server.listen(5000, function () {
  console.log('Starting server on port 5000');
});
// http://localhost:5000

let players = {};
let projectiles = new Projectiles();
let planets = new Planets();
let explosions = new Explosions();

io.on('connection', (socket) => {
  socket.on('new_player', () => {
    players[socket.id] = new Player(socket.id);
    console.log('user ' + socket.id + ' connected');
  });

  socket.on('movement', (data) => {
    const player = players[socket.id] || {};
    let Z = player.Z;
    let X = player.X;
    let Y = player.Y;

    const da = 0.015;
    if (data.left) {
      Z.rot(Y, da);
      X.rot(Y, da);
    }
    if (data.right) {
      Z.rot(Y, -da);
      X.rot(Y, -da);
    }
    if (data.up) {
      Z.rot(X, -da);
      Y.rot(X, -da);
    }
    if (data.down) {
      Z.rot(X, da);
      Y.rot(X, da);
    }
    if (data.tleft) {
      X.rot(Z, -da);
      Y.rot(Z, -da);
    }
    if (data.tright) {
      X.rot(Z, da);
      Y.rot(Z, da);
    }
    if (data.forward) {
      if (player.speed < 8) player.speed += 0.1;
    }
    if (data.backward) {
      if (player.speed > -2) player.speed -= 0.1;
    }
    if (data.projectile) {
      projectiles.add(new Projectile(player));
    }
  });

  socket.on('disconnect', () => {
    console.log('user ' + socket.id + ' disconnected');
    delete players[socket.id];
  });
});

setInterval(() => {
  for (let id in players) {
    players[id].update();
  }
  projectiles.update();
  explosions.update();
  io.sockets.emit('state', {
    players: players,
    planets: planets,
    projectiles: projectiles,
    explosions: explosions,
  });
}, 1000 / 60);




