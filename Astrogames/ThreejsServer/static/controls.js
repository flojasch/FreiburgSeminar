import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.117.1/build/three.module.js';

export const controls = (function () {

  class _Controls {
    constructor(socket) {
      this.socket = socket;
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
      this._SetSound();
    }

    update() {
      this.socket.emit('movement', this._move);
    }

    _SetSound() {
      const listener = new THREE.AudioListener();
      const audioLoader = new THREE.AudioLoader();

      this._lasersound = new THREE.Audio(listener);
      audioLoader.load('static/sounds/laser.wav', (buffer) => {
        this._lasersound.setBuffer(buffer);
      });
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
          this._lasersound.isPlaying=false;
          this._lasersound.play();
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
  }

  return {
    Controls: _Controls,
  };
})();