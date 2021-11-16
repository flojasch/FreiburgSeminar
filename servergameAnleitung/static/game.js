var socket = io();
socket.emit('new player');

function setup() {
  createCanvas(500, 500);
  background(100);
}

let bewegung = {
  up: false,
  down: false,
  left: false,
  right: false,
}

document.addEventListener('keydown', function (event) {
  switch (event.keyCode) {
    case 37: // keyleft
      bewegung.left = true;
      break;
    case 38: // keyup
      bewegung.up = true;
      break;
    case 39: // keyright
      bewegung.right = true;
      break;
    case 40: // keydown
      bewegung.down = true;
      break;

  }
});
document.addEventListener('keyup', function (event) {
  switch (event.keyCode) {
    case 37: // keyleft
      bewegung.left = false;
      break;
    case 38: // keyup
      bewegung.up = false;
      break;
    case 39: // keyright
      bewegung.right = false;
      break;
    case 40: // keydown
      bewegung.down = false;
      break;
  }
});

socket.on('state', function (players) {
  socket.emit('neue bewegung', bewegung);
  background(100);
  for (var id in players) {
    var player = players[id];
    fill(23, 209, 54);
    ellipse(player.x, player.y, 30, 30);
  }
});