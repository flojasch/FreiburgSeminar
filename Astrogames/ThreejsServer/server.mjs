import {
  worldserver
} from './world-server.mjs';
import express from 'express';
import * as http from 'http';
import * as socketIO from 'socket.io';

import path from 'path';
import {
  fileURLToPath
} from 'url';

function _Main() {
  const __filename = fileURLToPath(
    import.meta.url);
  const __dirname = path.dirname(__filename);

  const app = express();
  const server = http.createServer(app);
  const io = new socketIO.Server(server);

  app.use('/static', express.static(__dirname + '/static'));
  app.get('/', function (request, response) {
    response.sendFile(__dirname + '/index.html');
  });

  server.listen(5000, function () {
    console.log('Starting server on port 5000');
  });

  const _World = new worldserver.WorldServer(io);
}

_Main();