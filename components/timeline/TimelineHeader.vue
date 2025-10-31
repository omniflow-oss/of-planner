<template>
  <!-- Sticky timeline header with grid overlay -->
  <div class="relative sticky top-0 z-25 bg-default/90 backdrop-blur supports-[backdrop-filter]:bg-default/75">
    <!-- Grid overlay aligned with days (uses shared GridOverlay for consistency) -->
    <div class="absolute inset-0 pointer-events-none" :style="{ transform: `translateX(-${scrollLeft}px)` }">
      <GridOverlay :days="days" :pxPerDay="pxPerDay" :offsets="dayOffsets" :weekStarts="weekStarts" />
    </div>

    <!-- Top: Month + Year -->
    <div class="grid text-[12px] text-highlighted select-none border-b border-default bg-default " :style="{ gridTemplateColumns: monthColumns, transform: `translateX(-${scrollLeft}px)` }">
      <div v-for="seg in monthSegments" :key="seg.key" class="text-center py-1 font-medium border-x border-accented " style="transform: translateX(1px);"> <span class="month-year">{{ monthWithYear(seg) }}</span></div>
    </div>
    <!-- Bottom: Day (D MMM) -->
    <div class="grid text-[11px] text-highlighted select-none" :style="{ gridTemplateColumns: dayColumns, transform: `translateX(-${scrollLeft}px)` }">
      <div v-for="day in days" :key="day" class="text-center py-1.5">
        <span :class="['px-1.5 py-0.5 rounded-md inline-block', isToday(day) ? 'bg-inverted text-inverted' : '']" v-html="dayShort(day)"></span>
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
  scrollLeft?: number
}>()

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
  background-color: currentColor;
}
.cell-small  .month-txt {
  display: none;
}
.cell-small  .month-numeric {
  display: block;
}
</style>
