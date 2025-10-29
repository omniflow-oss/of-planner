<template>
  <!-- Sticky timeline header with grid overlay -->
  <div class="relative sticky top-0 z-30 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/75">
    <!-- Grid overlay aligned with days (uses shared GridOverlay for consistency) -->
    <div class="absolute inset-0 pointer-events-none">
      <GridOverlay :days="days" :weekStarts="weekStarts" :geometry="geometry" :scrollLeft="scrollLeft || 0" />
    </div>

    <!-- Top: Month + Year -->
    <div class="grid text-[12px] text-slate-700 select-none border-b border-slate-200" :style="{ gridTemplateColumns: monthColumns, transform: `translateX(-${scrollLeft}px)` }">
      <div v-for="(seg, idx) in monthSegments" :key="seg.key" :class="['text-center py-1 font-medium', idx>0 ? 'border-l-2 border-slate-300' : '']">{{ monthWithYear(seg) }}</div>
    </div>
    <!-- Bottom: Day (D MMM) -->
    <div class="grid text-[11px] text-slate-700 select-none" :style="{ gridTemplateColumns: dayColumns, transform: `translateX(-${scrollLeft}px)` }">
      <div v-for="day in days" :key="day" class="text-center py-1.5">
        <span :class="['px-1.5 py-0.5 rounded-md', day===todayISO ? 'bg-slate-900 text-white' : '']">{{ dayShort(day) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import GridOverlay from '@/components/internal/shared/GridOverlay.vue'
import { useTimelineGeometry } from '@/composables/useTimelineGeometry'
import { computed } from 'vue'

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

const geometry = useTimelineGeometry(computed(()=>props.days), computed(()=>props.pxPerDay), computed(()=>props.dayOffsets))

function monthWithYear(seg: { key:string; label:string }) {
  // seg.key is YYYY-MM
  const year = seg.key.slice(0,4)
  return `${seg.label} ${year}`
}

function dayShort(iso: string) {
  const d = new Date(iso)
  const day = d.getUTCDate()
  const mon = d.toLocaleString('en-US', { month: 'short' }).toUpperCase()
  return `${day} ${mon}`
}
</script>
