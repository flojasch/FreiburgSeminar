// Dependencies.
var express = require('express');
var http = require('http');
var socketIO = require('socket.io');

var app = express();
var server = http.createServer(app);
var io = socketIO(server);

app.use('/static', express.static(__dirname + '/static'));
// Routing
app.get('/', function (request, response) {
  response.sendFile(__dirname + '/index.html');
});

server.listen(3000, function () {
  console.log('Starting server on port 3000');
});
// http://localhost:3000

var players = {};
io.on('connection', function (socket) {
  socket.on('new player', function (player) {
    let angle = Math.random() * 6.28;
    let r = 1500;
    let xpos = r * Math.sin(angle);
    let ypos = r * Math.cos(angle);
    players[socket.id] = {
      x: xpos,
      y: 0,
      z: ypos,
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
      d: 20,
      playername: player.name,
      spaceship: player.spaceship,
    };
    io.sockets.emit('id', socket.id);
    console.log('user ' + socket.id + ' connected');
    //console.log(players);
  });
  socket.on('deleteplayer', function (id) {
    delete players[id];
  });
  socket.on('movement', function (data) {
    let player = players[socket.id] || {};
    let pZ=player.Z||{};
    let ang = 0.01;
    if (data.left) {
      player.Z = rot(player.Z, player.Y, ang);
      player.X = rot(player.X, player.Y, ang);
    }
    if (data.right) {
      player.Z = rot(player.Z, player.Y, -ang);
      player.X = rot(player.X, player.Y, -ang);
    }
    if (data.up) {
      player.Z = rot(player.Z, player.X, -ang);
      player.Y = rot(player.Y, player.X, -ang);
    }
    if (data.down) {
      player.Z = rot(player.Z, player.X, ang);
      player.Y = rot(player.Y, player.X, ang);
    }
    if (data.tleft) {
      player.X = rot(player.X, player.Z, -ang);
      player.Y = rot(player.Y, player.Z, -ang);
    }
    if (data.tright) {
      player.X = rot(player.X, player.Z, ang);
      player.Y = rot(player.Y, player.Z, ang);
    }
    if (data.forward) {
      newPos(5, player);
    }
    if (data.backward) {
      newPos(-5, player);
    }
    if (data.projectile) {
      let projectile = {
        x: player.x,
        y: player.y,
        z: player.z,
        vx: pZ.x,
        vy: pZ.y,
        vz: pZ.z,
        id: socket.id,
      };
      io.sockets.emit('projectile', projectile);
    }
  });
  socket.on('disconnect', () => {
    console.log('user ' + socket.id + ' disconnected');
    delete players[socket.id];
  });
});

function newPos(incr, p) {
  let pZ=p.Z||{};
    p.x += incr * pZ.x;
    p.y += incr * pZ.y;
    p.z += incr * pZ.z;
}

function rot(player, axis, alpha) {
  let n=axis||{};
  let p=player||{};
  let c = Math.cos(alpha);
  let s = Math.sin(alpha);
  let res = {};
  res.x = p.x * (n.x * n.x * (1. - c) + c) + p.y * (n.x * n.y * (1. - c) - n.z * s) + p.z * (n.x * n.z * (1. - c) + n.y * s);
  res.y = p.x * (n.x * n.y * (1. - c) + n.z * s) + p.y * (n.y * n.y * (1. - c) + c) + p.z * (n.y * n.z * (1. - c) - n.x * s);
  res.z = p.x * (n.x * n.z * (1. - c) - n.y * s) + p.y * (n.z * n.y * (1. - c) + n.x * s) + p.z * (n.z * n.z * (1. - c) + c);
  return res;
}

setInterval(function () {
  io.sockets.emit('state', players);
}, 1000 / 60);