import perlin from 'https://cdn.jsdelivr.net/gh/mikechambers/es6-perlin-module/perlin.js';

export const math = (function () {
  return {
    weierstrass: function (x, y, z, maxPow) {
      let b = 1;
      let amp = 1;
      let lambda = 2; 
      let base = 0.45;
      let ret = 0;
      for (let k = 0; k < maxPow; k++) {
        ret += amp * (2.0 * perlin(b * x, b * y, b * z) - 1.0);
        amp *= base;
        b *= lambda;
      }
      ret = Math.exp(1.7 * ret) - 1.;
      return ret;
    }
  };
})();