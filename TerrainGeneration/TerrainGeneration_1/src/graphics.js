import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.112.1/build/three.module.js';
import Stats from 'https://cdn.jsdelivr.net/npm/three@0.112.1/examples/jsm/libs/stats.module.js';

export const graphics = {
  Graphics: class  {
  constructor(game) {

  }

  Initialize() {

    this._threejs = new THREE.WebGLRenderer({
      antialias: true,
    });
    this._threejs.setPixelRatio(window.devicePixelRatio);
    this._threejs.setSize(window.innerWidth, window.innerHeight);

    const target = document.getElementById('target');
    target.appendChild(this._threejs.domElement);

    this._stats = new Stats();
    target.appendChild(this._stats.dom);

    window.addEventListener('resize', () => {
      this._OnWindowResize();
    }, false);

    const fov = 60;
    const aspect = window.innerWidth / window.innerHeight;
    const near = 0.1;
    const far = 50000.0;
    this._camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    this._camera.position.set(0., 2000., 5000.);

    this._scene = new THREE.Scene();
    this._scene.background = new THREE.Color(0xaaaaaa);

    this._CreateLights();

    return true;
  }

  _CreateLights() {
    let light = new THREE.DirectionalLight(0x808080, 1, 100);
    light.position.set(-100, 100, -100);
    light.target.position.set(0, 0, 0);
    light.castShadow = false;
    this._scene.add(light);

    light = new THREE.DirectionalLight(0x404040, 1, 100);
    light.position.set(100, 100, -100);
    light.target.position.set(0, 0, 0);
    light.castShadow = false;
    this._scene.add(light);
  }

  _OnWindowResize() {
    this._camera.aspect = window.innerWidth / window.innerHeight;
    this._camera.updateProjectionMatrix();
    this._threejs.setSize(window.innerWidth, window.innerHeight);
  }

  get Scene() {
    return this._scene;
  }

  get Camera() {
    return this._camera;
  }

  Render(timeInSeconds) { //10
    this._threejs.render(this._scene, this._camera);
    this._stats.update();
  }
}

};