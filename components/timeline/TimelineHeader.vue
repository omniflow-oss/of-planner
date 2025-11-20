<template>
  <div
    class="header-grid grid sticky top-0 z-20"
    style="grid-template-columns: 280px 1fr;"
  >
    <!-- Left spacer with timeline controls -->
    <div class="border-b border-r pane-border sticky left-0 z-30 bg-default flex flex-col justify-end pb-2 px-3">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <UBadge 
            size="xs" 
            :color="viewMode === 'person' ? 'primary' : 'neutral'"
            variant="subtle"
            class="capitalize"
          >
            {{ viewMode }} View
          </UBadge>
        </div>

        <!-- Expand/Collapse all toggle -->
        <UButton
          v-if="hasData"
          size="xs"
          variant="ghost"
          color="neutral"
          :icon="expanded ? 'i-lucide-chevrons-up' : 'i-lucide-chevrons-down'"
          :title="expanded ? 'Collapse all' : 'Expand all'"
          @click="emit('toggleExpandAll')"
        />
      </div>
    </div>

    <!-- Sticky timeline header with grid overlay -->
    <div
      class="relative border-b top-0 z-25 bg-default/95 backdrop-blur supports-[backdrop-filter]:bg-default/80 flex flex-col justify-end"
    >
      <!-- Week Numbers Row (Compressed) -->
      <div
        class="grid text-[9px] font-semibold text-slate-500 dark:text-slate-400 select-none border-b border-slate-200 dark:border-slate-700 bg-slate-100/50 dark:bg-slate-800/50"
        :style="{ gridTemplateColumns: `repeat( auto-fill , ${pxPerDay}px)`, height: '18px' }"
      >
        <div
          v-for="(day, i) in days"
          :key="'w' + day"
          class="text-center relative flex items-center justify-center"
          :class="{ 
            'bg-slate-50/80 dark:bg-slate-900/50': isWeekend(day)
          }"
        >
          <span v-if="weekStarts.includes(i) || i === 0" class="px-1">
            W{{ getWeekNumber(day) }}
          </span>
        </div>
      </div>

      <!-- Day Row (Compressed Month + Day) -->
      <div
        class="grid text-[11px] text-default select-none"
        style="grid-template-rows: auto;  grid-auto-rows: 0;"
        :style="{ gridTemplateColumns: `repeat( auto-fill, ${pxPerDay}px)` }"
      >
        <div
          v-for="(day, i) in days"
          :key="day"
          class="text-center py-1.5 whitespace-nowrap header-day relative flex flex-col items-center justify-center gap-0.5"
          :class="[ 
            weekStarts.includes(i) ? 'week' : '', 
            isToday(day) ? 'today' : '',
            isWeekend(day) ? 'bg-slate-100/70 dark:bg-slate-800/50' : ''
          ]"
        >
          <!-- Month Label (only on first day of month or start of view) -->
          <span 
            v-if="isMonthStart(day) || i === 0" 
            class="absolute top-0 left-1 text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider z-10"
          >
            {{ getMonthLabel(day) }} {{ getYearLabel(day) }}
          </span>

          <!-- Day Number -->
          <span
            :class="[
              'w-6 h-6 flex items-center justify-center rounded-full text-[11px]',
              isToday(day) 
                ? 'bg-amber-500 text-white font-bold shadow-lg shadow-amber-500/50 ring-2 ring-amber-200 dark:ring-amber-800 scale-110' 
                : 'text-slate-700 dark:text-slate-300 font-medium'
            ]"
          >
            {{ getDayNumber(day) }}
          </span>
          
          <!-- Day Name (Mon, Tue) -->
          <span class="text-[8px] text-slate-500 dark:text-slate-400 uppercase font-medium">
            {{ getDayName(day) }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  days: string[]
  dayColumns: string
  todayISO: string
  pxPerDay: number
  dayOffsets: number[]
  weekStarts: number[]
  viewMode: 'person' | 'project'
  expanded: boolean
  hasData: boolean
}>()

const emit = defineEmits<{
  toggleExpandAll: []
}>()

function isToday(day: string) {
  if (typeof window === 'undefined') return false
  return day === props.todayISO
}

function isWeekend(day: string) {
  const d = new Date(day)
  const dayOfWeek = d.getUTCDay()
  return dayOfWeek === 0 || dayOfWeek === 6
}

function getWeekNumber(iso: string) {
  const d = new Date(iso)
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7))
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
  return weekNo
}

function getDayNumber(iso: string) {
  return new Date(iso).getUTCDate()
}

function getDayName(iso: string) {
  return new Date(iso).toLocaleString('en-US', { weekday: 'short' })
}

function getMonthLabel(iso: string) {
  return new Date(iso).toLocaleString('en-US', { month: 'short' }).toUpperCase()
}

function isMonthStart(iso: string) {
  return new Date(iso).getUTCDate() === 1
}
function getYearLabel(iso: string) {
  return new Date(iso).getUTCFullYear()
}
</script>

<style scoped>
.header-day.today::after {
  /* Override global style if needed, or rely on the span styling */
  display: none; 
}
</style>
