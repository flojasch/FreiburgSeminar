import perlin from 'https://cdn.jsdelivr.net/gh/mikechambers/es6-perlin-module/perlin.js';

export const math = (function() {
  return {
    rand_range: function(a, b) {
      return Math.random() * (b - a) + a;
    },

    rand_normalish: function() {
      const r = Math.random() + Math.random() + Math.random() + Math.random();
      return (r / 4.0) * 2.0 - 1;
    },

    rand_int: function(a, b) {
      return Math.round(Math.random() * (b - a) + a);
    },

    lerp: function(x, a, b) {
      return x * (b - a) + a;
    },

    smoothstep: function(x, a, b) {
      x = x * x * (3.0 - 2.0 * x);
      return x * (b - a) + a;
    },

    smootherstep: function(x, a, b) {
      x = x * x * x * (x * (x * 6 - 15) + 10);
      return x * (b - a) + a;
    },

    clamp: function(x, a, b) {
      return Math.min(Math.max(x, a), b);
    },

    sat: function(x) {
      return Math.min(Math.max(x, 0.0), 1.0);
    },

    weierstrass: function(x, y,z) {
      const maxPow=4;
      let b = 1;
      let amp = 1;
      let lambda = 2; 
      let base = 0.5; 
      let ret = 0;
      for (let k = 0; k < maxPow; k++) {
        ret += amp * (2.0*perlin(b*x,b*y,b*z)-1.0);
        amp *= base;
        b *= lambda;
      }
      ret=Math.exp(1.7*ret)-1.;
      return ret;
    },

  };
})();
