class Ball extends GameObject {
  constructor(x, y, sprite, vx, vy) {
    super(x, y, sprite, vx, vy);
  }

  checkEdges() {
    if (this.x > width - this.icon.width) {
      this.vx *= -1;
    } else if (this.x < 0) {
      this.vx *= -1;
    }
  }

}