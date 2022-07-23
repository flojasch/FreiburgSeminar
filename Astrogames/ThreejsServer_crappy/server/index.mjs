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

function Main() {
  const __filename = fileURLToPath(
    import.meta.url);
  const __dirname = path.dirname(__filename);

  const app = express();
  const server = http.createServer(app);
  const io = new socketIO.Server(server);

  app.use('/static', express.static(__dirname + '/../client'));
  // Routing
  app.get('/', (request, response) => {
    response.sendFile(__dirname + '/index.html');
  });

  server.listen(5000, () => {
    console.log('Starting server on port 5000');
  });
 
  const _World = new worldserver.WorldServer(io); 
}

Main();