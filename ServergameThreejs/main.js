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
import {
  game
} from './game.js';

let _APP = null;

class ExplodeParticles {
  constructor(game) {
    this._particleSystem = new particles.ParticleSystem(
      game, {
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
};

class BlasterSystem {
  constructor(params) {
    this._model = params.model;
    this._frame = params.frame;
    this._vel = new THREE.Vector3(0, 0, -1);
    const Q = new THREE.Quaternion;
    this._model.getWorldQuaternion(Q);
    this._vel.applyQuaternion(Q);
    const pos = new THREE.Vector3();
    this._model.getWorldPosition(pos);
    const material = new THREE.MeshBasicMaterial({
      color: 0xff00ff
    });
    const geometry = new THREE.CylinderGeometry(0.02, 0.02, 2, 10);
    
    this._obj = new THREE.Object3D();
    this._obj.position.copy(pos);
    this._obj.quaternion.copy(Q);
    
    for (let i = 0; i < 2; ++i)
      for (let j = 0; j < 2; ++j) {
        let cyl = new THREE.Mesh(geometry, material);
        cyl.rotation.x = -Math.PI / 2;
        cyl.position.set(-1 + i * 2, -0.1 + j * 0.6, 0);
        this._obj.add(cyl);
      }
       
    this.hit = false;
  }

  Update(timeInSeconds) {
    const dR = this._vel.clone();
    dR.multiplyScalar(timeInSeconds);
    this._obj.position.add(dR);
  }

  checkCollision(entity) {
    const r = new THREE.Vector3();
    entity.obj.getWorldPosition(r);
    r.sub(this.obj.position);
    if (r.length() < entity.size) this.hit = true;
  }

}

class PlayerEntity {
  constructor(params) {
    this._model = params.model;
    this._params = params;
    this._game = params.game;
    this._camera = params.camera;

    this._frame = new THREE.Group();
    this._frame.add(this._camera);
    this._frame.add(this._model);
    this._model.position.set(0, -1.5, -3);
    this._frame.position.set(0, 0, 500);
    this._game._graphics.Scene.add(this._frame);

    this._fireCooldown = 0.0;

    this._health = 1000.0;
  }

  get Position() {
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

    this._fireCooldown = 0.05;
    this._game._entities['_blasterSystem'] = new BlasterSystem({
      model: this._model,
      frame: this._frame
    });
  }

  Update(timeInSeconds) {
    if (this.Dead) {
      return;
    }
    this._fireCooldown -= timeInSeconds;
  }
}

class BattleDemo extends game.Game {
  constructor() {
    super();
  }

  _OnInitialize() {

    this._LoadBackground();

    this._entities['_explosionSystem'] = new ExplodeParticles(this);

    const loader = new GLTFLoader();
    loader.load('./models/scene.gltf', (gltf) => {
      gltf.scene.scale.set(0.54, 0.54, 0.54);
      gltf.scene.rotation.y = Math.PI;
      gltf.scene.position.set(0, -0.1, -1.5);
      const object = new THREE.Object3D();
      object.add(gltf.scene);
      this._entities['player'] = new PlayerEntity({
        model: object,
        camera: this._graphics.Camera,
        game: this
      });

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
    this._graphics._scene.background = texture;
  }
}

function _Main() {
  _APP = new BattleDemo();
}

_Main();