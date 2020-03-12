//Load Sprite data
var jsondata;
fetch('images/ULPC/data.json')
  .then(res => res.json())
  .then(json => jsondata = json)

var socket = io()
var canvas = document.getElementById('canvas')
var cntx = canvas.getContext('2d')
canvas.width = window.innerWidth
canvas.height = window.innerHeight;
const input = document.getElementById('message')
const send = document.getElementById('send')

var User = JSON.parse(user)
delete User.password
User.x = Math.random()
User.y = Math.random()
User.animation = "stand_down"
User.frameCount = 0
User.message = ""


socket.emit('join', User)



//Socket Handling

socket.on('heartbeat', users => {

  cntx.clearRect(0, 0, canvas.width, canvas.height)
  for (var key in users) {
    if (jsondata) {
      const img = new Image()
      img.src = users[key].image;

      let l = Object.keys(jsondata["animations"][users[key].animation]).length
      let frame = jsondata["frames"][jsondata["animations"][users[key].animation][users[key].frameCount % l]]


      cntx.drawImage(img, frame.frame.x, frame.frame.y, 64, 64, users[key].x * canvas.width, users[key].y * canvas.height, 64, 64)
      cntx.fillStyle = "white"
      cntx.fillText(users[key].message, (users[key].x * canvas.width) + 5, (users[key].y * canvas.height) - 1)
    }
  }
})


socket.on('joined', name => {

  toast = new Android_Toast({
    content: `${name} Joined`,
    duration: 4000,
    position: 'top'
  });

})

socket.on('disconnected', name => {
  toast = new Android_Toast({
    content: `${name}  Left the Chat`,
    duration: 4000,
    position: 'top'
  });

})

socket.on('error', data => {
  alert(data)
})

canvas.addEventListener('click', (evt) => {
  mousePos = getMousePos(canvas, evt)

  // console.log(mousePos.x,mousePos.y)


  const data = {
    id: socket.id,
    x: mousePos.x / canvas.width,
    y: mousePos.y / canvas.height
  }
  socket.emit('change-pos', data)

})
//End of Socket Handling
//Send message
send.onclick = () => {
  var message = DOMPurify.sanitize(input.value);
  if (!message || 0 === message.length) {
    alert("Must enter something");
    return;
  }
  data = {
    id: socket.id,
    message: message
  }

  socket.emit('send-chat', data)
  input.value = "";

}
//Util Functions



function getMousePos(canvas, evt) {
  var rect = canvas.getBoundingClientRect();
  return {
    x: evt.clientX - rect.left,
    y: evt.clientY - rect.top
  }

}
//Responsive Canvas
window.onresize = function(event) {
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
};
