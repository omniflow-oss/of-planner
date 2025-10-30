<template>
  <div class="grid" style="grid-template-columns: 240px 1fr;-webkit-user-select: none; user-select: none;" :style="{ width: timelineWidth+'px' }"
  draggable="false"
  >
    <!-- Group header row -->
    <div 
      class="px-3 py-2 border-b border-r pane-border font-medium flex items-center gap-2 sticky left-0 z-10 bg-white"
      draggable="false"
      style="-webkit-user-select: none; user-select: none;"
    >
      <button class="w-5 h-5 grid place-items-center rounded border border-slate-200 text-slate-600 hover:bg-slate-50" @click="expanded = !expanded">{{ expanded ? '–' : '+' }}</button>
      <span>{{ label }}  </span>
      <span class="ml-auto inline-flex items-center rounded-xl bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700 inset-ring inset-ring-indigo-700/10">{{ itemCount }}</span>
    </div>
    <div class="relative border-b border-r pane-border timeline-bg disabled-rows" :style="{ height: headerHeight+'px', width: timelineWidth+'px' }">
      <GridOverlay :days="days" :pxPerDay="pxPerDay" :offsets="dayOffsets" :weekStarts="weekStarts" />
      <!-- <AssignmentBar v-for="a in headerAssignments" :key="'h_'+a.id" :assignment="a" :startISO="startISO" :pxPerDay="pxPerDay" :projectsMap="projectsMap" :top="laneTop(a._lane)" @update="onUpdate" @edit="onEdit" /> -->
    </div>

    <!-- Subrows -->
    <template v-if="expanded" v-for="sr in subrows" :key="sr.key">
      <!-- Left: label or add row using LeftPaneCell -->
      <div class="border-b border-r pane-border sticky left-0 z-10 bg-white" :style="{ height: (rowHeights[sr.key] || baseRowMin)+'px' }">
        <LeftPaneCell
          :is-add="isAddRow(sr)"
          :title="isAddRow(sr) ? cleanAddLabel(sr.label) : '-- ' + sr.label"
          @click="isAddRow(sr) && $emit('createFromSidebar', sr)"
        />
      </div>

      <!-- Right: timeline track -->
      <div class="relative border-b border-r pane-border timeline-bg" 
           :style="{ height: (rowHeights[sr.key] || baseRowMin)+'px', width: timelineWidth+'px' }" 
           :data-row-key="sr.key"
           @contextmenu.prevent.stop="onEmptyClick($event, sr)"
           @mousedown="startDragCreate($event, sr)"
           @mousemove="updateDragCreate($event, sr)"
           @mouseup="endDragCreate($event, sr)"
           @dragstart="cancelDragCreate"
           >
        <GridOverlay :days="days" :pxPerDay="pxPerDay" :offsets="dayOffsets" :weekStarts="weekStarts" />
        <AssignmentBar v-for="a in subAssignmentsLaned(sr)" :key="a.id" :assignment="a" :startISO="startISO" :pxPerDay="pxPerDay" :projectsMap="projectsMap" :peopleMap="peopleMap" :top="laneTop(a._lane)" @update="onUpdate" @edit="onEdit" @resize="(e: any) => onResizeEvent=e" />
        
        <!-- Drag-to-create preview bar -->
        <div v-if="dragState.active && dragState.rowKey === sr.key" 
             class="absolute bg-blue-500/30 border border-blue-500 rounded-sm pointer-events-none"
             :style="{
               left: dragState.previewLeft + 'px',
               top: '10px',
               width: dragState.previewWidth + 'px',
               height: '28px'
             }">
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onMounted, onUnmounted } from 'vue'
import AssignmentBar from '@/components/internal/shared/AssignmentBar.vue'
import GridOverlay from '@/components/internal/shared/GridOverlay.vue'
import LeftPaneCell from '@/components/internal/LeftPaneCell.vue'
import { addDaysISO, parseISO, businessDaysBetweenInclusive, businessOffset, isWeekendISO } from '@/composables/useDate'
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
  peopleMap?: Record<string, { id: string; name: string }>
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
const rowHeights = ref<Record<string, number>>({})
const baseRowMin = 44
const expanded = ref(true)
const onResizeEvent = ref(false)

