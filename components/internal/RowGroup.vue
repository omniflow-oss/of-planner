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
      <span class="ml-2 inline-flex items-center rounded-xl bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-700 border border-slate-200" :title="'Total man-days (visible window)'">{{ totalMDBadge }}</span>
      <button
        @click="handleAddClick"
        class="ml-2 w-6 h-6 flex items-center justify-center rounded-full bg-blue-50 hover:bg-blue-100 text-blue-600 hover:text-blue-700 transition-colors"
        :title="groupType === 'person' ? 'Assigner un projet' : 'Ajouter une personne'"
      >
        ➕
      </button>
    </div>
    <div class="relative border-b border-r pane-border timeline-bg disabled-rows" :style="{ height: headerHeight+'px', width: timelineWidth+'px' }">
      <GridOverlay :days="days" :pxPerDay="pxPerDay" :offsets="dayOffsets" :weekStarts="weekStarts" />
      <!-- Per-day coverage overlays on header track -->
      <template v-for="(day, i) in days" :key="'cap'+i">
        <div 
          v-if="capacityDaily[i] > 0"
          class="absolute inset-y-0"
          :class="coverageClass(i)"
          :style="{ left: lineLeft(i)+'px', width: dayWidth(i)+'px' }"
        >
          <div v-if="pxPerDay >= 44" class="absolute top-0 right-0 px-1 py-0.5 text-[10px] text-slate-700">{{ Math.round(capacityDaily[i]*100) }}%</div>
        </div>
      </template>
      <!-- <AssignmentBar v-for="a in headerAssignments" :key="'h_'+a.id" :assignment="a" :startISO="startISO" :pxPerDay="pxPerDay" :projectsMap="projectsMap" :top="laneTop(a._lane)" @update="onUpdate" @edit="onEdit" /> -->
    </div>

    <!-- Subrows -->
    <template v-if="expanded" v-for="sr in filteredSubrows" :key="sr.key">
      <!-- Left: label -->
      <div class="border-b border-r pane-border sticky left-0 z-10 bg-white" :style="{ height: (rowHeights[sr.key] || baseRowMin)+'px' }">
        <div class="flex items-center h-full px-3 pl-8 py-2 text-sm text-slate-800">
          <div class="truncate font-medium">-- {{ sr.label }}</div>
        </div>
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
import { addDaysISO, businessDaysBetweenInclusive, businessOffset } from '@/composables/useDate'
import { computeLanes } from '@/utils/lanes'
import { useTimelineGrid } from '@/composables/useTimeline'
import { indexFromX, businessSegment } from '@/utils/grid'
import { useCapacity } from '@/composables/useCapacity'

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

// Auto-scroll state
const autoScrollState = ref({
  isScrolling: false,
  direction: 0, // -1 for left, 1 for right, 0 for no scroll
  animationId: null as number | null
})

function isAddRow(sr:any) { return String(sr.key).includes('__add__') || sr.person_id === null || sr.project_id === null }
function cleanAddLabel(s: string) { return s.replace(/^\s*\+\s*/, '') }
function subAssignmentsLaned(sr: { key:string; person_id: string|null; project_id: string|null }) {
  // Since we filtered out add rows, all rows here should have assignments
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

// Filter out the add rows since we now have the + button in the header
const filteredSubrows = computed(() => {
  return props.subrows.filter(sr => !isAddRow(sr))
})

// Handle the + button click in the header
function handleAddClick() {
  // Create a synthetic add row object to maintain compatibility with existing logic
  const addRowData = {
    key: `${props.groupId}:__add__`,
    label: props.groupType === 'person' ? '➕ Assigner un projet' : '➕ Ajouter une personne',
    person_id: props.groupType === 'person' ? props.groupId : null,
    project_id: props.groupType === 'project' ? props.groupId : null
  }
  
  console.log('RowGroup: Add button clicked for', props.label, 'creating synthetic add row:', addRowData)
  emit('createFromSidebar', addRowData)
}

// Drag-to-create functions
function startDragCreate(e: MouseEvent, sr: any) {
  if (onResizeEvent.value) return
  
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
  const x = e.clientX - rect.left
  
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
    updatePreviewBar()
  }, 200) // 200ms for preview display
}

