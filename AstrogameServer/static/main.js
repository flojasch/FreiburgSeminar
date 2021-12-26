import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118/build/three.module.js';

import {
  GLTFLoader
} from 'https://cdn.jsdelivr.net/npm/three@0.118.1/examples/jsm/loaders/GLTFLoader.js';

import {
  controls
} from './controls.js';

import {
  objects
} from './gameobjects.js';
import {
  menger
} from './menger.js';

let _APP = null;

class FloatingName {
  constructor(ship) {
    this._ship = ship;
    this.Init_();
  }

  Destroy() {
    this.element_ = null;
  }

  Init_() {
    this.element_ = document.createElement('canvas');
    this.context2d_ = this.element_.getContext('2d');
    this.context2d_.canvas.width = 256;
    this.context2d_.canvas.height = 128;
    this.context2d_.fillStyle = '#FFF';
    this.context2d_.font = "18pt Helvetica";
    this.context2d_.shadowOffsetX = 3;
    this.context2d_.shadowOffsetY = 3;
    this.context2d_.shadowColor = "rgba(0,0,0,0.3)";
    this.context2d_.shadowBlur = 4;
    this.context2d_.textAlign = 'center';
    this.context2d_.fillText(this._ship._coords.name, 128, 64);

    const map = new THREE.CanvasTexture(this.context2d_.canvas);

    this.sprite_ = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: map,
        color: 0xffffff
      }));
    this.sprite_.scale.set(6, 3, 1);
    this.sprite_.position.y += 1.5;
    this._ship._model.add(this.sprite_);
  }
};

class GameData {
  constructor(player) {
    this._player = player;
    this._scoreElem = document.getElementById('score');
    this._scoreElem.innerHTML = 'Score: ' + player._score;
    this._liveElem = document.getElementById('lives');
    this._liveElem.innerHTML = 'Health: ' + player._health;
    this._gameOverElem = document.getElementById('gameover');
  }
  Update() {
    this._scoreElem.innerHTML = 'Score:' + this._player._score;
    this._liveElem.innerHTML = 'Health: ' + this._player._health;
    if (this._player._health < 0) {
      this._gameOverElem.innerHTML = '<p style="color:red; font-size:50px;" >GAME OVER</p>';

    }
  }

}

class PlayerEntity {
  constructor(game) {
    this._game = game;
    this._model = game._model;
    this._camera = game._camera;
    this._camera.add(game._model);

    game._model.position.set(0, -1.5, -3);
    this._radius = 1.0;
    this._fireCooldown = 0.0;
    this._game.socket.emit('new_player', this.Coords);
    this._health = 2;
    this._score = 0;
    this._gameData = new GameData(this);
  }

  get Position() {
    const pos = new THREE.Vector3();
    this._model.getWorldPosition(pos);
    return pos;
  }
  get Quaternion() {
    const Q = new THREE.Quaternion;
    this._model.getWorldQuaternion(Q);
    return Q;
  }
  get Coords() {
    const r = this.Position;
    const Q = this.Quaternion;
    return {
      x: r.x,
      y: r.y,
      z: r.z,
      qx: Q.x,
      qy: Q.y,
      qz: Q.z,
      qw: Q.w,
      name: this._game._name,
      id: this._game.socket.id,
    };
  }

  Fire() {
    if (this._fireCooldown > 0.0) {
      return;
    }
    this._fireCooldown = 0.3;
    this._game._entities['_blaster']._Push(new objects.BlasterSystem({
      coords: this.Coords,
      scene: this._game._scene,
      sound: this._game._lasersound,
    }));
    this._game.socket.emit('new_blaster', this.Coords);
  }

  Update(timeInSeconds) {
    this._fireCooldown -= timeInSeconds;
    this._game.socket.emit('update_player', this.Coords);
    if (this._health < 0) {
      this._Destroy();
    }
    this._gameData.Update();
  }

  _Hit(r) {
    r.sub(this.Position);
    const isHit = (r.length() < this._radius);
    return isHit;
  }

  _Destroy() {
    this._camera.remove(this._model);
    this._game.socket.emit('player_died', this._game.socket.id);
    delete this._game._entities['controls'];
    delete this._game._entities['player'];
  }
}

class OtherPlayers {
  constructor(game) {
    this._game = game;
    this._ships = [];
  }
  _Push(ship) {
    this._ships.push(ship);
  }
  Update(time) {
    this._ships.forEach((ship) => {
      ship._coords = this._game._playersCoords[ship._id];
      ship._UpdateCoords();
    });
  }
  _Hit(r) {
    let ret = false;
    this._ships.forEach((ship) => {
      r.sub(ship._model.position);
      ret = ret || (r.length() < ship._radius);
    });
    return ret;
  }
  _Remove(id) {
    let index = 0;
    for (let i = 0; i < this._ships.length; i++) {
      let ship = this._ships[i];
      if (ship._id == id) {
        ship._Remove();
        index = i;
      }
    }
    this._ships.splice(index, 1);
  }
}

class Ship {
  constructor(params) {
    this._model = new THREE.Object3D();
    this._scene = params.scene;
    this._coords = params.coords;
    this._id = params.id;
    this._CreateShip();
    this._UpdateCoords();
    this._radius = 1.0;
    this._name = new FloatingName(this);
  }

