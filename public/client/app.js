/* Global Variables */
let token
let peer
let dc
let ms_width = 1920
let ms_height = 1080
let count = 0
let mouseX
let mouseY

/* Import or Initilization */
const socket = io.connect('/')
const source = document.getElementById('display')
const tokenBox = document.getElementById('tokenBox') 

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
    source.play()
}

/* --------------------------------------------------------------------------------------------- */
                                // Mouse Events //

/* Mouse onclick event function */
//source.addEventListener('click', (e) => {
    //let posX = source.offsetLeft
    //let posY = source.offsetTop
    //let tempX = (e.pageX - posX) / window.innerWidth * 100 
    //let tempY = (e.pageY - posY) / window.innerHeight * 100
    /*-----------------------------*/
    //mouseX = tempX / 100 * ms_width
    //mouseY = tempY / 100 * ms_height
    /*-----------------------------*/
    //let pointer = {status: 'moveTo', x: Math.floor(mouseX), y: Math.floor(mouseY)}
    //console.log(pointer)
    //dc.send(pointer)
//})


/* Mouse double click event function */
//source.addEventListener('dblclick', (e) => {
    //let pointerClick = {status: 'doubleClick', x: Math.floor(mouseX), y: Math.floor(mouseY)}
    //dc.send(pointerClick)
//})

/* --------------------------------------------------------------------------------------------- */
                                // Touch Events //

/* Touch double tab & draggable setter event function */
let touchDoubleTab = 0
let draggable = false
let doubleTabTimer
source.addEventListener('touchstart', (e) => {
    touchDoubleTab = touchDoubleTab + 1
    let posX = source.offsetLeft
    let posY = source.offsetTop
    let tempX = (e.touches[0].pageX - posX) / window.innerWidth * 100 
    let tempY = (e.touches[0].pageY - posY) / window.innerHeight * 100
    /*-----------------------------*/
    mouseX = tempX / 100 * ms_width
    mouseY = tempY / 100 * ms_height
    /*-----------------------------*/
    if(touchDoubleTab === 2){
        clearInterval(doubleTabTimer)
        let pointerClick = {status: 'doubleClick', x: Math.floor(mouseX), y: Math.floor(mouseY)}
        dc.send(pointerClick)
        touchDoubleTab = 0
    }
    //else {
    //    draggable = true
    //}
    doubleTabTimer = setInterval(() => {
        touchDoubleTab = 0
        clearInterval(doubleTabTimer)
    }, 3000)
})


/* Touch cursor move & drag event function */
source.addEventListener('touchmove', (e) => {
    if(draggable){
        let pointer = {status:'dragTo', x: Math.floor(mouseX), y: Math.floor(mouseY)}
        console.log(pointer)
        dc.send(pointer)
    }
    else {
        let pointer = {status:'moveTo', x: Math.floor(mouseX), y: Math.floor(mouseY)}
        console.log(pointer)
        dc.send(pointer)
    }
})


/* Touch drag event disabler function */
source.addEventListener('touchend', (e) => {
    draggable = false
})


/* Keyboard event function */
const keyEvent = (e) => {
    var keys = e.which || e.keyCode;
    try {
        dc.send({status: 'write', nmChar: String.fromCharCode(keys)})
    } catch (error) {
        console.log('Peer not initiated')
    }
}
