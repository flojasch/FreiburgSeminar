import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.117.1/build/three.module.js';

export const controls = (function () {

  class _Controls {
    constructor(player) {
      this._Init(player);
    }
  
    _Init(player) {
      this._player = player;
      this._move = {
        left: false,
        right: false,
        up: false,
        down: false,
        tleft: false,
        tright: false,
        forward: false,
        backward: false,
        fire: false,
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
  
    Update(time) {
      const ang = time;
      const cameraFrame = this._player._camera;
      const _Q = new THREE.Quaternion();
      const _A = new THREE.Vector3();
      const _R = cameraFrame.quaternion.clone();
      const _vel = new THREE.Vector3(0, 0, 10);
      _vel.applyQuaternion(_R);
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
      this._rotateShip();
  
      if (this._move.fire) {
        this._player.Fire();
        this._move.fire = false;
      }
    }
  
    _rotateShip() {
      const model = this._player._model;
      const alpha = Math.PI / 4;
      if (model.rotation.z > alpha) model.rotation.z = alpha;
      if (model.rotation.z < -alpha) model.rotation.z = -alpha;
      if (this._move.left) model.rotation.z += 0.03;
      if (this._move.right) model.rotation.z -= 0.03;
      if (!this._move.left && !this._move.right) model.rotation.z -= 0.1 * model.rotation.z;
  
      if (model.rotation.x > alpha) model.rotation.x = alpha;
      if (model.rotation.x < -alpha) model.rotation.x = -alpha;
      if (this._move.up) model.rotation.x += 0.03;
      if (this._move.down) model.rotation.x -= 0.03;
      if (!this._move.up && !this._move.down) model.rotation.x -= 0.1 * model.rotation.x;
    }

    get Position(){
      return new THREE.Vector3();
    }
    get Radius(){
      return -1;//kann nicht getroffen werden
    }
  }

  return {
    Controls: _Controls,
  };
})();