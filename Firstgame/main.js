import * as THREE from 'https://threejsfundamentals.org/threejs/resources/threejs/r132/build/three.module.js';
import {
  GLTFLoader
} from 'https://threejsfundamentals.org/threejs/resources/threejs/r132/examples/jsm/loaders/GLTFLoader.js';

import{
  control
} from './controls.js'

class FirstGame {
  constructor() {
    this._renderer = new THREE.WebGLRenderer({
      antialias: true,
    });
    this._renderer.setPixelRatio(window.devicePixelRatio);
    this._renderer.setSize(window.innerWidth, window.innerHeight);

    document.body.appendChild(this._renderer.domElement);

    window.addEventListener('resize', () => {
      this._OnWindowResize();
    }, false);

    this._model = new THREE.Object3D();
    this._scene = new THREE.Scene();
  
    this._Init();
    this._RAF();
  }

  _Init() {
    this._SetCamera();
    this._SetLight();
    this._SetBackground();
    this._SetModel();
    this._SetEarth();
  }

  _SetCamera() {
    const fov = 75;
    const aspect = window.innerWidth/window.innerHeight;
    const near = 0.1;
    const far = 1000;
    this._camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    this._camera.position.set(0,0,50);
    this._camera.add(this._model);
    this._scene.add(this._camera);
    this._control = new control.Controls(this._camera);
  }

  _SetLight() {
    const dirLight = new THREE.DirectionalLight(0xFFFFFF, 1);
    dirLight.position.set(-1, 2, 4);
    this._scene.add(dirLight);
    const ambLight = new THREE.AmbientLight(0xFFFFFF, 0.2);
    this._scene.add(ambLight);
  }

  _SetBackground() {
    const bgloader = new THREE.CubeTextureLoader();
    const bgtexture = bgloader.load([
      './images/space-posx.jpg',
      './images/space-negx.jpg',
      './images/space-posy.jpg',
      './images/space-negy.jpg',
      './images/space-posz.jpg',
      './images/space-negz.jpg',
    ]);
    this._scene.background = bgtexture;
  }

  _SetModel() {
    const Gltfloader = new GLTFLoader();
    Gltfloader.load('./models/scene.gltf', (gltf) => {
      gltf.scene.scale.set(0.54, 0.54, 0.54);
      gltf.scene.rotation.y = Math.PI;
      gltf.scene.position.set(0, -1.6, -4.5);
      this._model.add(gltf.scene);
    });
  }

  _SetEarth() {
    const geometry = new THREE.SphereGeometry(10, 40, 40);
    const loader = new THREE.TextureLoader();
    const texture = loader.load("images/earth.jpg");
    const material = new THREE.MeshPhongMaterial({
      map: texture
    });
    const earth = new THREE.Mesh(geometry, material);
    this._scene.add(earth);
  }

  _RAF() {
    requestAnimationFrame((time) => {
      this._Render(time);
    });
  }

  _Render(timeInMs) {
    this._control.Update();
    this._renderer.render(this._scene, this._camera);
    this._RAF();
  }

  _OnWindowResize() {
    this._camera.aspect = window.innerWidth / window.innerHeight;
    this._camera.updateProjectionMatrix();
    this._renderer.setSize(window.innerWidth, window.innerHeight);
  }
  
}

const _APP = new FirstGame();