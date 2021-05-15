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

let softid

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

    // Need to work on this soon //
    socket.on('reserve_id', (data) => {
        softid = data.id
        console.log('Software ID : ' + softid)
    })

    socket.on('makeCall', () => {
        io.to(softid).emit('makeClientCall', '143');
    })
})

server.listen(process.env.PORT || 443)
