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

let players = {};
io.on('connection', (socket) => {
  socket.on('new_player', () => {
    players[socket.id] = new Player();
    console.log('user ' + socket.id + ' connected');
  });

  socket.on('movement', (data) => {
    const player = players[socket.id] || {};
    let Z = player.Z;
    let X = player.X;
    let Y = player.Y;
    
    const da = 0.015;
    if (data.left) {
      Z.rot(Y, da);
      X.rot(Y, da);
    }
    if (data.right) {
      Z.rot(Y, -da);
      X.rot(Y, -da);
    }
    if (data.up) {
      Z.rot(X, -da);
      Y.rot(X, -da);
    }
    if (data.down) {
      Z.rot(X, da);
      Y.rot(X, da);
    }
    if (data.tleft) {
      X.rot(Z, -da);
      Y.rot(Z, -da);
    }
    if (data.tright) {
      X.rot(Z, da);
      Y.rot(Z, da);
    }
    if (data.forward) {
      if (player.speed < 8) player.speed += 0.1;
    }
    if (data.backward) {
      if (player.speed > -2) player.speed -= 0.1;
    }
  });

  socket.on('disconnect', () => {
    console.log('user ' + socket.id + ' disconnected');
    io.sockets.emit('player_deleted', socket.id);
    delete players[socket.id];
  });
});

setInterval(() => {
  for(let id in players){
    players[id].update();
  }
  io.sockets.emit('state', players);
}, 1000 / 60);

class Vec {
  constructor(x, y, z) {
    this.x = x;
    this.y = y;
    this.z = z;
  }
  //rotation um einen kleinen Winkel da
  rot(n, da) {
    let dx = (n.y * this.z - n.z * this.y) * da;
    let dy = (n.z * this.x - n.x * this.z) * da;
    let dz = (n.x * this.y - n.y * this.x) * da;
    this.x += dx;
    this.y += dy;
    this.z += dz;
  }
}

class Player {
  constructor(){
    this.pos=new Vec(0,0,0);
    this.X=new Vec(1,0,0);
    this.Y=new Vec(0,1,0);
    this.Z=new Vec(0,0,1);
    this.speed=0;
  }
  update(){
    this.pos.x += this.Z.x*this.speed;
    this.pos.y += this.Z.y*this.speed;
    this.pos.z += this.Z.z*this.speed;
    this.speed *=0.98;
  }
}