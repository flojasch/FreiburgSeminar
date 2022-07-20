function rand() {
  let range = 40;
  return range * (1 - 2 * Math.random());
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
    this.list = {};
    this.hitable = true;
    this.xwingnum = 0;
    this.tienum = 0;
  }
  add(player) {
    this.list[player.id] = player;
  }
  update() {
    for (let playerId in this.list) {
      let player = this.list[playerId];
      player.update();
      if (player.lives <= 0) {
        delete this.list[playerId];
      }
    }
  }
  delete(id) {
    delete this.list[id];
  }
}

class Player {
  constructor(id) {
    this.lives = 10;
    this.score = 0;
    this.id = id;
    this.pos = new Vec(rand(), 0, rand());
    this.X = new Vec(1, 0, 0);
    this.Y = new Vec(0, 1, 0);
    this.Z = new Vec(0, 0, 1);
    this.setModelAchses();
    this.xa = 0;
    this.za = 0;
    this.speed = 0;
    this.r = 1;
    this.setmodel();
    this.loadtime = 0;
  }

  setmodel() {
    let diff = entities['player'].tienum - entities['player'].xwingnum;
    let models = ['tie', 'xwing'];
    let index;
    if (diff == 0)
      index = Math.floor(2 * Math.random());
    else
      index = (diff + 1) / 2;
    this.model = models[index];
    entities['player'].tienum += 1 - index;
    entities['player'].xwingnum += index;
  }
  setModelAchses() {
    this.mX = this.X.copy();
    this.mY = this.Y.copy();
    this.mZ = this.Z.copy();
  }
  rotX(alpha) {
    this.Z.rot(this.X, alpha);
    this.Y.rot(this.X, alpha);
  }
  rotY(alpha) {
    this.Z.rot(this.Y, alpha);
    this.X.rot(this.Y, alpha);
  }
  rotZ(alpha) {
    this.X.rot(this.Z, alpha);
    this.Y.rot(this.Z, alpha);
  }
  update() {
    this.pos.trans(this.Z, -this.speed);
    this.speed *= 0.98;
    this.hit();
    if (this.loadtime > 0) this.loadtime--;
  }

  hit() {
    for (let entity in entities) {
      if (entities[entity].hard && this.hitentity(entities[entity]))
        return;
    }
  }

  hitentity(entity) {
    for (let objId in entity.list) {
      let obj = entity.list[objId];
      if (this.pos.dist(obj.pos) < obj.r) {
        entities['explosion'].add(new Explosion(this.pos.copy()));
        this.lives = -1;
        return true;
      }
    }
    return false;
  }
}

class Projectiles {
  constructor() {
    this.list = {};
    this.hitable = false;
    this.hard = false;
    this.id = 0;
  }
  update() {
    let remove = false;
    for (let projId in this.list) {
      let projectile = this.list[projId];
      projectile.update();
      if (projectile.time > 100) remove = true;
      if (projectile.hit(entities)) remove = true;
      if (remove) delete this.list[projId];
    }
  }
  add(projectile) {
    this.list[this.id] = projectile;
    this.id++;
  }

}

class Projectile {
  constructor(player) {
    this.pos = player.pos.copy();
    this.speed = -player.speed - 1;
    this.Z = player.mZ.copy();
    this.Y = player.mY.copy();
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
    for (let objId in entity.list) {
      let obj = entity.list[objId];
      if (this.pos.dist(obj.pos) < obj.r && obj.id != this.id) {
        entities['explosion'].add(new Explosion(this.pos.copy()));
        obj.lives--;
        let player = entities['player'].list[this.id];
        if (player != undefined) player.score += 100;
        return true;
      }
    }
    return false;
  }
}

class Planets {
  constructor() {
    this.list = {};
    this.hitable = true;
    this.hard = true;
    this.id = 0;
    this.create();
  }

  create() {
    this.list[this.id] = new Planet(500, 0, 500, 200);
    this.id++;
  }

  update() {
    for (let id in this.list) {
      if (this.list[id].lives <= 0) {
        delete this.list[id];
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
    this.maxtime = 1000;
  }
  update() {
    this.time += 1;
  }
}

class Explosions {
  constructor() {
    this.list = {};
    this.hitable = false;
    this.hard = false;
    this.id = 0;
  }
  add(explosion) {
    this.list[this.id] = explosion;
    this.id++;
  }
  delete(id) {
    delete this.list[id];
  }
  update() {
    for (let id in this.list) {
      let explosion = this.list[id];
      explosion.update();
      if (explosion.time > explosion.maxtime) {
        this.delete(id);
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
entities['player'] = new Players();
entities['projectile'] = new Projectiles();
entities['planet'] = new Planets();
entities['explosion'] = new Explosions();

io.on('connection', (socket) => {
  socket.on('new_player', () => {
    if (playernum < 6) {
      entities['player'].add(new Player(socket.id));
      console.log('user ' + socket.id + ' connected');
      ++playernum;
    } else {
      console.log('Maximalzahl der Spieler schon erreicht');
    }
  });

  socket.on('movement', (data) => {
    const player = entities['player'].list[socket.id];
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
        if (player.za < amax) player.za += dma;
      }
      if (data.right) {
        player.rotY(-da);
        if (player.za > -amax) player.za -= dma;
      }
      if (data.up) {
        player.rotX(da);
        if (player.xa < amax) player.xa += dma;
      }
      if (data.down) {
        player.rotX(-da);
        if (player.xa > -amax) player.xa -= dma;
      }
      if (data.tleft) {
        player.rotZ(-da);
      }
      if (data.tright) {
        player.rotZ(da);
      }
      if (data.forward) {
        if (player.speed < 0.5) player.speed += 0.02;
      }
      if (data.backward) {
        if (player.speed > 0) player.speed -= 0.02;
      }
      if (data.fire) {
        if (player.loadtime == 0) {
          entities['projectile'].add(new Projectile(player));
          player.loadtime = 20;
        }
      }
    }
  });

  socket.on('disconnect', () => {
    console.log('user ' + socket.id + ' disconnected');
    delete entities['player'].list[socket.id];
  });
});

setInterval(() => {
  for (let entity in entities) {
    entities[entity].update();
  }
  io.sockets.emit('state', entities);
}, 1000 / 60);