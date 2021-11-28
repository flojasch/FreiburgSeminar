import * as THREE from "https://threejsfundamentals.org/threejs/resources/threejs/r132/build/three.module.js";
import {
  OBJLoader
} from 'https://threejsfundamentals.org/threejs/resources/threejs/r132/examples/jsm/loaders/OBJLoader.js';
import {
  GLTFLoader
} from 'https://threejsfundamentals.org/threejs/resources/threejs/r132/examples/jsm/loaders/GLTFLoader.js';
import {
  OrbitControls
} from 'https://threejs.org/examples/jsm/controls/OrbitControls.js';
import {
  controls
} from './controls.js'


class Planet {
  constructor(params) {
    this.name = params.name;
    this.size = params.size;
    this.speed = params.speed;
    this.file = params.file;
    if (params.isSun == 'undefined') this.isSun = false;
    else this.isSun = params.isSun;
    this.name = params.name;
    const geometry = new THREE.SphereGeometry(this.size, 40, 40);
    const texture = loader.load("images/" + this.file);
    let material;
    if (this.isSun)
      material = new THREE.MeshBasicMaterial({
        map: texture
      });
    else
      material = new THREE.MeshPhongMaterial({
        map: texture
      });
    this.obj = new THREE.Mesh(geometry, material);
    this.obj.position.copy(params.pos);
    this.orb = new THREE.Object3D();
    this.orb.add(this.obj);
    scene.add(this.orb);
    this.info = document.createElement('div');
    this.info.textContent = this.name;
    labelContainerElem.appendChild(this.info);
    this.rotateX = 0;
  }
  addChild(planet) {
    scene.remove(planet.orb);
    this.obj.add(planet.obj);
  }
  update(time) {
    this.obj.rotation.x = this.rotateX;
    this.obj.rotation.y = time;
    this.orb.rotation.y = time * this.speed;
  }
}

const canvas = document.querySelector("#c");
const labelContainerElem = document.querySelector('#labels');
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
});


const fov = 75;
const aspect = 2; // the canvas default
const near = 0.1;
const far = 1000;
const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
const scene = new THREE.Scene();

// const orbcontr = new OrbitControls(camera, canvas);
// orbcontr.target.set(0, 0, -2);
// orbcontr.update();

const color = 0xffffff;
let intensity = 1;
let light = new THREE.PointLight(color, intensity);
light.position.set(0, 0, 0);
scene.add(light);
intensity = 0.1;
light = new THREE.AmbientLight(color, intensity);
scene.add(light);

const loader = new THREE.TextureLoader();
// const texture = loader.load(
//   'images/background.webp',
//   () => {
//     const rt = new THREE.WebGLCubeRenderTarget(texture.image.height);
//     rt.fromEquirectangularTexture(renderer, texture);
//     scene.background = rt.texture;
//   });

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

const objLoader = new OBJLoader();
const xWing = new THREE.Object3D();
const cameraFrame = new THREE.Object3D();
cameraFrame.add(camera);

const uniforms = {
  iTime: {
    value: 0
  },
  iResolution: {
    value: new THREE.Vector3()
  },
  az: {
    value: new THREE.Vector3()
  },
  ay: {
    value: new THREE.Vector3()
  },
  ax: {
    value: new THREE.Vector3()
  },
  ro: {
    value: new THREE.Vector3()
  }
};

const material = new THREE.ShaderMaterial({
  fragmentShader: fragmentShader,
  uniforms: uniforms,
  transparent: true,
});

const plane = new THREE.PlaneGeometry(8 * canvas.width / canvas.height, 8);

const planeMesh = new THREE.Mesh(plane, material);
planeMesh.position.set(0, 0, -5);
cameraFrame.add(planeMesh);

