<template>
  <transition name="slideup" appear>
    <div class="infocontainer" v-show="!animating" >

      <div class="dataContainer">
        
        <div class="row1">
          <h2>{{ currentLocation.name }}</h2>

          <span class="time">{{ currentTime.hours | zeropad }}:{{ currentTime.minutes | zeropad }}:{{ currentTime.seconds | zeropad }}
          </span>
        </div>
        <div class="row2">
          <div>
            <Temperature
              class="big"
              :temperature="currentTemperature"
            ></Temperature>

            <div class="hilo">
              <div>HI: {{ currentHILO.hi | notNaN }}{{ currentFormat }}</div>
              <div>LO: {{ currentHILO.lo | notNaN }}{{ currentFormat }}</div>
            </div>
          </div>
        </div>

      </div>
      <div class="buttons">
        <div class="modalButton todetails" v-on:click="$store.commit('setModal', 'details')">Details</div>
        <div class="modalButton toform" v-on:click="$store.commit('setModal', 'form')">Submit</div>
      </div>
    </div>
  </transition>
</template>

<script>
import { mapGetters, mapState } from 'vuex'
import Temperature from './Temperature.vue'
export default {
	name: 'InfoContainer',
  components: { Temperature },
	computed: {
		...mapState(['locations', 'animating']),
		...mapGetters(['currentFormat', 'currentTemperature', 'currentLocation', 'inputTemperatureCelcius', 'currentHILO']),
    currentTime: function() {
      // get the time of the location we have selected
      const time = this.unixtime || 0
      const offset = this.currentLocation.utcOffsetHours || 0
      // shift a new date by the offset amount, so that the real
      // time will be in .getUTC, this seems backwards but it works..
      const locationtime = new Date(time + offset*60*60*1000)
      return {
        hours: locationtime.getUTCHours(),
        minutes: locationtime.getUTCMinutes(),
        seconds: locationtime.getUTCSeconds()
      }
    }

	},
  data () {
    return {
      unixtime: 0,
    }
  },
  created: function() {
    // update time in one second intervals
    setInterval(function(){
      this.unixtime = Date.now()
    }.bind(this), 1000)
  },
  filters: {
    zeropad: function(t) {
      if (t / 10 < 1) t = "0"+t
      return t
    },
    notNaN: function(n) {
    	if (isNaN(n)) return '-'
    	return n
    }
  }
}
</script>

<style>
.infocontainer {
  z-index: 2;
  background-color:white;
  border: 2px solid #bcc;
  align-self: center;
  margin-top: auto;
  margin-bottom: 10px;
  padding: 7px 20px;
  width: calc(100% - 20px);
  max-width: 400px;
}
.infocontainer .dataContainer {
  display: flex;
  justify-content: space-between;
  padding: 5px 15px;
}
.infocontainer .row1 {
}
.infocontainer .row1  {
  text-align: center;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
}
.infocontainer .row1 h2{
  margin:0;
}
.infocontainer .row2{
  flex-grow: 1;
  text-align: center;
}
.infocontainer .row2 > div {
  text-align: left;
  display: inline-block;
}
.infocontainer .buttons{
  display: flex;
}
.infocontainer .buttons div {
}
.infocontainer .buttons .todetails {
  margin-right: 10px;
}
.time {
  margin-top: auto;
  margin-bottom: 10px;
  font-size: 20px;
}
.submitContainer {
  display: flex;
  flex-direction: column;
}
.rangewrap{
  display: flex;
  margin: 10px -10px 10px -10px;
}
.range{
  flex-grow: 1;
  align-self: center;
}
.increment{
  user-select: none;
  -moz-user-select: none;
  font-size: 24px;
  padding: 10px;
  cursor: pointer;
}
.modalButton {
  user-select: none;
  -moz-user-select: none;
  cursor: pointer;
  padding: 7px 10px;
  text-align: center;
  margin:10px 0;
  display: inline-block;
  flex-grow: 1;
  transition: all .1s ease-out;
  position: relative;
  top: 0;
  box-shadow:
    3px 3px #bcc, /* bottom right */
    -2px -2px #bcc, /* top left */
    3px -2px #bcc, /* top right */
    -2px 3px #bcc /* bottom left */
}
.modalButton[disabled] {
  opacity: 0.5;
}
.modalButton:active {
  top:2px;
  box-shadow:
    1px 1px #bcc, /* bottom right */
    -2px -2px #bcc, /* top left */
    1px -2px #bcc, /* top right */
    -2px 1px #bcc /* bottom left */
}


@media(max-width: 800px) {
  .infocontainer {
    max-width: auto;
  }
}
</style>