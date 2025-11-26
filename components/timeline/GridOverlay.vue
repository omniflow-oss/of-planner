
<template>
  <div class="pointer-events-none">
    <div
      v-for="day in filteredDays"
      :key="'bg'+day.index"
      class="day-cell"
      :class="[
        'day-bg',
        weekStarts && weekStarts.includes(day.index) ? 'week' : '', 
        day.day === toISO(new Date()) ? 'today' : '',
        isWeekend(day.day) ? 'weekend-bg' : ''
      ]"
      :style="{ left: left(day.index)+'px'}"
    />
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{ days: string[]; pxPerDay: number; offsets?: number[]; weekStarts?: number[]; todayISO?: string, visibleStartIdx?: number , visibleEndIdx?: number }>()
import { toISO, isWeekendISO } from '@/composables/useDate'
const px = computed(() => props.pxPerDay)
const offsets = computed(() => props.offsets ?? props.days.map((_,i)=> i*px.value))
function left(i:number){ return offsets.value[i] ?? i*px.value }
const widthCell = computed(() => {
  return props.pxPerDay + 'px'
})

function isWeekend(day: string) { return isWeekendISO(day) }
const filteredDays = computed(() => {
  const list = props.days.map((d, i) => ({day: d, index: i})).filter((d:any) => {
  //  if(props.hasUserTimeoffOnDay(props.subrow.person_id, d.day) && props.groupType === 'project') {
    if(d.index < props.visibleEndIdx + 7 &&  d.index > props.visibleStartIdx - 7) {
     return {day: d.day, index: d.index}
   }else {
     return null
   }
  })
  return list
})

</script>

<style scoped>
.week-boundary {
  border-left: 2px solid rgba(100, 116, 139, 0.3);
}

.dark .week-boundary {
  border-left: 2px solid rgba(148, 163, 184, 0.3);
}

.weekend-bg {
  background-color: rgba(241, 245, 249, 0.5);
}

.dark .weekend-bg {
  background-color: rgba(30, 41, 59, 0.4);
}
.widthCell {
  width: v-bind(widthCell);
}
</style>
