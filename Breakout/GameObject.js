class GameObject {
  constructor(x,y,sprite,vx = 0,vy = 0) {
    this.x = x;
    this.y = y;
    this.icon = sprite;
    this.width = sprite.width;
    this.height = sprite.height;
    this.vx = vx;
    this.vy = vy;
  }

  show() {
    // draw the icon CENTERED around the X and Y coords of the game object
    image(this.icon, this.x, this.y, this.width, this.height);
  }

  collision(object){
    return this.x + this.width > object.x && this.x < object.x + object.width
      && this.y + this.height > object.y && this.y < object.y + object.height
  }

  static collision(o1,o2){
    return o1.x + o1.width > o2.x && o1.x < o2.x + o2.width
    && o1.y + o1.height > o2.y && o1.y < o2.y + o2.height 
  }
  update() {
    this.x += this.vx;
    this.y += this.vy;
  }

}
