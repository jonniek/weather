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
	const m = {
		id: Math.floor(Math.random() * 5),
		celcius: Math.floor(Math.random() * 20 + 10)
	}
	console.log(m)
	io.emit('measurement', m)
}, 10000)


http.listen(3000, () => {
  console.log('listening on *:3000')
})