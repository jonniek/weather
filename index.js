// use express to serve files
const express = require('express')
const app = express()

// use http as middleware for express server
// so that socket io can listen in on events
const http = require('http').Server(app)

// use socket io for communication between
// client and server
const io = require('socket.io')(http)

/** use lightweight nedb that uses
	* same api as mongodb making an upgrade
	* straight forward.
	*/
const Datastore = require('nedb')

/** Since we don't need to dynamically add
	* locations we can be lazy and store them in
	* a static variable and only store measurement
	* data by relation
	*/
const locations = [
	{
		id: 0,
		name: 'Tokyo',
		coordinates: [139.7328635, 35.6584421],
		topoindex: 82 
	}, {
		id: 1,
		name: 'Helsinki',
		coordinates: [24.9490830, 60.1697530],
		topoindex: 52
	}, {
		id: 2,
		name: 'New York',
		coordinates: [-73.9938438, 40.7406905],
		topoindex: 168
	}, {
		id: 3,
		name: 'Amsterdam',
		coordinates: [4.9040238, 52.3650691],
		topoindex: 117 
	}, {
		id: 4,
		name: 'Dubai',
		coordinates: [55.1562243, 25.092535],
		topoindex: 3 
	}
]
const allLocIds = locations.map(l => l.id)

// setup our database from file
const temperatureDatabase =
	new Datastore({
		filename: './temperatures.db',
		autoload: true
	})

const saveMeasurement = (data) => {
	const timestamp = Date.now()
	const locationId = data.id
	const { temperature } = data

	return new Promise((resolve, reject) => {
		temperatureDatabase.insert({
			locationId,
			temperature, // backend stores measuremnt in celcius
			timestamp
		}, (err, doc) => {
			if(err){
				reject(err)
			} else {
				resolve(doc)
			}
		})
	})
}

const getMeasurements = () => {
	const onedayago = Date.now() - 24*60*60*1000
	return new Promise((resolve, reject) => {
		temperatureDatabase
			.find({ $where: function(){
				return this.timestamp > onedayago
			}}, (err, docs) => {
				if (err) {
					reject(err)
				} else {
					resolve(docs)
				}
			})
	})
}


app.use(express.static('static'))

app.get('/', (req, res) => {
	res.sendFile(__dirname + '/index.html')
})

app.get('/data', (req, res) => {
	getMeasurements().then(measurements => {
		res.json({
			success: true,
			locations,
			measurements
		})
	})
	.catch(err => {
		res.json({ success: false })
	})
})

io.on('connection', (socket) => {

	// when user sends temperature measurements
	// save it in the database and 
  socket.on('add', (measurement, callback) => {

  	// verify data
  	const id = measurement.id
  	const temp = measurement.temperature

  	const validId = allLocIds.indexOf(id) !== -1
  	const validTemp = temp < 101 && temp > -101

  	if (!validId || !validTemp) {
  		// data is corrupted
    	callback({ success: false })
  	}

    saveMeasurement(measurement)
    	.then(res => {
    		io.emit('update', res)
    		callback({ success: true })
    	})
    	.catch(err => {
    		console.log("error", err)
    		callback({ success: false })
    	})

  })
})


http.listen(3000, () => {
  console.log('listening on *:3000')
})

