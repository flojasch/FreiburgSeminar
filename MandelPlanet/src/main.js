import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.112.1/build/three.module.js';
import {
  game
} from './game.js';
import {
  controls
} from './controls.js';
import {
  cubequadtree
} from './quadtree.js';

let _APP = null;
const TERRAIN_SIZE = 500;

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

    this._group = new THREE.Group()
    this._group.rotation.x = -Math.PI / 2;
    params.scene.add(this._group);

    this.CubeQuadTree = new cubequadtree.CubeQuadTree(this);
  }

  Update(timeInSeconds) {
    this.CubeQuadTree.Rebuild(this.CubeQuadTree._root);
    this.CubeQuadTree.Update(this.CubeQuadTree._root);
  }

}

class ProceduralTerrain_Demo extends game.Game {
  constructor() {
    super();
  }

  _OnInitialize() {

    this._entities['_terrain'] = new Terrain({
      scene: this._graphics.Scene,
      camera: this._graphics._camera,
      gui: this._gui,
      guiParams: this._guiParams,
    });

    this._entities['control'] = new controls.Controls({
      _camera: this._graphics._camera
    });

  }

  _OnStep(timeInSeconds) {}
}

function _Main() {
  _APP = new ProceduralTerrain_Demo();
}

_Main();