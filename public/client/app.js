/* Global Variables */
let token
let peer
let dc
let ms_width = 0
let ms_height = 0
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
const save = document.getElementById('save')
const copy = document.getElementById('copy')
const cut = document.getElementById('cut')
const paste = document.getElementById('paste')
const selectAll = document.getElementById('select-all')
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
        console.log('You entered : ' + token)
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
        var peerid = 'lite'+token.toString()
        console.log(peerid)
        dc = peer.connect(peerid)
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
            dc.on('data', (size) => {
                ms_width = size.pcWidth
                ms_height = size.pcHeight
                console.log('Main Screen Width : ' + ms_width)
                console.log('Main Screen Height : ' + ms_height)
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

/* --------------------------------------------------------------------------------------------- */
                                // Keyboard Events //

/* Keyboard event function */
document.addEventListener('keypress', (e) => {
    console.log(e.key)
    try {
        if(e.key === 'Backspace'){
            dc.send({status: 'backspace', nmChar: e.key})
        }
        else if(e.key === ' '){
            dc.send({status: 'space', nmChar: e.key})
        }
        else if (e.key === 'Enter'){
            dc.send({status: 'enter', nmChar: e.key})
          }
        else {
            dc.send({status: 'write', nmChar: e.key})
        }
    } catch (error) {
        console.log('Peer not initiated')
    }
})

/* --------------------------------------------------------------------------------------------- */
                        //Virtual Keyboard Events for touch screen //

/* Virtual keyboard for Touch Devices */
toggle.addEventListener('click', () => {
    if(keyboardStatus === false){
        virtualKeys.style.visibility = 'visible'
        toggle.style.backgroundColor = 'lightgray'
        keyboardStatus = true
    }
    else{
        virtualKeys.style.visibility = 'hidden'
        toggle.style.backgroundColor = 'white'
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

/* Smart Menu events */
let guestFocus = false
guester.addEventListener('mousedown', (e) => {
    guestFocus = true
})

guester.addEventListener('mouseup', (e) => {
    guestFocus = false
})

guester.addEventListener('mousemove', (e) => {
    if(guestFocus){
        guester.style.left = e.pageX + 'px'
    }
})

guester.addEventListener('touchstart', (e) => {
    guestFocus = true
})

guester.addEventListener('touchmove', (e) => {
    if(guestFocus){
        guester.style.left = e.touches[0].pageX + 'px'
    }
})

guester.addEventListener('touchend', (e) => {
    guestFocus = false
})


/* Drag icon event */
dragger.addEventListener('click', () => {
    if(!dragPos){
        dragger.style.backgroundColor = 'lightgray'
        let dragSet = {status: 'dragSet', x: Math.round(mouseX), y: Math.round(mouseY)}
        dc.send(dragSet)
        dragPos = true
    }
    else if(dragPos){
        dragger.style.backgroundColor = 'white'
        let dragTo = {status: 'dragTo', x: Math.round(mouseX), y: Math.round(mouseY)}
        dc.send(dragTo)
        dragPos = false
    }
})

save.addEventListener('click', () => {
    let saveThat = {status: 'saveThat', x: Math.round(mouseX), y: Math.round(mouseY)}
    dc.send(saveThat)
})

copy.addEventListener('click', () => {
    copy.style.backgroundColor = 'lightgray'
    let copyThat = {status: 'copyThat', x: Math.round(mouseX), y: Math.round(mouseY)}
    dc.send(copyThat)
})

cut.addEventListener('click', () => {
    cut.style.backgroundColor = 'lightgray'
    let cutThat = {status: 'cutThat', x: Math.round(mouseX), y: Math.round(mouseY)}
    dc.send(cutThat)
})

paste.addEventListener('click', () => {
    copy.style.backgroundColor = 'white'
    cut.style.backgroundColor = 'white'
    let pasteThat = {status: 'pasteThat', x: Math.round(mouseX), y: Math.round(mouseY)}
    dc.send(pasteThat)
})

selectAll.addEventListener('click', () => {
    let selectThose = {status: 'selectThose', x: Math.round(mouseX), y: Math.round(mouseY)}
    dc.send(selectThose)
})
