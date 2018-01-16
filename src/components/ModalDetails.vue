<template>
	<div class="modal">
      <h3 class="center">{{ currentLocation.name }} measurements</h3>
      <transition-group
        v-if="currentMeasurements.length > 0"
        tag="ul"
        name="fade-in-list"
        class="measurementsList"
      >
        <li class="listItem" :key="measurement._id" v-for="measurement in currentMeasurements">
          <span>
            <span>{{ measurement.temperature }}{{ currentFormat }}</span>
            <span class="light small align">{{ measurement.timestamp | xTimeAgo }}</span>
          </span>
        </li>
    </transition-group>
    <div v-else class="warning center">No measurements!</div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
export default {
	computed: {
		...mapGetters(['currentMeasurements', 'currentLocation', 'currentFormat']),
	},
  filters: {
    xTimeAgo: function(unix) {
      const minuteDifference = Math.round((Date.now() - unix) / 1000 / 60)
      if (minuteDifference > 59) {
        const hourDifference = Math.round(minuteDifference / 60)
        return hourDifference + ' hours ago'
      }
      return minuteDifference + ' minutes ago'
    }
  }
}
</script>

<style>
.fade-in-list-enter, .fade-in-list-leave-to{
  opacity: 0;
  transform: translateX(-30px);
}
.fade-in-list-leave-active {
  position: absolute;
}
.measurementsList{
  list-style: none;
  padding-left: 0;
}
.listItem {
  transition: all 0.4s;
}
.listItem > span {
  display: flex;
  justify-content: space-evenly;
  align-items: center;
}
</style>