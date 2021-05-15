/* Global Variables */
let token
let peer
let dc
let ms_width = 1920
let ms_height = 1080
let count = 0

/* Import or Initilization */
const socket = io.connect('/')
const display = document.getElementById('display')
const source = document.getElementById('source')
const ctx = display.getContext('2d');
const tokenBox = document.getElementById('tokenBox') 
//const maxBtn = document.getElementById('maxBtn')

/* Connection Establishment Event */
socket.on('YourId', (myId) => {
    document.getElementById('btn').disabled = false
})

/* Connection Establishment Function */
const startConnection = () => {
    token = document.getElementById('token').value
    if(token) { 
        tokenBox.remove()
        socket.emit('makeCall', token) 
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
                createDisplay(stream)
            }
            else {
                console.log(`Stream received for ${count} times`)
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
    display.width = window.innerWidth
    display.height = window.innerHeight
    display.style.visibility = 'visible'
    source.srcObject = stream
    source.play()
    console.log('Inner Width : ', window.innerWidth)
    console.log('Inner Height : ', window.innerHeight)
    drawImage()
}

const drawImage = () => {
    ctx.drawImage(source, 0, 0);
    setTimeout(drawImage, 1000 / 24);
}

/* Mouse onclick event function */
const mouseClick = (e) => {
    let posX = display.offsetLeft
    let posY = display.offsetTop
    let tempX = (e.pageX - posX) / window.innerWidth * 100 
    let tempY = (e.pageY - posY) / window.innerHeight * 100
    /*-----------------------------*/
    let X = tempX / 100 * ms_width
    let Y = tempY / 100 * ms_height
    /*-----------------------------*/
    let pointer = {x: Math.floor(X), y: Math.floor(Y)}
    console.log(pointer)
    dc.send(pointer)
}

/* Keyboard event function */
const keyEvent = (e) => {
    var keys = e.which || e.keyCode;
    try {
        dc.send(String.fromCharCode(keys))
    } catch (error) {
        console.log('Peer not initiated')
    }
}
