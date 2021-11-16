class Planet {
  constructor(r, v,d,m, img) {
    this.d = d;
    this.r = r;
    this.img = img;
    this.v = v;
    this.m = m;
    this.setkoords();
  }
  setkoords(){
    this.x=this.r.x;
    this.y=this.r.y;
    this.z=this.r.z;
  }
  show() {
    push();
    translate(-this.x, -this.y, -this.z);
    rotateY(millis() / 1000);
    texture(this.img);
    noStroke();
    sphere(this.d);
    pop();
  }
  
  static update(planets) {
    let a = [];
    for (let i = 0; i < planets.length; i++) {
      a[i] = createVector(0, 0, 0);
      for (let j = 0; j < planets.length; j++) {
        if (j != i) {
          let fij = p5.Vector.sub(planets[j].r, planets[i].r);
          let dist = fij.mag();
          fij.mult(planets[j].m / pow(dist, 3));
          a[i].add(fij);
        }
      }
    }
    for (let i = 0; i < planets.length; i++) {
      let p=planets[i];
      p.v.add(a[i].mult(0.01));
      p.r.add(p.v);
      p.setkoords();
    }
  }
}

class Projectile {
  constructor(x, y, z, xAngle, yAngle,id) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.pos = createVector(x, y, z);
    this.v = 20;
    this.xAngle = xAngle;
    this.yAngle = yAngle;
    this.id=id;
  }
  show() {
    push();
    translate(-this.x, -this.y, -this.z);
    rotateY(-this.yAngle);
    rotateX(-this.xAngle);
    rotateX(PI / 2);
    noStroke();
    fill(color('magenta'));
    cylinder(10, 80);
    pop();
  }
  update() {
    this.x += this.v * Math.sin(-this.yAngle) * Math.cos(this.xAngle);
    this.y += this.v * Math.sin(this.xAngle);
    this.z += this.v * Math.cos(this.yAngle) * Math.cos(this.xAngle);
  }
  hit(o) {
    let dx = this.x - o.x;
    let dy = this.y - o.y;
    let dz = this.z - o.z;
    let dist = dx * dx + dy * dy + dz * dz;
    return dist < o.d * o.d;
  }
}

class Explosion {
  constructor(x,y,z) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.time = 0;
    this.size = 10;
  }
  show() {
    push();
    translate(-this.x, -this.y, -this.z);
    noStroke();
    texture(expimg);
    sphere(this.size);
    pop();
  }
  update() {
    this.time += 0.2;
    let t = (this.time - 5) * 0.5;
    this.size = exp(-t * t) * 50;
  }

}