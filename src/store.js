import Vue from 'vue'
import Vuex from 'vuex'
Vue.use(Vuex)

import io from 'socket.io-client'

const store = new Vuex.Store({
  state: {
  	appLoaded: false,
  	socket: undefined,
  	animating: false,
  	showModal: false,
  	modalContent: 'form',
  	selected: 0,
  	preSelected: 0,
  	useCelcius: true,
  	userlocation: false,
  	flashMessage: {
  		active: false,
  		className: "",
  		msg: ""
  	},
  	inputTemperature: 0,
  	// location data
  	location: [],
  	// temperature measurements data
  	measurements: [],
    disconnected: false,
  },
  getters: {
  	currentMeasurements: state => {
  		// the measurements of the selected city
      let currentM =
        // deep clone
        JSON.parse(JSON.stringify(state.measurements))
        // show only measurements from selected id
        .filter(m => m.locationId === state.selected)
        .sort((a, b) => a.timestamp < b.timestamp)

      // if we use fahrenheits convert first
      if (!state.useCelcius) {
        currentM = currentM.map(m => {
        	m.temperature = celciusToFahrenheit(m.temperature)
        	return m
        })
      }

      return currentM
  	},
  	currentTemperature: (state, getters) => {
  		const measurements = getters.currentMeasurements
      if (measurements.length === 0) return NaN
      return measurements[0].temperature
  	},
  	currentFormat: (state) => {
  		return state.useCelcius ? '°C' : '°F'
  	},
  	currentHILO: (state, getters) => {
      // current locations highest and lowest temperature value
      if (getters.currentMeasurements.length < 1) return { hi: NaN, lo: NaN }
      
      const byTemp =
        getters.currentMeasurements.slice()
        .sort((a, b) => a.temperature > b.temperature)

      const hi = byTemp[byTemp.length - 1].temperature
      const lo = byTemp[0].temperature
      return { hi, lo }
    },
  	inputTemperatureCelcius: (state) => {
  		if (!state.useCelcius) {
  			return celciusToFahrenheit(state.inputTemperature)
  		}
  		return state.inputTemperature
  	},
  	minmaxTemperature(state) {
      // returns the max degrees of current setting
      if (state.useCelcius) {
        return [-100, 100]
      } else {
        return [celciusToFahrenheit(-100), celciusToFahrenheit(100)]
      }
    },
    currentLocation(state) {
      if (state.locations[state.selected] === void 0) {
        // if we do not have a location return a dummy
        return { id: 0, name: 'undefined' }
      }
      return state.locations[state.selected]
    },
  },
  mutations: {
  	removeFlashMessage(state) {
  		state.flashMessage = { active: false, className: '', msg: ''}
  	},
  	setFlashMessage(state, { className, msg }) {
  		state.flashMessage = { className, msg, active: true }
  	},
    setSending(state, sending) { state.sending = sending },
    appLoaded(state) { state.appLoaded = true },
  	toggleCelcius(state) {
  		if (state.useCelcius) {
  			state.inputTemperature = celciusToFahrenheit(state.inputTemperature)
  		} else {
  			state.inputTemperature = fahrenheitToCelcius(state.inputTemperature)
  		}
  		state.useCelcius = !state.useCelcius
  	},
  	setDisconnected(state, disconnected) { state.disconnected = disconnected },
  	setLocations(state, locations) { state.locations = locations },
  	setMeasurements(state, measurements) { state.measurements = measurements },
  	addMeasurement(state, measurement) { state.measurements.push(measurement) },
  	setPreSelected(state, index) { state.preSelected = index },
  	syncSelected(state) { state.selected = preSelected },
  	startAnimating(state) { state.animating = true },
  	finishAnimating(state) {
  		state.animating = false
  		state.selected = state.preSelected
  	},
  	setInputTemperature(state, value) { state.inputTemperature = value },
  	closeModal(state) { state.showModal = false },
  	setModal(state, content) {
  		if(content) state.modalContent = content
  		state.showModal = true
  	},
  	setSocket(state, socket) { state.socket = socket },
  	setUserLocation(state, loc) { state.userlocation = loc }
  },
  actions: {
  	addTemperature({ state, getters, commit }, value) {
      // add values to the temperature input
      // not allowed to go beyond the minmax range
      const max = (a, b) => a > b ? a : b
      const min = (a, b) => a < b ? a : b
      const temprange = getters.minmaxTemperature
      if (value > 0) {
        commit('setInputTemperature', min(temprange[1], state.inputTemperature + value) )
      } else {
        commit('setInputTemperature', max(temprange[0], state.inputTemperature - 1) )
      }
    },
  	setFlashMessage({ commit }, flashObject) {
  		commit('setFlashMessage', flashObject)
  		setTimeout(() => commit('removeFlashMessage'), flashObject.duration || 3000)
  	},
  	fetchMeasurements({ commit }) {
  		return fetch('/data').then(res => res.json())
      .then((data) => {
        data.locations = data.locations.map(l => {
          l.imgUrl = require('./assets/img/'+l.slug+'.png')
          return l
        })
        commit('setLocations', data.locations)
        commit('setMeasurements', data.measurements)
        commit('appLoaded')
        return new Promise((r) => r())
      })
      .catch((err) => {
        commit('setDisconnected', true)
        commit('setFlashMessage', {
          active: true,
          className: 'error',
          msg: 'No connection to database. Try again later.'
        })
        commit('appLoaded')
      })
  	},
  	sendMeasurement({ commit, state, dispatch }, payload) {
  		return new Promise((resolve) => {
  			state.socket.emit('add', payload, (res) => {
	        commit('closeModal')
	        if (res.success){
	        	dispatch('setFlashMessage', {
	            msg: "Thank you for your contribution!",
	            className: "success"
	          })
	        } else {
	        	dispatch('setFlashMessage', {
	            msg: "There was an error sending data!",
	            className: "error"
	          })
	        }
	        resolve()
	      })
	    })
  	},
  	initSocket({ state, commit, dispatch }) {
  		const socket = io()
  		commit('setSocket', socket)
      // receive live data from the server
      socket.on('update', (measurement) => commit('addMeasurement', measurement))

      const connectionError = (reason) => {
        commit('setDisconnected', true)
        commit('setFlashMessage', {
          active: true,
          className: "error",
          msg: "Connection error. Try to refresh or come back later."
        })
      }

      // when socket has problems show a connection error
      socket.on('disconnect', connectionError)
      socket.on('connect_error', connectionError)
      socket.on('connect_timeout', connectionError)

      // when socket reconnects fetch new data and then
      // remove any lingering flash messages
      socket.on('reconnect', function() {
        dispatch('fetchMeasurements')
        .then(() => {
          // after we fetched updated data remove disconnection
          commit('setDisconnected', false)
          commit('removeFlashMessage')
        })
      })
  	},
  	initLocation({ commit }) {
	    // ask user for gps location
	    if (navigator && navigator.geolocation) {
	      navigator.geolocation.getCurrentPosition((position) => {
	        const { latitude, longitude } = position.coords
	        commit('setUserLocation', [longitude, latitude])
	      })
	    }
  	}
  }
})

const celciusToFahrenheit = (celcius) => Math.round((celcius * 9 / 5) + 32)
const fahrenheitToCelcius = (fahrenheit) => Math.round((fahrenheit - 32) * 5 / 9)

export default store