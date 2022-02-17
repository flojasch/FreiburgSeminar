import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.112.1/build/three.module.js';

export const quadtree = (function () {

  const MIN_SIZE = 25;
  const HEIGHT = 1000;

  class TerrainChunk {
    constructor(params) {
      this._params = params;
      this._matrix = params.matrix;
      this._position = params.chunkPos;
      this._height = HEIGHT;
      this._power = 0.5;
      this._res = 100;
      this._size = params.size;
      this._terrainSize = params.terrainSize;
      this._radius = Math.sqrt(3) * this._terrainSize;
      this._mandelsize=0.5;
      this._Init();
    }
    Destroy() {
      this._params.group.remove(this._plane);
    }

    _Init() {
      const geometry = new THREE.PlaneGeometry(this._size, this._size, this._res, this._res);
      this._plane = new THREE.Mesh(geometry,
        new THREE.MeshStandardMaterial({
          wireframe: false,
          color: 0xFFFFFF,
          side: THREE.FrontSide,
          vertexColors: THREE.VertexColors,
        }));
      this._plane.castShadow = false;
      this._plane.receiveShadow = true;
      this._params.group.add(this._plane);
      this.Rebuild();
    }

    setColor(h, vertexColours) {
      function sat(x) {
        return Math.min(Math.max(x, 0.0), 1.0);
      }
      const GREEN = new THREE.Color(0x46b00c);
      let a = sat(h / this._height);
      let vc = new THREE.Color(0xFFFFFF);
      vc.lerp(GREEN, a);
      vertexColours.push(vc);
    }

    Rebuild() {
      const heights = [];
      for (let k in this._plane.geometry.vertices) {
        const v = this._plane.geometry.vertices[k];
        v.add(this._position);
        let vx= v.x+this._terrainSize * this._params.ty*this._mandelsize*4;
        let vy= v.y-this._terrainSize * this._params.tx*this._mandelsize*4;
        let height = this.setHeight(vx, vy);
        v.multiplyScalar((this._radius + height) / v.length());
        v.applyMatrix4(this._matrix);
        heights.push(height);
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

    setHeight(vx, vy) {
      const R = 1024;
      const maxiter = 100;
      let x = 0,
        y = 0,
        cx, cy, xx, yy, r = 0,
        n;
      let dx = 0,
        dy = 0;
      cx = vx * this._mandelsize / this._terrainSize;
      cy = vy * this._mandelsize / this._terrainSize;
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

  class QuadTree {
    constructor(params) {
      this._terrainSize = params.terrainSize;
      this._group = params.group;
      this._cam = params.camPos;
      this._matrix=params.matrix.m;
      this._tx=params.matrix.tx;
      this._ty=params.matrix.ty;
      this._root = {
        children: [],
        x: 0.0,
        y: 0.0,
        size: this._terrainSize,
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
          group: this._group,
          chunkPos: new THREE.Vector3(node.x, node.y, this._terrainSize),
          size: 2 * node.size,
          terrainSize: this._terrainSize,
          matrix: this._matrix,
          tx: this._tx,
          ty: this._ty,
        });
      }
    }

    isClose(node) {
      let r = new THREE.Vector3(node.x, node.y, this._terrainSize);
      r.multiplyScalar(Math.sqrt(3) * this._terrainSize / r.length());
      r.applyMatrix4(this._matrix);
      r.sub(this._cam);
      return r.length() < 2 * node.size;
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