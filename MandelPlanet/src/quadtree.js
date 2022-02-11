import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.112.1/build/three.module.js';

export const cubequadtree = (function () {


  const MIN_SIZE = 25;
  const HEIGHT = 10;

  class TerrainChunk {
    constructor(params) {
      this.group = params.group;
      this.transform = params.transform;
      this.offset = params.offset;
      this.height = HEIGHT;
      this.power = 0.5;
      this.res = 50;
      this.size = params.size;
      this.terrainSize = params.terrainSize;
      this.Init();
    }
    Destroy() {
      this.group.remove(this.plane);
    }

    Init() {
      const geometry=new THREE.PlaneGeometry(this.size, this.size, this.res, this.res);
      geometry.applyMatrix4(this.transform);  
      this.plane = new THREE.Mesh(
        geometry,
        new THREE.MeshStandardMaterial({
          wireframe: false,
          color: 0xFFFFFF,
          side: THREE.FrontSide,
          vertexColors: THREE.VertexColors,
        }));
      this.plane.position.add(this.offset);
      this.plane.castShadow = false;
      this.plane.receiveShadow = true;
      
      this.group.add(this.plane);
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
      for (let k in this.plane.geometry.vertices) {
        const v = this.plane.geometry.vertices[k];
        v.z = this.setHeight(v.x + this.offset.x, v.y + this.offset.y);
        heights.push(v.z);
      }

      for (let f of this.plane.geometry.faces) {
        const vertexColours = [];

        this.setColor(heights[f.a], vertexColours);
        this.setColor(heights[f.b], vertexColours);
        this.setColor(heights[f.c], vertexColours);

        f.vertexColors = vertexColours;
      }
      this.plane.geometry.elementsNeedUpdate = true;

      this.plane.geometry.verticesNeedUpdate = true;
      this.plane.geometry.computeVertexNormals();
    }

    setHeight(j, i) {
      const R = 1024;
      const maxiter = 100;
      let x = 0,
        y = 0,
        cx, cy, xx, yy, r = 0,
        n;
      let dx = 0,
        dy = 0;
      cx = i * 3. / this.terrainSize - 0.7;
      cy = j * 3. / this.terrainSize;
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
      const pow = Math.pow(d, this.power);
      return this.height * pow;
    }

  }

  class QuadTree {
    constructor(params) {
      this.group = params.group;
      this.camPos = params.camPos;
      this.transform = params.transform;
      this.root = {
        children: [],
        x: 0.0,
        y: 0.0,
        size: params.terrainSize,
      };
      this.Grow(this.root);
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
          group: this.group,
          offset: new THREE.Vector3(node.x, node.y, 0),
          size: 2 * node.size,
          terrainSize: this.terrainSize,
          transform: this.transform,
        });
      }
    }

    isClose(node) {
      let x = this.camPos.x - node.x;
      let y = this.camPos.z + node.y;
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

  class CubeQuadTree {
    constructor(params) {
      this.group = params.group;
      this.camPos = params.camPos;
      this.terrainSize = params.terrainSize;
      this.sides = [];

      const r = this.terrainSize;
      let m;

      const transforms = [];

      // +Y
      m = new THREE.Matrix4();
      m.makeRotationX(-Math.PI / 2);
      m.premultiply(new THREE.Matrix4().makeTranslation(0, r, 0));
      transforms.push(m);

      // -Y
      m = new THREE.Matrix4();
      m.makeRotationX(Math.PI / 2);
      m.premultiply(new THREE.Matrix4().makeTranslation(0, -r, 0));
      transforms.push(m);

      // +X
      m = new THREE.Matrix4();
      m.makeRotationY(Math.PI / 2);
      m.premultiply(new THREE.Matrix4().makeTranslation(r, 0, 0));
      transforms.push(m);

      // -X
      m = new THREE.Matrix4();
      m.makeRotationY(-Math.PI / 2);
      m.premultiply(new THREE.Matrix4().makeTranslation(-r, 0, 0));
      transforms.push(m);

      // +Z
      m = new THREE.Matrix4();
      m.premultiply(new THREE.Matrix4().makeTranslation(0, 0, r));
      transforms.push(m);

      // -Z
      m = new THREE.Matrix4();
      m.makeRotationY(Math.PI);
      m.premultiply(new THREE.Matrix4().makeTranslation(0, 0, -r));
      transforms.push(m);

      for (let t of transforms) {
        this.sides.push(new QuadTree({
          group: this.group,
          camPos: this.camPos,
          terrainSize: this.terrainSize,
          transform: t,
        }));
      }
    }
    Update() {
      for (let side of this.sides) {
        side.Rebuild(side.root);
        side.Update(side.root);
      }
    }
  }

  return {
    CubeQuadTree: CubeQuadTree
  }
})();