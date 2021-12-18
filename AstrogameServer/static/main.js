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

class PlayerEntity {
  constructor(game) {
    this._game = game;
    this._model = game._model;
    this._camera = game._camera;
    this._camera.add(game._model);

    game._model.position.set(0, -1.5, -3);

    this._fireCooldown = 0.0;
    this._health = 1000.0;
    this.SendCoords('new_player');
  }

  get Position() {
    const pos = new THREE.Vector3();
    this._model.getWorldPosition(pos);
    return pos;
  }
  get Radius() {
    return 1.0;
  }
  get Health() {
    return this._health;
  }
  get Dead() {
    return (this._health <= 0.0);
  }
  SendCoords(label) {
    const r = this.Position;
    const Q = new THREE.Quaternion;
    this._model.getWorldQuaternion(Q);
    this._game.socket.emit(label, {
      x: r.x,
      y: r.y,
      z: r.z,
      qx: Q.x,
      qy: Q.y,
      qz: Q.z,
      qw: Q.w,
    });
  }
  TakeDamage(dmg) {
    this._game._entities['_explosionSystem'].Splode(this.Position);
    this._health -= dmg;
  }
  Fire() {
    if (this._fireCooldown > 0.0) {
      return;
    }
    this._fireCooldown = 0.3;
    this._game._entities['_blaster']._Push(new objects.BlasterSystem({
      model: this._game._model,
      scene: this._game._scene,
      sound: this._game._lasersound,
    }));
  }
  Update(timeInSeconds) {
    if (this.Dead) {
      return;
    }
    this._fireCooldown -= timeInSeconds;
    this.SendCoords('player');
  }
}

class OtherPlayers {
  constructor(game) {
    this._game=game;
    this._ships = [];
  }
  _Push(ship) {
    this._ships.push(ship);
  }

  get Position() {
    return new THREE.Vector3();
  }
  get Radius() {
    return -1.0;
  }
  Update(time) {
    this._ships.forEach((ship) => {
      ship._coords=this._game._playersCoords[ship._id];
      ship._UpdateCoords()
    });
  }
}

class Ship {
  constructor(params) {
    this._model = new THREE.Object3D();
    this._scene = params.scene;
    this._coords = params.coords;
    this._id=params.id;
    this._CreateShip();
    this._UpdateCoords();
  }

  _CreateShip() {
    const loader = new GLTFLoader();
    loader.load('static/models/scene.gltf', (gltf) => {
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
    this._Socket();
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
    this._CreatePlayer();

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
    const x = Math.random() * 1000 - 500;
    const y = Math.random() * 1000 - 500;
    const z = Math.random() * 1000 - 500;
    this._camera.position.set(0, 0, 500);
    this._scene.add(this._camera);
  }

  _CreatePlayer() {
    const loader = new GLTFLoader();
    loader.load('static/models/scene.gltf', (gltf) => {
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