let canvas;
let g;
let terrain = [];
let maxfreq = 10;
let a = [];
let phi = [];
let speed = 10;
let ypos = 0;
let xpos = 0;
let incr = 0.02;

function setup() {
    canvas = createCanvas(windowWidth, windowHeight, WEBGL);
    noStroke();
    //camera(0, -150, 300);
    for (let l = 1; l < maxfreq; l++) {
        a[l] = [];
        phi[l] = [];
        for (let k = 1; k < maxfreq; k++) {
            a[l][k] = Math.random();
            phi[l][k] = Math.random() * Math.PI * 2;
        }
    }
    g = new p5.Geometry(256, 256, oberflaeche);
}

function noise2d(x, y) {
    let k = 2 * PI*0.1 ;
    let ret = 0;
    for (let i = 1; i < maxfreq; i++)
      for (let j = 1; j < maxfreq; j++) {
        ret += a[i][j] * sin(k * (i * x + j * y) + phi[i][j]);
      }
    return ret;
  }
  
  function weierstrass(x, y) {
    let b = 1;
    let amp = 1;
    let lambda = 1.9;
    let base = 0.5;
    let ret = 0;
    for (let k = 0; k < maxfreq; k++) {
      ret += amp * noise2d(b * x, b * y);
      amp *= base;
      b *= lambda;
    }
    return ret;
  }

function oberflaeche() {
    for (var y = 0; y <= this.detailY; y++) {
        var w = y / this.detailY;
        for (var x = 0; x <= this.detailX; x++) {
            var u = x / this.detailX;
            var p = new p5.Vector(u - 0.5, w - 0.5, 0);
            this.vertices.push(p);
            this.uvs.push(u, w);
        }
    }
}

function draw() {
    background(100);
    orbitControl(2, 1, 0.05);

    if (keyIsPressed) {

        if (key == 'w') {
            ypos += incr;
        }
        if (key == 's') {
            ypos -= incr;
        }
        if (key == 'a') {
            xpos += incr;
        }
        if (key == 'd') {
            xpos -= incr;
        }

    }

    let yoff = ypos;
    for (let y = 0; y <= g.detailY; y++) {
        let xoff = xpos;
        terrain[y] = [];
        for (let x = 0; x <= g.detailX; x++) {
            terrain[y][x] = 0.5*weierstrass(xoff, yoff);
            xoff += 0.03;
        }
        yoff += 0.03;
    }

    for (let y = 0; y <= g.detailY; y++) {
        for (let x = 0; x <= g.detailX; x++) {
            g.vertices[y * (g.detailX + 1) + x].z = terrain[y][x];

        }
    }
    rotateX(-PI / 2);
    ambientLight(100, 100, 100);
    directionalLight(255, 255, 255, -1, -1, -1);

    translate(0, 2500, 300);
    noStroke();
    g.computeFaces().computeNormals();
    canvas.createBuffers("!", g);
    canvas.drawBuffersScaled("!", 6000, 6000, 100);
}