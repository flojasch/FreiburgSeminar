class Paddel extends GameObject {
  constructor(x, y, sprite) {
    super(x, y, sprite);
  }

  update() {
    if (keyIsPressed) {
      if (keyCode == 39) {
        if (this.x < width - this.icon.width) {
          this.x += 10;
        }
      }
      if (keyCode == 37) {
        if (this.x > 0) {
          this.x -= 10;
        }
      }
    }
  }
}