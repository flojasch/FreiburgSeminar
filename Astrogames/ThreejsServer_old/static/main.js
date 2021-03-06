import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.117.1/build/three.module.js';

import {
  GLTFLoader
} from 'https://cdn.jsdelivr.net/npm/three@0.117.1/examples/jsm/loaders/GLTFLoader.js';

import {
  graphics
} from './graphics.js';
import {
  graphics_ohne
} from './graphics_ohne.js';
import {
  controls
} from './controls.js';

import {
  objects
} from './gameobjects.js';
import {
  sky
} from './sky.js';
import {
  math
} from './math.js';

let _APP = null;
const TERRAIN_SIZE = 5000;
const REL_HEIGHT = 0.01;

function _CreateShip(params) {
  let file;
  let scale;
  if (params.ship == 'xwing') {
    file = 'xwing-gltf';
    scale = 0.54;
  } else if (params.ship == 'tie') {
    file = 'tie-fighter-gltf';
    scale = 0.03;
  }
  const loader = new GLTFLoader();
  loader.load('static/models/' + file + '/scene.gltf', (gltf) => {
    gltf.scene.scale.multiplyScalar(scale);
    gltf.scene.rotation.y = Math.PI;
    gltf.scene.position.set(0, -0.1, -1.5);
    params.model.add(gltf.scene);
  });
}

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

class GameGui {
  constructor(player) {
    this._player = player;
    const guiDiv = document.createElement('div');
    guiDiv.className = 'guiRoot guiBox';

    const scoreDiv = document.createElement('div');
    scoreDiv.className = 'vertical';

    const scoreTitle = document.createElement('div');
    scoreTitle.className = 'guiBigText';
    scoreTitle.innerText = 'SCORE';

    const scoreText = document.createElement('div');
    scoreText.className = 'guiSmallText';
    scoreText.innerText = '0';
    scoreText.id = 'scoreText';

    const healthTitle = document.createElement('div');
    healthTitle.className = 'guiBigText';
    healthTitle.innerText = 'HEALTH';

    const healthText = document.createElement('div');
    healthText.className = 'guiSmallText';
    healthText.innerText = '2';
    healthText.id = 'healthText';

    scoreDiv.appendChild(scoreTitle);
    scoreDiv.appendChild(scoreText);
    scoreDiv.appendChild(healthTitle);
    scoreDiv.appendChild(healthText);

    guiDiv.appendChild(scoreDiv);
    document.body.appendChild(guiDiv);

  }
  Update() {
    document.getElementById('scoreText').innerText = this._player._score;
    document.getElementById('healthText').innerText = this._player._health;
    if (this._player._health < 0) {
      const gameOver = document.createElement('div');
      gameOver.className = 'veryBigText';
      gameOver.innerText = 'GAME OVER';
      document.body.appendChild(gameOver);
    }
  }
}

class PlayerEntity {
  constructor(game) {
    this._game = game;
    this._model = new THREE.Object3D();
    this._model.position.set(0, -1.3, -3);
    this._camera = game._camera;
    this._camera.add(this._model);
    this._radius = 3.0;
    this._fireCooldown = 0.0;
    this._health = 3;
    this._score = 0;
    this._ship = 'xwing';
    if (Math.random() > 0.5) this._ship = 'tie';
    this.GetName();
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
      name: this._name,
      id: this._game.socket.id,
      ship: this._ship,
    };
  }

  GetName() {
    const text = document.createElement('div');
    text.className = 'welcomeText';
    text.innerText = 'Willkommen zum Astrobattle Royale. \n Gib hier deinen Namen ein.'
    const welcomeDiv = document.createElement('div');
    welcomeDiv.className = 'welcomeBox';
    const input = document.createElement('input');
    input.setAttribute('type', 'text');
    welcomeDiv.appendChild(text);
    welcomeDiv.appendChild(input);
    document.body.appendChild(welcomeDiv);
    input.addEventListener('keydown', (evt) => {
      if (evt.keyCode === 13) {
        evt.preventDefault();
        this._name = input.value;
        welcomeDiv.remove();
        this.StartGame();
      }
    }, false);
  }

  StartGame() {
    this._gameGui = new GameGui(this);
    this._game.socket.emit('new_player', this.Coords);
    _CreateShip({
      model: this._model,
      ship: this._ship,
    });
    this._game._Socket();
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
    this._gameGui.Update();

    if (this._TerrainCollision()) {
      this._health -= 1;
      this._game._entities['_explosionSystem'].Splode(this.Position);
    }
  }

  _TerrainCollision() {
    let dir = new THREE.Vector3();
    dir.copy(this.Position);
    dir.normalize();
    return this.Position.length() < this._game._terrainSize * (Math.sqrt(3) + this._game._relHeight * math.weierstrass(dir.x, dir.y, dir.z))
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
    this._scene = params.game._scene;
    this._coords = params.coords;
    this._model = new THREE.Object3D();
    this._scene.add(this._model);
    this._id = params.id;
    this._UpdateCoords();
    this._radius = 1.0;
    this._name = new FloatingName(this);
    _CreateShip({
      model: this._model,
      ship: this._coords.ship,
    });

  }
  get Coords() {
    return this._coords;
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

class BattleGame {
  constructor() {
    this.graphics = new graphics.Graphics(this);
    const x = 0; //+Math.random() * 100;
    const y = 5000; //+Math.random() * 100;
    const z = 20000; //+Math.random() * 100;
    this.graphics.Initialize(x,y,z);
    this._camera = this.graphics.Camera;
    this._scene = this.graphics.Scene;
    this.directionalLight = this.graphics.directionalLight;

    this._entities = {};
    this._playersCoords = {};
    this.socket = io();
    this._Initialize();

  }

  _Socket() {
    this.socket.on('state', (playersCoords) => {
      for (const id in playersCoords) {
        if (this._playersCoords[id] == null && id != this.socket.id) {
          this._playersCoords[id] = playersCoords[id];
          const ship = new Ship({
            coords: this._playersCoords[id],
            game: this,
            id: id,
          });
          this._entities['_otherPlayers']._Push(ship);
        } else {
          this._playersCoords[id] = playersCoords[id];
        }
      }
      this._StepEntities(1 / 60);
      this.graphics.Render(1/60);
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
    this._LoadBackground();
    this._SetSound();

    this._terrainSize = TERRAIN_SIZE;
    this._relHeight = REL_HEIGHT;
    this._entities['_terrain'] = new objects.Terrain({
      scene: this._scene,
      camPos: this._camera.position,
      terrainSize: this._terrainSize,
      relHeight: this._relHeight,
    });

    this._entities['_sky'] = new sky.TerrainSky({
      camPos: this._camera.position,
      scene: this._scene,
      terrainSize: this._terrainSize,
      lightPos: this.directionalLight.position,
    });
   

    this._entities['_explosionSystem'] = new objects.ExplodeParticles(this);
    this._entities['_blaster'] = new objects.Blaster(this);
    this._entities['_otherPlayers'] = new OtherPlayers(this);
    this._entities['player'] = new PlayerEntity(this);
    this._entities['controls'] = new controls.Controls(this._entities['player']);

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

function _Main() {
  _APP = new BattleGame();
}

_Main();