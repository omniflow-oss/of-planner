<template>
  <div class="grid" style="grid-template-columns: 240px 1fr;" :style="{ width: timelineWidth+'px' }">
    <!-- Group header row -->
    <div class="px-3 py-2 border-b border-r pane-border font-medium flex items-center gap-2 sticky left-0 z-10 bg-white">
      <button class="w-5 h-5 grid place-items-center rounded border border-slate-200 text-slate-600 hover:bg-slate-50" @click="expanded = !expanded">{{ expanded ? '–' : '+' }}</button>
      <span>{{ label }}  </span>
      <span class="ml-auto inline-flex items-center rounded-xl bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700 inset-ring inset-ring-indigo-700/10">{{ itemCount }}</span>
    </div>
    <div class="relative border-b border-r pane-border timeline-bg" :style="{ height: headerHeight+'px', width: timelineWidth+'px' }">
      <GridOverlay :days="days" :pxPerDay="pxPerDay" :offsets="dayOffsets" :weekStarts="weekStarts" />
      <!-- <AssignmentBar v-for="a in headerAssignments" :key="'h_'+a.id" :assignment="a" :startISO="startISO" :pxPerDay="pxPerDay" :projectsMap="projectsMap" :top="laneTop(a._lane)" @update="onUpdate" @edit="onEdit" /> -->
    </div>

    <!-- Subrows -->
    <template v-if="expanded" v-for="sr in subrows" :key="sr.key">
      <!-- Left: label or add row using LeftPaneCell -->
      <div class="border-b border-r pane-border sticky left-0 z-10 bg-white" :style="{ height: rowHeights.get(sr.key)+'px' }">
        <LeftPaneCell
          :is-add="isAddRow(sr)"
          :title="isAddRow(sr) ? cleanAddLabel(sr.label) : '-- ' + sr.label"
          @click="isAddRow(sr) && $emit('createFromSidebar', sr)"
        />
      </div>

      <!-- Right: timeline track -->
      <div class="relative border-b border-r pane-border timeline-bg" :style="{ height: rowHeights.get(sr.key)+'px', width: timelineWidth+'px' }" @click.self="onEmptyClick($event, sr)">
        <GridOverlay :days="days" :pxPerDay="pxPerDay" :offsets="dayOffsets" :weekStarts="weekStarts" />
        <AssignmentBar v-for="a in subAssignmentsLaned(sr)" :key="a.id" :assignment="a" :startISO="startISO" :pxPerDay="pxPerDay" :projectsMap="projectsMap" :top="laneTop(a._lane)" @update="onUpdate" @edit="onEdit" @resize="(e) => onResizeEvent=e" />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import AssignmentBar from '@/components/internal/shared/AssignmentBar.vue'
import GridOverlay from '@/components/internal/shared/GridOverlay.vue'
import LeftPaneCell from '@/components/internal/LeftPaneCell.vue'
import { addDaysISO, parseISO } from '@/composables/useDate'
import { computeLanes } from '@/utils/lanes'
import { useTimelineGrid } from '@/composables/useTimeline'

const props = defineProps<{
  label: string
  groupType: 'person'|'project'
  groupId: string
  subrows: { key: string; label: string; person_id: string|null; project_id: string|null }[]
  startISO: string
  days: string[]
  pxPerDay: number
  projectsMap: Record<string, { id: string; name: string; color?: string|null; emoji?: string|null }>
}>()
const emit = defineEmits(['create','update','createFromSidebar','edit','createPopover'])

const pxPerDay = computed(() => props.pxPerDay)
const days = computed(() => props.days)
const { dayOffsets, weekStarts } = useTimelineGrid(days, pxPerDay)
function lineLeft(i:number){ return dayOffsets.value[i] ?? i*pxPerDay.value }
function dayWidth(i:number){ const next = dayOffsets.value[i+1] ?? (lineLeft(i) + pxPerDay.value); return Math.max(0, next - lineLeft(i)) }
const weekStartSet = computed(() => new Set(weekStarts.value))
function isWeekStart(i:number){ return weekStartSet.value.has(i) }

// Calculate total timeline width to ensure timeline-bg resizes properly when scrolling
const timelineWidth = computed(() => days.value.length * pxPerDay.value)
const startISO = computed(() => props.startISO)
const rowHeights = new Map<string, number>()
const baseRowMin = 44
const expanded = ref(true)
const onResizeEvent  = ref(false);

function isAddRow(sr:any) { return String(sr.key).includes('__add__') || sr.person_id === null || sr.project_id === null }
function cleanAddLabel(s: string) { return s.replace(/^\s*\+\s*/, '') }
function isWeekend(dayISO: string) { const d = parseISO(dayISO).getUTCDay(); return d === 0 || d === 6 }
function subAssignmentsLaned(sr: { key:string; person_id: string|null; project_id: string|null }) {
  console.log('submissionslaned called')
  if (isAddRow(sr)) { rowHeights.set(sr.key, baseRowMin); return [] }
  const list = assignmentsRef.value.filter((a: any) => a.person_id === sr.person_id && a.project_id === sr.project_id)
  const { items, laneCount } = computeLanes(props.startISO, list)
  const laneHeight = 30
  const padding = 10
  const totalH = padding*2 + laneCount*laneHeight
  rowHeights.set(sr.key, Math.max(baseRowMin, totalH))
  return items
}
function laneTop(lane: number) { const padding = 10; const laneHeight = 30; return padding + lane*laneHeight }

function onUpdate(payload: { id: string; start?: string; end?: string }) { emit('update', payload) }
function onEdit(payload: { assignment: any; x: number; y: number }) { emit('edit', payload) }

// Empty click to show create popover (now handled by Timeline.vue)
function onEmptyClick(e: MouseEvent, sr: any) {
  if(onResizeEvent.value) {
    return;
  }
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
  const x = e.clientX - rect.left
  // Map x to closest day index based on offsets/widths
  let idx = 0
  if (dayOffsets.value) {
    for (let i=0;i<days.value.length;i++){
      const left = lineLeft(i)
      const width = dayWidth(i)
      if (x < left + width) { idx = i; break }
      idx = i
    }
  } else {
    idx = Math.round(x / pxPerDay.value)
  }
  const start = days.value[Math.max(0, Math.min(days.value.length-1, idx))]
  emit('createPopover', { key: sr.key, x: e.clientX, y: e.clientY, dayISO: start, person_id: sr.person_id, project_id: sr.project_id })
}

// Today line - avoid hydration mismatch
const todayISO = (() => { const d = new Date(); d.setUTCHours(0,0,0,0); return d.toISOString().slice(0,10) })()
const todayIndex = computed(() => days.value.findIndex(d => d === todayISO))

// tiny pinia-less accessor for current assignments via inject to keep component pure
const assignmentsKey = Symbol.for('assignmentsRef')
function usePlanner() { return inject<any>(assignmentsKey)! }
const assignmentsRef = usePlanner()

// Header aggregated assignments
const headerLaneCount = ref(1)
const headerAssignments = computed(() => {
  const list = assignmentsRef.value.filter((a: any) => (props.groupType === 'person' ? a.person_id === props.groupId : a.project_id === props.groupId))
  const { items, laneCount } = computeLanes(props.startISO, list)
  headerLaneCount.value = laneCount
  return items
})
const headerHeight = computed(() => Math.max(baseRowMin, 16 + headerLaneCount.value*30))

// Count of projects or people (excluding the "add" row)
const itemCount = computed(() => {
  return props.subrows.filter(sr => !isAddRow(sr)).length
})

defineExpose({ rowHeights })
</script>
