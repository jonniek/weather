const express = require('express')
const app = express()
const http = require('http').Server(app)
const io = require('socket.io')(http)

app.use(express.static('static'))

app.get('/', (req, res) => {
	res.sendFile(__dirname + '/index.html')
})

io.on('connection', (socket) => {
  socket.on('add', (measurement, callback) => {
    console.log('measurement: ', measurement)

    io.emit('update', measurement)

    callback({ status: 'ok' })
  })
})


http.listen(3000, () => {
  console.log('listening on *:3000')
})