function updateUniforms(time) {
  uniforms.iResolution.value.set(canvas.width, canvas.height, 1);
  uniforms.iTime.value = time;
  const A = new THREE.Vector3();
  const Q = cameraFrame.quaternion.clone();
  A.set(1, 0, 0);
  A.applyQuaternion(Q);
  uniforms.ax.value.copy(A);
  A.set(0, 1, 0);
  A.applyQuaternion(Q);
  uniforms.ay.value.copy(A);
  A.set(0, 0, 1);
  A.applyQuaternion(Q);
  uniforms.az.value.copy(A);
  const pos = new THREE.Vector3();
  pos.sub(cameraFrame.position);
  uniforms.ro.value = pos;
}


const projectiles = [];

const params = {
  frame: cameraFrame,
  model: xWing,
  projectiles: projectiles,
  scene: scene,
}
const control = new controls.Controls(params);

const metall = new THREE.MeshStandardMaterial({
  color: 0x3377ff,
  roughness: 0.4,
  metalness: 0.8,
});

// objLoader.load('images/xwing.obj', obj => {
//   obj.traverse(c => {
//     c.material = metall;
//   });
//   obj.rotation.z = Math.PI;
//   obj.rotation.x = -Math.PI / 2;
//   obj.scale.multiplyScalar(0.01);
//   xWing.add(obj);
// });


const Gltfloader = new GLTFLoader();
Gltfloader.load('./models/scene.gltf', (gltf) => {
  gltf.scene.scale.set(0.54, 0.54, 0.54);
  gltf.scene.rotation.y = Math.PI;
  gltf.scene.position.set(0, -0.1, -1.5);
  xWing.add(gltf.scene);
});

cameraFrame.add(xWing);
xWing.position.set(0, -1.5, -3);
cameraFrame.position.set(0, 0, 500);
scene.add(cameraFrame);

const objects = [];
objects.push(new Planet({
  pos: new THREE.Vector3(),
  size: 50,
  file: 'sun.jpg',
  isSun: true,
  name: '',
  speed: 0
}));
const earth = new Planet({
  pos: new THREE.Vector3(300, 0, 0),
  size: 10,
  file: 'earth.jpg',
  name: '',
  speed: 0.02
});
earth.rotateX = 23 * Math.PI / 180;
const moon = new Planet({
  pos: new THREE.Vector3(30, 0, 0),
  size: 3,
  file: 'moon.jpg',
  name: '',
  speed: 0
});
earth.addChild(moon);
objects.push(earth);

objects.push(new Planet({
  pos: new THREE.Vector3(100, 0, 0),
  size: 8,
  file: 'mercury.jpg',
  name: '',
  speed: 0.1
}));
objects.push(new Planet({
  pos: new THREE.Vector3(200, 0, 0),
  size: 8,
  file: 'venusmap.jpg',
  name: '',
  speed: 0.05
}));
objects.push(new Planet({
  pos: new THREE.Vector3(350, 0, 0),
  size: 10,
  file: 'mars.jpg',
  name: '',
  speed: 0.01
}));
objects.push(new Planet({
  pos: new THREE.Vector3(500, 0, 0),
  size: 30,
  file: 'jupitermap.jpg',
  name: '',
  speed: 0.005
}));

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

const tempV = new THREE.Vector3();

function render(time) {
  time *= 0.001;
  control.Update();

  if (resizeRendererToDisplaySize(renderer)) {
    const canvas = renderer.domElement;
    camera.aspect = canvas.clientWidth / canvas.clientHeight;
    camera.updateProjectionMatrix();
  }
  camera.updateWorldMatrix(true, false);

  updateUniforms(time);

  objects.forEach(planet => {
    planet.update(time);

    const elem = planet.info;
    planet.obj.getWorldPosition(tempV);
    tempV.project(camera);

    const x = (tempV.x * .5 + .5) * canvas.clientWidth;
    const y = (tempV.y * -.5 + .5) * canvas.clientHeight;
    elem.style.transform = `translate(-50%, -50%) translate(${x}px,${y}px)`;
  });

  projectiles.forEach(proj => {
    proj.update()
    if (proj.obj.position.length() > 500) {
      scene.remove(proj.obj);
      projectiles.splice(projectiles.indexOf(proj), 1);
    }
  });

  renderer.render(scene, camera);

  requestAnimationFrame(render);
}

requestAnimationFrame(render);