// Drag-to-create state
const dragState = ref({
  active: false,
  rowKey: '',
  startX: 0,
  currentX: 0,
  startDayIndex: 0,
  endDayIndex: 0,
  previewLeft: 0,
  previewWidth: 0,
  longClickTimer: null as number | null,
  isLongClick: false
})

function isAddRow(sr:any) { return String(sr.key).includes('__add__') || sr.person_id === null || sr.project_id === null }
function cleanAddLabel(s: string) { return s.replace(/^\s*\+\s*/, '') }
function isWeekend(dayISO: string) { const d = parseISO(dayISO).getUTCDay(); return d === 0 || d === 6 }
function subAssignmentsLaned(sr: { key:string; person_id: string|null; project_id: string|null }) {
  if (isAddRow(sr)) { rowHeights.value[sr.key] = baseRowMin; return [] }
  const list = assignmentsRef.value.filter((a: any) => a.person_id === sr.person_id && a.project_id === sr.project_id)
  const { items, laneCount } = computeLanes(props.startISO, list)
  const laneHeight = 30
  const padding = 10
  const totalH = padding*2 + laneCount*laneHeight
  rowHeights.value[sr.key] = Math.max(baseRowMin, totalH)
  return items
}
function laneTop(lane: number) { const padding = 10; const laneHeight = 30; return padding + lane*laneHeight }

function onUpdate(payload: { id: string; start?: string; end?: string }) { emit('update', payload) }
function onEdit(payload: { assignment: any; x: number; y: number }) { emit('edit', payload) }

// Drag-to-create functions
function startDragCreate(e: MouseEvent, sr: any) {
  if (isAddRow(sr) || onResizeEvent.value) return
  
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
  const x = e.clientX - rect.left
  
  console.log('RowGroup: Starting drag create for row:', sr.key)
  
  // Save all critical state immediately before any mouse movement
  dragState.value.rowKey = sr.key
  dragState.value.startX = x
  dragState.value.currentX = x
  dragState.value.startDayIndex = getDayIndexFromX(x)
  dragState.value.endDayIndex = dragState.value.startDayIndex
  // Set active and isLongClick immediately to ensure they persist
  
  
  // Start long click timer (now just for preview display timing)
  dragState.value.longClickTimer = window.setTimeout(() => {
    dragState.value.active = true
    dragState.value.isLongClick = true
    console.log('RowGroup: Long click timer completed, showing preview')
    updatePreviewBar()
  }, 200) // 200ms for preview display
}

function updateDragCreate(e: MouseEvent, sr: any) {
  // Only process if drag is active and this is the correct row, or if rowKey matches but sr.key is different (mouse moved outside)
  if (!dragState.value.active) return
  if (dragState.value.rowKey && dragState.value.rowKey !== sr.key) {
    // Mouse moved outside the original row, but we still want to update if we have a saved rowKey
    console.log('RowGroup: Mouse outside original row, preserving rowKey:', dragState.value.rowKey)
    return
  }
  
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
  const x = e.clientX - rect.left
  
  dragState.value.currentX = x
  dragState.value.endDayIndex = getDayIndexFromX(x)
  updatePreviewBar()
}

