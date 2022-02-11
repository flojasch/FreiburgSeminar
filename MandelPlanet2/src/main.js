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
  quadtree
} from './quadtree.js';


let _APP = null;
const TERRAIN_SIZE = 100;

class UpSide {
  constructor(params) {
    this._group = new THREE.Group()
    this._group.rotation.x = -Math.PI / 2;
    params.scene.add(this._group);
    this.quadTree = new quadtree.QuadTree({
      terrainSize: params.terrainSize,
      group: this._group,
      camPos: params.camPos,
    });
  }
}
class FrontSide {
  constructor(params) {
    this._group = new THREE.Group()
    this._group.position.z=params.terrainSize;
    this._group.position.y=-params.terrainSize;
    this._group.rotation.x=-Math.PI;
    
    params.scene.add(this._group);
    this.quadTree = new quadtree.QuadTree({
      terrainSize: params.terrainSize,
      group: this._group,
      camPos: params.camPos,
    });
  }
}

class Terrain {
  constructor(params) {
    this._terrainSize = TERRAIN_SIZE;
    this._sides = [];
    this._InitTerrain(params);

  }

  _InitTerrain(params) {
    this._sides.push(new UpSide({
      scene: params.scene,
      camPos: params.camPos,
      terrainSize: this._terrainSize
    }));
    this._sides.push(new FrontSide({
      scene: params.scene,
      camPos: params.camPos,
      terrainSize: this._terrainSize
    }));

  }

  Update(timeInSeconds) {
    for (let side of this._sides) {
      side.quadTree.Rebuild(side.quadTree._root);
      side.quadTree.Update(side.quadTree._root);
    }
  }

}

class ProceduralTerrain_Demo extends game.Game {
  constructor() {
    super();
  }

  _OnInitialize() {
    //this._CreateGUI();

    this._entities['_terrain'] = new Terrain({
      scene: this._graphics.Scene,
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