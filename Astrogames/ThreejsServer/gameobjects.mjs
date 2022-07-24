export const gameobject = (function () {

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

  class Player {
    constructor(params) {
      this.health = 10;
      this.score = 0;
      this.id = params.id;
      this.playerName = params.playerName;
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
  }

  class Projectile {
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
  }

  class Planet {
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
  }

  class Explosion {
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

  return {
    explosion: Explosion,
    projectile: Projectile,
    planet: Planet,
    player: Player,
  };
})();