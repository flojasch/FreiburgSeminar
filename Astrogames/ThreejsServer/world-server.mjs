import {
  worldmanager
} from './world-manager.mjs';

export const worldserver = (() => {

  class WorldServer {
    constructor(io) {
      this.playernum = 0;
      this.world = new worldmanager.WorldManager();
      this.world.add('player');
      this.world.add('projectile');
      this.world.add('planet');
      this.world.add('explosion');

      this.world.entities['planet'].add({
        x: 0,
        y: 0,
        z: -700,
        r: 300
      });
      this._SetSocket(io);
    }

    _SetSocket(io) {
      io.on('connection', (socket) => {
        socket.on('new_player', (playerName) => {
          if (this.playernum < 6) {
            this.world.entities['player'].add({
              id: socket.id,
              playerName: playerName
            });
            console.log('user ' + socket.id + ' connected');
            ++this.playernum;
          } else {
            console.log('Maximalzahl der Spieler schon erreicht');
          }
        });

        socket.on('movement', (data) => {
          const player = this.world.entities['player'].list[socket.id];
          if (player != undefined) {
            let Z = player.Z;
            let X = player.X;

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
                this.world.entities['projectile'].add(player);
                player.loadtime = 20;
              }
            }
          }
        });

        socket.on('disconnect', () => {
          console.log('user ' + socket.id + ' disconnected');
          delete this.world.entities['player'].list[socket.id];
        });
      });

      setInterval(() => {
        this.world.update();
        io.sockets.emit('state', this.world.entities);
      }, 1000 / 60);
    }
  }

  return {
    WorldServer: WorldServer,
  };
})();