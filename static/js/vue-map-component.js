/** A canvas map vue component
  *
  * locations prop is an array of location objects with
  * coordinates and latest temperature
  *
  * Selected prop is the index which location is selected
  *
  * Ping prop changes to index of a location that had a measurement
  *
  * Global variable dependencies:
  *   Vue       /-- For the component declaration
  *   d3        /-- For sphere projections/paths and other functions
  *   world     /-- A json object with world-110m data
  *   topojson  /-- For parsing the world data
  *   
  * Uses modern javascript features. Use babel transpilation
  * to support older browsers.
  *
*/

// calculate naive distance between two coordinates
const pythagoras = (x, y) => {
  return Math.sqrt(Math.pow(x[0]-y[0], 2) + Math.pow(x[1]-y[1], 2))
}

// register vue component
Vue.component('vue-map', {
  template: '<canvas ref="canvas"></canvas>',
  props: ['locations', 'selected'],
  watch: {
    selected: function() {
      
      const oldCoordinates = this.coordinates

      this.coordinates = this.locations[this.selected].coordinates

      // when selected location changes, rotate the projection
      this.rotate(this.coordinates, oldCoordinates)
    }
  },
  created: function() {

    // initialize the first coordinates
    this.coordinates = this.locations[this.selected].coordinates

    // initialize worldmap meshes
    this.land =
      topojson.feature(world, world.objects.land)
    this.countries =
      topojson.feature(world, world.objects.countries).features
    this.borders =
      topojson.mesh(world, world.objects.countries, (a, b) => a !== b)

    const locationIndexes =
      this.locations.map(l => l.topoindex)

    // assign a varied color to each countries index
    this.colors = this.countries.map((_, i) => {

      if (locationIndexes.indexOf(i) !== -1) {
        return '#ABB'
      }

      let hex = (i % 4 * 3).toString(16)
      return '#C'+hex+'D'+hex+'D'+hex
    })

  },
  mounted: function() {
    // add resize listener to rescale canvas on window size change
    window.addEventListener('resize', this.init)

    // initialize the canvas
    this.init(true)

    // center map around current location if possible
    /*
    if (navigator && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        const { latitude, longitude } = position.coords
        console.log("Location found, centering map", latitude, longitude)
        this.rotate([latitude, longitude])
      }, console.error) 
    }*/
  },
  methods: {
    init: function(first) {
      this.canvas = this.$refs.canvas
      this.height = window.innerHeight
      this.width = window.innerWidth
      this.canvas.setAttribute("height", this.height)
      this.canvas.setAttribute("width", this.width)
      this.context = this.canvas.getContext('2d')

      this.projection =
        d3.geo.orthographic()
        .scale(500)
        .translate([this.width / 2, this.height / 2])
        .precision(0.6)

      this.path = 
        d3.geo.path()
        .projection(this.projection)
        .context(this.context)

      this.backGrid = d3.geo.graticule()
      this.frontGrid = d3.geo.graticule()

      this.rotate(this.coordinates)
    },
    rotate: function(coordinates, oldCoordinates) {
      // create clojures of draw and projection functions
      // to avoid complex binding
      const draw = this.draw
      const projection = this.projection

      d3.transition()
      .duration(850)
      .tween('rotate', function() {
        // interpolate the path of the rotation
        const rotation =
          d3.interpolate(
            projection.rotate(),
            coordinates.map(coordinate => -coordinate)
          )

        // distance of rotation
        let distance = 50
        if (oldCoordinates) {
          distance = pythagoras(coordinates, oldCoordinates)
        }

        return (t) => {
          // apply interpolated rotation at time t
          projection.rotate(rotation(t))

          // redraw rotated globe
          draw(t, distance)
        }
      })
      .transition()
    },
    draw: function(time, distance) {
      const c = this.context
      const projection = this.projection
      const path = this.path

      // clear the canvas
      c.clearRect(0, 0, this.width, this.height)

      // Clip to the backside of the globe
      projection.clipAngle(180)

      // landmass path
      c.fillStyle =
        "#e4eeee", c.beginPath(), path(this.land), c.fill()
      // Backside country borders path
      c.strokeStyle =
        "#fff", c.lineWidth = .5, c.beginPath(),
        path(this.borders), c.stroke()
      // Backside grid path
      c.strokeStyle =
        "rgba(0, 0, 0, 0.05)", c.lineWidth = .5, c.beginPath(),
        path(this.backGrid), c.stroke()

      // CLip to front side of the globe
      projection.clipAngle(90)

      // Color countries in different predetermined colors to make map more vivid
      for (let i in this.countries) {
        c.fillStyle =
          this.colors[i],
          c.beginPath(),
          path(this.countries[i]),
          c.fill()
      }
      // Front side borders
      c.strokeStyle =
        "#fff", c.lineWidth = .5, c.beginPath(), path(this.borders), c.stroke()
      // Globe border
      c.strokeStyle =
        "rgba(0, 0, 0, 0.1)", c.lineWidth = 1, c.beginPath(), path({type:'Sphere'}), c.stroke()
      // Frontside grid
      c.strokeStyle =
        "rgba(0, 0, 0, 0.1)", c.lineWidth = .5, c.beginPath(), path(this.frontGrid), c.stroke()

      // create a red circle on each location
      const circle =
        d3.geo.circle()

      let circles = []
      for (let i in this.locations) {
        let angle =  0.5

        // the target location will have a big decreasing angle over time
        if (i == this.selected) {
          // results in 0.5 at the end of the animation
          angle = 0.5 + ( ( 1-(time || 1) ) * Math.pow(distance / 10, 1.4) )
        }

        circles.push(
          circle
          .angle(angle)
          .origin(
            this.locations[i].coordinates
          )()
        )
      }
      c.fillStyle = 'rgba(250,100,100,0.8)'
      c.beginPath()
      path({type: "GeometryCollection", geometries: circles})
      c.fill()

    }
  }
})