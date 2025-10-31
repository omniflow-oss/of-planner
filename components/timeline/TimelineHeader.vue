<template>
  <!-- eslint-disable vue/no-v-html -->
  <div
    class="grid border-b"
    style=" grid-template-columns: 240px 1fr;"
    :style="{ width: timelineWidth+'px' }"
  >
    <!-- Left spacer with timeline controls -->
    <div class="border-b border-r pane-border sticky left-0 z-30 bg-default">
      <div class="py-3 px-3 text-center h-full flex flex-col justify-center">
        <div class="text-xs text-slate-500 tracking-tight flex flex-wrap items-center gap-2 justify-center">
          {{ viewMode === 'person' ? 'People View' : 'Project View' }} 
          <!-- Add Project Button (only show in project view) -->
          <UButton 
            v-if="viewMode === 'project'"
            size="xs"
            color="primary"
            :leading-icon="'i-lucide-plus'"
            title="Add a new project to the timeline"
            @click="emit('addNewProject')"
          >
            Add Project
          </UButton>
          <!-- Add Person Button (only show in people view) -->
          <UButton 
            v-if="viewMode === 'person'"
            size="xs"
            color="primary"
            :leading-icon="'i-lucide-plus'"
            title="Add a new person to the timeline"
            @click="emit('addNewPerson')"
          >
            Add Person
          </UButton>
          <!-- Expand/Collapse all -->
          <span class="mx-1 w-px h-4 bg-slate-200" />
          <UButton
            size="xs"
            variant="outline"
            color="neutral"
            :leading-icon="'i-lucide-chevrons-down'"
            @click="emit('expandAll')"
          >
            Expand all
          </UButton>
          <UButton
            size="xs"
            variant="outline"
            color="neutral"
            :leading-icon="'i-lucide-chevrons-up'"
            @click="emit('collapseAll')"
          >
            Collapse all
          </UButton>
        </div>          
      </div>
    </div>

    <!-- Sticky timeline header with grid overlay -->
    <div
      class="relative top-0 z-25 bg-default/90 backdrop-blur supports-[backdrop-filter]:bg-default/75 flex flex-col justify-between"
      :style="{ width: (timelineWidth - 240)+'px' }"
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
        class="grid text-[12px] text-highlighted select-none border-b border-default bg-default "
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
          class="text-center py-1.5"
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
}>()

const emit = defineEmits<{
  addNewProject: []
  addNewPerson: []
  expandAll: []
  collapseAll: []
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
