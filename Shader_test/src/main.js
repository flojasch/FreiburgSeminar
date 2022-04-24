import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118/build/three.module.js';

import {
  game
} from './game.js';
import {
  controls
} from './controls.js';
import {
  quadtree
} from './quadtree.js';
import {
  sky
} from './sky.js';

let _APP = null;

class Terrain {
  constructor(params) {
    this._terrainSize = params.terrainSize;
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
    for (let side of this.sides) {
      side.Rebuild(side._root);
      side.Update(side._root);
    }
  }

}

class ProceduralTerrain_Demo extends game.Game {
  constructor() {
    super();
  }

  _OnInitialize() {
    this.terrainSize=200;
    this._entities['_terrain'] = new Terrain({
      scene: this._graphics.Scene,
      camPos: this._graphics._camera.position,
      terrainSize: this.terrainSize,
    });

    // this._entities['_sky'] = new sky.TerrainSky({
    //   camPos: this._graphics._camera.position,
    //   scene: this._graphics.Scene,
    //   terrainSize: this.terrainSize,
    // });
   
    this._entities['control'] = new controls.Controls({
      _camera: this._graphics._camera
    });
    this._LoadBackground();
  }

  _LoadBackground() {
    this._graphics.Scene.background = new THREE.Color(0x000000);
    const loader = new THREE.CubeTextureLoader();
    const texture = loader.load([
      './resources/space-posx.jpg',
      './resources/space-negx.jpg',
      './resources/space-posy.jpg',
      './resources/space-negy.jpg',
      './resources/space-posz.jpg',
      './resources/space-negz.jpg',
    ]);
    this._graphics._scene.background = texture;
  }

  _OnStep(timeInSeconds) {}
}

function _Main() {
  _APP = new ProceduralTerrain_Demo();
}

_Main();