import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.117.1/build/three.module.js';
import {
  Water
} from 'https://cdn.jsdelivr.net/npm/three@0.112.1/examples/jsm/objects/Water.js';

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
const TERRAIN_SIZE = 5000;

class WaterSurf {
  constructor(params) {
    this._camPos = params.camPos;
    this._Init(params);
  }
  _Init(params) {
    const waterSize = 5000*Math.sqrt(3)+5;
     //const geometry = new THREE.PlaneBufferGeometry(waterSize, waterSize, 100, 100);
    const geometry=new THREE.SphereBufferGeometry(waterSize,100,100);
    this._water = new Water(
      geometry, {
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

    this._water.rotation.x = -Math.PI/2 ;
    this._water.position.x=0;
    this._water.position.y=0;
    this._water.position.z=0;  
    params.scene.add(this._water);
  }
  Update(timeInSeconds) {
    this._water.material.uniforms['time'].value += timeInSeconds;
    // this._water.position.x = this._camPos.x;
    // this._water.position.z = this._camPos.z;
  
  }

}

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
    this._entities['_terrain'] = new Terrain({
      scene: this._graphics.Scene,
      camPos: this._graphics._camera.position,
    });

    this._entities['_water'] = new WaterSurf({
      scene: this._graphics._scene,
      camPos: this._graphics._camera.position,
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