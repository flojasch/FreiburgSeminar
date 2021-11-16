let mx = -0.7;
let my = 0.0;
let ex = 2.8;
let ey = 2.8;
let mousePressed = false;

document.addEventListener('mousedown', function (event) {
  startX = event.pageX;
  startY = event.pageY;
  mousePressed = true;
}, false);

document.addEventListener('mousemove', function (event) {
  if (mousePressed) {
    const canvas = document.querySelector('#c');
    // der Vorfaktor macht die Maus spritziger
    mx += 2*ex * (startX - event.pageX) / canvas.clientWidth;
    my -= 2*ey * (startY - event.pageY) / canvas.clientHeight;
    startX=event.pageX;
    startY=event.pageY;
  }
}, false);

document.addEventListener('mouseup', function (event) {
  mousePressed = false;
}, false);

document.addEventListener('wheel', function (event) {
  const canvas = document.querySelector('#c');
  var zoom = 1.15;
  if (event.deltaY < 0) {
    zoom = 0.85;
  }
  // die Vorfaktoren sorgen dafür, dass der Zoompunkt der Mauszeiger ist
  var ix = mx + 4*ex * (event.pageX / canvas.clientWidth-.5);
  var iy = my - 2*ey * (event.pageY / canvas.clientHeight-.5);
  ex *= zoom;
  ey *= zoom;
  mx = ix + (mx - ix) * zoom;
  my = iy + (my - iy) * zoom;
}, false);