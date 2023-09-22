import {
  gameobject
} from './gameobjects.mjs';

export const worldmanager = (function () {
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
        this.id = params.id;
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
      this.add('player');
      this.add('projectile');
      this.add('planet');
      this.add('terrain');
      this.add('explosion');
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
  return {
    WorldManager: WorldManager,
  };
})();