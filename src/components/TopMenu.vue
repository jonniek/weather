<template>
  <transition name="slidedown" appear>
    <div class="topmenu" >
      <div class="cities">
        <div :class="{ citybutton: true, selected: loc.id == preSelected }" v-on:click="clickHandler(loc.id)" v-for="loc in locations">
          <img class="cityicon" :src="loc.imgUrl" alt="">
          <div class="cityname">{{ loc.name }}</div>
        </div>
      </div>
      <transition name="slidedown">
        <div v-if="flashMessage.active" :class="flashMessage.className + ' flash'">{{ flashMessage.msg }}</div>
      </transition>
    </div>
  </transition>
</template>

<script>
import { mapGetters, mapState } from 'vuex'
export default {
	name: 'TopMenu',
	computed: {
		...mapState(['useCelcius', 'flashMessage', 'locations', 'preSelected'])
	},
	methods: {
		clickHandler: function(id) {
			this.$store.commit('setPreSelected', id)
		}
	}
}
</script>

<style>
.topmenu {
  text-align: center;
  z-index: 2;
  font-size: 15px;
}
.citybutton {
  user-select: none;
  -moz-user-select: none;
  cursor: pointer;
  display: inline-flex;
  flex-direction: column;
  background-color: white;
  position: relative;
  margin: 10px;
  padding: 10px;
  min-width: 50px;
  transition: top 0.2s cubic-bezier(.25,.8,.25,1);
  box-shadow: 0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24);
  border: 2px solid #bcc;
  top: 0px;
}
.citybutton:hover, .citybutton.selected {
  box-shadow: 0 8px 15px rgba(0,0,0,0.2), 0 5px 5px rgba(0,0,0,0.2);
}
.citybutton.selected{
  cursor: default;
  top: 15px;
}
.citybutton > *{
  pointer-events: none;
}
.cityicon {
  width: 50px;
  height: 50px;
  display: block;
  margin: auto;
  padding: 5px;
}
.flash {
  text-align: center;
  position: relative;
  top: 15px;
  z-index: 3;
  width: 95%;
  max-width: 500px;
  margin: auto;
  color: white;
  font-weight: bold;
  padding: 10px 20px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24);
}
.flash.success {
  background: rgb(120, 200, 100);
}
.flash.error {
  background: rgb(230, 120, 100);
}
@media(max-width: 800px) {
  .topmenu .cities {
    display: flex;
  }
  .citybutton {
    width: 20%;
  }
  .cityname { display: none; }
  .cityicon {
    width: 100%;
    padding: 0;
  }
  .infocontainer {
    width: calc(100% - 20px);
  }
}
</style>