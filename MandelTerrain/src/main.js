import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.112.1/build/three.module.js';
import {
  GUI
} from 'https://cdn.jsdelivr.net/npm/three@0.112.1/examples/jsm/libs/dat.gui.module.js';
import {
  Sky
} from 'https://cdn.jsdelivr.net/npm/three@0.112.1/examples/jsm/objects/Sky.js';
import {
  game
} from './game.js';

import {
  controls
} from './controls.js';

import {
  quadtree
} from './quadtree.js';


let _APP = null;
const HEIGHT = 100;
const TERRAIN_SIZE = 5000;

class TerrainSky {
  constructor(params) {
    this._Init(params);
  }

  _Init(params) {
    this._sky = new Sky();
    this._sky.scale.setScalar(10000);
    params.scene.add(this._sky);

    params.guiParams.sky = {
      turbidity: 10.0,
      rayleigh: 2,
      mieCoefficient: 0.005,
      mieDirectionalG: 0.8,
      luminance: 1,
    };

    params.guiParams.sun = {
      inclination: 0.31,
      azimuth: 0.25,
    };

    const onShaderChange = () => {
      for (let k in params.guiParams.sky) {
        this._sky.material.uniforms[k].value = params.guiParams.sky[k];
      }
    };

    const onSunChange = () => {
      var theta = Math.PI * (params.guiParams.sun.inclination - 0.5);
      var phi = 2 * Math.PI * (params.guiParams.sun.azimuth - 0.5);

      const sunPosition = new THREE.Vector3();
      sunPosition.x = Math.cos(phi);
      sunPosition.y = Math.sin(phi) * Math.sin(theta);
      sunPosition.z = Math.sin(phi) * Math.cos(theta);

      this._sky.material.uniforms['sunPosition'].value.copy(sunPosition);
    };

    const skyRollup = params.gui.addFolder('Sky');
    skyRollup.add(params.guiParams.sky, "turbidity", 0.1, 30.0).onChange(
      onShaderChange);
    skyRollup.add(params.guiParams.sky, "rayleigh", 0.1, 4.0).onChange(
      onShaderChange);
    skyRollup.add(params.guiParams.sky, "mieCoefficient", 0.0001, 0.1).onChange(
      onShaderChange);
    skyRollup.add(params.guiParams.sky, "mieDirectionalG", 0.0, 1.0).onChange(
      onShaderChange);
    skyRollup.add(params.guiParams.sky, "luminance", 0.0, 2.0).onChange(
      onShaderChange);

    const sunRollup = params.gui.addFolder('Sun');
    sunRollup.add(params.guiParams.sun, "inclination", 0.0, 1.0).onChange(
      onSunChange);
    sunRollup.add(params.guiParams.sun, "azimuth", 0.0, 1.0).onChange(
      onSunChange);

    onShaderChange();
    onSunChange();
  }

  Update(timeInSeconds) {}
}

class TerrainChunk {
  constructor(params) {
    this._params = params;
    this._offset = params.offset;
    this._height = HEIGHT;
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

  sat(x) {
    return Math.min(Math.max(x, 0.0), 1.0);
  }
  setColor(h, vertexColours) {
    const GREEN = new THREE.Color(0x46b00c);
    let a = this.sat(h / this._height);
    let vc = new THREE.Color(0xFFFFFF);
    vc.lerp(GREEN, a);
    vertexColours.push(vc);
  }
  Rebuild() {
    const heights = [];
    for (let k in this._plane.geometry.vertices) {
      const v = this._plane.geometry.vertices[k];
      v.z = this.setHeight(v.x + this._offset.x, v.y + this._offset.y);
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
  setHeight(j, i) {
    const R = 1024;
    const maxiter = 100;
    let x = 0,
      y = 0,
      cx, cy, xx, yy, r = 0,
      n;
    let dx = 0,
      dy = 0;
    cx = i * 3. / this._params.terrainSize - 0.7;
    cy = j * 3. / this._params.terrainSize;
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

class Terrain {
  constructor(params) {
    this._terrainSize = TERRAIN_SIZE;
    this._camera = params.camera;
    this._camSec = new THREE.Vector3();
    this._Init(params);
  }

  _Init(params) {
    this._InitTerrain(params);
  }

  _InitTerrain(params) {
    params.guiParams.terrain = {
      wireframe: false,
    };
    params.guiParams.mandel = {
      height: HEIGHT,
      power: 0.5,
    };

    this._group = new THREE.Group()
    this._group.rotation.x = -Math.PI / 2;
    params.scene.add(this._group);

    const terrainRollup = params.gui.addFolder('Terrain');
    terrainRollup.add(params.guiParams.terrain, "wireframe").onChange(() => {
      for (let k in this._chunks) {
        this._chunks[k].chunk._plane.material.wireframe = params.guiParams.terrain.wireframe;
      }
    });
    const mandelRollup = params.gui.addFolder('Mandelbrot');
    mandelRollup.add(params.guiParams.mandel, "height", 0.0, 300.0).onChange(() => {
      for (let k in this._chunks) {
        this._chunks[k].chunk._height = params.guiParams.mandel.height;
        this._chunks[k].chunk.Rebuild();
      }
    });
    mandelRollup.add(params.guiParams.mandel, "power", 0.0, 2.0).onChange(() => {
      for (let k in this._chunks) {
        this._chunks[k].chunk._power = params.guiParams.mandel.power;
        this._chunks[k].chunk.Rebuild();
      }
    });

    this._InitLeaves();
  }

  _InitLeaves() {
    this.quadTree = new quadtree.QuadTree({
      cam: this._camera.position,
      size: this._terrainSize,
      x: 0,
      y: 0,
    });

    this.leaves = this.quadTree.GetLeaves();
    for (let l of this.leaves) {
      l.chunk = new TerrainChunk({
        group: this._group,
        offset: new THREE.Vector3(l.x, l.y, 0),
        size: 2 * l.size,
        terrainSize: this._terrainSize,
      });
    }
  }

  Update(timeInSeconds) {
    this._UpdateLeaves();
  }

  _UpdateLeaves() {
    for (let k = this.leaves.length - 1; k > -1; k--) {
      const l = this.leaves[k];
      const newLeaves = this.quadTree.Update(l);
      if (newLeaves.length > 0) {
        l.chunk.Destroy();
        this.leaves.splice(k, 1);

        for (let nl of newLeaves) {
          nl.chunk = new TerrainChunk({
            group: this._group,
            offset: new THREE.Vector3(nl.x, nl.y, 0),
            size: 2 * nl.size,
            terrainSize: this._terrainSize,
          });
          this.leaves.push(nl);
        }
      }
    }
  }

}

class ProceduralTerrain_Demo extends game.Game {
  constructor() {
    super();
  }

  _OnInitialize() {
    this._controls = this._CreateControls();
    this._CreateGUI();

    this._entities['_terrain'] = new Terrain({
      scene: this._graphics.Scene,
      camera: this._graphics._camera,
      gui: this._gui,
      guiParams: this._guiParams,
    });

    this._entities['_sky'] = new TerrainSky({
      scene: this._graphics.Scene,
      gui: this._gui,
      guiParams: this._guiParams,
    });
  }

  _CreateGUI() {
    this._guiParams = {};
    this._gui = new GUI();
    this._gui.close();
  }

  _CreateControls() {
    const params = {
      _camera: this._graphics._camera
    }
    this._entities['control'] = new controls.Controls(params);
  }

  _OnStep(timeInSeconds) {}
}

function _Main() {
  _APP = new ProceduralTerrain_Demo();
}

_Main();