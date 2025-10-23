<template>
  <!-- Sticky timeline header with optional grid overlay -->
  <div class="relative sticky top-0 z-30 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/75">
    <!-- Grid overlay: vertical day/week lines and today marker -->
    <GridOverlay
      class="pointer-events-none absolute inset-0"
      :days="days"
      :day-columns="dayColumns"
      :scroll-left="scrollLeft"
    />
    <div class="grid text-[11px] text-slate-500 select-none border-b border-slate-200" :style="{ gridTemplateColumns: yearColumns, transform: `translateX(-${scrollLeft}px)` }">
      <div v-for="seg in yearSegments" :key="seg.key" class="text-center py-1 font-medium">{{ seg.label }}</div>
    </div>
    <div class="grid text-[11px] text-slate-600 select-none border-b border-slate-200" :style="{ gridTemplateColumns: monthColumns, transform: `translateX(-${scrollLeft}px)` }">
      <div v-for="seg in monthSegments" :key="seg.key" class="text-center py-1">{{ seg.label }}</div>
    </div>
    <div class="grid text-[11px] text-slate-700 select-none" :style="{ gridTemplateColumns: dayColumns, transform: `translateX(-${scrollLeft}px)` }">
      <div v-for="day in days" :key="day" class="text-center py-1.5">
        <span :class="['px-1.5 py-0.5 rounded-md', day===todayISO ? 'bg-slate-900 text-white' : '']">{{ dayLabel(day) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import GridOverlay from './GridOverlay.vue'
defineProps<{
  days: string[]
  dayColumns: string
  monthSegments: { key:string; label:string; span:number }[]
  monthColumns: string
  yearSegments: { key:string; label:string; span:number }[]
  yearColumns: string
  scrollLeft: number
  todayISO: string
  dayLabel: (iso: string) => string
}>()
</script>
