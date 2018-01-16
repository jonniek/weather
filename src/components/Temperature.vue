<template>
  <span class="temperature" v-on:click="clickHandler">
    <spanv-if="useCelcius">
      {{ temperature | notNaN }}°C<span class="switch">°F</span>
    </span>
    <span v-else>
      {{ temperature | notNaN }}°F<span class="switch">°C</span>
    </span>
  </span>
</template>

<script>
import { mapGetters, mapState } from 'vuex'
export default {
  name: 'TemperatureSwitch',
  props: ['temperature'],
  computed: {
    ...mapState(['useCelcius'])
  },
  methods: {
    clickHandler: function() {
      this.$store.commit('toggleCelcius')
    }
  },
  filters: {
    notNaN: function(n) {
      if (isNaN(n)) return '-'
      return n
    }
  }
}
</script>

<style>
.temperature {
  user-select: none;
  -moz-user-select: none;
  cursor: pointer;
}
.temperature > span {
  display: inline-flex;
  align-items: center;
}
.switch {
  font-size: 50%;
  padding-left: 5px;
  opacity: 0.5;
  cursor: pointer;
}
</style>