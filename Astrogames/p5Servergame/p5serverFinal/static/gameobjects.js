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
        this.xwingnum=players.xwingnum;
        this.tienum=players.tienum;
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
        this.id = player.id;
        this.model = player.model;
        this.score=player.score;
        this.lives=player.lives;
    }
    show() {
        push();
        transform(this.pos, this.Z, this.Y);
        scale(0.5);
        texture(metall);

        if (this.id == socket.id) {
            this.rotateModel();
            rotateX(alphax);
            rotateY(alphay);
        }
        if (this.model == 'xwing') {
            model(xwing);
        }
        if (this.model == 'tie') {
            model(tie);
        }
        pop();
    }

    rotateModel() {
        if (movement.left)
            if (alphay > -amax) alphay -= da;
        if (movement.right)
            if (alphay < amax) alphay += da;
        if (movement.up)
            if (alphax > -amax) alphax -= da;
        if (movement.down)
            if (alphax < amax) alphax += da;
        if (!movement.up && !movement.down) alphax *= 0.85;
        if (!movement.left && !movement.right) alphay *= 0.85;
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
            if(explosion.time<2){
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