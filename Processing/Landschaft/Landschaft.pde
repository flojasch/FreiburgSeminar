int cols, rows;
int scl=5;
float[][] terrain;
float flying=0;
int w=3000;
int h=2400;
float[][] a;
float[][] siphi;
float[][] cophi;
int maxNoiseFreq=10;
int maxWeierPow=10;

void setup() {
  size(1000, 1000, P3D);
  //frameRate(10);
  cols =w/scl;
  rows =h/scl;

  terrain=new float[cols][rows];
  for (int y=0; y <rows; y++) {
    for (int x=0; x <cols; x++) {
      terrain[x][y]=0;
    }
  }
int N=maxNoiseFreq;
  a=new float[N][N];
  siphi=new float[N][N];
  cophi=new float[N][N];
  for (int l = 0; l < N; l++) {
    for (int k = 0; k < N; k++) {
      a[l][k] = random(1);
      float phi = random(TWO_PI);
      siphi[l][k]=sin(phi);
      cophi[l][k]=cos(phi);
    }
  }
}

float weierstrass(float x, float y) {
  float scale = 100;
  x=x*TWO_PI/scale;
  y=y*TWO_PI/scale;
  float b = 1;
  float amp = 50;
  float lambda = 2;//1.5;
  float base = 0.45;//0.6;
  float ret = 0;
  for (int k = 0; k < maxWeierPow; k++) {
    ret += amp * (fourierNoise(b * x, b * y)-0.0);
    amp *= base;
    b *= lambda;
  }
  return ret;
}

float fourierNoise(float x, float y) {
  float ret = 0;
  float six=sin(x);
  float cox=cos(x);
  float siy=sin(y);
  float coy=cos(y);
  float imx=0;
  float rex=1;
  float imy=0;
  float rey=1;
  float reh;
  float zx,zy;
  
  for (int i = 0; i < maxNoiseFreq; i++) {
    reh=cox*rex-six*imx;
    imx=rex*six+imx*cox;
    rex=reh;
    rey=1;
    imy=0;
    for (int j = 0; j < maxNoiseFreq; j++) {
      reh=coy*rey-siy*imy;
      imy=rey*siy+imy*coy;
      rey=reh;
      zx=rex*rey-imx*imy;
      zy=rex*imy+imx*rey;
      ret += a[i][j] * (zx*siphi[i][j]+zy*cophi[i][j]);
    }
  }
  return ret;
}

void draw() {
  background(140, 157, 230);
  //spotLight(0, 255, 0, 200, 50, 800, 0, 0, -1, PI/4, 2);
  lights();
  noStroke();

  //fill(255);
  translate(width/2-200, height/2+50);
  rotateX(PI/3);
  translate(-width/2, -1200,300);
  flying -=0.03;

  float yoff =flying;
  for (int y=0; y <rows; y++) {
    float xoff =0;
    for (int x=0; x <cols; x++) {
      if (y<rows-1) {
        terrain[x][y]=terrain[x][y+1];
      } else {
        terrain[x][y]=max(weierstrass(xoff, yoff), 0);
      }
      xoff +=0.03;
    }
    yoff +=0.03;
  }

  for (int y=0; y< rows-1; y++) {
    beginShape(TRIANGLE_STRIP);
    for (int x=0; x <cols; x++) {
      color tal=color(25, 106, 40);
      color berg=color(99);
      float interparam=min(max(0, terrain[x][y]/250), 1);
      color inter =lerpColor(tal, berg, interparam);
      if (terrain[x][y]==0) fill(0, 100, 200); 
      else fill(inter);
      vertex(x*scl, y*scl, terrain[x][y]);
      vertex(x*scl, (y+1)*scl, terrain[x][y+1]);
    }
    endShape();
  }
}
