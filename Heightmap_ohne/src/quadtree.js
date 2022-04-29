import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.112.1/build/three.module.js';

import {
  math
} from './math.js';
import {
  graphics
} from './graphics.js';

export const quadtree = (function () {

  const MIN_SIZE = 50;
  const HEIGHT = 500;
  const TERRAIN_SIZE = 10000;

  class Heightmap {
    constructor(img) {
      this._data = graphics.GetImageData(img);
    }

    Get(x, y) {
      const _GetPixelAsFloat = (x, y) => {
        const position = (x + this._data.width * y) * 4;
        const data = this._data.data;
        return data[position] / 255.0;
      }

      // Bilinear filter

      const dimensions = new THREE.Vector2(TERRAIN_SIZE, TERRAIN_SIZE);

      const xf = 1-math.sat((x+TERRAIN_SIZE/2) / dimensions.x);
      const yf = math.sat((y+TERRAIN_SIZE/2) / dimensions.y);
      const w = this._data.width - 1;
      const h = this._data.height - 1;

      const x1 = Math.floor(xf * w);
      const y1 = Math.floor(yf * h);
      const x2 = math.clamp(x1 + 1, 0, w);
      const y2 = math.clamp(y1 + 1, 0, h);

      const xp = xf * w - x1;
      const yp = yf * h - y1;

      const p11 = _GetPixelAsFloat(x1, y1);
      const p21 = _GetPixelAsFloat(x2, y1);
      const p12 = _GetPixelAsFloat(x1, y2);
      const p22 = _GetPixelAsFloat(x2, y2);

      const px1 = math.lerp(xp, p11, p21);
      const px2 = math.lerp(xp, p12, p22);

      return math.lerp(yp, px1, px2) * HEIGHT;
    }
  }

  class TerrainChunk {
    constructor(params) {
      this._params = params;
      this._offset = params.offset;
      this._heightmap = params.heightmap;
      this._height = HEIGHT;
      this._power = 0.5;
      this._res = 100;
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
      const GRAY = new THREE.Color(0xFFFFFF);
      let a = sat(h / this._height);
      let vc = new THREE.Color(0x46b00c);
      vc.lerp(GRAY, a);
      vertexColours.push(vc);
    }

    Rebuild() {
      const heights = [];
      for (let k in this._plane.geometry.vertices) {
        const v = this._plane.geometry.vertices[k];
        if (this._heightmap != undefined)
          v.z = this._heightmap.Get(v.x + this._offset.x, v.y + this._offset.y);
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

  }

  class QuadTree {
    constructor(terrain) {
      this._terrain = terrain;
      this._cam = terrain._camera.position;
      this._root = {
        children: [],
        x: 0.0,
        y: 0.0,
        size: terrain._terrainSize,
      };
      this.loadImage();
      this.Grow(this._root);
    }

    loadImage() {
      const loader = new THREE.TextureLoader(this._manager);
      loader.load('./resources/seealpen.png', (result) => {
        this.setHeightmap(result.image);
      });
    }

    setHeightmap(img) {
      this._heightmap = new Heightmap(img);
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
          heightmap: this._heightmap,
          offset: new THREE.Vector3(node.x, node.y, 0),
          size: 2 * node.size,
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