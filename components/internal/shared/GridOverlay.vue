<template>
  <div class="pointer-events-none">
    <div
      v-for="day in filteredDays"
      :key="'bg'+day.index"
      :class="[
        'day-bg',
        weekStarts && weekStarts.includes(day.index) ? 'week' : '', 
        day.day === toISO(new Date()) ? 'today' : '',
        isWeekend(day.day) ? 'weekend-bg' : ''
      ]"
      :style="{ left: left(day.index)+'px', width: width(day.index)+'px' }"
    />
  </div>
  <!-- <div
      v-for="(day, i) in days"
      :key="'bg'+i"
      :class="[
        'day-bg',
        weekStarts && weekStarts.includes(i) ? 'week' : '', 
        day === toISO(new Date()) ? 'today' : '',
        isWeekend(day) ? 'weekend-bg' : ''
      ]"
      :style="{ left: left(i)+'px', width: width(i)+'px' }"
    />
  </div> -->
</template>

<script setup lang="ts">
import { computed } from 'vue'
const props = defineProps<{ days?: string[]; pxPerDay?: number; offsets?: number[]; weekStarts?: number[]; todayISO?: string; visibleStartIdx?: number; visibleEndIdx?: number }>()
import { toISO, isWeekendISO } from '@/composables/useDate'

const px = computed(() => Number(props.pxPerDay ?? 56))
const offsets = computed(() => (props.offsets ?? (props.days ?? []).map((_, i) => i * px.value)))

function left(i:number){ return offsets.value?.[i] ?? i*px.value }
function width(i:number){ const next = offsets.value?.[i+1] ?? (left(i)+px.value); return Math.max(0, next - left(i)) }
function isWeekend(day: string) { return isWeekendISO(day) }

// Only render a clamped window of days (with small buffer) to avoid massive DOM updates
const BUFFER_DAYS = 2
const filteredDays = computed(() => {
  const days = props.days ?? []
  const len = days.length
  if (len === 0) return []

  const startIdx = Math.max(0, Math.min(len - 1, Number(props.visibleStartIdx ?? 0) - BUFFER_DAYS))
  const endIdx = Math.max(0, Math.min(len - 1, Number(props.visibleEndIdx ?? (len - 1)) + BUFFER_DAYS))

  const out: Array<{ day: string; index: number }> = []
  for (let i = startIdx; i <= endIdx; i++) {
    out.push({ day: days[i] ?? '', index: i })
  }
  return out
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
</style>