function updateDragCreate(e: MouseEvent, sr: any) {
  // Only process if drag is active and this is the correct row, or if rowKey matches but sr.key is different (mouse moved outside)
  if (!dragState.value.active) return
  if (dragState.value.rowKey && dragState.value.rowKey !== sr.key) {
    // Mouse moved outside the original row; keep state bound to original row
    return
  }
  
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
  const x = e.clientX - rect.left
  
  dragState.value.currentX = x
  dragState.value.endDayIndex = getDayIndexFromX(x)
  updatePreviewBar()
}

function endDragCreate(e: MouseEvent, sr: any) {
  
  // Clear long click timer
  if (dragState.value.longClickTimer) {
    clearTimeout(dragState.value.longClickTimer)
    dragState.value.longClickTimer = null
  }
  
  // If drag is not active, handle as regular click
  if (!dragState.value.active) {
    onEmptyClick(e, sr)
    resetDragState()
    return
  }
  
  // If we have a saved rowKey but mouse ended on different row, still create assignment on original row
  if (dragState.value.rowKey && dragState.value.rowKey !== sr.key) {
    // Find the original subrow data using the saved rowKey
    const originalSubrow = filteredSubrows.value.find(subrow => subrow.key === dragState.value.rowKey)
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
  dragState.value.active = false
  dragState.value.isLongClick = false
  dragState.value.rowKey = ''
  dragState.value.startX = 0
  dragState.value.currentX = 0
  dragState.value.startDayIndex = 0
  dragState.value.endDayIndex = 0
  dragState.value.previewLeft = 0
  dragState.value.previewWidth = 0
  
  // Stop any active auto-scrolling
  stopAutoScroll()
}

// Auto-scroll helper functions
function startAutoScroll(direction: number, timelineContainer: HTMLElement) {
  if (autoScrollState.value.isScrolling && autoScrollState.value.direction === direction) {
    return // Already scrolling in this direction
  }
  
  stopAutoScroll()
  autoScrollState.value.isScrolling = true
  autoScrollState.value.direction = direction
  
  const scroll = () => {
    if (!autoScrollState.value.isScrolling || !dragState.value.active) {
      return
    }
    
    const scrollSpeed = 8
    timelineContainer.scrollLeft += direction * scrollSpeed
    
    // Update drag state after scroll
    if (dragState.value.rowKey) {
      const activeRow = document.querySelector(`[data-row-key="${dragState.value.rowKey}"]`)
      if (activeRow) {
        // Re-trigger mouse position update to maintain correct drag state
        const mouseEvent = new MouseEvent('mousemove', {
          clientX: dragState.value.currentX + (activeRow.getBoundingClientRect().left),
          clientY: 0
        })
        updateDragFromScroll()
      }
    }
    
    autoScrollState.value.animationId = requestAnimationFrame(scroll)
  }
  
  autoScrollState.value.animationId = requestAnimationFrame(scroll)
}

function stopAutoScroll() {
  if (autoScrollState.value.animationId) {
    cancelAnimationFrame(autoScrollState.value.animationId)
    autoScrollState.value.animationId = null
  }
  autoScrollState.value.isScrolling = false
  autoScrollState.value.direction = 0
}

function updateDragFromScroll() {
  if (dragState.value.active && dragState.value.rowKey) {
    const activeRow = document.querySelector(`[data-row-key="${dragState.value.rowKey}"]`)
    if (activeRow) {
      const rect = activeRow.getBoundingClientRect()
      const x = dragState.value.currentX // Keep the relative mouse position
      dragState.value.endDayIndex = getDayIndexFromX(x)
      updatePreviewBar()
    }
  }
}

function getDayIndexFromX(x: number): number {
  return indexFromX(x, dayOffsets.value, pxPerDay.value, days.value.length)
}

function updatePreviewBar() {
  const startIndex = Math.min(dragState.value.startDayIndex, dragState.value.endDayIndex)
  const endIndex = Math.max(dragState.value.startDayIndex, dragState.value.endDayIndex)
  
  if (startIndex < 0 || endIndex < 0 || startIndex >= days.value.length || endIndex >= days.value.length) return
  const startDay = days.value[startIndex]
  const endDay = days.value[endIndex]
  const seg = businessSegment(props.startISO, startDay, endDay, pxPerDay.value)
  dragState.value.previewLeft = seg.left
  dragState.value.previewWidth = seg.width
}

// Empty click to show create popover (now handled by Timeline.vue)
function onEmptyClick(e: MouseEvent, sr: any) {
  if(onResizeEvent.value) {
    return;
  }
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
  const x = e.clientX - rect.left
  const idx = indexFromX(x, dayOffsets.value, pxPerDay.value, days.value.length)
  const start = days.value[idx]
  emit('createPopover', { key: sr.key, x: e.clientX, y: e.clientY, dayISO: start, person_id: sr.person_id, project_id: sr.project_id })
}

// Today index no longer used here; header overlay handles today marker

// tiny pinia-less accessor for current assignments via inject to keep component pure
const assignmentsKey = Symbol.for('assignmentsRef')
function usePlanner() { return inject<any>(assignmentsKey)! }
const assignmentsRef = usePlanner()

// Expand/Collapse all controls
const rowGroupControls = inject<{ expandAllToken: Ref<number>; collapseAllToken: Ref<number> } | null>('rowGroupControls', null)
if (rowGroupControls) {
  watch(() => rowGroupControls.expandAllToken.value, (v) => { if (v) expanded.value = true })
  watch(() => rowGroupControls.collapseAllToken.value, (v) => { if (v) expanded.value = false })
}

// Header aggregated lane count
const headerLaneCount = computed(() => {
  const list = assignmentsRef.value.filter((a: any) => (props.groupType === 'person' ? a.person_id === props.groupId : a.project_id === props.groupId))
  const { laneCount } = computeLanes(props.startISO, list)
  return laneCount
})

// Force recalculation by triggering subAssignmentsLaned for all subrows
function recalculateAllHeights() {
  // Clear existing heights to force recalculation
  rowHeights.value = {}
  
  // Trigger subAssignmentsLaned for each filtered subrow to recalculate heights
  filteredSubrows.value.forEach(sr => {
    subAssignmentsLaned(sr)
  })
}

// Watch for subrows changes (which happens when switching views)
watch(() => props.subrows, () => {
  nextTick(() => {
    recalculateAllHeights()
  })
}, { immediate: true })

// Keep main (header) row height fixed regardless of subrow lanes
const headerHeight = computed(() => baseRowMin)

// Count of projects or people (excluding the "add" row)
const itemCount = computed(() => {
  return filteredSubrows.value.length
})

// Capacity per group in visible window (header overlays and total MD badge)
const capacityApi = useCapacity(assignmentsRef, days, { type: props.groupType, id: props.groupId })
const capacityDaily = computed(() => capacityApi.daily.value)
const totalMD = computed(() => capacityApi.totalMD.value)
const totalMDBadge = computed(() => {
  const val = totalMD.value
  return Number.isInteger(val) ? `${val}d` : `${Math.round(val * 10) / 10}d`
})
function coverageClass(i: number) {
  const v = capacityDaily.value[i] || 0
  if (v > 1) return 'bg-red-500/15'
  if (Math.abs(v - 1) < 1e-6) return 'bg-green-500/15'
  if (v > 0) return 'bg-amber-400/15'
  return ''
}

// Global mouse event handlers for drag operations
const handleGlobalMouseUp = (e: MouseEvent) => {
  if (dragState.value.active && dragState.value.rowKey) {
    console.log('RowGroup: Global mouseup with active drag, completing assignment creation')
    
    // Find the original subrow data using the saved rowKey
    const originalSubrow = filteredSubrows.value.find(subrow => subrow.key === dragState.value.rowKey)
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
      
      // Auto-scroll when dragging beyond the edges of the timeline
      const timelineContainer = activeRow.closest('.overflow-auto') as HTMLElement || 
                               document.querySelector('[ref="scrollArea"]') as HTMLElement ||
                               document.querySelector('.overflow-auto') as HTMLElement
      
      if (timelineContainer) {
        const containerRect = timelineContainer.getBoundingClientRect()
        const scrollThreshold = 100 // pixels from edge to trigger scroll
        
        // Check if mouse is near right edge and should trigger auto-scroll
        if (e.clientX > containerRect.right - scrollThreshold) {
          startAutoScroll(1, timelineContainer)
        }
        // Auto-scroll left when near left edge
        else if (e.clientX < containerRect.left + scrollThreshold && timelineContainer.scrollLeft > 0) {
          startAutoScroll(-1, timelineContainer)
        }
        // Stop auto-scroll when mouse is in the middle area
        else if (autoScrollState.value.isScrolling) {
          stopAutoScroll()
        }
      }
    } else {
      // If activeRow is not found, still update currentX based on the original startX position
      // This prevents losing the drag state when mouse goes far outside
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
  stopAutoScroll()
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
