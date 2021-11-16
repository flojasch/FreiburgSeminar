var express = require('express');
var http = require('http')
var socketIO = require('socket.io');

var app = express();
var server = http.createServer(app);
var io = socketIO(server);

app.use('/static', express.static(__dirname + '/static'));
app.get('/', function (request, response) { 
  response.sendFile(__dirname + '/index.html');
});

server.listen(3000, function () { // http://localhost:3000
  console.log('listening on *:3000');
});

let players = {};
io.on('connection', function (socket) {
  socket.on('new player', function () {
    players[socket.id] = {
      x: 200,
      y: 200,
    };
    console.log('user '+  socket.id+' connected');
  });
  socket.on('neue bewegung', function (data) { 
    let player = players[socket.id] || {}; 
    if (data.left) {
      player.x -= 5;
    }
    if (data.up) {
      player.y -= 5;
    }
    if (data.right) {
      player.x += 5;
    }
    if (data.down) {
      player.y += 5;
    }
  });
  socket.on('disconnect', () => {
    console.log('user ' + socket.id + ' disconnected');
  });
});

setInterval(function () {
  io.sockets.emit('state', players);
}, 1000 / 60);