import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.112.1/build/three.module.js';

import {
  math
} from './math.js';

export const quadtree = (function () {

  const MIN_SIZE = 128;
  const RESOLUTION = 64;

  class TerrainChunk {
    constructor(params) {
      this._params = params;
      this._matrix = params.matrix;
      this._position = params.chunkPos;
      this._res = RESOLUTION;
      this._size = params.size;
      this._terrainSize = params.terrainSize;
      this._relHeight = params.relHeight;
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
      let vc = new THREE.Color(0x0f4fb8);
      if (h > 0.0) {
        const GRAY = new THREE.Color(0xaaaaaa);
        let a = sat(h);
        vc = new THREE.Color(0x4b8f17);
        vc.lerp(GRAY, a);
      }

      vertexColours.push(vc);
    }

    Rebuild() {
      const heights = [];
      for (let k in this._plane.geometry.vertices) {
        const v = this._plane.geometry.vertices[k];
        v.add(this._position);
        v.normalize();
        v.applyMatrix4(this._matrix);

        let height = math.weierstrass(v.x, v.y, v.z);
        v.multiplyScalar(this._terrainSize * (Math.sqrt(3) + this._relHeight * height));
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

  }

  class QuadTree {
    constructor(params) {
      this._terrainSize = params.terrainSize;
      this._relHeight=params.relHeight;
      this._group = params.group;
      this._cam = params.camPos;
      this._matrix = params.matrix.m;
      this._tx = params.matrix.tx;
      this._ty = params.matrix.ty;
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
          relHeight: this._relHeight,
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