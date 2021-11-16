import * as THREE from "https://threejsfundamentals.org/threejs/resources/threejs/r132/build/three.module.js";
import {
  OBJLoader
} from 'https://threejsfundamentals.org/threejs/resources/threejs/r132/examples/jsm/loaders/OBJLoader.js';

function main() {
  const canvas = document.querySelector("#c");
  const renderer = new THREE.WebGLRenderer({
    canvas
  });

  const fov = 75;
  const aspect = 2; // the canvas default
  const near = 0.1;
  const far = 30;
  const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
  const scene = new THREE.Scene();

  //lights
  const color = 0xffffff;
  const intensity = 1;
  const light = new THREE.PointLight(color, intensity);
  light.position.set(0, 0, 0);
  scene.add(light);
  const dlight = new THREE.DirectionalLight(color, intensity);
  dlight.position.set(0, 2, 2);
  dlight.target.position.set(0, 0, 0);
 
  
  const loader = new THREE.TextureLoader();
  const texture = loader.load(
    'images/background.webp',
    () => {
      const rt = new THREE.WebGLCubeRenderTarget(texture.image.height);
      rt.fromEquirectangularTexture(renderer, texture);
      scene.background = rt.texture;
    });

  const objLoader = new OBJLoader();
  const xWing=new THREE.Object3D();
  xWing.add(dlight);
  xWing.add(dlight.target);

  const metall = new THREE.MeshStandardMaterial({
    color: 0x3377ff,
    roughness: 0.4,
    metalness: 0.8,
  });

  objLoader.load('images/xwing.obj', obj => {
    obj.scale.set(0.01, 0.01, 0.01);
    obj.rotation.x = -Math.PI / 2;
    obj.traverse(function (child) {
      if (child instanceof THREE.Mesh) {
        child.material = metall;
      }
    });
    obj.position.set(0, -1.5, 3);
    xWing.add(obj);
  });
  scene.add(xWing);
  
  function newObj(x, y, z, size, file, type) {
    const geometry = new THREE.SphereGeometry(1, 40, 40);
    const texture = loader.load("images/" + file);
    let material;
    if (type == 'sun')
      material = new THREE.MeshBasicMaterial({
        map: texture
      });
    else
      material = new THREE.MeshPhongMaterial({
        map: texture
      });
    let objMesh = new THREE.Mesh(geometry, material);
    objMesh.scale.set(size, size, size);
    objMesh.position.set(x, y, z);
    return objMesh;
  }

  const solarSystem = new THREE.Group();
  const earthOrbit = new THREE.Group();
  earthOrbit.position.set(4, 0, 0);

  const moonOrbit = new THREE.Group();
  moonOrbit.position.set(1, 0, 0);

  const sunMesh = newObj(0, 0, 0, 2, 'sun.jpg', 'sun');
  const earthMesh = newObj(0, 0, 0, 0.6, 'earth.jpg', 'planet');
  const moonMesh = newObj(0, 0, 0, 0.2, 'moon.jpg', 'planet');
  //build the scenegraph
  moonOrbit.add(moonMesh);
  earthOrbit.add(earthMesh);
  earthOrbit.add(moonOrbit);
  solarSystem.add(earthOrbit);
  scene.add(sunMesh);
  scene.add(solarSystem);


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

  function setObject(obj){
    obj.up.set(player.Y.x, player.Y.y, player.Y.z);
    obj.position.set(-player.Z.x, -player.Z.y, -player.Z.z);
    obj.lookAt(0, 0, 0);
    obj.position.set(player.x, player.y, player.z);
  }
  function render(time) {
    time *= 0.001;
    movePlayer(mov);
    setObject(camera);
    setObject(xWing);

    if (resizeRendererToDisplaySize(renderer)) {
      const canvas = renderer.domElement;
      camera.aspect = canvas.clientWidth / canvas.clientHeight;
      camera.updateProjectionMatrix();
    }
    earthOrbit.rotation.x = 23 / 180 * Math.PI
    earthOrbit.rotation.y = time;
    solarSystem.rotation.y = time / 2;
    sunMesh.rotation.y = time / 4;

    renderer.render(scene, camera);

    requestAnimationFrame(render);
  }

  requestAnimationFrame(render);
}

main();