const express = require('express')
const app = express()
const fs = require('fs')
const path = require('path')
const server = require('http').Server(app)
const { ExpressPeerServer } = require('peer')
const peerServer = ExpressPeerServer(server, {
    debug: true
})
const io = require('socket.io')(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
})

app.use('/peerjs', peerServer)
app.set('view-engine', 'ejs')
app.use(express.static('public'))

app.get('/client', (req, res) => {
    res.render('client.ejs')
});

app.get('/engine', (req, res) => {
    res.render('engine.ejs')
});

io.on('connection', socket => {
    io.to(socket.id).emit('YourId', socket.id);
    console.log('Client Connected id : ' + socket.id)

    socket.on('create-room', roomid => {
        socket.join(roomid)
        console.log('Create Room : ' + roomid)
    })
    
    socket.on('makeCall', (token, cliWidth, cliHeight) => {
        socket.join(token)
        io.to(token).emit('makeClientCall', token, cliWidth, cliHeight)
        console.log('Token of client is : ' + token)
    })

})

server.listen(process.env.PORT || 443)
