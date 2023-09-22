
let express = require('express');
let http = require('http');
let socketIO = require('socket.io');

let app = express();
let server = http.createServer(app);
let io = socketIO(server);

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
io.on('connection', (socket)=> {
  socket.on('new_player', (player)=> {
    players[socket.id] = player;
    console.log('user '+  socket.id+' connected');
  });
  socket.on('new_blaster',(coords)=>{
    io.sockets.emit('new_blaster',coords);
  });
  socket.on('update_player', (player)=> {
    players[socket.id]=player;
    
  });
  socket.on('player_died', (id)=> {
    io.sockets.emit('player_deleted',id);
    delete players[id];
  });
  socket.on('disconnect', () => {
    console.log('user ' + socket.id + ' disconnected');
    io.sockets.emit('player_deleted',socket.id);
    delete players[socket.id];
  });
});

setInterval(()=> {
  io.sockets.emit('state', players);
}, 1000 / 60);