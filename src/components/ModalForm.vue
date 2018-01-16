<template>
	<form v-on:submit.prevent="sendMeasurement" class="modal">
    <div class="formfield">
      <div class="center">
        <span class="big">{{ currentLocation.name }}: </span>
        <Temperature
          class="big"
          :temperature="inputTemperature"
        ></Temperature>
      </div>
      <div class="rangewrap">
        <span class="increment" v-on:click="$store.dispatch('addTemperature', -1)">-</span>
        <input class="range" @input="updateInput" :value="inputTemperature" type="range" :min="minmaxTemperature[0]" :max="minmaxTemperature[1]" step="1"/>
        <span class="increment" v-on:click="$store.dispatch('addTemperature', 1)">+</span>
      </div>
    </div>
    <div class="submitContainer">
      <p class="warning brief" v-if="locationShouldWarn">
        Your closest location is {{ closestLocation.name }}. Are you sure you mean to submit to {{ currentLocation.name }}?
      </p>
      <div :disabled="submitDisabled" class="modalButton" v-on:click="sendMeasurement">Submit</div>
    </div>
  </form>
</template>

<script>
import { mapGetters, mapState } from 'vuex'
import Temperature from './Temperature.vue'
export default {
	components: { Temperature },
	data() {
		return {
			sending: false
		}
	},
	computed: {
		...mapState(['disconnected', 'inputTemperature', 'userlocation', 'locations', 'selected']),
		...mapGetters(['minmaxTemperature', 'currentLocation', 'inputTemperatureCelcius']),
		submitDisabled: function() {
			return this.disconnected || this.sending
		},
		closestLocation: function() {
			const index = this.closetsLocationIndex
			if (index !== -1) {
				return this.locations[index]
			}
			return {}
		},
    locationShouldWarn: function() {
      // if we have user location and user has selected
      // other than their own location, we will return true
      const closest = this.closetsLocationIndex
      return  closest !== -1 && closest !== this.selected
    },
    closetsLocationIndex: function() {
      const userloc = this.userlocation
      const locs = this.locations.slice()

      const getClosestLocation = (from, to) => {
        const distance = (x, y) => {
          return Math.sqrt(Math.pow(x[0]-y[0], 2) + Math.pow(x[1]-y[1], 2))
        }
        const locationsByDistance =
          to.sort((a, b) => { 
            return (
              distance(from, a.coordinates)
            > distance(from, b.coordinates)
            )
          })
        return locationsByDistance[0].id
      }

      if (userloc !== false && locs.length > 0) {
        const closest =
          getClosestLocation(userloc, locs)
        return closest
      }
      return -1
    }
	},
	methods: {
    updateInput: function(e) {
      this.$store.commit('setInputTemperature', +e.target.value)
    },
    sendMeasurement: function() {
      if (this.submitDisabled) return
      // Since we already have a socket open let's use that
      // instead of a post request
      this.sending = true
      const input = this.inputTemperature

      this.$store.dispatch('sendMeasurement', {
        id: this.selected,
        temperature: this.inputTemperatureCelcius
      })
      .then(function() {
      	this.sending = false
      }.bind(this))
    },
	}
}
</script>

<style>
.brief{ max-width: 300px; }
.formfield {padding: 5px 0;}
/* CUSTOM RANGE SLIDER STYLES */
input[type=range] {
  -webkit-appearance: none; /* Hides the slider so that custom slider can be made */
  width: 100%; /* Specific width is required for Firefox. */
  background: transparent; /* Otherwise white in Chrome */
}
input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; }
input[type=range]:focus { outline: none; }
input[type=range]::-moz-focus-outer { border: 0; }
/* Special styling for WebKit/Blink */
input[type=range]::-webkit-slider-thumb {
  box-shadow: 1px 1px 1px #111, 0px 0px 1px #0d0d0d;
  -webkit-appearance: none;
  border: 3px solid #bcc;
  height: 30px;
  width: 16px;
  border-radius: 0px;
  background: #fff;
  cursor: pointer;
  margin-top: -14px;
}
/* All the same stuff for Firefox */
input[type=range]::-moz-range-thumb {
  box-shadow: 0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24);
  border: 3px solid #bcc;
  height: 30px;
  width: 16px;
  border-radius: 0px;
  background: #bcc;
  cursor: pointer;
}
input[type=range]::-webkit-slider-runnable-track {
  width: 100%;
  height: 8.4px;
  cursor: pointer;
  background: #fff;
  border-radius: 0px;
  border: 0.2px solid #bcc;
}

input[type=range]:focus::-webkit-slider-runnable-track {
  background: #367ebd;
}

input[type=range]::-moz-range-track {
  width: 100%;
  height: 8.4px;
  cursor: pointer;
  background: #fff;
  border-radius: 0;
  border: 0.2px solid #bcc;
}
</style>