import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.117.1/build/three.module.js';

import {
  Sky
} from 'https://cdn.jsdelivr.net/npm/three@0.117.1/examples/jsm/objects/Sky.js';
import {
  Water
} from 'https://cdn.jsdelivr.net/npm/three@0.117.1/examples/jsm/objects/Water.js';


export const sky = (function () {

  class TerrainSky {
    constructor(params) {
      this.isSky = false;
      this._params = params;
      this._R = params.terrainSize * Math.sqrt(3);
      this.sunPos=params.lightPos;
      this._Init(params);
    }

    _Init(params) {

      const geometry = new THREE.SphereBufferGeometry(this._R + 10, 100, 100);
      this._water = new Water(
        geometry, {
          textureWidth: 2048,
          textureHeight: 2048,
          waterNormals: new THREE.TextureLoader().load('static/resources/waternormals.jpg', function (texture) {
            texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
          }),
          alpha: 0.5,
          sunDirection: new THREE.Vector3(0, 0, 1),
          sunColor: 0xffffff,
          waterColor: 0x001e0f,
          distortionScale: 0.0,
          fog: undefined
        }
      );
      this._water.rotation.x = -Math.PI / 2;
      this._water.position.set(0, 0, 0);

      this._sky = new Sky();
      this._sky.scale.setScalar(50000);

      this._group = new THREE.Group();

      params.scene.add(this._group);

      const skyParams = {
        turbidity: 10.0,
        rayleigh: 2,
        mieCoefficient: 0.005,
        mieDirectionalG: 0.8,
        luminance: 1,
      };

      const sunParams = {
        inclination: 0.31,
        azimuth: 0.25,
      };

      const onShaderChange = () => {
        for (let k in skyParams) {
          this._sky.material.uniforms[k].value = skyParams[k];
        }
      };

      const onSunChange = () => {
        var theta = Math.PI * (sunParams.inclination - 0.5);
        var phi = 2 * Math.PI * (sunParams.azimuth - 0.5);

        const sunPosition = new THREE.Vector3();
        sunPosition.x = Math.cos(phi);
        sunPosition.y = Math.sin(phi) * Math.sin(theta);
        sunPosition.z = Math.sin(phi) * Math.cos(theta);
        console.log(sunPosition);
        this._sky.material.uniforms['sunPosition'].value.copy(sunPosition);
        this._water.material.uniforms['sunDirection'].value.copy(sunPosition.normalize());
        //this._params.terrainLight.position.copy(sunPosition);
      };

      onShaderChange();
      onSunChange();
    }

    Update(timeInSeconds) {
      if (this._params.camPos.length() < this._R + 500 && !this.isSky) {
        this._group.add(this._water);
        this._group.add(this._sky);
        this.isSky = true;
      }
      if (this._params.camPos.length() >= this._R + 500 && this.isSky) {
        this._group.remove(this._water);
        this._group.remove(this._sky);
        this.isSky = false;
      }

      this._water.material.uniforms['time'].value += timeInSeconds;

    }

    _Hit(r) {
      return false;
    }
  }

  return {
    TerrainSky: TerrainSky
  }
})();