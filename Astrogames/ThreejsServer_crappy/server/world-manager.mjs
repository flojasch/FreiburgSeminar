import {
  objects
} from './gameobjects.mjs';

export const worldmanager = (() => {
  class WorldManager {
    constructor(name) {
      this.name = name;
      this.matter = false;
      this.id = 0;
      this.list = {};
    }
    add(params) {
      if (this.name == 'player') this.id = params;
      this.list[this.id] = new objects[this.name](this.id);
      this.matter = this.list[this.id].matter;
      if (this.name != 'player') this.id++;
    }
    update(entities) {
      for (let id in this.list) {
        let obj = this.list[id];
        obj.update(entities);
        if (obj.health <= 0) {
          this.delete(id);
        }
      }
    }
    delete(id) {
      delete this.list[id];
    }
  }

  return {
    WorldManager: WorldManager,
  };
})();