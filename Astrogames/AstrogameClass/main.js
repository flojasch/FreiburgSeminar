import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118/build/three.module.js';
import {
  WEBGL
} from 'https://cdn.jsdelivr.net/npm/three@0.112.1/examples/jsm/WebGL.js';

import {
  GLTFLoader
} from 'https://cdn.jsdelivr.net/npm/three@0.118/examples/jsm/loaders/GLTFLoader.js';

import {
  math
} from './math.js';
import {
  controls
} from './controls.js'
import {
  particles
} from './particles.js';
import {
  quadtree
} from './quadtree.js';




let _APP = null;


class Terrain {
  constructor(params) {
    this._terrainSize = params.terrainSize;
    this.sides = [];
    this.MakeSides(params);
  }

  MakeSides(params) {
    const group = new THREE.Group();
    params.scene.add(group);

    let m;
    const rotations = [];
    //top
    m = new THREE.Matrix4();
    m.makeRotationX(-Math.PI / 2);
    rotations.push({
      m,
      tx: -1,
      ty: 0,
    });

    m = new THREE.Matrix4();
    rotations.push({
      m,
      tx: 0,
      ty: 0
    });

    m = new THREE.Matrix4();
    m.makeRotationX(Math.PI / 2);
    rotations.push({
      m,
      tx: 1,
      ty: 0
    });
    //backside
    m = new THREE.Matrix4();
    m.makeRotationY(-Math.PI);
    rotations.push({
      m,
      tx: 0,
      ty: -2
    });

    m = new THREE.Matrix4();
    m.makeRotationY(Math.PI / 2);
    rotations.push({
      m,
      tx: 0,
      ty: 1
    });

    m = new THREE.Matrix4();
    m.makeRotationY(-Math.PI / 2);
    rotations.push({
      m,
      tx: 0,
      ty: -1
    });

    for (let rot of rotations)
      this.sides.push(new quadtree.QuadTree({
        terrainSize: this._terrainSize,
        group: group,
        camPos: params.camPos,
        matrix: rot,
      }));
  }

  Update(timeInSeconds) {
    for (let side of this.sides) {
      side.Rebuild(side._root);
      side.Update(side._root);
    }
  }

  get Position() {
    return new THREE.Vector3();
  }
  get Radius() {
    return Math.sqrt(3) * (this._terrainSize * 1.01);
  }

}

class ExplodeParticles {
  constructor(game) {
    this._sound = game._bombsound;
    this._particleSystem = new particles.ParticleSystem(
      game._scene, {
        texture: "./images/explosion.png"
      });
    this._particles = [];
  }

  Splode(origin) {
    for (let i = 0; i < 96; i++) {
      const p = this._particleSystem.CreateParticle();
      p.Position.copy(origin);
      p.Velocity = new THREE.Vector3(
        math.rand_range(-1, 1),
        math.rand_range(-1, 1),
        math.rand_range(-1, 1)
      );
      p.Velocity.normalize();
      p.Velocity.multiplyScalar(50);
      p.TotalLife = 2.0;
      p.Life = p.TotalLife;
      p.Colours = [new THREE.Color(0xFF8010), new THREE.Color(0xFF8010)];
      p.Sizes = [4, 16];
      p.Size = p.Sizes[0];
      this._particles.push(p);
    }
    this._sound.play();
  }

