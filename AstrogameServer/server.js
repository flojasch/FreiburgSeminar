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
  socket.on('new_player', function (player) {
    players[socket.id] = player;
    console.log('user '+  socket.id+' connected');
    console.log(players);
  });
  socket.on('deleteplayer', function (id) {
    delete players[id];
  });
  socket.on('player', function (player) {
    players[socket.id]=player;
    
  });
  socket.on('disconnect', () => {
    console.log('user ' + socket.id + ' disconnected');
    delete players[socket.id];
  });
});


setInterval(function () {
  io.sockets.emit('state', players);
}, 1000 / 60);