function endDragCreate(e: MouseEvent, sr: any) {
  console.log('RowGroup: End drag create', { 
    active: dragState.value.active, 
    isLongClick: dragState.value.isLongClick,
    rowKey: dragState.value.rowKey,
    srKey: sr.key
  })
  
  // Clear long click timer
  if (dragState.value.longClickTimer) {
    clearTimeout(dragState.value.longClickTimer)
    dragState.value.longClickTimer = null
  }
  
  // If drag is not active, handle as regular click
  if (!dragState.value.active) {
    console.log('RowGroup: Drag not active, handling as regular click')
    onEmptyClick(e, sr)
    resetDragState()
    return
  }
  
  // If we have a saved rowKey but mouse ended on different row, still create assignment on original row
  if (dragState.value.rowKey && dragState.value.rowKey !== sr.key) {
    console.log('RowGroup: Mouse ended on different row, using saved rowKey:', dragState.value.rowKey)
    // Find the original subrow data using the saved rowKey
    const originalSubrow = props.subrows.find(subrow => subrow.key === dragState.value.rowKey)
    if (originalSubrow) {
      sr = originalSubrow // Use the original subrow for assignment creation
    }
  }
  
  // Calculate assignment details using business days logic (same as AssignmentBar)
  const startIndex = Math.min(dragState.value.startDayIndex, dragState.value.endDayIndex)
  const endIndex = Math.max(dragState.value.startDayIndex, dragState.value.endDayIndex)
  
  if (startIndex >= 0 && endIndex >= 0 && startIndex < days.value.length && endIndex < days.value.length) {
    const startDay = days.value[startIndex]
    const endDay = days.value[endIndex]
    
    // Calculate duration using business days (matching Timeline's onCreate expectation)
    const duration = Math.max(1, businessDaysBetweenInclusive(startDay, endDay))
    
    console.log('RowGroup: Creating assignment', { 
      person_id: sr.person_id, 
      project_id: sr.project_id, 
      start: startDay, 
      duration: duration 
    })
    
    // Emit create event with duration (as expected by Timeline.onCreate)
    emit('create', {
      person_id: sr.person_id,
      project_id: sr.project_id,
      start: startDay,
      duration: duration,
      allocation: 1 // Default allocation
    })
  }
  
  resetDragState()
}

function cancelDragCreate() {
  // Clear long click timer
  if (dragState.value.longClickTimer) {
    clearTimeout(dragState.value.longClickTimer)
    dragState.value.longClickTimer = null
  }
  
  resetDragState()
}

function resetDragState() {
  console.log('RowGroup: Resetting drag state, clearing rowKey:', dragState.value.rowKey)
  dragState.value.active = false
  dragState.value.isLongClick = false
  dragState.value.rowKey = ''
  dragState.value.startX = 0
  dragState.value.currentX = 0
  dragState.value.startDayIndex = 0
  dragState.value.endDayIndex = 0
  dragState.value.previewLeft = 0
  dragState.value.previewWidth = 0
}

function getDayIndexFromX(x: number): number {
  let idx = 0
  if (dayOffsets.value) {
    for (let i = 0; i < days.value.length; i++) {
      const left = lineLeft(i)
      const width = dayWidth(i)
      if (x < left + width) {
        idx = i
        break
      }
      idx = i
    }
  } else {
    idx = Math.round(x / pxPerDay.value)
  }
  return Math.max(0, Math.min(days.value.length - 1, idx))
}

function updatePreviewBar() {
  const startIndex = Math.min(dragState.value.startDayIndex, dragState.value.endDayIndex)
  const endIndex = Math.max(dragState.value.startDayIndex, dragState.value.endDayIndex)
  
  if (startIndex >= 0 && endIndex >= 0 && startIndex < days.value.length && endIndex < days.value.length) {
    // Calculate preview bar using the same positioning logic as AssignmentBar
    const startDay = days.value[startIndex]
    const endDay = days.value[endIndex]
    
    // Use business day offset from timeline start (same as AssignmentBar)
    const businessStartIndex = Math.max(0, businessOffset(props.startISO, startDay))
    const businessDayCount = Math.max(1, businessDaysBetweenInclusive(startDay, endDay))
    
    // Position and width calculation (matching AssignmentBar logic)
    const left = businessStartIndex * pxPerDay.value
    const width = Math.max(1, businessDayCount * pxPerDay.value - 2)  // -2 for border like AssignmentBar
    
    dragState.value.previewLeft = left
    dragState.value.previewWidth = width
  }
}

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

