import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.117.1/build/three.module.js';
import {
  particles
} from './particles.js';
import {
  math
} from './math.js';
import {
  quadtree
} from './quadtree.js';

export const objects = (function () {

  class _Blaster {
    constructor(game) {
      this._blaster = [];
      this._entities = game._entities;
      this._scene = game._scene;
      this._model = game._model;
      this._game = game;
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
      if (!blaSys._isAlive) {
        this._scene.remove(blaSys._obj);
        this._blaster.splice(this._blaster.indexOf(blaSys), 1);
      }
    }
    _Hits(blaSys) {
      for (let name in this._entities) {
        const r = blaSys.Position;
        if (blaSys._Hit(this._entities[name])) {
          if (name == '_otherPlayers' && blaSys._coords.id == this._game.socket.id) {
            this._game._entities['player']._score += 100;
          }
          if (!(name == 'player' && blaSys._coords.id == this._game.socket.id)) {
            this._entities['_explosionSystem'].Splode(r);
            blaSys._isAlive = false;
            if (name == 'player') {
              this._game._entities['player']._health -= 1.0;
            }
          }
        }
      }
    }
    _Hit(r) {
      return false;
    }
  }

  class _BlasterSystem {
    constructor(params) {
      this._coords = params.coords;
      this._scene = params.scene;
      this._vel = new THREE.Vector3(0, 0, 200);
      const Q = new THREE.Quaternion;
      Q.set(this._coords.qx, this._coords.qy, this._coords.qz, this._coords.qw);
      this._vel.applyQuaternion(Q);
      const pos = new THREE.Vector3();
      pos.set(this._coords.x, this._coords.y, this._coords.z);
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
      this._scene.add(this._obj);
      this._liveTime = 0.0;
      this._isAlive = true;
      if (params.sound) params.sound.play();
    }
    Update(timeInSeconds) {
      const dR = this._vel.clone();
      dR.multiplyScalar(timeInSeconds);
      this._obj.position.sub(dR);
      this._liveTime += timeInSeconds;
      if (this._liveTime > 4.0)
        this._isAlive = false;
    }

    _Hit(entity) {
      return entity._Hit(this._obj.position.clone());
    }

    get Position() {
      return this._obj.position.clone();
    }

  }

  class _Planet {
    constructor(params) {
      this._position = params.position;
      this._scene = params.scene;
      this._radius = 30000;
      const geometry = new THREE.SphereGeometry(this._radius, 60, 60);
      const loader = new THREE.TextureLoader();
      const texture = loader.load('static/images/sun.jpg');
      const material = new THREE.MeshPhongMaterial({
        map: texture
      });
      const sphere = new THREE.Mesh(geometry, material);
      sphere.position.copy(params.position);
      this._scene.add(sphere);
    }
    Update(time) {

    }
    _Hit(r) {
      r.sub(this._position);
      return (r.length() < this._radius);
    }
  }

  class _Terrain {
    constructor(params) {
      this._terrainSize = params.terrainSize;
      this._relHeight=params.relHeight;
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
          relHeight: this._relHeight,
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
    
    _Hit(r) {
      return (r.length() < Math.sqrt(3) * (this._terrainSize * 1.01));
    }
    
  }

  class _ExplodeParticles {
    constructor(game) {
      this._sound = game._bombsound;
      this._particleSystem = new particles.ParticleSystem(
        game._scene, {
          texture: "static/images/explosion.png"
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
    _Hit(r) {
      return false;
    }
  };
  return {
    Blaster: _Blaster,
    BlasterSystem: _BlasterSystem,
    Planet: _Planet,
    ExplodeParticles: _ExplodeParticles,
    Terrain: _Terrain
  };
})();