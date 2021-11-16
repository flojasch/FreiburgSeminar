let text;

function setup() {
  createCanvas(window.innerWidth - 4, window.innerHeight - 4, WEBGL);
  text = createGraphics(window.innerWidth - 4, window.innerHeight - 4);
  text.textFont('Source Code Pro');
  text.textAlign(CENTER);
  text.textSize(133);
  text.fill(200,0,0);
  text.noStroke();
  text.text('test', width * 0.5, height * 0.5);
}

function draw() {
  background(217);
  noStroke();
  texture(text);
  rotateY(map(mouseX, 0, width, 0, 3));
  plane(window.innerWidth - 4, window.innerHeight - 4);
}