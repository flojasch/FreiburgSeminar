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


const gameobject = {
  player: class Player {
    constructor(id) {
      this.health = 10;
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
      this.hitable = true;
      this.name = 'player';
      this.checkHit = true;
    }

    setmodel() {
      let models = ['tie', 'xwing'];
      let index = Math.floor(2 * Math.random());
      this.model = models[index];
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
      if (this.loadtime > 0) this.loadtime--;
    }
  },

  projectile: class Projectile {
    constructor(player) {
      this.pos = player.pos.copy();
      this.speed = -player.speed - 1;
      this.Z = player.mZ.copy();
      this.Y = player.mY.copy();
      this.id = player.id;
      this.health = 200;
      this.hitable = false;
      this.name = 'projectile';
      this.checkHit = true;
    }
    update() {
      this.pos.trans(this.Z, this.speed);
      this.health--;
    }
  },

  planet: class Planet {
    constructor(params) {
      this.pos = new Vec(params.x, params.y, params.z);
      this.r = params.r;
      this.health = 10;
      this.hitable = true;
      this.name = 'planet';
      this.checkHit = false;
    }
    update() {

    }
  },

  explosion: class Explosion {
    constructor(pos) {
      this.pos = pos;
      this.health = 1000;
      this.hitable = false;
      this.name = 'explosion';
      this.checkHit = false;
    }
    update() {
      this.health--;
    }
  }
}

class ObjectList {
  constructor(params) {
    this.list = {};
    this.hitable = false;
    this.id = 0;
    this.name = params.name;
    this.isPlayer = (params.name == 'player');
    this.checkHit;
  }
  add(params) {
    if (this.isPlayer)
      this.id = params;
    else
      this.id++;
    const obj = new gameobject[this.name](params);
    this.list[this.id] = obj;
    this.hitable = obj.hitable;
    this.checkHit = obj.checkHit;
  }
  update() {
    for (let id in this.list) {
      let obj = this.list[id];
      obj.update();
      if (obj.health <= 0) {
        this.delete(id);
      }
    }
  }
  delete(id) {
    delete this.list[id];
  }
}

class WorldManager {
  constructor() {
    this.entities = {}
  }
  add(name) {
    this.entities[name] = new ObjectList({
      name: name
    });
  }
  update() {
    for (let objname in this.entities) {
      let entity = this.entities[objname];
      entity.update();
      if (entity.checkHit)
        for (let id in entity.list) {
          let obj = entity.list[id];
          this.hit(obj);
        }
    }
  }

  hit(obj) {
    for (let name in this.entities) {
      let entity = this.entities[name];
      if (entity.hitable && this.hitentity(obj, entity))
        return;
    }
  }

  hitentity(obj1, entity) {
    for (let id in entity.list) {
      let obj2 = entity.list[id];
      if (obj1.pos.dist(obj2.pos) < obj2.r && obj2.id != obj1.id) {
        this.entities['explosion'].add(obj1.pos.copy());
        obj2.health--;
        obj1.health--;
        if (obj1.name == 'projectile')
          obj1.health = -1;
        let player = this.entities['player'].list[obj1.id];
        if (player != undefined) player.score += 100;
        return true;
      }
    }
    return false;
  }
}

class WorldServer {
  constructor(io) {
    this.playernum = 0;
    this.world = new WorldManager();
    this.world.add('player');
    this.world.add('projectile');
    this.world.add('planet');
    this.world.add('explosion');
    
    this.world.entities['planet'].add({
      x: 0,
      y: 0,
      z: -700,
      r: 300
    });
    this._SetSocket(io);
  }

  _SetSocket(io) {
    io.on('connection', (socket) => {
      socket.on('new_player', () => {
        if (this.playernum < 6) {
          this.world.entities['player'].add(socket.id);
          console.log('user ' + socket.id + ' connected');
          ++this.playernum;
        } else {
          console.log('Maximalzahl der Spieler schon erreicht');
        }
      });

      socket.on('movement', (data) => {
        const player = this.world.entities['player'].list[socket.id];
        if (player != undefined) {
          let Z = player.Z;
          let X = player.X;

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
              this.world.entities['projectile'].add(player);
              player.loadtime = 20;
            }
          }
        }
      });

      socket.on('disconnect', () => {
        console.log('user ' + socket.id + ' disconnected');
        delete this.world.entities['player'].list[socket.id];
      });
    });

    setInterval(() => {
      this.world.update();
      io.sockets.emit('state', this.world.entities);
    }, 1000 / 60);
  }
}

function _Main() {
  const express = require('express');
  const http = require('http');
  const socketIO = require('socket.io');

  const app = express();
  const server = http.createServer(app);
  const io = socketIO(server);

  app.use('/static', express.static(__dirname + '/static'));
  app.get('/', function (request, response) {
    response.sendFile(__dirname + '/index.html');
  });

  server.listen(5000, function () {
    console.log('Starting server on port 5000');
  });

  const _World = new WorldServer(io);
}

_Main();