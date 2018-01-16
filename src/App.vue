<template>
  <div id="app" v-if="appLoaded">

    <TopMenu></TopMenu>

    <transition name="quickfade">
      <div class="overlay formodal" v-if="showModal"></div>
    </transition>
    <transition name="slidedown">
      <div v-on:click.self="$store.commit('closeModal')" class="modalContainer" v-if="showModal" >
        <ModalForm v-if="modalContent == 'form'"></ModalForm>
        <ModalDetails v-else-if="modalContent == 'details'"></ModalDetails>
      </div>
    </transition>

    <InfoContainer></InfoContainer>

    <Map id="map" v-on:started="$store.commit('startAnimating')" v-on:finished="$store.commit('finishAnimating')" :locations="locations" :selected="preSelected"></Map>
  </div>
</template>

<script>
import { mapGetters, mapState } from 'vuex'
import ModalForm from './components/ModalForm.vue'
import TopMenu from './components/TopMenu.vue'
import InfoContainer from './components/InfoContainer.vue'
import ModalDetails from './components/ModalDetails.vue'
import Map from './components/Map.vue'

export default {
  components: { Map, ModalForm, ModalDetails, TopMenu, InfoContainer },
  name: 'app',
  created: function() {
    // fetch inital measurement and location data
    this.$store.dispatch('fetchMeasurements')

    // initialize socket for server communication
    this.$store.dispatch('initSocket')

    this.$store.dispatch('initLocation')
  },
  computed: {
    ...mapState(['locations', 'preSelected', 'modalContent', 'showModal', 'appLoaded']),
  },
}
</script>

<style>
* {
  box-sizing: border-box;
  -webkit-tap-highlight-color: rgba(255, 255, 255, 0);
}
html, body {
  font-family: -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif;
  font-size: 17px;
  word-spacing: 1px;
  color:#455;
  padding: 0;
  margin: 0;
}
.light { color:#9aa }
.small { font-size: 80% }
.big { font-size: 160% }
.center { text-align: center }
.flex { display: flex }
.block { display: block }
.warning { color: orange; }
#app{
  position: relative;
  height: 100vh;
  width: 100vw;
  display: flex;
  flex-direction: column;
  background-color: #fff;
}
#map{
  position: absolute;
  top: 0;
  left: 0;
  z-index: 0;
}
.overlay {
  position: absolute;
  pointer-events: none;
  top: 0;
  left: 0;
  height: 100vh;
  width: 100vw;
}
.overlay.formodal {
  z-index: 9;
  background-color: rgba(0,0,0,0.5);
}
.modalContainer {
  z-index: 10;
  position: absolute;
  top: 0;
  left: 0;
  height: 100vh;
  width: 100vw;
}
.modal {
  user-select: none;
  -moz-user-select: none;
  max-height: 70vh;
  background: white;
  border: 2px solid #bcc;
  padding: 20px 40px;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  max-width: 95%;
  overflow-y: scroll;
}

.slidedown-enter-active, .slidedown-leave-active {
  transform: translateY(0%);
  opacity: 1;
  transition: all .3s cubic-bezier(0.42, 0, 0.58, 1);
}
.slidedown-enter, .slidedown-leave-to{
  transform: translateY(-100%);
  opacity: 0;
  transition: all .3s cubic-bezier(0.42, 0, 0.58, 1);
}

.fade-enter-active, .fade-leave-active {
  opacity: 1;
  transition: all 0.2s cubic-bezier(0.42, 0, 0.58, 1);
}
.fade-enter, .fade-leave-to{
  opacity: 0;
  transition: all 0.2s cubic-bezier(0.42, 0, 0.58, 1);
}

.slideup-enter-active, .slideup-leave-active {
  transform: translateY(0%);
  opacity: 1;
  transition: all .3s cubic-bezier(0.42, 0, 0.58, 1);
}
.slideup-enter, .slideup-leave-to{
  transform: translateY(100%);
  opacity: 0;
  transition: all .3s cubic-bezier(0.42, 0, 0.58, 1);
}

@media(max-width: 800px) {
  .modal {
    width: calc(100% - 20px);
  }
}
</style>