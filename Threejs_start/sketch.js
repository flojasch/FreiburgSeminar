import * as THREE from 'https://threejsfundamentals.org/threejs/resources/threejs/r132/build/three.module.js';
import {
  GLTFLoader
} from 'https://threejsfundamentals.org/threejs/resources/threejs/r132/examples/jsm/loaders/GLTFLoader.js';
import {
  OrbitControls
} from 'https://threejs.org/examples/jsm/controls/OrbitControls.js';

class Planet {
  constructor(params) {

    this.size = params.size;
    this.speed = params.speed;
    this.file = params.file;
    this.scene = params.scene;

    this.obj.position.copy(params.pos);
    this.orb = new THREE.Object3D();
    this.orb.add(this.obj);
    this.scene.add(this.orb);
  }

  update(time) {
    this.obj.rotation.y = time;
    this.orb.rotation.y = time * this.speed;
  }
}


function main() {

  function resizeRendererToDisplaySize(renderer) {
    const canvas = renderer.domElement;
    const pixelRatio = window.devicePixelRatio;
    const width = (canvas.clientWidth * pixelRatio) | 0;
    const height = (canvas.clientHeight * pixelRatio) | 0;
    const needResize = canvas.width !== width || canvas.height !== height;
    if (needResize) {
      renderer.setSize(width, height, false);
    }
    return needResize;
  }

  const canvas = document.querySelector('#c');
  const renderer = new THREE.WebGLRenderer({
    canvas
  });

  const fov = 75;
  const aspect = 2; // the canvas default
  const near = 1;
  const far = 1000;
  const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
  const scene = new THREE.Scene();

  const orbcontr = new OrbitControls(camera, canvas);
  orbcontr.target.set(0, 0, -10);
  orbcontr.update();

  const color = 0xFFFFFF;
  let intensity = 1;
  let light = new THREE.DirectionalLight(color, intensity);
  light.position.set(-1, 2, 4);
  scene.add(light);
  intensity = 0.1;
  light = new THREE.AmbientLight(color, intensity);
  scene.add(light);

  const bgloader = new THREE.CubeTextureLoader();
  const bgtexture = bgloader.load([
    './images/space-posx.jpg',
    './images/space-negx.jpg',
    './images/space-posy.jpg',
    './images/space-negy.jpg',
    './images/space-posz.jpg',
    './images/space-negz.jpg',
  ]);
  scene.background = bgtexture;

  const xWing = new THREE.Object3D();
  const cameraFrame = new THREE.Object3D();
  cameraFrame.add(camera);
  const Gltfloader = new GLTFLoader();
  Gltfloader.load('./models/scene.gltf', (gltf) => {
    gltf.scene.scale.set(0.54, 0.54, 0.54);
    gltf.scene.rotation.y = Math.PI;
    gltf.scene.position.set(0, -0.1, -1.5);
    xWing.add(gltf.scene);
  });

  cameraFrame.add(xWing);
  xWing.position.set(0, -1.5, -3);
  cameraFrame.position.set(0, 0, 50);
  scene.add(cameraFrame);

  // Hier wird die Erde hinzugefügt
  const geometry = new THREE.SphereGeometry(10, 40, 40);
  const loader = new THREE.TextureLoader();
  const texture = loader.load("images/earth.jpg");
  const material = new THREE.MeshPhongMaterial({
    map: texture
  });
  const earth = new THREE.Mesh(geometry, material);
  scene.add(earth);

  function render(time) {
    time *= 0.001;

    if (resizeRendererToDisplaySize(renderer)) {
      const canvas = renderer.domElement;
      camera.aspect = canvas.clientWidth / canvas.clientHeight;
      camera.updateProjectionMatrix();
    }
    renderer.render(scene, camera);

    requestAnimationFrame(render);
  }
  requestAnimationFrame(render);

}

main();