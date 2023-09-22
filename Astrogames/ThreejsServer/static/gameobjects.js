import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.117.1/build/three.module.js';

import {
    GLTFLoader
} from 'https://cdn.jsdelivr.net/npm/three@0.117.1/examples/jsm/loaders/GLTFLoader.js';
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

    function transform(obj, Y, Z) {
        let alpha = 0;
        let beta = 0;
        let gamma = -Math.PI;
        let r = Math.sqrt(Z.x ** 2 + Z.y ** 2);
        if (r != 0) {
            beta = Math.acos(Z.z);
            let ca = Z.x / r;
            let sa = Z.y / r;
            alpha = Math.acos(ca);
            gamma = Math.acos(Y.x * sa - Y.y * ca);
            if (Z.y < 0) {
                alpha = 2 * Math.PI - alpha;
            }
            if (Y.z > 0) {
                gamma = 2 * Math.PI - gamma;
            }
        }
        let nz = new THREE.Vector3(0, 0, 1);
        let ny = new THREE.Vector3(0, 1, 0);

        obj.setRotationFromQuaternion(new THREE.Quaternion());
        obj.rotateOnAxis(nz, alpha);
        obj.rotateOnAxis(ny, beta);
        obj.rotateOnAxis(nz, gamma + Math.PI);

    }

    class Vec {
        constructor(x, y, z) {
            this.x = x;
            this.y = y;
            this.z = z;
        }
        trans(v, t) {
            this.x += v.x * t;
            this.y += v.y * t;
            this.z += v.z * t;
        }
        copy() {
            return new Vec(this.x, this.y, this.z);
        }
        dist(v) {
            let rr = (v.x - this.x) ** 2 + (v.y - this.y) ** 2 + (v.z - this.z) ** 2;
            return Math.sqrt(rr);
        }
        set(v) {
            this.x = v.x;
            this.y = v.y;
            this.z = v.z;
        }
    }

    class FloatingName {
        constructor(player) {
            this.model = player.model;
            this.name = player.name;
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
            this.context2d_.fillText(this.name, 128, 64);

            const map = new THREE.CanvasTexture(this.context2d_.canvas);

            this.sprite = new THREE.Sprite(
                new THREE.SpriteMaterial({
                    map: map,
                    color: 0xffffff
                }));
            this.sprite.scale.set(6, 3, 1);
            this.sprite.position.y += 1.5;
            this.model.add(this.sprite);
        }
    };

    class Player {
        constructor(params) {
            let player = params.obj;
            this.scene = params.scene;
            this.id = player.id;
            this.score = player.score;
            this.health = player.health;
            this.model = new THREE.Object3D();
            this.scene.add(this.model);
            this.setModel(player.model);
            this.name=player.playerName;
            this.floatingName=new FloatingName(this);
        }
        setModel(name) {
            const loader = new GLTFLoader();
            loader.load('static/models/' + name + '/scene.gltf', (gltf) => {
                if (name == 'xwing')
                    gltf.scene.scale.set(0.7, 0.7, 0.7);
                if (name == 'tie')
                    gltf.scene.scale.set(0.04, 0.04, 0.04);
                gltf.scene.rotation.y = Math.PI;
                this.model.add(gltf.scene);
            });
        }
        update(player) {
            this.model.position.set(player.pos.x, player.pos.y, player.pos.z);
            transform(this.model, player.mY, player.mZ);
        }
        remove() {
            this.scene.remove(this.model);
            this.floatingName.Destroy();
        }

    }

    class Planet {
        constructor(params) {
            this.r = params.obj.r;
            this.scene = params.scene;
            const geometry = new THREE.SphereGeometry(this.r, 60, 60);
            const loader = new THREE.TextureLoader();
            const texture = loader.load('static/images/earth.jpg');
            const material = new THREE.MeshPhongMaterial({
                map: texture
            });
            this.planet = new THREE.Mesh(geometry, material);

            this.scene.add(this.planet);
        }
        update(planet) {
            this.planet.position.set(planet.pos.x, planet.pos.y, planet.pos.z);
        }
        remove() {
            this.scene.remove(this.planet);
        }

    }

    class Projectile {
        constructor(params) {
            this.scene = params.scene;
            this.obj = new THREE.Object3D();
            const material = new THREE.MeshBasicMaterial({
                color: 0xff00ff
            });
            const geometry = new THREE.CylinderGeometry(0.03, 0.03, 2, 10);

            for (let i = 0; i < 2; ++i)
                for (let j = 0; j < 2; ++j) {
                    let cyl = new THREE.Mesh(geometry, material);
                    cyl.rotation.x = -Math.PI / 2;
                    cyl.position.set(-1.9 + i * 3.5, -0.35 + j * 0.8, 0);
                    this.obj.add(cyl);
                }
            this.scene.add(this.obj);
        }

        update(proj) {
            this.obj.position.set(proj.pos.x, proj.pos.y, proj.pos.z);
            transform(this.obj, proj.Y, proj.Z);
        }
        remove() {
            this.scene.remove(this.obj);
        }
    }

    class Explosion {
        constructor(params) {
            this.sound = params.sound;
            this._particleSystem = new particles.ParticleSystem(
                params.scene, {
                    texture: "static/images/explosion.png"
                });
            this._particles = [];
        }

        update(explosion) {
            if (explosion.health == 999) {
                this.sound['bombsound'].play();
                let origin = new THREE.Vector3(explosion.pos.x, explosion.pos.y, explosion.pos.z);
                this.explode(origin);
            }
            this.Update((1000 - explosion.health) / 1000);
        }

        remove() {

        }

        explode(origin) {
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

    class Terrain {
        constructor(params) {
          this._terrainSize = 5000;
          this._relHeight=0.01;
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
              camPos: params.camera.position,
              matrix: rot,
            }));
        }
      
        update(terrain) {
          for (let side of this.sides) {
            side.Rebuild(side._root);
            side.Update(side._root);
          }
        }
        
      }
    

    return {
        explosion: Explosion,
        projectile: Projectile,
        planet: Planet,
        player: Player,
        Vec: Vec,
        terrain: Terrain,
    };
})();