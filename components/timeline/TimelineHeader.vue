<template>
  <!-- eslint-disable vue/no-v-html -->
  <div
    class="header-grid grid sticky top-0 z-20"
    style=" grid-template-columns: 240px 1fr;"
  >
    <!-- Left spacer with timeline controls -->
    <div class="border-b-2 border-r-2 pane-border sticky left-0 z-30 bg-default">
      <div class="py-3 px-3 text-center h-full flex flex-col justify-center">
        <div class="text-xs text-slate-500 tracking-tight flex flex-wrap items-center gap-2">
          
          <!-- Add Project Button (only show in project view) -->
          
          <span>
            {{ viewMode === 'person' ? 'People View' : 'Project View' }} 
          </span>
          
          <!-- Expand/Collapse all toggle (only show when there's data) -->
          <UButton
            v-if="hasData"
            size="xs"
            variant="outline"
            color="neutral"
            class="ml-auto"
            :leading-icon="expanded ? 'i-lucide-chevrons-up' : 'i-lucide-chevrons-down'"
            :title="expanded ? 'Collapse all' : 'Expand all'"
            @click="emit('toggleExpandAll')"
          >
          </UButton>
        </div>          
      </div>
    </div>

    <!-- Sticky timeline header with grid overlay -->
    <div
      class="relative border-b top-0 z-25 bg-default/90 backdrop-blur supports-[backdrop-filter]:bg-default/75 flex flex-col justify-between"
    >
      <!-- Grid overlay aligned with days (uses shared GridOverlay for consistency) -->
      <div
        class="absolute inset-0 pointer-events-none"
        style="top: 26px;"
      >
        <GridOverlay
          :days="days"
          :px-per-day="pxPerDay"
          :offsets="dayOffsets"
          :week-starts="weekStarts"
        />
      </div>

      <!-- Top: Month + Year -->
      <div
        class="grid text-[12px] text-highlighted select-none border-b-2 border-default bg-default "
        :style="{ gridTemplateColumns: monthColumns }"
      >
        <div
          v-for="seg in monthSegments"
          :key="seg.key"
          class="text-center py-1 font-medium  border-accented month-year-header relative"
        >
          {{ monthWithYear(seg) }}
        </div>
      </div>
      <!-- Bottom: Day (D MMM) -->
      <div
        class="grid text-[11px] text-highlighted select-none"
        :style="{ gridTemplateColumns: dayColumns }"
      >
        <div
          v-for="day in days"
          :key="day"
          class="text-center py-1.5 whitespace-nowrap"
        >
          <!-- eslint-disable-next-line vue/no-v-html -->
          <span
            :class="['px-1.5 py-0.5 rounded-md inline-block', isToday(day) ? 'bg-inverted text-inverted' : '']"
            v-html="dayShort(day)"
          />
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
  // View mode and button handlers
  viewMode: 'person' | 'project'
  expanded: boolean
  hasData: boolean
}>()

const emit = defineEmits<{
  toggleExpandAll: []
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
  return `<span class="font-medium">${day}</span> <span class="month-txt">${mon}</span> <span class="month-numeric">${monNumeric}</span>`
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
.month-year-header{
  overflow: hidden;
  height:26px;
}
.month-year-header::after {
  height: 30px;
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  top:0;
  width: 2px;
  background-color: rgb(203 213 225); /* slate-300 */

}

</style>
