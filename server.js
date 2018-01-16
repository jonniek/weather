// use express to serve files
const express = require('express')
const app = express()

// add static folder to load icons and js
app.use(express.static('dist'))

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
    slug: 'tokyo',
    coordinates: [139.7328635, 35.6584421],
    topoindex: 82,
    utcOffsetHours: 9
  }, {
    id: 1,
    name: 'Helsinki',
    slug: 'helsinki',
    coordinates: [24.9490830, 60.1697530],
    topoindex: 52,
    utcOffsetHours: 2 // TODO in the summer it's 3!!
  }, {
    id: 2,
    name: 'New York',
    slug: 'newyork',
    coordinates: [-73.9938438, 40.7406905],
    topoindex: 168,
    utcOffsetHours: -5 // -4 in the summer..
  }, {
    id: 3,
    name: 'Amsterdam',
    slug: 'amsterdam',
    coordinates: [4.9040238, 52.3650691],
    topoindex: 117,
    utcOffsetHours: 1 // I guess I need some api for this..
  }, {
    id: 4,
    name: 'Dubai',
    slug: 'dubai',
    coordinates: [55.1562243, 25.092535],
    topoindex: 3,
    utcOffsetHours: 4
  }
]

const locationIdExists = (id) => {
  return locations.filter(l => l.id === id).length > 0
}

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
      temperature,
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

// gets all measurements from the past 24 hours
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
  // save it in the database and emit to everyone
  socket.on('add', (measurement, callback) => {

    // make sure measurements is not undefined
    measurement = measurement === undefined
      ? {} : measurement
    // verify measurements data
    const id = +measurement.id
    const temp = +measurement.temperature

    const validId = locationIdExists(id)
    const validTemp = temp < 101 && temp > -101

    if (!validId || !validTemp) {
      // data is corrupted
      console.log("corrupted input", measurement)
      callback({ success: false })
      return
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

const port = process.env.PORT || 3000

http.listen(port, () => {
  console.log('listening on: localhost:' + port)
})

