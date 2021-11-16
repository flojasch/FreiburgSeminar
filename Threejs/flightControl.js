document.addEventListener('keydown', keyDownHandler, false);
document.addEventListener('keyup', keyUpHandler, false);

const mov = {
  left: false,
  right: false,
  up: false,
  down: false,
  tleft: false,
  tright: false,
  forward: false,
  backward: false,
}
const player = {
  x: 0,
  y: 0,
  z: -10,
  X: {
    x: 1,
    y: 0,
    z: 0,
  },
  Y: {
    x: 0,
    y: 1,
    z: 0,
  },
  Z: {
    x: 0,
    y: 0,
    z: 1,
  },
};

function keyDownHandler(event) {
  switch (event.keyCode) {
    case 37: // keyleft
      mov.left = true;
      break;
    case 38: // keyup
      mov.up = true;
      break;
    case 39: // keyright
      mov.right = true;
      break;
    case 40: // keydown
      mov.down = true;
      break;
    case 65: // a
      mov.tleft = true;
      break;
    case 68: //d
      mov.tright = true;
      break;
    case 87: //w
      mov.forward = true;
      break;
    case 83: //s
      mov.backward = true;
      break;
  }
}

function keyUpHandler(event) {
  switch (event.keyCode) {
    case 37: // keyleft
      mov.left = false;
      break;
    case 38: // keyup
      mov.up = false;
      break;
    case 39: // keyright
      mov.right = false;
      break;
    case 40: // keydown
      mov.down = false;
      break;
    case 65: // a
      mov.tleft = false;
      break;
    case 68: //d
      mov.tright = false;
      break;
    case 87: //w
      mov.forward = false;
      break;
    case 83: //s
      mov.backward = false;
      break;
  }
}

function movePlayer(move) {
  let ang = 0.01;
  if (move.left) {
    player.Z = rot(player.Z, player.Y, ang);
    player.X = rot(player.X, player.Y, ang);
  }
  if (move.right) {
    player.Z = rot(player.Z, player.Y, -ang);
    player.X = rot(player.X, player.Y, -ang);
  }
  if (move.up) {
    player.Z = rot(player.Z, player.X, -ang);
    player.Y = rot(player.Y, player.X, -ang);
  }
  if (move.down) {
    player.Z = rot(player.Z, player.X, ang);
    player.Y = rot(player.Y, player.X, ang);
  }
  if (move.tleft) {
    player.X = rot(player.X, player.Z, -ang);
    player.Y = rot(player.Y, player.Z, -ang);
  }
  if (move.tright) {
    player.X = rot(player.X, player.Z, ang);
    player.Y = rot(player.Y, player.Z, ang);
  }
  if (move.forward) {
    newPos(0.03, player);
  }
  if (move.backward) {
    newPos(-0.03, player);
  }

  function newPos(incr, p) {
    let pZ = p.Z || {};
    p.x += incr * pZ.x;
    p.y += incr * pZ.y;
    p.z += incr * pZ.z;
  }

  function rot(player, axis, alpha) {
    let n = axis || {};
    let p = player || {};
    let c = Math.cos(alpha);
    let s = Math.sin(alpha);
    let res = {};
    res.x = p.x * (n.x * n.x * (1. - c) + c) + p.y * (n.x * n.y * (1. - c) - n.z * s) + p.z * (n.x * n.z * (1. - c) + n.y * s);
    res.y = p.x * (n.x * n.y * (1. - c) + n.z * s) + p.y * (n.y * n.y * (1. - c) + c) + p.z * (n.y * n.z * (1. - c) - n.x * s);
    res.z = p.x * (n.x * n.z * (1. - c) - n.y * s) + p.y * (n.z * n.y * (1. - c) + n.x * s) + p.z * (n.z * n.z * (1. - c) + c);
    return res;
  }
}