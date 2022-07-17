import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.117.1/build/three.module.js';

export const objects = (function () {
    function transform(pos, Z, Y) {
        translate(pos.x, pos.y, pos.z);
        let alpha = 0;
        let beta = 0;
        let gamma = -PI;
        let r = Math.sqrt(Z.x ** 2 + Z.y ** 2);
        if (r != 0) {
            beta = Math.acos(Z.z);
            let ca = Z.x / r;
            let sa = Z.y / r;
            alpha = Math.acos(ca);
            gamma = Math.acos(Y.x * sa - Y.y * ca);
            if (Z.y < 0) {
                alpha = 2 * PI - alpha;
            }
            if (Y.z > 0) {
                gamma = 2 * PI - gamma;
            }
        }
        rotateZ(alpha);
        rotateY(beta);
        rotateZ(gamma);
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
    }

    class Players {
        constructor(players) {
            this.list = [];
            this.xwingnum = players.xwingnum;
            this.tienum = players.tienum;
            for (let player of players.list) {
                this.list.push(new Player(player))
            }
        }
        show() {
            for (let obj of this.list) {
                obj.show();
            }
        }
        get(id) {
            for (let player of this.list) {
                if (player.id == id) {
                    return player;
                }
            }
        }
    }

    class Player {
        constructor(player) {
            this.pos = new Vec(player.pos.x, player.pos.y, player.pos.z);
            this.Z = player.Z;
            this.Y = player.Y;
            this.mZ = player.mZ;
            this.mY = player.mY;
            this.id = player.id;
            this.model = player.model;
            this.score = player.score;
            this.lives = player.lives;
        }
        show() {
            if (this.model == 'xwing') {
                model(xwing);
            }
            if (this.model == 'tie') {
                model(tie);
            }
            push();
            transform(this.pos, this.mZ, this.mY);
            scale(0.5);
            texture(metall);
            
            pop();
        }
    }

    class Planets {
        constructor(planets) {
            this.list = [];
            for (let planet of planets.list) {
                this.list.push(new Planet(planet));
            }
        }
        show() {
            for (let planet of this.list) {
                planet.show();
            }
        }
    }

    class _Planet {
        constructor(planet) {
          this.pos = planet.pos;
          this.r = planet.r;
          const geometry = new THREE.SphereGeometry(this._radius, 60, 60);
          const loader = new THREE.TextureLoader();
          const texture = loader.load('static/images/earth.jpg');
          const material = new THREE.MeshPhongMaterial({
            map: texture
          });
          const sphere = new THREE.Mesh(geometry, material);
          sphere.position.set;
        }
        show(){

        }
        
      }

    class Planet {
        constructor(planet) {
            this.pos = planet.pos;
            this.r = planet.r;
        }
        show() {
            push();
            translate(this.pos.x, this.pos.y, this.pos.z);
            rotateY(millis() / 1000);
            texture(img);
            noStroke();
            sphere(this.r);
            pop();
        }
    }

    class Projectiles {
        constructor(projectiles) {
            this.list = [];
            for (let projectile of projectiles.list) {
                this.list.push(new Projectile(projectile));
            }
        }
        show() {
            for (let projectile of this.list) {
                projectile.show();
            }
        }

    }

    class Projectile {
        constructor(proj) {
            this.pos = proj.pos;
            this.Z = proj.Z;
        }
        show() {
            push();
            transform(this.pos, this.Z, new Vec(0, 1, 0));
            noStroke();
            fill(color('magenta'));
            cylinder(1, 80);
            pop();
        }
    }

    class Explosions {
        constructor(explosions) {
            this.list = [];
            for (let explosion of explosions.list) {
                this.list.push(new Explosion(explosion));
                if (explosion.time < 2) {
                    bombsound.play();
                }
            }
        }
        show() {
            for (let explosion of this.list) {
                explosion.show();
            }
        }

    }

    class Explosion {
        constructor(explosion) {
            this.pos = explosion.pos;
            this.r = explosion.r;
        }
        show() {
            push();
            translate(this.pos.x, this.pos.y, this.pos.z);
            texture(fire);
            noStroke();
            sphere(this.r);
            pop();
        }
    }

    return {
        Explosions: Explosions,
        Projectiles: Projectiles,
        Planets: Planets,
        Players: Players,
    };
})();