// Force recalculation by triggering subAssignmentsLaned for all subrows
function recalculateAllHeights() {
  // Clear existing heights to force recalculation
  rowHeights.value = {}
  
  // Trigger subAssignmentsLaned for each subrow to recalculate heights
  props.subrows.forEach(sr => {
    subAssignmentsLaned(sr)
  })
}

// Watch for subrows changes (which happens when switching views)
watch(() => props.subrows, () => {
  nextTick(() => {
    recalculateAllHeights()
  })
}, { immediate: true })

const headerHeight = computed(() => Math.max(baseRowMin, 16 + headerLaneCount.value*30))

// Count of projects or people (excluding the "add" row)
const itemCount = computed(() => {
  return props.subrows.filter(sr => !isAddRow(sr)).length
})

// Global mouse event handlers for drag operations
const handleGlobalMouseUp = (e: MouseEvent) => {
  if (dragState.value.active && dragState.value.rowKey) {
    console.log('RowGroup: Global mouseup with active drag, completing assignment creation')
    
    // Find the original subrow data using the saved rowKey
    const originalSubrow = props.subrows.find(subrow => subrow.key === dragState.value.rowKey)
    if (originalSubrow) {
      // Calculate assignment details using business days logic
      const startIndex = Math.min(dragState.value.startDayIndex, dragState.value.endDayIndex)
      const endIndex = Math.max(dragState.value.startDayIndex, dragState.value.endDayIndex)
      
      if (startIndex >= 0 && endIndex >= 0 && startIndex < days.value.length && endIndex < days.value.length) {
        const startDay = days.value[startIndex]
        const endDay = days.value[endIndex]
        
        // Calculate duration using business days
        const duration = Math.max(1, businessDaysBetweenInclusive(startDay, endDay))
        
        console.log('RowGroup: Creating assignment from global mouseup', { 
          person_id: originalSubrow.person_id, 
          project_id: originalSubrow.project_id, 
          start: startDay, 
          duration: duration 
        })
        
        // Emit create event
        emit('create', {
          person_id: originalSubrow.person_id,
          project_id: originalSubrow.project_id,
          start: startDay,
          duration: duration,
          allocation: 1
        })
      }
    }
    
    resetDragState()
  } else if (dragState.value.active) {
    // Just cancel if no rowKey saved
    cancelDragCreate()
  }
}

const handleGlobalMouseMove = (e: MouseEvent) => {
  // This allows dragging to continue even when mouse leaves the row area
  if (dragState.value.active && dragState.value.rowKey) {
    // Find the active timeline track element
    const activeRow = document.querySelector(`[data-row-key="${dragState.value.rowKey}"]`)
    if (activeRow) {
      const rect = activeRow.getBoundingClientRect()
      const x = e.clientX - rect.left
      dragState.value.currentX = x
      dragState.value.endDayIndex = getDayIndexFromX(x)
      updatePreviewBar()
    } else {
      // If activeRow is not found, still update currentX based on the original startX position
      // This prevents losing the drag state when mouse goes far outside
      console.log('RowGroup: Active row not found, preserving rowKey:', dragState.value.rowKey)
      dragState.value.currentX = e.clientX - dragState.value.startX
    }
  }
}

// Setup global listeners
onMounted(() => {
  document.addEventListener('mouseup', handleGlobalMouseUp)
  document.addEventListener('mousemove', handleGlobalMouseMove)
})

// Cleanup on unmount
onUnmounted(() => {
  if (dragState.value.longClickTimer) {
    clearTimeout(dragState.value.longClickTimer)
  }
  document.removeEventListener('mouseup', handleGlobalMouseUp)
  document.removeEventListener('mousemove', handleGlobalMouseMove)
})

defineExpose({ rowHeights })
</script>
<style scoped>
.disabled-rows {
  pointer-events: none;
  background-color: transparent;
} 

</style>