import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.112.1/build/three.module.js';
import {
  GUI
} from 'https://cdn.jsdelivr.net/npm/three@0.112.1/examples/jsm/libs/dat.gui.module.js';
import {
  sky
} from './sky.js';
import {
  game
} from './game.js';
import {
  controls
} from './controls.js';

import {
  terrain
} from './terrain.js';

let _APP = null;

class Terrain {
  constructor(params) {
    this._camera = params.camera;
    this._camSec = new THREE.Vector3();
    this._InitTerrain(params);
  }

  _InitTerrain(params) {
    params.guiParams.terrain = {
      wireframe: false,
      height: 2000,
    };

    this._group = new THREE.Group()
    this._group.rotation.x = -Math.PI / 2;
    params.scene.add(this._group);

    const terrainRollup = params.gui.addFolder('Terrain');
    terrainRollup.add(params.guiParams.terrain, "wireframe").onChange(() => {
      this.terrainChunk._plane.material.wireframe = params.guiParams.terrain.wireframe;
    });
    terrainRollup.add(params.guiParams.terrain, "height", 0.1, 5000).onChange(
      () => {
        this.terrainChunk._height = params.guiParams.terrain.height;
        this.terrainChunk.loadImage();
      });

    this.terrainChunk = new terrain.TerrainChunk({
      group: this._group,
    });
  }

  Update(timeInSeconds) {

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

    this._entities['_sky'] = new sky.TerrainSky({
      camera: this._graphics.Camera,
      scene: this._graphics.Scene,
      gui: this._gui,
      guiParams: this._guiParams,
    });

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