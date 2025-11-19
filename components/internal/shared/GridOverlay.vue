<template>
  <div class="pointer-events-none">
    <div
      v-for="(day, i) in days"
      :key="'bg'+i"
      :class="[
        'day-bg',
        weekStarts && weekStarts.includes(i) ? 'week week-boundary' : '', 
        day === toISO(new Date()) ? 'today' : '',
        isWeekend(day) ? 'weekend-bg' : ''
      ]"
      :style="{ left: left(i)+'px', width: width(i)+'px' }"
    />
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{ days: string[]; pxPerDay: number; offsets?: number[]; weekStarts?: number[]; todayISO?: string }>()
import { toISO, isWeekendISO } from '@/composables/useDate'
const px = computed(() => props.pxPerDay)
const offsets = computed(() => props.offsets ?? props.days.map((_,i)=> i*px.value))
function left(i:number){ return offsets.value[i] ?? i*px.value }
function width(i:number){ const next = offsets.value[i+1] ?? (left(i)+px.value); return Math.max(0, next - left(i)) }
function isWeekend(day: string) { return isWeekendISO(day) }
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
</style>
