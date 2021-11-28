class _Controls {
  constructor(params) {
    this._Init(params);
  }

  _Init(params) {
    this._params = params;
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
    const cameraFrame = this._params.frame;
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

