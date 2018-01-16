<template>
	<canvas ref="canvas"></canvas>
</template>

<script>
import * as world from '../assets/world-110m.json'
import * as d3 from '../assets/js/d3.v3.min.js'
import * as topojson from '../assets/js/topojson.v1.min.js'

export default {
  props: ['locations', 'selected'],
  watch: {
    selected: function() {
      // when selected prop changes change the coordinates
      // and rotate the projection
      const oldCoordinates = this.coordinates
      this.coordinates = this.locations[this.selected].coordinates

      // pass old coordinates to rotate to calcuate distance
      this.rotate(this.coordinates, oldCoordinates)
    }
  },
  created: function() {
    // initialize the first coordinates
    const firstloc = this.locations[this.selected]
    if (firstloc) {
      this.coordinates = this.locations[this.selected].coordinates
    } else {
      this.coordinates = [0, 0] // default to simple coordinates
    }

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

      // for countries in our location list use a stronger color
      if (locationIndexes.indexOf(i) !== -1) {
        return '#ABB'
      }

      let hex = (i % 4 * 3).toString(16)
      return '#C'+hex+'D'+hex+'D'+hex
    })

  },
  mounted: function() {
    // initialize the canvas and projection
    this.init()

    // add resize listener to rescale canvas on window size change
    window.addEventListener('resize', this.resizeHandler)

    const getHiddenProp = () => {
      var prefixes = ['webkit','moz','ms','o']
      
      // if 'hidden' is natively supported just return it
      if ('hidden' in document) return 'hidden'
      
      // otherwise loop over all the known prefixes until we find one
      for (var i = 0; i < prefixes.length; i++){
        if ((prefixes[i] + 'Hidden') in document) 
          return prefixes[i] + 'Hidden'
      }

      // otherwise it's not supported
      return null
    }
    // redraw canvas when tab gets back into focus
    const visProp = getHiddenProp()
    if (visProp) {
      const evtname = visProp.replace(/[H|h]idden/,'') + 'visibilitychange'
      window.addEventListener(evtname, this.draw)
    }
  },
  computed: {
    scale: function() {
      // the scale of the projection
      const scale = this.width / 3
      return scale < 400 ? 400 : scale
    }
  },
  methods: {
    resetCanvas: function() {
      // reset the canvas size and store window size in vue variables
      this.height = window.innerHeight
      this.width = window.innerWidth
      this.canvas.setAttribute("height", this.height)
      this.canvas.setAttribute("width", this.width)
    },
    resizeHandler: function() {
      this.resetCanvas()

      // reset the translation of the projection
      this.projection
        .translate([this.width / 2, this.height / 2])
        .scale(this.scale)

      // redraw the new canvas and projection
      this.draw()
    },
    init: function() {
      // create canvas variables and projection functions

      this.canvas = this.$refs.canvas
      this.context = this.canvas.getContext('2d')

      // set the size of canvas
      this.resetCanvas()

      // controls the projection of the globe
      this.projection =
        d3.geo.orthographic()
        .scale(this.scale)
        .translate([this.width / 2, this.height / 2])
        .precision(0.6)

      // translates paths of the projection to the canvas
      this.path = 
        d3.geo.path()
        .projection(this.projection)
        .context(this.context)

      // grids for the projection
      this.backGrid = d3.geo.graticule()
      this.frontGrid = d3.geo.graticule()

      // rotate projection to the inital coordinates
      this.rotate(this.coordinates)
    },
    rotate: function(coordinates, oldCoordinates) {

      // animation has started
      this.$emit('started')

      d3.transition()
      .duration(1300)
      .tween('rotate', function() {
        // interpolate the path of the rotation
        const rotation =
          d3.interpolate(
            this.projection.rotate(),
            coordinates.map(coordinate => -coordinate)
          )

        // calculate naive distance between two coordinates
        const pythagoras = (x, y) => {
          return Math.sqrt(Math.pow(x[0]-y[0], 2) + Math.pow(x[1]-y[1], 2))
        }

        // distance of rotation
        let distance = 50
        if (oldCoordinates) {
          distance = pythagoras(coordinates, oldCoordinates)
        }

        const createScaler = (distance, initialscale) => {
          // creates a function that returns interpolated scales
          // larger distance creates a larger range in the scale
          const range = Math.pow(distance, 1.1)
          return (time) => (initialscale - range) + ( Math.abs(time - 0.5) * range * 2 )
        } 
        const scaler = createScaler(distance, this.scale)

        return function(t) {
          // apply interpolated rotation at time t
          this.projection.rotate(rotation(t))

          // get scale value at time t
          const scale = scaler(t)

          // redraw rotated globe
          this.draw(t, distance, scale)

          // animation has ended
          if (t == 1) {
            this.$emit('finished')
          }
        }.bind(this)
      }.bind(this))
      .transition()
      
    },
    draw: function(time, distance, scale) {
      const c = this.context
      const projection = this.projection
      const path = this.path

      time = time || 1
      distance = distance || 0
      scale = scale || 500

      // clear the canvas
      c.clearRect(0, 0, this.width, this.height)

      // set scale of projection
      this.projection.scale(scale)

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
          angle = 0.5 + ( ( 1 - time ) * Math.pow(distance / 10, 1.4) )
        }

        circles.push(
          circle
          .angle(angle)
          .origin(this.locations[i].coordinates)()
        )
      }
      c.fillStyle = 'rgba(250,100,100,0.8)'
      c.beginPath()
      path({type: "GeometryCollection", geometries: circles})
      c.fill()

    }
  }
}
</script>