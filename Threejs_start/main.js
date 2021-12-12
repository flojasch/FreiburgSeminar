import * as THREE from 'https://threejsfundamentals.org/threejs/resources/threejs/r132/build/three.module.js';
import {
  GLTFLoader
} from 'https://threejsfundamentals.org/threejs/resources/threejs/r132/examples/jsm/loaders/GLTFLoader.js';

class _Controls {
  constructor(frame) {
    this._Init(frame);
  }

  _Init(frame) {
    this.frame = frame;
    this._move = {
      left: false,
      right: false,
      up: false,
      down: false,
      tleft: false,
      tright: false,
      forward: false,
      backward: false,
    }

    document.addEventListener('keydown', (e) => this._onKeyDown(e), false);
    document.addEventListener('keyup', (e) => this._onKeyUp(e), false);
  }

  _onKeyDown(event) {
    switch (event.keyCode) {
      case 37: // keyleft
        this._move.left = true;
        break;
      case 38: // keyup
        this._move.up = true;
        break;
      case 39: // keyright
        this._move.right = true;
        break;
      case 40: // keydown
        this._move.down = true;
        break;
      case 65: // a
        this._move.tleft = true;
        break;
      case 68: //d
        this._move.tright = true;
        break;
      case 87: //w
        this._move.forward = true;
        break;
      case 83: //s
        this._move.backward = true;
        break;
      case 32: //space
        this._move.fire = true;
        break;

    }
  }

  _onKeyUp(event) {
    switch (event.keyCode) {
      case 37: // keyleft
        this._move.left = false;
        break;
      case 38: // keyup
        this._move.up = false;
        break;
      case 39: // keyright
        this._move.right = false;
        break;
      case 40: // keydown
        this._move.down = false;
        break;
      case 65: // a
        this._move.tleft = false;
        break;
      case 68: //d
        this._move.tright = false;
        break;
      case 87: //w
        this._move.forward = false;
        break;
      case 83: //s
        this._move.backward = false;
        break;
      case 32: //space
        this._move.fire = false;
        break;
    }
  }

  Update() {
    const ang = 0.01;
    const cameraFrame = this.frame;
    const _Q = new THREE.Quaternion();
    const _A = new THREE.Vector3();
    const _R = cameraFrame.quaternion.clone();
    const _vel = new THREE.Vector3(0, 0, .4);
    _vel.applyQuaternion(_R);
    _vel.multiplyScalar(2);
    if (this._move.left) {
      _A.set(0, 1, 0);
      _Q.setFromAxisAngle(_A, ang);
      _R.multiply(_Q);
    }
    if (this._move.right) {
      _A.set(0, 1, 0);
      _Q.setFromAxisAngle(_A, -ang);
      _R.multiply(_Q);
    }
    if (this._move.up) {
      _A.set(1, 0, 0);
      _Q.setFromAxisAngle(_A, ang);
      _R.multiply(_Q);
    }
    if (this._move.down) {
      _A.set(1, 0, 0);
      _Q.setFromAxisAngle(_A, -ang);
      _R.multiply(_Q);
    }
    if (this._move.tleft) {
      _A.set(0, 0, 1);
      _Q.setFromAxisAngle(_A, ang);
      _R.multiply(_Q);
    }
    if (this._move.tright) {
      _A.set(0, 0, 1);
      _Q.setFromAxisAngle(_A, -ang);
      _R.multiply(_Q);
    }
    if (this._move.forward) {
      cameraFrame.position.sub(_vel);
    }
    if (this._move.backward) {
      cameraFrame.position.add(_vel);
    }
    cameraFrame.quaternion.copy(_R);

  }
}

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

    this._camFrame = new THREE.Group();
    this._camFrame.position.set(0, 0, 50);
    this._model = new THREE.Object3D();
    this._camFrame.add(this._model);
    this._scene = new THREE.Scene();
    this._scene.add(this._camFrame);
    this._control = new _Controls(this._camFrame);
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
    const aspect = 2;
    const near = 0.1;
    const far = 1000;
    this._camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    this._camFrame.add(this._camera);
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