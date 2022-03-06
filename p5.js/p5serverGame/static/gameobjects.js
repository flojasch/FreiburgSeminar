class Planet {
  constructor(r, alpha, d,img) {
    this.d = d;
    this.x = r*sin(alpha);
    this.y =0;
    this.z=r*cos(alpha);
    this.img = img;
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
  hit(o) {
    let dx = this.x - o.x;
    let dy = this.y - o.y;
    let dz = this.z - o.z;
    let dist = dx * dx + dy * dy + dz * dz;
    return dist < (this.d+100) * (this.d+100);
  }
}

class Projectile {
  constructor(x, y, z, vx, vy, vz, id) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.pos = createVector(x, y, z);
    this.v = 20;
    this.vx = vx;
    this.vy = vy;
    this.vz = vz;
    this.id = id;
  }
  show() {
    push();
    translate(-this.x, -this.y, -this.z);
    let r=sqrt(this.vx*this.vx+this.vz*this.vz);
    let xAngle=asin(this.vy);
    let yAngle=acos(this.vz/r); 
    if(this.vx<0) yAngle *=-1;
    rotateY(yAngle);
    rotateX(-xAngle);
    rotateX(PI / 2);
    noStroke();
    fill(color('magenta'));
    cylinder(10, 80);
    //sphere(30);
    pop();
  }
  update() {
    this.x += this.v * this.vx;
    this.y += this.v * this.vy;
    this.z += this.v * this.vz;
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
  constructor(x, y, z) {
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