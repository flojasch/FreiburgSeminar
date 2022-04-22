import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.112.1/build/three.module.js';

export const graphics = (function () {

  class _Graphics {
    constructor(game) {}

    Initialize() {

      this._threejs = new THREE.WebGLRenderer({
        antialias: true,
      });
      this._threejs.setPixelRatio(window.devicePixelRatio);
      this._threejs.setSize(window.innerWidth, window.innerHeight);

      const target = document.getElementById('target');
      target.appendChild(this._threejs.domElement);

      window.addEventListener('resize', () => {
        this._OnWindowResize();
      }, false);

      const fov = 75;
      const aspect = window.innerWidth / window.innerHeight;
      const near = 0.1;
      const far = 500000.0;
      this._camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
      const x = 0; //+Math.random() * 100;
      const y = 5000; //+Math.random() * 100;
      const z = 20000; //+Math.random() * 100;
      this._camera.position.set(x, y, z);
      
      this._scene = new THREE.Scene();
      this._scene.add(this._camera);
      this._CreateLights();

      return true;
    }

    _CreateLights() {
      this.directionalLight = new THREE.DirectionalLight(0x808080, 1.0);
      this.directionalLight.position.set(-100, -100, -100);
      this.directionalLight.target.position.set(0, 0, 0);
      this._scene.add(this.directionalLight);
  
      this.ambientlight = new THREE.AmbientLight(0x808080, 0.5);
      this._scene.add(this.ambientlight);
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

    Render() {
      this._threejs.render(this._scene, this._camera);
    }
  }

  return {
    Graphics: _Graphics,
  };
})();