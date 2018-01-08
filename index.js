const express = require('express')
const app = express()
const http = require('http').Server(app)
const io = require('socket.io')(http)

app.use(express.static('static'))

app.get('/', (req, res) => {
	res.sendFile(__dirname + '/index.html')
})

io.on('connection', function(socket){
  console.log('a user connected');
})

const ping = setInterval(() => {
	io.emit('ping', new Date())
}, 10000)


http.listen(3000, () => {
  console.log('listening on *:3000')
})