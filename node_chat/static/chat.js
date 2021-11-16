var socket = io();
let user = '';

function setup() {
  createP('willkommen im Nodechat');
  createP('Unter welchem Namen möchtest du hier auftreten?')
  inputname = createInput();
  //inputname.position(20, 150);
  namebutton = createButton('submit');
  //namebutton.position(inputname.x + inputname.width, 150);
  namebutton.mousePressed(savename);
}

function savename() {
  user = inputname.value();
  removeElements();
  leaveButton=createButton('chat verlassen');
  leaveButton.mousePressed(leave);
  createP('Gib hier deine Nachricht ein');
  input = createInput();
  //input.position(20, 150);
  button = createButton('submit');
  //button.position(input.x + input.width, 150);
  button.mousePressed(send);
  socket.emit('chat message', 'Der Teilnehmer '+user+' hat den Chat betreten');
}
function leave(){
  socket.emit('chat message', 'Der Teilnehmer '+user+' hat den Chat verlassen');
  removeElements();
}
function send() {
  let str = user + ': ' + input.value();
  socket.emit('chat message', str);
}

socket.on('chat message', function (msg) {
  createP(msg);
});
// aufrufen mit http://localhost:3000