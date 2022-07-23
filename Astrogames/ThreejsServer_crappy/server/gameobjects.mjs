import {
  math
} from './math.mjs';

export const objects = (() => {

  class Player {
    constructor(id) {
      this.health = 10;
      this.score = 0;
      this.id = id;
      this.X = new math.Vec(1, 0, 0);
      this.Y = new math.Vec(0, 1, 0);
      this.Z = new math.Vec(0, 0, 1);
      this.setModelAchses();
      this.xa = 0;
      this.za = 0;
      this.speed = 0;
      this.r = 1;
      this.setModel();
      this.setPosition();
      this.loadtime = 0;
      this.matter = true;
    }

    setModel() {
      let models = ['tie', 'xwing'];
      let index = Math.floor(2 * Math.random());
      this.model = models[index];
    }
    setPosition() {
      let x = 50 * (1 - 2 * Math.random());
      let z = 50 * (1 - 2 * Math.random());
      this.pos = new math.Vec(x, 0, z);
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
    update(entities) {
      this.pos.trans(this.Z, -this.speed);
      this.speed *= 0.98;
      this.hit(entities);
      if (this.loadtime > 0) this.loadtime--;
    }

    hit(entities) {
      for (let name in entities) {
        let entity = entities[name];
        if (entity.matter && this.hitentity(entity, entities))
          return;
      }
    }

    hitentity(entity, entities) {
      for (let objId in entity.list) {
        let obj = entity.list[objId];
        if (this.id != obj.id && this.pos.dist(obj.pos) < obj.r) {
          entities['explosion'].add(this.pos.copy());
          this.health--;
          obj.health--;
          return true;
        }
      }
      return false;
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
      this.matter = false;
    }
    update(entities) {
      this.pos.trans(this.Z, this.speed);
      this.hit(entities);
      this.health--;
    }

    hit(entities) {
      for (let name in entities) {
        let entity = entities[name];
        if (entity.matter && this.hitentity(entity, entities))
          return;
      }
    }

    hitentity(entity, entities) {
      for (let objId in entity.list) {
        let obj = entity.list[objId];
        if (this.pos.dist(obj.pos) < obj.r && obj.id != this.id) {
          entities['explosion'].add(this.pos.copy());
          obj.health--;
          this.health = -1;
          let player = entities['player'].list[this.id];
          if (player != undefined) player.score += 100;
          return true;
        }
      }
      return false;
    }
  }

  class Planet {
    constructor(params) {
      this.pos = new math.Vec(params.x,params.y,params.z);
      this.r = params.r;
      this.health = 10;
      this.matter = true;
    }
    update(entities) {

    }
  }

  class Explosion {
    constructor(pos) {
      this.pos = pos;
      this.time = 0;
      this.health = 1000;
      this.matter = false;
    }
    update(entities) {
      this.health--;
    }
  }

  return {
    player: Player,
    explosion: Explosion,
    planet: Planet,
    projectile: Projectile,
  };
})();