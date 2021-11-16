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

server.listen(5000, function () {
  console.log('Starting server on port 5000');
});
// http://localhost:5000

var players = {};
io.on('connection', function (socket) {
  socket.on('new player', function () {
    let xpos = Math.random() * 1000 - 500;
    let ypos = Math.random() * 1000 - 500;
    let zpos = Math.random() * 1000 - 500;
    players[socket.id] = {
      x: xpos,
      y: ypos,
      z: zpos,
      xAngle: 0,
      yAngle: 0,
      d: 20,
    };
    io.sockets.emit('id', socket.id);
    console.log('user '+  socket.id+' connected');
  });
  socket.on('deleteplayer', function (id) {
    delete players[id];
  });
  socket.on('movement', function (data) {
    var player = players[socket.id] || {};
    if (data.left) {
      player.yAngle -= 0.01;
    }
    if (data.right) {
      player.yAngle += 0.01;
    }
    if (data.up) {
      player.xAngle += 0.01;
    }
    if (data.down) {
      player.xAngle -= 0.01;
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
        xAngle: player.xAngle,
        yAngle: player.yAngle,
        id: socket.id
      };
      io.sockets.emit('projectile', projectile);
    }
    player.spaceship=data.spaceship;
  });
  socket.on('disconnect', () => {
    console.log('user ' + socket.id + ' disconnected');
    delete players[socket.id];
  });
});

function newPos(incr, player) {
  player.x += incr * Math.sin(-player.yAngle) * Math.cos(player.xAngle);
  player.y += incr * Math.sin(player.xAngle);
  player.z += incr * Math.cos(player.yAngle) * Math.cos(player.xAngle);
}

setInterval(function () {
  io.sockets.emit('state', players);
}, 1000 / 60);