  Update(timeInSeconds) {
    const _V = new THREE.Vector3();

    this._particles = this._particles.filter(p => {
      return p.Alive;
    });
    for (const p of this._particles) {
      p.Life -= timeInSeconds;
      if (p.Life <= 0) {
        p.Alive = false;
      }
      p.Position.add(p.Velocity.clone().multiplyScalar(timeInSeconds));

      _V.copy(p.Velocity);
      _V.multiplyScalar(10.0 * timeInSeconds);
      const velocityLength = p.Velocity.length();

      if (_V.length() > velocityLength) {
        _V.normalize();
        _V.multiplyScalar(velocityLength)
      }

      p.Velocity.sub(_V);
      p.Size = math.lerp(p.Life / p.TotalLife, p.Sizes[0], p.Sizes[1]);
      p.Colour.copy(p.Colours[0]);
      p.Colour.lerp(p.Colours[1], 1.0 - p.Life / p.TotalLife);
      p.Opacity = math.smootherstep(p.Life / p.TotalLife, 0.0, 1.0);
    }
    this._particleSystem.Update();
  }
  get Position() {
    return new THREE.Vector3();
  }
  get Radius() {
    return -1; //kann nicht getroffen werden
  }
}

class PlayerEntity {
  constructor(game) {
    this._game = game;
    this._model = game._model;
    this._camera = game._camera;
    this._camera.add(game._model);

    game._model.position.set(0, -1.5, -3);

    this._fireCooldown = 0.0;
    this._health = 1000.0;
  }
  get Position() {
    return this._model.getWorldPosition();
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
  TakeDamage(dmg) {
    this._game._entities['_explosionSystem'].Splode(this.Position);
    this._health -= dmg;
  }
  Fire() {
    if (this._fireCooldown > 0.0) {
      return;
    }
    this._fireCooldown = 0.3;
    this._game._entities['_blaster']._Push(new BlasterSystem({
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
  }
}

class Blaster {
  constructor(game) {
    this._blaster = [];
    this._entities = game._entities;
    this._scene = game._scene;
    this._model = game._model;
  }
  _Push(blasterSystem) {
    this._blaster.push(blasterSystem);
  }
  Update(time) {
    this._blaster.forEach(blaSys => {
      blaSys.Update(time);
      this._Hits(blaSys);
      this._RemoveOld(blaSys);
    });
  }
  _RemoveOld(blaSys) {
    if (!blaSys.isAlive) {
      this._blaster.splice(this._blaster.indexOf(blaSys), 1);
      this._scene.remove(blaSys.obj);
    }
  }
  _Hits(blaSys) {
    for (let name in this._entities) {
      const r = blaSys.Position;
      if (blaSys._Hit(this._entities[name])) {
        this._entities['_explosionSystem'].Splode(r);
        blaSys.isAlive = false;
      }
    }
  }

  get Position() {
    return new THREE.Vector3();
  }
  get Radius() {
    return -1; //kann nicht getroffen werden
  }
}

class BlasterSystem {
  constructor(params) {
    this.model = params.model;
    this.scene = params.scene;
    this._vel = new THREE.Vector3(0, 0, 200);
    const Q = new THREE.Quaternion;
    this.model.getWorldQuaternion(Q);
    this._vel.applyQuaternion(Q);
    const pos = new THREE.Vector3();
    this.model.getWorldPosition(pos);
    const material = new THREE.MeshBasicMaterial({
      color: 0xff00ff
    });
    const geometry = new THREE.CylinderGeometry(0.02, 0.02, 2, 10);

    this.obj = new THREE.Object3D();
    this.obj.position.copy(pos);
    this.obj.quaternion.copy(Q);

    for (let i = 0; i < 2; ++i)
      for (let j = 0; j < 2; ++j) {
        let cyl = new THREE.Mesh(geometry, material);
        cyl.rotation.x = -Math.PI / 2;
        cyl.position.set(-1 + i * 2, -0.1 + j * 0.6, 0);
        this.obj.add(cyl);
      }
    this.scene.add(this.obj);
    this.liveTime = 0.0;
    this.isAlive = true;
    params.sound.play();
  }
  Update(timeInSeconds) {
    const dR = this._vel.clone();
    dR.multiplyScalar(timeInSeconds);
    this.obj.position.sub(dR);
    this.liveTime += timeInSeconds;
    if (this.liveTime > 4.0)
      this.isAlive = false;
  }

  _Hit(entity) {
    const r = entity.Position.clone();
    r.sub(this.obj.position);
    return (r.length() < entity.Radius);
  }

  get Position() {
    return this.obj.position.clone();
  }

}

class Graphics {
  constructor(x,y,z) {
    if (!WEBGL.isWebGL2Available()) {
      return false;
    }

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('webgl2', {
      alpha: false
    });

    this._threejs = new THREE.WebGLRenderer({
      canvas: canvas,
      context: context,
      antialias: true,
    });
    this._threejs.setPixelRatio(window.devicePixelRatio);
    this._threejs.setSize(window.innerWidth, window.innerHeight);
    const target = document.getElementById('target');
    target.appendChild(this._threejs.domElement);

    window.addEventListener('resize', () => {
      this._OnWindowResize();
    }, false);

    this._scene = new THREE.Scene();
    this._CreateCamera(x,y,z);
    this._CreateLights();
  }

  _CreateCamera(x,y,z){
    this.scale = 200;
    const fov = 60;
    const aspect = window.innerWidth / window.innerHeight;
    const near = 0.1;
    const far = this.scale * 5000;
    this._camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    this._camera.position.set(x * this.scale, y * this.scale, z * this.scale);
    this._scene.add(this._camera);
  }

  _CreateLights() {
    let light = new THREE.DirectionalLight(0x808080, 1, 100);
    light.position.set(-1, 1, -1);
    light.target.position.set(0, 0, 0);
    light.castShadow = false;
    this._scene.add(light);

    let amblight = new THREE.AmbientLight(0x808080, 0.5);
    this._scene.add(amblight);
  }

  _OnWindowResize() {
    this._camera.aspect = window.innerWidth / window.innerHeight;
    this._camera.updateProjectionMatrix();
    this._threejs.setSize(window.innerWidth, window.innerHeight);
    this._composer.setSize(window.innerWidth, window.innerHeight);
    this._target.setSize(window.innerWidth, window.innerHeight);
  }

  get Scene() {
    return this._scene;
  }

  get Camera() {
    return this._camera;
  }

  Render(timeInSeconds) {
    this._threejs.render(this._scene, this._camera);

  }

}

class BattleGame {
  constructor() {
    const x = 1100;
    const y = 110;
    const z = 0;

    this._graphics = new Graphics(x,y,z);
    this._scene = this._graphics._scene;
    this.scale = this._graphics.scale;
    this._camera = this._graphics.Camera;

    this._previousRAF = null;
    this._minFrameTime = 1.0 / 10.0;

    this._entities = {};
    this._model = new THREE.Object3D();
    this._LoadBackground();
    this._SetSound();
    this._CreatePlayer();

    this._entities['_explosionSystem'] = new ExplodeParticles(this);
    this._entities['_blaster'] = new Blaster(this);
    
    this._RAF();
  }

  _RAF() {
    requestAnimationFrame((t) => {
      if (this._previousRAF === null) {
        this._previousRAF = t;
      }
      this._Render(t - this._previousRAF);
      this._previousRAF = t;
    });
  }

  _StepEntities(timeInSeconds) {
    for (let name in this._entities) {
      this._entities[name].Update(timeInSeconds);
    }
  }

  _Render(timeInMS) {
    const timeInSeconds = Math.min(timeInMS * 0.001, this._minFrameTime);
    this._StepEntities(timeInSeconds);
    this._graphics.Render(timeInSeconds);
    this._RAF();
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

  _CreatePlayer() {
    const loader = new GLTFLoader();
    loader.load('./models/scene.gltf', (gltf) => {
      gltf.scene.scale.set(0.54, 0.54, 0.54);
      gltf.scene.rotation.y = Math.PI;
      gltf.scene.position.set(0, -0.1, -1.5);

      this._model.add(gltf.scene);
      this._entities['player'] = new PlayerEntity(this);

      this._entities['controls'] = new controls.Controls(this._entities['player']);
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
}

function _Main() {
  _APP = new BattleGame();
}

_Main();