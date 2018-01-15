Vue.component('vue-graph', {
  template: '<svg width="600" height="450" ref="svg"></svg>',
  props: ['measurements'],
  mounted: function() {
  	this.draw()
  },
  methods: {
	  draw: function() {
	  	
		}
  }
})