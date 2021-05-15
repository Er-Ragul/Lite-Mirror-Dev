/* Global Variables */
let token
let peer
let dc
let ms_width = 1920
let ms_height = 1080
let display_width = 0
let display_height = 0
let count = 0
let HD = false

/* Import or Initilization */
const socket = io.connect('/')
const source = document.getElementById('display')
const tokenBox = document.getElementById('tokenBox') 

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
        socket.emit('makeCall', token, window.innerWidth, window.innerHeight) 
        peer = new Peer(token.toString(), {
            host: 'localhost',
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
                count = 0
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
    source.srcObject = stream
    source.style.visibility = 'visible'
}

source.addEventListener('loadedmetadata', () => {
    display_width = source.videoWidth 
    source.width = display_width
    console.log(display_width);
    /* --- */
    display_height = source.videoHeight
    source.height = display_height
    console.log(display_height);
    source.play()
    if(HD === false){
        dc.send('hd')
        HD = true
    }
});

/* Mouse onclick event function */
const mouseClick = (e) => {
    let posX = source.offsetLeft
    let posY = source.offsetTop
    let tempX = (e.pageX - posX) / display_width * 100 
    let tempY = (e.pageY - posY) / display_height * 100
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
        dc.send({nmChar: String.fromCharCode(keys)})
    } catch (error) {
        console.log('Peer not initiated')
    }
}
