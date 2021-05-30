/* Global Variables */
let peer
let dc
let softwareId
let peerid

/* Import or Initialization */
let socket = io.connect('/')
const { desktopCapturer } = require('electron')
const fs = require('fs')
const { type } = require('os')

/* Socket callback events for peer to peer connectivity */
socket.on('YourId', (myId) => {
    softwareId = Math.floor(1000 + Math.random() * 9000)
    peerid = 'lite'+softwareId.toString()
    document.getElementById('yourToken').innerHTML = softwareId
    console.log('Software ID : ' + peerid)
    peer = new Peer(peerid, {
        host: 'lite-mirror-dev.herokuapp.com',
        port: 443,
	path: '/peerjs',
        secure: true,
        config: {
            'iceServers': [
                   { url: 'stun:stun1.l.google.com:19302' },
                   {
                       url: 'turn:3.17.63.136:3478?transport=udp',
                       credential: 'ragul',
                       username: 'ragul'
                   }]
        }
    })
    dataConnection()
    socket.emit('create-room', softwareId.toString())
})

/* Make call to client  ---> step : 1 */
socket.on('makeClientCall', (client_id, cliWidth, cliHeight) => {
    console.log('Call Requested from Client')
    console.log('Client ID : ', client_id)
    startShare(client_id, cliWidth, cliHeight)
})

/* Function to call client with media stream  ---> step : 2 */
function startShare(client_id, reqWidth, reqHeight){
    console.log('Media : ', reqWidth, reqHeight)
    desktopCapturer.getSources({ types: ['window', 'screen'] })
    .then(sources => {
        for(i=0; i<sources.length; i++){
            if(sources[i].name === 'Entire Screen'){
                displaySource = sources[i].id
                try{
                    navigator.mediaDevices.getUserMedia({video: 
                        {
                            mandatory: {              
                                chromeMediaSource: 'desktop',
                                maxWidth: 1920,
                                maxHeight: 1080
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
                catch (e){
                    console.log('Error inside Navigator : ', e)
                }
            }
        }
    })
    .catch(e => console.log('Error outside Navigator : ', e))
}

/* Function to receive data's (mouse coordinates) from client */
const dataConnection = () => {
    peer.on('connection', function(conn) {
        dc = conn
        dc.on('open', () => {
            dc.on('data', (pointer) => {
                click(pointer)
            })
            var width = window.screen.width * window.devicePixelRatio
            var height = window.screen.height * window.devicePixelRatio
            dc.send({pcWidth: width, pcHeight: height})
        })
    })
}

/* Mouse & Keyboard event execution function */
const click = (command) => {
    if(typeof(command) === "object" && Object.keys(command).length === 3){
        console.log(typeof(command))
        console.log('Status : ', command.status)
        console.log('X : ' + command.x)
        console.log('Y : ' + command.y)                    
        var mouseCoordinates = command.status + '|' + command.x + '|' + command.y
        fs.writeFile('./mouse_pointer.txt', mouseCoordinates, function (err) {
            if (err) throw err;
            console.log('Mouse pointer updated !');
        });
    }
    else if(typeof(command) === "object" && Object.keys(command).length === 2){
        console.log('Status :', command.status)
        console.log('Keys :', command.nmChar)
        var pencil = command.status + '|' + command.nmChar
        fs.writeFile('./key_events.txt', pencil, function (err) {
            if (err) throw err;
            console.log('String updated !');
        });
    }
}
