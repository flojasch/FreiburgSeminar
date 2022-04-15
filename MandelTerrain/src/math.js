import perlin from 'https://cdn.jsdelivr.net/gh/mikechambers/es6-perlin-module/perlin.js';

export const math=(function(){
    return {
        fourierNoise: function(x, y) {
            const six = Math.sin(x);
            const cox = Math.cos(x);
            const siy = Math.sin(y);
            const coy = Math.cos(y);
            let imx = 0;
            let rex = 1;
            let imy = 0;
            let rey = 1;
            let reh;
            let zx, zy;
            let ret = 0;
      
            for (let i = 0; i < this.rand.maxFreq; i++) {
              reh = cox * rex - six * imx;
              imx = rex * six + imx * cox;
              rex = reh;
              rey = 1;
              imy = 0;
              for (let j = 0; j < this.rand.maxFreq; j++) {
                reh = coy * rey - siy * imy;
                imy = rey * siy + imy * coy;
                rey = reh;
                zx = rex * rey - imx * imy;
                zy = rex * imy + imx * rey;
                ret += this.rand.a[i][j] * (zx * this.rand.siphi[i][j] + zy * this.rand.cophi[i][j]);
              }
            }
            return ret;
        },

        mandelBrot: function(ykoord, xkoord, terrainSize) {
            const R = 1024;
            const maxiter = 100;
            let x = 0,
              y = 0,
              cx, cy, xx, yy, r = 0,
              n;
            let dx = 0,
              dy = 0;
            cx = xkoord * 3. / terrainSize - 0.7;
            cy = ykoord * 3. / terrainSize;
            let c2 = cx * cx + cy * cy;
            if (256.0 * c2 * c2 - 96.0 * c2 + 32.0 * cx - 3.0 < 0.0) return 0.0;
            if (16.0 * (c2 + 2.0 * cx + 1.0) - 1.0 < 0.0) return 0.0;
            for (n = 0; n < maxiter; n++) {
              xx = x * x;
              yy = y * y;
              r = xx + yy;
              if (r > R) {
                break;
              }
              let dxh = dx;
              dx = 2 * (dx * x - dy * y) + 1;
              dy = 2 * (x * dy + y * dxh);
              y = 2 * x * y + cy;
              x = xx - yy + cx;
            }
      
            let d = Math.sqrt(r / (dx * dx + dy * dy)) * Math.log(r);
            if (n == maxiter) d = 0;
            const pow = Math.pow(d, this._power);
            return this._height * pow;
        },

        weierstrass: function(x, y,height,scale,maxPow) {
            x = x * scale;
            y = y * scale;
            let b = 1;
            let amp = 1;
            let lambda = 2; //1.5;
            let base = 0.5; //0.6;
            let ret = 0;
            for (let k = 0; k < maxPow; k++) {
              ret += amp * (2.0*perlin(b*x,b*y)-1.0);
              amp *= base;
              b *= lambda;
            }
            ret=Math.exp(1.2*ret)-0.8;
            return height*(ret);
          }

    };
})();