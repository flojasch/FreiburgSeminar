import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.117.1/build/three.module.js';

import {
  objects
} from './gameobjects.js';

import {
  graphics
} from './graphics.js';

import {
  gamegui
} from './gamegui.js';

import {
  controls
} from './controls.js';

class ObjectManager {
  constructor(params) {
    this.list = {};
    this.name = params.name;
    this.scene = params.scene;
    this.sound = params.sound;
  }
  update(typeList) {
    this.delete(typeList);
    this.add(typeList);
    this.updateKoords(typeList);

  }
  updateKoords(typeList) {
    for (let id in this.list) {
      this.list[id].update(typeList[id]);
    }
  }
  delete(typeList) {
    for (let id in this.list) {
      if (typeList[id] == undefined) {
        this.list[id].remove();
        delete this.list[id];
      }
    }
  }
  add(typeList) {
    for (let id in typeList) {
      if (this.list[id] == undefined) {
        this.list[id] = new objects[this.name]({
          obj: typeList[id],
          scene: this.scene,
          sound: this.sound,
        });
      }
    }
  }
}

class BattleGame {
  constructor() {
    this.socket = io();
    this.graphics = new graphics.Graphics(this);
    this.controls = new controls.Controls(this.socket);
    this.gamegui = new gamegui.GameGui();
    this.graphics.Initialize();
    this._camera = this.graphics.Camera;
    this._scene = this.graphics.Scene;
    this.sound = {};
    this._entities = {};
    this.counter=0;
    this._Initialize();
  }

  _Initialize() {
    this._LoadBackground();
    this._SetSound();
    let nameList = ['player', 'planet', 'explosion', 'projectile'];
    for (let name of nameList) {
      this._entities[name] = new ObjectManager({
        name: name,
        scene: this._scene,
        sound: this.sound,
      });
    }
    this.socket.emit('new_player');
    this._Socket();
  }

  _Socket() {
    this.socket.on('state', (data) => {
      if(this.counter<1) console.log(data);
      this.counter++;
      this._StepEntities(data);
      this.controls.update();

      let player = data['player'].list[this.socket.id];
      
      if (player != undefined) {
        this.updateCamera(player);
      }
      this.gamegui.Update(data['player'].list,this.socket.id);
      this.graphics.Render();
    });
  }

  updateCamera(player) {
    let Z = player.Z;
    let Y = player.Y;

    let cpos = new objects.Vec(player.pos.x, player.pos.y, player.pos.z);
    cpos.trans(Z, 6);
    cpos.trans(Y, 1.5);
    let clook = new objects.Vec(player.pos.x, player.pos.y, player.pos.z);
    clook.trans(Y, 1.5);

    this._camera.position.set(cpos.x, cpos.y, cpos.z);
    this._camera.lookAt(clook.x, clook.y, clook.z);
    this._camera.up.set(Y.x, Y.y, Y.z);
  }

  _StepEntities(data) {
    for (let name in this._entities) {
      this._entities[name].update(data[name].list);
    }
  }

  _SetSound() {
    const listener = new THREE.AudioListener();
    const audioLoader = new THREE.AudioLoader();

    this.sound['bombsound'] = new THREE.Audio(listener);
    audioLoader.load('static/sounds/bomb.wav', (buffer) => {
      this.sound['bombsound'].setBuffer(buffer);
    });
  }

  _LoadBackground() {
    const loader = new THREE.CubeTextureLoader();
    const texture = loader.load([
      'static/images/space-posx.jpg',
      'static/images/space-negx.jpg',
      'static/images/space-posy.jpg',
      'static/images/space-negy.jpg',
      'static/images/space-posz.jpg',
      'static/images/space-negz.jpg',
    ]);
    this._scene.background = texture;
  }
}

new BattleGame();