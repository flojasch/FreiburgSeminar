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

    class Player {
        constructor(params) {
            let player = params.obj;
            this.scene = params.scene;
            this.id = player.id;
            this.score = player.score;
            this.lives = player.lives;
            this.model = new THREE.Object3D();
            this.scene.add(this.model);
            this.setModel(player.model);
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
            const geometry = new THREE.CylinderGeometry(0.02, 0.02, 2, 10);

            for (let i = 0; i < 2; ++i)
                for (let j = 0; j < 2; ++j) {
                    let cyl = new THREE.Mesh(geometry, material);
                    cyl.rotation.x = -Math.PI / 2;
                    cyl.position.set(-1 + i * 2, -0.1 + j * 0.6, 0);
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
        constructor(explosion) {
            this.pos = explosion.pos;
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
      };
    return {
        explosion: Explosion,
        projectile: Projectile,
        planet: Planet,
        player: Player,
        Vec: Vec,
    };
})();