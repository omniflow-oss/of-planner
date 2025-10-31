<template>
  <!-- Timeline header grid matching content layout -->
  <div class="grid border-b" style=" grid-template-columns: 240px 1fr;" :style="{ width: timelineWidth+'px' }">
    <!-- Left empty spacer to match content structure -->
    <div class="bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/75 sticky left-0 z-10 border-r border-slate-200"></div>
    
    <!-- Right timeline header content -->
    <div class="relative bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/75" :style="{ width: (timelineWidth - 240)+'px' }">
      <!-- Grid overlay aligned with days (uses shared GridOverlay for consistency) -->
      <div class="absolute inset-0 pointer-events-none">
        <GridOverlay :days="days" :pxPerDay="pxPerDay" :offsets="dayOffsets" :weekStarts="weekStarts" />
      </div>

      <!-- Top: Month + Year -->
      <div class="grid text-[12px] text-slate-700 select-none border-b border-slate-200 bg-white" :style="{ gridTemplateColumns: monthColumns }">
        <div v-for="seg in monthSegments" :key="seg.key" class="text-center py-1 font-medium  relative bg-white month-year-header" style="height:30px;"> 
          <span class="month-year">{{ monthWithYear(seg) }}</span>
        </div>
      </div>
      <!-- Bottom: Day (D MMM) -->
      <div class="grid text-[11px] text-slate-700 select-none" :style="{ gridTemplateColumns: dayColumns }">
        <div v-for="day in days" :key="day" class="text-center py-1.5">
          <span :class="['px-1.5 py-0.5 rounded-md inline-block', isToday(day) ? 'bg-slate-900 text-white' : '']" v-html="dayShort(day)"></span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import GridOverlay from '@/components/internal/shared/GridOverlay.vue'

const props = defineProps<{
  days: string[]
  dayColumns: string
  monthSegments: { key:string; label:string; span:number }[]
  monthColumns: string
  todayISO: string
  dayLabel: (iso: string) => string
  // For shared GridOverlay alignment
  pxPerDay: number
  dayOffsets: number[]
  weekStarts: number[]
}>()

// Calculate timeline width to match timeline content
const timelineWidth = computed(() => props.days.length * props.pxPerDay)

function monthWithYear(seg: { key:string; label:string }) {
  // seg.key is YYYY-MM
  const year = seg.key.slice(0,4)
  return `${seg.label} ${year}`
}

function dayShort(iso: string) {
  const d = new Date(iso)
  const day = d.getUTCDate()
  const mon = d.toLocaleString('en-US', { month: 'short' }).toUpperCase()
  const monNumeric = d.toLocaleString('en-US', { month: 'numeric' })
  return `${day} <span class="month-txt">${mon}</span> <span class="month-numeric">${monNumeric}</span>`
}

function isToday(day: string) {
  // Only highlight today on client side to avoid hydration mismatch
  if (typeof window === 'undefined') return false
  return day === props.todayISO
}
</script>
<style>
.month-numeric {
  display: none;
}
.month-numeric::before {
  content: '';
  display: block;
  width: 15px;
  height: 1px;
  margin: auto;
  background-color: rgb(51 65 85);
}
.bg-slate-900 .month-numeric::before {
  background-color: white;
}
.cell-small  .month-txt {
  display: none;
}
.cell-small  .month-numeric {
  display: block;
}
.month-year-header::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  top:0;
  width: 2px;
  background-color: rgb(203 213 225); /* slate-300 */

}

</style>