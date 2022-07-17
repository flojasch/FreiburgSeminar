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
  //rotation um einen endlichen Winkel
  Rot(n, alpha) {
    let c = Math.cos(alpha);
    let s = Math.sin(alpha);
    let x = this.x;
    let y = this.y;
    let z = this.z;
    this.x = x * (n.x * n.x * (1. - c) + c) + y * (n.x * n.y * (1. - c) - n.z * s) + z * (n.x * n.z * (1. - c) + n.y * s);
    this.y = x * (n.x * n.y * (1. - c) + n.z * s) + y * (n.y * n.y * (1. - c) + c) + z * (n.y * n.z * (1. - c) - n.x * s);
    this.z = x * (n.x * n.z * (1. - c) - n.y * s) + y * (n.z * n.y * (1. - c) + n.x * s) + z * (n.z * n.z * (1. - c) + c);
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

class Players {
  constructor() {
    this.list = [];
    this.hitable = true;
    this.xwingnum = 0;
    this.tienum = 0;
  }
  add(player) {
    this.list.push(player);
  }
  update() {
    for (let player of this.list) {
      player.update();
      if (player.lives <= 0) {
        this.list.splice(this.list.indexOf(player), 1);
      }
    }
  }
  get(id) {
    for (let player of this.list) {
      if (player.id == id) {
        return player;
      }
    }
  }
  delete(id) {
    for (let player of this.list) {
      if (player.id == id) {
        this.list.splice(this.list.indexOf(player), 1);
        return;
      }
    }
  }
}

class Player {
  constructor(id) {
    this.lives = 10;
    this.score = 0;
    this.id = id;
    this.pos = new Vec(rand(), rand(), rand());
    this.X = new Vec(1, 0, 0);
    this.Y = new Vec(0, 1, 0);
    this.Z = new Vec(0, 0, 1);
    this.setModelAchses();
    this.xa = 0;
    this.za = 0;
    this.speed = 0;
    this.r = 15;
    this.setmodel();
  }

  setmodel() {
    let diff = entities['players'].tienum - entities['players'].xwingnum;
    let models = ['tie', 'xwing'];
    let index;
    if (diff == 0)
      index = Math.floor(2 * Math.random());
    else
      index = (diff + 1) / 2;
    this.model = models[index];
    entities['players'].tienum += 1 - index;
    entities['players'].xwingnum += index;
  }
  setModelAchses() {
    this.mX = this.X.copy();
    this.mY = this.Y.copy();
    this.mZ = this.Z.copy();
  }
  rotX(alpha){
    this.Z.rot(this.X, alpha);
    this.Y.rot(this.X, alpha);
  }
  rotY(alpha){
    this.Z.rot(this.Y, alpha);
    this.X.rot(this.Y, alpha);
  }
  rotZ(alpha){
    this.X.rot(this.Z, alpha);
    this.Y.rot(this.Z, alpha);
  }
  update() {
    this.pos.trans(this.Z, -this.speed);
    this.speed *= 0.98;
    this.hit();
  }

  hit() {
    for (let entity in entities) {
      if (entities[entity].hard && this.hitentity(entities[entity]))
        return;
    }
  }

  hitentity(entity) {
    for (let obj of entity.list) {
      if (this.pos.dist(obj.pos) < obj.r) {
        entities['explosions'].add(new Explosion(this.pos.copy()));
        this.lives = -1;
        return true;
      }
    }
    return false;
  }
}

class Projectiles {
  constructor() {
    this.list = [];
    this.hitable = false;
    this.hard = false;
  }
  update() {
    let remove = false;
    for (let projectile of this.list) {
      projectile.update();
      if (projectile.time > 100) remove = true;
      if (projectile.hit(entities)) remove = true;
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
    this.Z = player.mZ.copy();
    this.id = player.id;
    this.time = 0;

  }
  update() {
    this.pos.trans(this.Z, this.speed);
    this.time++;
  }

  hit(entities) {
    for (let entity in entities) {
      if (entities[entity].hitable && this.hitentity(entities[entity]))
        return true;
    }
    return false;
  }

  hitentity(entity) {
    for (let obj of entity.list) {
      if (this.pos.dist(obj.pos) < obj.r) {
        entities['explosions'].add(new Explosion(this.pos.copy()));
        obj.lives--;
        entities['players'].get(this.id).score += 100;
        return true;
      }
    }
    return false;
  }
}

class Planets {
  constructor() {
    this.list = [];
    this.hitable = true;
    this.hard = true;
    this.create();
  }

  create() {
    for (let i = -3; i <= 3; i += 2) {
      for (let j = -2; j <= 3; j += 2) {
        for (let k = -2; k <= 3; k += 2) {
          let planet = new Planet(500 * i, 500 * j, 500 * k, 100);
          this.list.push(planet);
        }
      }
    }
  }

  update() {
    for (let planet of this.list) {
      if (planet.lives <= 0) {
        this.list.splice(this.list.indexOf(planet), 1);
      }
    }
  }
}

class Planet {
  constructor(x, y, z, r) {
    this.pos = new Vec(x, y, z);
    this.r = r;
    this.lives = 10;
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
    this.r = 0.02 * t * (this.maxtime - t);
    this.time += 1;
  }
}

class Explosions {
  constructor() {
    this.list = [];
    this.hitable = false;
    this.hard = false;
  }
  add(explosion) {
    this.list.push(explosion);
  }
  delete(explosion) {
    this.list.splice(this.list.indexOf(explosion, 1));
  }
  update() {
    for (let explosion of this.list) {
      explosion.update();
      if (explosion.time > explosion.maxtime) {
        this.delete(explosion);
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

let playernum = 0;
let entities = {}
entities['players'] = new Players();
entities['projectiles'] = new Projectiles();
entities['planets'] = new Planets();
entities['explosions'] = new Explosions();

io.on('connection', (socket) => {
  socket.on('new_player', () => {
    if (playernum < 3) {
      entities['players'].add(new Player(socket.id));
      console.log('user ' + socket.id + ' connected');
      ++playernum;
    } else {
      console.log('Maximalzahl der Spieler schon erreicht');
    }
  });

  socket.on('movement', (data) => {
    const player = entities['players'].get(socket.id);
    if (player != undefined) {
      let Z = player.Z;
      let X = player.X;
      let Y = player.Y;

      const da = 0.015;
      const dma = 0.05;
      const amax = Math.PI / 4;

      player.setModelAchses();

      player.mX.Rot(Z, player.za);
      player.mY.Rot(Z, player.za);

      player.mY.Rot(X, player.xa);
      player.mZ.Rot(X, player.xa);

      if (!data.up && !data.down) player.xa *= 0.85;
      if (!data.left && !data.right) player.za *= 0.85;

      if (data.left) {
        player.rotY(da);
        if (player.za > -amax) player.za -= dma;
      }
      if (data.right) {
        player.rotY(-da);
        if (player.za < amax) player.za += dma;
      }
      if (data.up) {
        player.rotX(-da);
        if (player.xa > -amax) player.xa -= dma;
      }
      if (data.down) {
        player.rotX(da);
        if (player.xa < amax) player.xa += dma;
      }
      if (data.tleft) {
        player.rotZ(-da);
      }
      if (data.tright) {
        player.rotZ(da);
      }
      if (data.forward) {
        if (player.speed < 8) player.speed += 0.1;
      }
      if (data.backward) {
        if (player.speed > -2) player.speed -= 0.1;
      }
      if (data.projectile) {
        entities['projectiles'].add(new Projectile(player));
      }
    }
  });

  socket.on('disconnect', () => {
    console.log('user ' + socket.id + ' disconnected');
    entities['players'].delete(socket.id);
  });
});

setInterval(() => {
  for (let entity in entities) {
    entities[entity].update();
  }
  io.sockets.emit('state', entities);
}, 1000 / 60);