export const math = (function () {
  class Vec {
    constructor(x, y, z) {
      this.x = x;
      this.y = y;
      this.z = z;
    }
    //rotation um einen kleinen Winkel da um den Vektor n
    rot(n, da) {
      let dx = (n.y * this.z - n.z * this.y) * da;
      let dy = (n.z * this.x - n.x * this.z) * da;
      let dz = (n.x * this.y - n.y * this.x) * da;
      this.x += dx;
      this.y += dy;
      this.z += dz;
      let R = Math.sqrt(this.x ** 2 + this.y ** 2 + this.z ** 2)
      this.x /= R;
      this.y /= R;
      this.z /= R;
    }
    //rotation um einen endlichen Winkel
    Rot(n, alpha) {
      let c = Math.cos(alpha);
      let s = Math.sin(alpha);
      let x = this.x;
      let y = this.y;
      let z = this.z;
      this.x = x * (n.x * n.x * (1. - c) + c) + y * (n.x * n.y * (1. - c) - n.z * s) + z * (n.x * n.z * (1. - c) + n.y * s);
      this.y = x * (n.x * n.y * (1. - c) + n.z * s) + y * (n.y * n.y * (1. - c) + c) + z * (n.y * n.z * (1. - c) - n.x * s);
      this.z = x * (n.x * n.z * (1. - c) - n.y * s) + y * (n.z * n.y * (1. - c) + n.x * s) + z * (n.z * n.z * (1. - c) + c);
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
  return {
    Vec: Vec,
  };
})();