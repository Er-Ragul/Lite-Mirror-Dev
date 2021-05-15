/* Global Variables */
let displaySource
let peer
let dc

/* Import or Initialization */
let socket = io.connect('/')
const { desktopCapturer } = require('electron')
const fs = require('fs')
const { type } = require('os')
desktopCapturer.getSources({ types: ['window', 'screen'] })
    .then(sources => {
        for(i=0; i<sources.length; i++){
            if(sources[i].name === 'Entire Screen'){
                displaySource = sources[i].id
            }
        }
    })
    .catch(e => console.log(e))


/* Socket callback events for peer to peer connectivity */
socket.on('YourId', (myId) => {
    console.log('Received ID from server')
    peer = new Peer('software', {
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
    dataConnection()
    socket.emit('reserve_id', {name: 'software', id: myId})
})

/* Make call to client  ---> step : 1 */
socket.on('makeClientCall', (client_id) => {
    console.log('Call Initiated from client')
    startShare(client_id)
})

/* Function to call client with media stream  ---> step : 2 */
function startShare(client_id){
    navigator.mediaDevices.getUserMedia({video: 
        {
            mandatory: {              
                chromeMediaSource: 'desktop',
                chromeMediaSourceId: displaySource
            },
            cursor: 'never'
        }, 
        audio: {
            mandatory: {
                chromeMediaSource: 'desktop'
            }
        }
        })
        .then(stream => {
            peer.call(client_id, stream)
        })
        .catch(e => console.log(e))
}

/* Function to receive data's (mouse coordinates) from client */
const dataConnection = () => {
    peer.on('connection', function(conn) {
        dc = conn
        dc.on('open', () => {
            dc.on('data', (pointer) => {
                click(pointer)
            })
        })
    })
}

/* Mouse Click (Single click) function */
const click = (command) => {
    if(typeof(command) === "object"){
        console.log(typeof(command))
        console.log('X : ' + command.x)
        console.log('Y : ' + command.y)                    
        var mouseCoordinates = command.x + ',' + command.y
        fs.writeFile('./interface/mouse_pointer.txt', mouseCoordinates, function (err) {
            if (err) throw err;
            console.log('Mouse pointer updated !');
        });
    }
    else if(typeof(command) === "string"){
        console.log('Keys :', command)
        var pencil = 'write' + ',' + command
        fs.writeFile('./interface/key_events.txt', pencil, function (err) {
            if (err) throw err;
            console.log('String updated !');
        });
    }
}

/* Message sender function */
const send = () => {
    dc.send('Message sent from Software')
}
