import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.112.1/build/three.module.js';
import {
  GUI
} from 'https://cdn.jsdelivr.net/npm/three@0.112.1/examples/jsm/libs/dat.gui.module.js';
import {
  OrbitControls
} from 'https://cdn.jsdelivr.net/npm/three@0.112.1/examples/jsm/controls/OrbitControls.js';
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
const TERRAIN_SIZE = 25000;

class Terrain {
  constructor(params) {
    this._terrainSize = TERRAIN_SIZE;
    this.sides = [];
    this.MakeSides(params);
  }

  MakeSides(params) {
    const group = new THREE.Group();
    params.scene.add(group);

    let m;
    const rotations = [];
    //top
    m = new THREE.Matrix4();
    m.makeRotationX(-Math.PI / 2);
    rotations.push({
      m,
      tx: -1,
      ty: 0,
    });

    m = new THREE.Matrix4();
    rotations.push({
      m,
      tx: 0,
      ty: 0
    });

    m = new THREE.Matrix4();
    m.makeRotationX(Math.PI / 2);
    rotations.push({
      m,
      tx: 1,
      ty: 0
    });
   //backside
    m = new THREE.Matrix4();
    m.makeRotationY(-Math.PI);
    rotations.push({
      m,
      tx: 0,
      ty: -2
    });

    m = new THREE.Matrix4();
    m.makeRotationY(Math.PI / 2);
    rotations.push({
      m,
      tx: 0,
      ty: 1
    });

    m = new THREE.Matrix4();
    m.makeRotationY(-Math.PI / 2);
    rotations.push({
      m,
      tx: 0,
      ty: -1
    });

    for (let rot of rotations)
      this.sides.push(new quadtree.QuadTree({
        terrainSize: this._terrainSize,
        group: group,
        camPos: params.camPos,
        matrix: rot,
      }));
  }

  Update(timeInSeconds) {
    for (let side of this.sides){
      side.Rebuild(side._root);
      side.Update(side._root);
    }
  }

}

class ProceduralTerrain_Demo extends game.Game {
  constructor() {
    super();
  }

  _CreateControls() {
    const controls = new OrbitControls(
      this._graphics._camera, this._graphics._threejs.domElement);
    controls.target.set(0, 50, 0);
    controls.object.position.set(475, 345, 900);
    controls.update();
    return controls;
  }

  _OnInitialize() {
    //this._CreateGUI();
    //this._CreateControls();
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