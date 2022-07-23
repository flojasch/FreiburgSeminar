import {
  worldmanager
} from './world-manager.mjs';

import {
  math
} from './math.mjs';

export const worldserver = (() => {
  class WorldServer {
    constructor(io) {
      this.playernum = 0;
      this.entities = {};
      this.entities['player'] = new worldmanager.WorldManager('player');
      this.entities['projectile'] = new worldmanager.WorldManager('projectile');
      this.entities['planet'] = new worldmanager.WorldManager('planet');
      this.entities['explosion'] = new worldmanager.WorldManager('explosion');
      this.entities['planet'].add({
        x: 0,
        y: 0,
        z:-500,
        r: 100
      })
      this.playernum = 0;
      this.setupIO(io);
    }

    setupIO(io) {
      io.on('connection', (socket) => {
        socket.on('new_player', () => {
          if (this.playernum < 6) {
            this.entities['player'].add(socket.id);
            console.log('user ' + socket.id + ' connected');
            ++this.playernum;
          } else {
            console.log('Maximalzahl der Spieler schon erreicht');
          }
        });

        socket.on('movement', (data) => {
          const player = this.entities['player'].list[socket.id];
          if (player != undefined) {
            let Z = player.Z;
            let X = player.X;
            let Y = player.Y;

            const da = 0.015;
            const dma = 0.05;
            const amax = Math.PI / 4;

            player.setModelAchses();

            player.mX.Rot(Z, player.za);
            player.mY.Rot(Z, player.za);

            player.mY.Rot(X, player.xa);
            player.mZ.Rot(X, player.xa);

            if (!data.up && !data.down) player.xa *= 0.85;
            if (!data.left && !data.right) player.za *= 0.85;

            if (data.left) {
              player.rotY(da);
              if (player.za < amax) player.za += dma;
            }
            if (data.right) {
              player.rotY(-da);
              if (player.za > -amax) player.za -= dma;
            }
            if (data.up) {
              player.rotX(da);
              if (player.xa < amax) player.xa += dma;
            }
            if (data.down) {
              player.rotX(-da);
              if (player.xa > -amax) player.xa -= dma;
            }
            if (data.tleft) {
              player.rotZ(-da);
            }
            if (data.tright) {
              player.rotZ(da);
            }
            if (data.forward) {
              if (player.speed < 0.5) player.speed += 0.02;
            }
            if (data.backward) {
              if (player.speed > 0) player.speed -= 0.02;
            }
            if (data.fire) {
              if (player.loadtime == 0) {
                this.entities['projectile'].add(player);
                player.loadtime = 20;
              }
            }
          }
        });

        socket.on('disconnect', () => {
          console.log('user ' + socket.id + ' disconnected');
          delete this.entities['player'].list[socket.id];
        });
      });

      setInterval(() => {
        for (let name in this.entities) {
          this.entities[name].update(this.entities);
        }
        io.sockets.emit('state', this.entities);
      }, 1000 / 60);
    }
  }

  return {
    WorldServer: WorldServer,
  };
})();