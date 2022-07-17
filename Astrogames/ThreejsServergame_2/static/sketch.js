import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.117.1/build/three.module.js';

import {
  GLTFLoader
} from 'https://cdn.jsdelivr.net/npm/three@0.117.1/examples/jsm/loaders/GLTFLoader.js';

import {
  objects
} from './gameobjects.js';


class BattleGame {
  constructor() {
    this.socket = io();
    this.movement = {
      up: false,
      down: false,
      left: false,
      right: false,
      forward: false,
      backward: false,
      tleft: false,
      tright: false,
      projectile: false,
    }

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
    this._models = {
      'xwing': new THREE.Object3D(),
      'tie': new THREE.Object3D(),
    };
    this._Initialize();
  }

  _Initialize() {
    this._SetCamera();
    this._LoadBackground();
    this._SetLight();
    this._SetSound();
    this._SetModels();
    this.socket.emit('new_player');
    this._Socket();
  }

  _Socket() {
    socket.on('state', (data) => {
      this._entities['players'] = new objects.Players(data.players);
      this._entities['planets'] = new objects.Planets(data.planets);
      this._entities['explosions'] = new objects.Explosions(data.explosions);
      this._entities['projectiles'] = new objects.Projectiles(data.projectiles);

      let player = entities['players'].get(socket.id);
      if (player != undefined) {
        Z = player.Z;
        Y = player.Y;

        let cpos = player.pos.copy();
        cpos.trans(Z, 140);
        cpos.trans(Y, -30);
        let clook = player.pos.copy();
        clook.trans(Y, -30);

        this._camera.position.set(cpos.x, cpos.y, cpos.z);
        this._camera.lookAt(clook.x,clook.y,clook.z);
        this._camera.up.set(Y.x,Y.y,Y.z);
        
        for (let entity in entities) {
          entities[entity].show();
        }
        this._threejs.render(this._scene, this._camera);

        socket.emit('movement', this.movement);
      }

    });
  }

  _SetCamera() {
    const fov = 75;
    const aspect = this._width / this._height;
    const near = 0.1;
    const far = 10000;
    this._camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    this._scene.add(this._camera);
  }

  _SetSound() {
    const listener = new THREE.AudioListener();
    const audioLoader = new THREE.AudioLoader();

    this._lasersound = new THREE.Audio(listener);
    audioLoader.load('sounds/laser.wav', (buffer) => {
      this._lasersound.setBuffer(buffer);
    });

    this._bombsound = new THREE.Audio(listener);
    audioLoader.load('sounds/bomb.wav', (buffer) => {
      this._bombsound.setBuffer(buffer);
    });
  }

  _SetLight() {
    let light = new THREE.DirectionalLight(0x808080, 1.0);
    light.position.set(-100, 100, -100);
    light.target.position.set(0, 0, 0);
    this._scene.add(light);

    light = new THREE.AmbientLight(0x808080, 0.5);
    this._scene.add(light);
  }

  _SetModels() {
    const loader = new GLTFLoader();
    loader.load('./models/tie-fighter-gltf/scene.gltf', (gltf) => {
      gltf.scene.scale.set(0.5, 0.5, 0.5);
      gltf.scene.rotation.y = Math.PI;
      this._models.tie.add(gltf.scene);
    });
    loader.load('./models/xwing-gltf/scene.gltf', (gltf) => {
      gltf.scene.scale.set(0.5, 0.5, 0.5);
      gltf.scene.rotation.y = Math.PI;
      this._models.xwing.add(gltf.scene);
    });
  }

  _LoadBackground() {
    const loader = new THREE.CubeTextureLoader();
    const texture = loader.load([
      './images/space-posx.jpg',
      './images/space-negx.jpg',
      './images/space-posy.jpg',
      './images/space-negy.jpg',
      './images/space-posz.jpg',
      './images/space-negz.jpg',
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

let battlegame = new BattleGame();


document.addEventListener('keydown', (event) => {
  switch (event.keyCode) {
    case 37: // keyleft
      movement.left = true;
      break;
    case 38: // keyup
      movement.up = true;
      break;
    case 39: // keyright
      movement.right = true;
      break;
    case 40: // keydown
      movement.down = true;
      break;
    case 65: // a
      movement.tleft = true;
      break;
    case 68: //d
      movement.tright = true;
      break;
    case 87: //w
      movement.forward = true;
      break;
    case 83: //s
      movement.backward = true;
      break;
    case 32: //space
      movement.projectile = true;
      battlegame._lasersound.play();
      break;
  }
});

document.addEventListener('keyup', (event) => {
  switch (event.keyCode) {
    case 37: // keyleft
      movement.left = false;
      break;
    case 38: // keyup
      movement.up = false;
      break;
    case 39: // keyright
      movement.right = false;
      break;
    case 40: // keydown
      movement.down = false;
      break;
    case 65: // a
      movement.tleft = false;
      break;
    case 68: //d
      movement.tright = false;
      break;
    case 87: //w
      movement.forward = false;
      break;
    case 83: //s
      movement.backward = false;
      break;
    case 32: //space
      movement.projectile = false;
      break;
  }
});