  _CreateShip() {
    const loader = new GLTFLoader();
    loader.load('static/models/xwing-gltf/scene.gltf', (gltf) => {
      gltf.scene.scale.set(0.54, 0.54, 0.54);
      gltf.scene.rotation.y = Math.PI;
      gltf.scene.position.set(0, -0.1, -1.5);
      this._model.add(gltf.scene);
      this._scene.add(this._model);
    });
  }
  _UpdateCoords() {
    this._model.position.set(this._coords.x, this._coords.y, this._coords.z);
    this._model.quaternion.set(this._coords.qx, this._coords.qy, this._coords.qz, this._coords.qw);
  }
  _Remove() {
    this._scene.remove(this._model);
    this._name.Destroy();
  }
}

class GetName {
  constructor(game) {
    this._game = game;
    this._Init();
  }
  _Init() {
    this._input = document.getElementById('name-input');
    this._text = document.getElementById('name-text');
    this._input.addEventListener('keydown', (e) => this._OnKeyDown(e), false);
  }
  _OnKeyDown(evt) {
    if (evt.keyCode === 13) {
      evt.preventDefault();
      this._game._name = this._input.value;
      this._input.remove();
      this._text.remove();
      this._game._CreatePlayer();
      this._game._Socket();
    }
  }
}

class BattleGame {
  constructor() {
    this._threejs = new THREE.WebGLRenderer({
      antialias: true,
    });

    this._threejs.setPixelRatio(window.devicePixelRatio);
    this._width = window.innerWidth;
    this._height = window.innerHeight;
    this._threejs.setSize(this._width, this._height);

    document.body.appendChild(this._threejs.domElement);

    window.addEventListener('resize', () => {
      this._OnWindowResize();
    }, false);
    this._scene = new THREE.Scene();
    this._entities = {};
    this._model = new THREE.Object3D();
    this._playersCoords = {};
    this.socket = io();
    this._Initialize();
    new GetName(this);
  }

  _Socket() {
    this.socket.on('state', (playersCoords) => {
      for (const id in playersCoords) {
        if (this._playersCoords[id] == null && id != this.socket.id) {
          this._playersCoords[id] = playersCoords[id];
          const ship = new Ship({
            scene: this._scene,
            coords: this._playersCoords[id],
            id: id,
          });
          this._entities['_otherPlayers']._Push(ship);
        } else {
          this._playersCoords[id] = playersCoords[id];
        }
      }
      this._StepEntities(1 / 60);
      this._threejs.render(this._scene, this._camera);
    });
    this.socket.on('new_blaster', (coords) => {
      if (coords.id != this.socket.id) {
        this._entities['_blaster']._Push(new objects.BlasterSystem({
          coords: coords,
          scene: this._scene,
        }));
      }
    });
    this.socket.on('player_deleted', (id) => {
      this._entities['_otherPlayers']._Remove(id);
    });
  }

  _StepEntities(time) {
    for (let name in this._entities) {
      this._entities[name].Update(time);
    }
  }

  _Initialize() {
    this._SetCamera();
    this._LoadBackground();
    this._SetLight();
    this._SetSound();

    this._entities['_earth'] = new objects.Planet({
      scene: this._scene,
      position: new THREE.Vector3()
    })

    this._entities['_explosionSystem'] = new objects.ExplodeParticles(this);
    this._entities['_blaster'] = new objects.Blaster(this);
    //this._entities['_menger']=new menger.Menger(this._camera);
    this._entities['_otherPlayers'] = new OtherPlayers(this);
  }

  _SetCamera() {
    const fov = 75;
    const aspect = this._width / this._height;
    const near = 0.1;
    const far = 1000;
    this._camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    const x = Math.random() * 100 + 500;
    const y = Math.random() * 100 + 500;
    const z = Math.random() * 100 + 500;
    this._camera.position.set(0, 0, 500);
    this._scene.add(this._camera);
  }

  _CreatePlayer() {
    const loader = new GLTFLoader();
    loader.load('static/models/xwing-gltf/scene.gltf', (gltf) => {
      gltf.scene.scale.set(0.54, 0.54, 0.54);
      gltf.scene.rotation.y = Math.PI;
      gltf.scene.position.set(0, -0.1, -1.5);

      this._model.add(gltf.scene);
      this._entities['player'] = new PlayerEntity(this);

      this._entities['controls'] = new controls.Controls(this._entities['player']);
    });
  }

  _SetSound() {
    const listener = new THREE.AudioListener();
    const audioLoader = new THREE.AudioLoader();

    this._lasersound = new THREE.Audio(listener);
    audioLoader.load('static/sounds/laser.wav', (buffer) => {
      this._lasersound.setBuffer(buffer);
    });

    this._bombsound = new THREE.Audio(listener);
    audioLoader.load('static/sounds/bomb.wav', (buffer) => {
      this._bombsound.setBuffer(buffer);
    });
  }

  _SetLight() {
    let light = new THREE.DirectionalLight(0xFFFFFF, 1.0);
    light.position.set(100, 100, -100);
    light.target.position.set(0, 0, 0);
    this._scene.add(light);

    light = new THREE.AmbientLight(0xFFFFFF, 0.1);
    this._scene.add(light);
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

  _OnWindowResize() {
    this._width = window.innerWidth;
    this._height = window.innerHeight;
    this._camera.aspect = this._width / this._height;
    this._camera.updateProjectionMatrix();
    this._threejs.setSize(this._width, this._height);
  }
}

function _Main() {
  _APP = new BattleGame();
}

_Main();