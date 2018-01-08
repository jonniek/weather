Vue.component('vue-map', {
  template: '<canvas ref="canvas"></canvas>',
  props: ['locations', 'coordinates'],
  watch: {
    coordinates: function(args) {
      console.log("coordinates changed", args)
      this.rotate(args)
    }
  },
  created: function() {
    console.log("CREATING, PROPS ARE", this.locations, this.coordinates)

    // initialize worldmap meshes
    this.land =
      topojson.feature(world, world.objects.land)
    this.countries =
      topojson.feature(world, world.objects.countries).features
    this.borders =
      topojson.mesh(world, world.objects.countries, (a, b) => a !== b)

    // assign a varied color to each countries index
    this.colors = this.countries.map((_, i) => {
      let hex = (i % 4 * 3).toString(16)
      return'#C'+hex+'D'+hex+'D'+hex
    })

    const distance = (x, y) => {
      // calculate naive distance between two coordinates
      return Math.sqrt(Math.pow(x.lat-y.lat, 2) + Math.pow(x.lng-y.lng, 2))
    }

    // create a network of lines from each location to one another
    this.networks = this.locations.reduce((lines, location, index) => {
      const otherlocations = this.locations.slice(index + 1)
      if (otherlocations.length !== 0) {

        const othersbydistance =
          otherlocations
            .sort((a, b) => distance(a, location) > distance(b, location))

        const newline = {
          type: 'LineString',
          coordinates: [
            [location.lng, location.lat],
            [othersbydistance[0].lng, othersbydistance[0].lat]
          ]
        }
        lines.push(newline)
      }
      return lines
    }, [])

    console.log("INITIALIZED MESHES", this.land)
  },
  mounted: function() {

    // add resize listener to rescale canvas on window size change
    window.addEventListener('resize', this.init)

    // initialize the canvas
    this.init(true)

    // center map around current location if provided
    if (navigator && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        const { latitude, longitude } = position.coords
        console.log("Location found, centering map", latitude, longitude)
        this.rotate([latitude, longitude])
      }, console.error)
    }
  },
  methods: {
    init: function(first) {
      console.log("INITIALIZING CANVAS AND FUNCTIONS")
      this.canvas = this.$refs.canvas
      this.height = window.innerHeight
      this.width = window.innerWidth
      this.canvas.setAttribute("height", this.height)
      this.canvas.setAttribute("width", this.width)
      this.context = this.canvas.getContext('2d')

      this.projection =
        d3.geo.orthographic()
        .scale(this.height / 1.1)
        .translate([this.width / 2, this.height / 2])
        .precision(0.6)

      this.path = 
        d3.geo.path()
        .projection(this.projection)
        .context(this.context)

      this.backGrid = d3.geo.graticule()
      this.frontGrid = d3.geo.graticule()

      // if this is the first init rotate globe to first location
      // else redraw
      if (first) {
        this.rotate(this.coordinates)
      }else{
        this.draw()
      }
    },
    rotate: function(coordinates) {
      const draw = this.draw
      const projection = this.projection
      d3.transition()
      .duration(850)
      .tween('rotate', function() {
        // interpolate the path of rotation
        const rotation =
          d3.interpolate(
            projection.rotate(),
            coordinates.map(coordinate => -coordinate).reverse()
          )

        // runs every frame of the animation
        return function(t) {
          // apply interpolated rotation at time t
          projection.rotate(rotation(t))

          // redraw rotated globe
          draw()
        }
      })
      .transition()
    },
    draw: function() {
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

      for (let i in this.networks) {
        c.strokeStyle =
          "rgba(150,50,50,0.5)",
          c.lineWidth = 3,
          c.beginPath(),
          path(this.networks[i]),
          c.stroke()
      }
    }
  }
})