import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.112.1/build/three.module.js';

export const quadtree = (function () {

  const MIN_SIZE = 100;
  const SCALE=Math.PI / 10000;
  const HEIGHT=50;
  const TERRAIN_SIZE = 5000;
  const MAX_POW=5;
  
  class TerrainChunk {
    constructor(params) {
      this._params = params;
      this.rand = params.randomVals;
      this._offset = params.offset;
      this._power = 0.5;
      this._res = 50;
      this._size = params.size;
      this._Init();
    }
    Destroy() {
      this._params.group.remove(this._plane);
    }

    _Init() {
      this._plane = new THREE.Mesh(
        new THREE.PlaneGeometry(this._size, this._size, this._res, this._res),
        new THREE.MeshStandardMaterial({
          wireframe: false,
          color: 0xFFFFFF,
          side: THREE.FrontSide,
          vertexColors: THREE.VertexColors,
        }));
      this._plane.position.add(this._offset);
      this._plane.castShadow = false;
      this._plane.receiveShadow = true;
      this._params.group.add(this._plane);
      this.Rebuild();
    }

    setColor(h, vertexColours) {
      function sat(x) {
        return Math.min(Math.max(x, 0.0), 1.0);
      }
      let vc=new THREE.Color(0x2596BE);
      if (h > -9.0) {
        const GRAY = new THREE.Color(0xFFFFFF);
        let a = sat(0.2*h / HEIGHT);
        vc = new THREE.Color(0x46b00c);
        vc.lerp(GRAY, a);
      }
      vertexColours.push(vc);
    }

    Rebuild() {
      const heights = [];
      for (let k in this._plane.geometry.vertices) {
        const v = this._plane.geometry.vertices[k];
        v.z = this.weierstrass(v.x + this._offset.x, v.y + this._offset.y,MAX_POW);
        heights.push(v.z);
      }

      for (let f of this._plane.geometry.faces) {
        const vertexColours = [];

        this.setColor(heights[f.a], vertexColours);
        this.setColor(heights[f.b], vertexColours);
        this.setColor(heights[f.c], vertexColours);

        f.vertexColors = vertexColours;
      }
      this._plane.geometry.elementsNeedUpdate = true;
      this._plane.geometry.verticesNeedUpdate = true;
      this._plane.geometry.computeVertexNormals();
    }

    fourierNoise(x, y) {
      const six = Math.sin(x);
      const cox = Math.cos(x);
      const siy = Math.sin(y);
      const coy = Math.cos(y);
      let imx = 0;
      let rex = 1;
      let imy = 0;
      let rey = 1;
      let reh;
      let zx, zy;
      let ret = 0;

      for (let i = 0; i < this.rand.maxFreq; i++) {
        reh = cox * rex - six * imx;
        imx = rex * six + imx * cox;
        rex = reh;
        rey = 1;
        imy = 0;
        for (let j = 0; j < this.rand.maxFreq; j++) {
          reh = coy * rey - siy * imy;
          imy = rey * siy + imy * coy;
          rey = reh;
          zx = rex * rey - imx * imy;
          zy = rex * imy + imx * rey;
          ret += this.rand.a[i][j] * (zx * this.rand.siphi[i][j] + zy * this.rand.cophi[i][j]);
        }
      }
      return ret;
    }

    weierstrass(x, y,maxPow) {
      x = x * SCALE;
      y = y * SCALE;
      let b = 1;
      let amp = 1;
      let lambda = 2; //1.5;
      let base = 0.5; //0.6;
      let ret = 0;
      for (let k = 0; k < maxPow; k++) {
        ret += amp * this.fourierNoise(b * x, b * y);
        amp *= base;
        b *= lambda;
      }
      return HEIGHT*(ret);
    }

    mandelBrot(ykoord, xkoord) {
      const R = 1024;
      const maxiter = 100;
      let x = 0,
        y = 0,
        cx, cy, xx, yy, r = 0,
        n;
      let dx = 0,
        dy = 0;
      cx = xkoord * 3. / TERRAIN_SIZE - 0.7;
      cy = ykoord * 3. / TERRAIN_SIZE;
      let c2 = cx * cx + cy * cy;
      if (256.0 * c2 * c2 - 96.0 * c2 + 32.0 * cx - 3.0 < 0.0) return 0.0;
      if (16.0 * (c2 + 2.0 * cx + 1.0) - 1.0 < 0.0) return 0.0;
      for (n = 0; n < maxiter; n++) {
        xx = x * x;
        yy = y * y;
        r = xx + yy;
        if (r > R) {
          break;
        }
        let dxh = dx;
        dx = 2 * (dx * x - dy * y) + 1;
        dy = 2 * (x * dy + y * dxh);
        y = 2 * x * y + cy;
        x = xx - yy + cx;
      }

      let d = Math.sqrt(r / (dx * dx + dy * dy)) * Math.log(r);
      if (n == maxiter) d = 0;
      const pow = Math.pow(d, this._power);
      return this._height * pow;
    }

  }

  class RandomVals {
    constructor() {
      this.maxFreq = 10;
      this.a = [];
      this.siphi = [];
      this.cophi = [];
      for (let l = 0; l < this.maxFreq; l++) {
        this.siphi[l] = [];
        this.cophi[l] = [];
        this.a[l] = [];
        for (let k = 0; k < this.maxFreq; k++) {
          this.a[l][k] = Math.random();
          let phi = 2 * Math.PI * Math.random();
          this.siphi[l][k] = Math.sin(phi);
          this.cophi[l][k] = Math.cos(phi);
        }
      }
    }
  }

  class QuadTree {
    constructor(terrain) {
      this._terrain = terrain;
      this._cam = terrain._camera.position;
      this._randomVals = new RandomVals();
      this._root = {
        children: [],
        x: 0.0,
        y: 0.0,
        size: TERRAIN_SIZE,
      };
      this.Grow(this._root);
    }

    Split(node) {
      for (let i = -1; i < 2; i += 2) {
        for (let j = -1; j < 2; j += 2) {
          const size = node.size / 2;
          const x = node.x + i * size;
          const y = node.y + j * size;
          node.children.push({
            children: [],
            x: x,
            y: y,
            size: size,
          })
        }
      }
    }

    Grow(node) {
      if (this.isClose(node) && node.size > 2 * MIN_SIZE) {
        this.Split(node);
        for (let child of node.children) {
          this.Grow(child);
        }
      } else {
        node.chunk = new TerrainChunk({
          group: this._terrain._group,
          offset: new THREE.Vector3(node.x, node.y, 0),
          size: 2 * node.size,
          randomVals: this._randomVals,
        });
      }
    }

    isClose(node) {
      let x = this._cam.x - node.x;
      let y = this._cam.z + node.y;
      return x * x + y * y < node.size * node.size * 4;
    }

    Update(node) {
      if (node.children.length == 0) {
        if (this.isClose(node)) {
          if (node.size > 2 * MIN_SIZE) {
            node.chunk.Destroy();
            delete node.chunk;
            this.Grow(node);
          }
        }
      } else
        for (let child of node.children)
          this.Update(child);
    }

    DeleteChunks(node) {
      for (let child of node.children) {
        if (child.children.length == 0) {
          child.chunk.Destroy();
          delete child.chunk;
        } else {
          this.DeleteChunks(child);
        }
      }
      node.children = [];
    }

    Rebuild(node) {
      if (!this.isClose(node) && node.children.length != 0) {
        console.log(node);
        this.DeleteChunks(node);
        this.Grow(node);
      } else
        for (let child of node.children) {
          this.Rebuild(child);
        }
    }
  }

  return {
    QuadTree: QuadTree
  }
})();