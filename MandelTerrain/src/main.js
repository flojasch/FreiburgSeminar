import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.117.1/build/three.module.js';
import {
  GUI
} from 'https://cdn.jsdelivr.net/npm/three@0.117.1/examples/jsm/libs/dat.gui.module.js';
import {Water} from 'https://cdn.jsdelivr.net/npm/three@0.117.1/examples/jsm/objects/Water.js';

import {sky} from './sky.js';

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

class WaterSurf {
  constructor(params) {
    this._camPos = params.camPos;
    this._Init(params);
  }
  _Init(params) {
    const waterGeometry = new THREE.PlaneBufferGeometry(10000, 10000, 100, 100);

    this._water = new Water(
      waterGeometry, {
        textureWidth: 2048,
        textureHeight: 2048,
        waterNormals: new THREE.TextureLoader().load('resources/waternormals.jpg', function (texture) {
          texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        }),
        alpha: 0.5,
        sunDirection: new THREE.Vector3(1, 0, 0),
        sunColor: 0xffffff,
        waterColor: 0x001e0f,
        distortionScale: 0.0,
        fog: undefined
      }
    );
    this._water.rotation.x = -Math.PI / 2;
    this._water.position.y = 0.0;
    params.scene.add(this._water);
  }
  Update(timeInSeconds) {
    this._water.material.uniforms['time'].value += timeInSeconds;

    this._water.position.x = this._camPos.x;
    this._water.position.z = this._camPos.z;
  }
  
}

class Terrain {
  constructor(params) {
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
      power: 0.5,
      height:10,
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

    this.quadTree = new quadtree.QuadTree(this);
  }

  Update(timeInSeconds) {
    this.quadTree.Rebuild(this.quadTree._root);
    this.quadTree.Update(this.quadTree._root);
  }

}

class ProceduralTerrain_Demo extends game.Game {
  constructor() {
    super();
  }

  _OnInitialize() {
    this._CreateGUI();

    this._entities['_terrain'] = new Terrain({
      scene: this._graphics.Scene,
      camera: this._graphics._camera,
      gui: this._gui,
      guiParams: this._guiParams,
    });

    this._entities['_water'] = new WaterSurf({
      scene: this._graphics._scene,
      camPos: this._graphics._camera.position,
    });
    // this._entities['_sky'] = new sky.TerrainSky({
    //   camera: this._graphics.Camera,
    //   scene: this._graphics.Scene,
    //   gui: this._gui,
    //   guiParams: this._guiParams,
    // });

    this._entities['control'] = new controls.Controls({
      _camera: this._graphics._camera
    });

  }

  _CreateGUI() {
    this._guiParams = {};
    this._gui = new GUI();
    this._gui.close();
  }

  _OnStep(timeInSeconds) {}
}

function _Main() {
  _APP = new ProceduralTerrain_Demo();
}

_Main();