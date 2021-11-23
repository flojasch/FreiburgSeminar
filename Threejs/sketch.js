import * as THREE from "https://threejsfundamentals.org/threejs/resources/threejs/r132/build/three.module.js";
import {
  OBJLoader
} from 'https://threejsfundamentals.org/threejs/resources/threejs/r132/examples/jsm/loaders/OBJLoader.js';
import {
  GLTFLoader
} from 'https://threejsfundamentals.org/threejs/resources/threejs/r132/examples/jsm/loaders/GLTFLoader.js';

const canvas = document.querySelector("#c");
const labelContainerElem = document.querySelector('#labels');
const renderer = new THREE.WebGLRenderer({
  canvas
});

const fov = 75;
const aspect = 2; // the canvas default
const near = 0.1;
const far = 1000;
const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
const scene = new THREE.Scene();

//lights
const color = 0xffffff;
const intensity = 1;
const light = new THREE.PointLight(color, intensity);
light.position.set(0, 0, 0);
scene.add(light);

// const dlight = new THREE.DirectionalLight(color, intensity);
// dlight.position.set(0, 2, 2);
// dlight.target.position.set(0, 0, 0);
// scene.add(dlight);
// scene.add(dlight.target);


const loader = new THREE.TextureLoader();
const texture = loader.load(
  'images/background.webp',
  () => {
    const rt = new THREE.WebGLCubeRenderTarget(texture.image.height);
    rt.fromEquirectangularTexture(renderer, texture);
    scene.background = rt.texture;
  });

const objLoader = new OBJLoader();
const xWing = new THREE.Object3D();
const xWingFrame = new THREE.Object3D();

const metall = new THREE.MeshStandardMaterial({
  color: 0x3377ff,
  roughness: 0.4,
  metalness: 0.8,
});

objLoader.load('images/xwing.obj', obj => {
  obj.traverse(c => {
    c.material = metall;
  });
  xWing.add(obj);
});


// const Gltfloader = new GLTFLoader();
// Gltfloader.load('./models/scene.gltf', (gltf) => {
//   gltf.scene.scale.set(0.5, 0.5, 0.5);
//   gltf.scene.position.set(0, -.5, 4);
//   xWing.add(gltf.scene);
// });
xWingFrame.add(xWing);
xWing.position.set(0, -1.5, 3);
xWing.scale.set(0.01, 0.01, 0.01);
scene.add(xWingFrame);

class Planet {
  constructor(x, y, z, size, speed, file, sun = false, name = '') {
    this.name = name;
    const geometry = new THREE.SphereGeometry(size, 40, 40);
    const texture = loader.load("images/" + file);
    let material;
    if (sun)
      material = new THREE.MeshBasicMaterial({
        map: texture
      });
    else
      material = new THREE.MeshPhongMaterial({
        map: texture
      });
    let obj = new THREE.Mesh(geometry, material);
    obj.position.set(x, y, z);
    const orb = new THREE.Object3D();
    orb.add(obj);
    scene.add(orb);
    const elem = document.createElement('div');
    elem.textContent = this.name;
    labelContainerElem.appendChild(elem);
    this.speed = speed;
    this.obj = obj;
    this.orb = orb;
    this.info = elem;
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

class Projectile {
  constructor(dir) {
    this.dir = dir;
    const material = new THREE.MeshBasicMaterial({
      color: 0xff00ff
    });
    const geometry = new THREE.CylinderGeometry(0.02, 0.02, 2, 10);
    const cyl1 = new THREE.Mesh(geometry, material);
    cyl1.rotation.x = -Math.PI / 2;
    cyl1.position.set(-1, -0.7, 2.5);
    const cyl2 = new THREE.Mesh(geometry, material);
    cyl2.rotation.x = -Math.PI / 2;
    cyl2.position.set(1, -0.7, 2.5);
    const cyl3 = new THREE.Mesh(geometry, material);
    cyl3.rotation.x = -Math.PI / 2;
    cyl3.position.set(-1, -1.3, 2.5);
    const cyl4 = new THREE.Mesh(geometry, material);
    cyl4.rotation.x = -Math.PI / 2;
    cyl4.position.set(1, -1.3, 2.5);
    this.obj = new THREE.Object3D();
    this.obj.add(cyl1);
    this.obj.add(cyl2);
    this.obj.add(cyl3);
    this.obj.add(cyl4);
    scene.add(this.obj);
    setObject(this.obj);
  }
  update() {
    this.obj.position.x += this.dir.x;
    this.obj.position.y += this.dir.y;
    this.obj.position.z += this.dir.z;
  }

}

const objects = [];
const sun = new Planet(0, 0, 0, 50, 0.25, 'sun.jpg', true, 'sun');
objects.push(sun);
const earth = new Planet(300, 0, 0, 10, 0.02, 'earth.jpg', false, 'earth');
earth.rotateX = 23 * Math.PI / 180;
const moon = new Planet(30, 0, 0, 3, 0, 'moon.jpg');
earth.addChild(moon);
objects.push(earth);
objects.push(new Planet(100, 0, 0, 8, 0.1, 'mercury.jpg', false, 'mercury'));
objects.push(new Planet(200, 0, 0, 8, 0.05, 'venusmap.jpg', false, 'venus'));
objects.push(new Planet(350, 0, 0, 10, 0.01, 'mars.jpg', false, 'mars'));
objects.push(new Planet(500, 0, 0, 30, 0.005, 'jupitermap.jpg', false, 'jupiter'));

//build the scenegraph

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

function setObject(obj) {
  obj.up.set(player.Y.x, player.Y.y, player.Y.z);
  obj.position.set(-player.Z.x, -player.Z.y, -player.Z.z);
  obj.lookAt(0, 0, 0);
  obj.position.set(player.x, player.y, player.z);
}

function rotateShip(mov) {
  if (xWing.rotation.z > Math.PI / 3) xWing.rotation.z = Math.PI / 3;
  if (xWing.rotation.z < -Math.PI / 3) xWing.rotation.z = -Math.PI / 3;
  if (mov.left) xWing.rotation.z += 0.03;
  if (mov.right) xWing.rotation.z -= 0.03;
  if (!mov.left&&!mov.right) xWing.rotation.z -= 0.1*xWing.rotation.z;
  let rotx=xWing.rotation.x+Math.PI/2;
  if (rotx > Math.PI / 3) xWing.rotation.x = -Math.PI/2+Math.PI / 3;
  if (rotx < -Math.PI / 3) xWing.rotation.x = -Math.PI/2-Math.PI / 3;
  if (mov.up) xWing.rotation.x -= 0.03;
  if (mov.down) xWing.rotation.x += 0.03;
  if (!mov.up&&!mov.down) xWing.rotation.x -= 0.1*(xWing.rotation.x+Math.PI/2);
}
const tempV = new THREE.Vector3();
const projectiles = [];

function render(time) {
  time *= 0.001;
  movePlayer(mov);

  if (mov.fire) {
    const dir = new THREE.Vector3(player.Z.x, player.Z.y, player.Z.z);
    projectiles.push(new Projectile(dir));
    mov.fire = false;
  }
  setObject(camera);
  setObject(xWingFrame);
  rotateShip(mov);

  if (resizeRendererToDisplaySize(renderer)) {
    const canvas = renderer.domElement;
    camera.aspect = canvas.clientWidth / canvas.clientHeight;
    camera.updateProjectionMatrix();
  }
  camera.updateWorldMatrix(true, false);
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
  });
  renderer.render(scene, camera);

  requestAnimationFrame(render);
}

requestAnimationFrame(render);