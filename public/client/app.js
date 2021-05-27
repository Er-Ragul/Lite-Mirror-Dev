/* Global Variables */
let token
let peer
let dc
let ms_width = 1920
let ms_height = 1080
let count = 0
let mouseX
let mouseY
let dragPos = false
let keyboardStatus = false

/* Import or Initilization */
const socket = io.connect('/')
const source = document.getElementById('display')
const tokenBox = document.getElementById('tokenBox') 
const toggle = document.getElementById('toggleKeyboard')
const virtualKeys = document.getElementById('virtualKeyboard')
const guester = document.getElementById('guester')
const dragger = document.getElementById('dragger')
const Keyboard = window.SimpleKeyboard.default;
/* --------------------------------------------------------------------------------------------- */
                                // Signaling & Stream setup //

/* Connection Establishment Event */
socket.on('YourId', (myId) => {
    document.getElementById('btn').disabled = false
})

/* Connection Establishment Function */
const startConnection = () => {
    token = document.getElementById('token').value
    if(token) { 
        tokenBox.remove()
        // Working here -------------------------------------------------------------------> //
        socket.emit('makeCall', token.toString(), window.innerWidth, window.innerHeight) 
        peer = new Peer(token.toString(), {
            host: 'lite-mirror-dev.herokuapp.com',
            port: 443,
            path: '/peerjs',
            secure: true,
            config: {
                'iceServers': [
                       { url: 'stun:stun1.l.google.com:19302' },
                       {
                           url: 'turn:3.131.158.239:3478?transport=udp',
                           credential: 'ragul',
                           username: 'ragul'
                       }]
            }
        })
        receiveShare() 
    }
    else { window.alert('Token should not be empty... Try Again') }
}

/* Initializing display function */
const receiveShare = () => {
    peer.on('call', (call) => {
        dc = peer.connect('software')
        console.log('Incoming Call')
        call.answer(null)
        call.on('stream', (stream) => {
            count++
            if(count === 2){
                console.log(`Stream received for ${count} times`)
                createDisplay(stream)
                count = 0
            }
        })

        dc.on('open', () => {
            dc.on('data', (msg) => {
                console.log(msg)
            })
        })
    })
}

/* Function to create display and sizing */
const createDisplay = (stream) => {
    source.width = window.innerWidth
    source.height = window.innerHeight
    source.srcObject = stream
    source.style.visibility = 'visible'
    guester.style.visibility = 'visible'
    source.play()
}

/* --------------------------------------------------------------------------------------------- */
                                // Mouse Events //

/* Mouse onclick event function */
source.addEventListener('click', (e) => {
    let posX = source.offsetLeft
    let posY = source.offsetTop
    let tempX = (e.pageX - posX) / window.innerWidth * 100 
    let tempY = (e.pageY - posY) / window.innerHeight * 100
    /*-----------------------------*/
    mouseX = tempX / 100 * ms_width
    mouseY = tempY / 100 * ms_height
    /*-----------------------------*/
    
    let click = {status:'click', x: Math.round(mouseX), y: Math.round(mouseY)}
    console.log(click)
    dc.send(click)
})

dragger.addEventListener('click', () => {
    if(!dragPos){
        drag.style.backgroundColor = 'lightgray'
        let dragSet = {status: 'dragSet', x: Math.round(mouseX), y: Math.round(mouseY)}
        dc.send(dragSet)
        dragPos = true
    }
    else if(dragPos){
        drag.style.backgroundColor = 'white'
        let dragTo = {status: 'dragTo', x: Math.round(mouseX), y: Math.round(mouseY)}
        dc.send(dragTo)
        dragPos = false
    }
})

/* Mouse double click event function */
source.addEventListener('dblclick', (e) => {
    let pointerClick = {status: 'doubleClick', x: Math.round(mouseX), y: Math.round(mouseY)}
    dc.send(pointerClick)
})

/* --------------------------------------------------------------------------------------------- */
                                // Touch Events //


/* Touch cursor move & drag event function */
source.addEventListener('touchmove', (e) => {
    let posX = source.offsetLeft
    let posY = source.offsetTop
    let tempX = (e.touches[0].pageX - posX) / window.innerWidth * 100 
    let tempY = (e.touches[0].pageY - posY) / window.innerHeight * 100
    /*-----------------------------*/
    mouseX = tempX / 100 * ms_width
    mouseY = tempY / 100 * ms_height
    /*-----------------------------*/
    let moveCursor = {status: 'moveTo', x: Math.round(mouseX), y: Math.round(mouseY)}
    dc.send(moveCursor)
})

/* Keyboard event function */
document.addEventListener('keypress', (e) => {
    console.log(e.key)
    try {
        dc.send({status: 'write', nmChar: e.key})
    } catch (error) {
        console.log('Peer not initiated')
    }
})


/* Virtual keyboard for Touch Devices */
toggle.addEventListener('click', () => {
    if(keyboardStatus === false){
        virtualKeys.style.visibility = 'visible'
        keyboardStatus = true
    }
    else{
        virtualKeys.style.visibility = 'hidden'
        keyboardStatus = false
    }
})

const keyboard = new Keyboard({
    onKeyPress: button => onKeyPress(button)
  });
  
 function onKeyPress(button) {
  if (button === "{shift}" || button === "{lock}"){
    handleShift();
  }
  else if (button === "{bksp}"){
    dc.send({status: 'backspace', nmChar: button})
  }
  else if (button === "{enter}"){
    dc.send({status: 'enter', nmChar: button})
  }
  else if (button === "{space}"){
    dc.send({status: 'space', nmChar: button})
  }
  else {
    dc.send({status: 'write', nmChar: button})
    console.log("Button pressed", button);
  }
}

function handleShift() {
  let currentLayout = keyboard.options.layoutName;
  let shiftToggle = currentLayout === "default" ? "shift" : "default";

  keyboard.setOptions({
    layoutName: shiftToggle
  });
}
