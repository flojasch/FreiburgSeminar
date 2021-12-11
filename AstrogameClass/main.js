import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118/build/three.module.js';

import {
  GLTFLoader
} from 'https://cdn.jsdelivr.net/npm/three@0.118.1/examples/jsm/loaders/GLTFLoader.js';

import {
  math
} from './math.js';
import {
  controls
} from './controls.js'
import {
  particles
} from './particles.js';

let _APP = null;

class ExplodeParticles {
  constructor(game) {
    this._scene=game._scene;
    this._sound=game._bombsound;
    this._particleSystem = new particles.ParticleSystem(
      this._scene, {
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
};

class PlayerEntity {
  constructor(game) {
    this._game = game;
    this._model = game._model;
    this._frame = new THREE.Group();
    this._frame.add(game._camera);
    this._frame.add(game._model);
    this._frame.position.set(0, 0, 500);

    game._model.position.set(0, -1.5, -3);
    game._scene.add(this._frame);

    this._fireCooldown = 0.0;
    this._health = 1000.0;
  }
  get Position() {
    // const r = THREE.Vector3();
    // this._model.getWorldPosition(r); does not work???
    return this._model.position;
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
    this._fireCooldown = 0.2;
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
    this._scene=game._scene;
    this._model=game._model;
  }
  _Push(blasterSystem) {
    this._blaster.push(blasterSystem);
  }
  Update(time) {
    this._blaster.forEach(blaSys => {
      blaSys.Update(time);
      for (let name in this._entities) {
        const r = blaSys.Position;
        let remove=false;
        if (blaSys._Hit(this._entities[name])) {
          this._entities['_explosionSystem'].Splode(r);
          remove=true;
        }
        // r.sub(this._model.position);
        // if (r.length() > 500) 
        //  remove = true;
        if(remove){
          this._blaster.splice(this._blaster.indexOf(blaSys), 1);
          this._scene.remove(blaSys.obj);
        }  
      }
    });
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
    this._vel = new THREE.Vector3(0, 0, 70);
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
    params.sound.play();
  }
  Update(timeInSeconds) {
    const dR = this._vel.clone();
    dR.multiplyScalar(timeInSeconds);
    this.obj.position.sub(dR);
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

class Planet {
  constructor(params) {
    this._position = params.position;
    this._scene = params.scene;
    this._radius = 200;
    const geometry = new THREE.SphereGeometry(this._radius, 60, 60);
    const loader = new THREE.TextureLoader();
    const texture = loader.load('./images/earth.jpg');
    const material = new THREE.MeshPhongMaterial({
      map: texture
    });
    const sphere = new THREE.Mesh(geometry, material);
    sphere.position.copy(params.position);
    this._scene.add(sphere);
  }
  Update(time) {

  }
  get Position() {
    return this._position;
  }
  get Radius() {
    return this._radius;
  }
}

class BattleGame {
  constructor() {
    this._threejs = new THREE.WebGLRenderer({
      antialias: true,
    });
    this._threejs.setPixelRatio(window.devicePixelRatio);
    this._threejs.setSize(window.innerWidth, window.innerHeight);

    document.body.appendChild(this._threejs.domElement);

    window.addEventListener('resize', () => {
      this._OnWindowResize();
    }, false);
    this._scene = new THREE.Scene();
    this._entities = {};
    this._Initialize();
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
    const timeInSeconds = timeInMS * 0.001;

    this._StepEntities(timeInSeconds);
    this._threejs.render(this._scene, this._camera);

    this._RAF();
  }

  _Initialize() {
    this._SetCamera();
    this._LoadBackground();
    this._SetLight();
    this._SetSound();
    this._CreatePlayer();

    this._entities['_earth'] = new Planet({
      scene: this._scene,
      position: new THREE.Vector3()
    })

    this._entities['_explosionSystem'] = new ExplodeParticles(this);
    this._entities['_blaster'] = new Blaster(this);
  }

  _SetCamera() {
    const fov = 75;
    const aspect = 2;
    const near = 0.1;
    const far = 1000;
    this._camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
  }

  _SetSound() {
    const listener = new THREE.AudioListener();
    this._camera.add(listener);
    this._lasersound = new THREE.Audio(listener);
    const audioLoader = new THREE.AudioLoader();
    audioLoader.load('sounds/laser.wav', (buffer) => {
      this._lasersound.setBuffer(buffer);
    });
    this._bombsound = new THREE.Audio(listener);
    audioLoader.load('sounds/bomb.wav', (buffer) => {
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

  _CreatePlayer() {
    const loader = new GLTFLoader();
    loader.load('./models/scene.gltf', (gltf) => {
      gltf.scene.scale.set(0.54, 0.54, 0.54);
      gltf.scene.rotation.y = Math.PI;
      gltf.scene.position.set(0, -0.1, -1.5);
      this._model = new THREE.Object3D();
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

  _OnWindowResize() {
    this._camera.aspect = window.innerWidth / window.innerHeight;
    this._camera.updateProjectionMatrix();
    this._threejs.setSize(window.innerWidth, window.innerHeight);
  }
}

function _Main() {
  _APP = new BattleGame();
}

_Main();