<template>
  <div 
    :class="[
      'absolute flex items-center overflow-hidden rounded-full bar-shadow border text-default assignment-bar',
      isTimeOff 
        ? 'border-gray-500 bg-gray-300 dark:bg-gray-600 dark:text-gray-100' 
        : 'border-default bg-default dark:bg-gray-300 dark:text-gray-800',
      { 
        'dragging': isDragging,
        'resizing': isResizing
      }
    ]"
    :style="barStyle"
    @mousedown.self="onMouseDown"
    @contextmenu.prevent.stop="onRightClick"
  >
    <div
      v-if="!isTimeOff"
      class="h-full w-1.5"
      :style="{ background: color }"
    />
    <UTooltip :text="tooltipText">
      <div 
        :class="[
          'flex items-center gap-2 px-3 text-[12px] w-full draggable-content',
          { 'readonly': store.isReadOnly }
        ]"
        @mousedown="onMouseDown"
      >
        <span :class="isTimeOff ? 'text-gray-900 dark:text-gray-200' : 'dark:text-gray-700'">
          {{ person?.name ?? assignment.person_id }}</span>
        <span :class="[
          'px-1.5 rounded-full border text-[11px]',
          isTimeOff 
            ? 'border-gray-600 bg-gray-400 dark:bg-gray-500 dark:text-gray-100 text-gray-900'
            : 'border-default bg-elevated/80 dark:bg-gray-200 dark:border-gray-400 dark:text-gray-800'
        ]">{{ allocBadge }}</span>
        <span
          :class="[
            'ml-auto pl-2 text-[11px]',
            isTimeOff ? 'text-gray-800 dark:text-gray-300' : 'text-muted dark:text-gray-700'
          ]"
          :title="mdTitle"
        >{{ mdBadge }}</span>
      </div>
    </UTooltip>
    <div
      v-if="!store.isReadOnly"
      class="handle left"
      draggable="false"
      @mousedown.stop.prevent="onResizeStart('left', $event)"
    />
    <div
      v-if="!store.isReadOnly"
      class="handle right"
      draggable="false"
      @mousedown.stop.prevent="onResizeStart('right', $event)"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onUnmounted } from 'vue'
import { addDaysISO, businessDaysBetweenInclusive, businessOffset, isWeekendISO } from '@/composables/useDate'
import { generateUserColor } from '@/utils/colors'
import { roundToDecimalPlaces } from '@/composables/useProjectEstimation'
import { usePlannerStore } from '@/stores/usePlannerStore'
import type { Assignment } from '@/types/planner'

const props = defineProps<{ assignment: Assignment; startISO: string; pxPerDay: number; projectsMap: Record<string, { id:string; name:string; color?:string|null; emoji?:string|null }>; peopleMap?: Record<string, { id: string; name: string }>; top?: number }>()
const emit = defineEmits(['update', 'edit', 'delete', 'resize'])
const store = usePlannerStore()
const project = computed(() => props.projectsMap[props.assignment.project_id])
const person = computed(() => props.peopleMap?.[props.assignment.person_id])

// Check if this is a time off assignment
const isTimeOff = computed(() => props.assignment.project_id === 'TIMEOFF')

// Generate unique color per user based on their person_id
const color = computed(() => generateUserColor(props.assignment.person_id))
const allocBadge = computed(() => {
  const a = props.assignment.allocation
  return a === 1 ? '1' : a === 0.75 ? '¾' : a === 0.5 ? '½' : '¼'
})

const startIndex = computed(() => {
  const baseOffset = businessOffset(props.startISO, props.assignment.start)
  
  // If prepending fixes the issue, then we need to simulate what prepending does
  // Prepending typically moves the timeline start to align with business day boundaries
  // Let's try to detect if the current timeline start needs this alignment
  
  let adjustedOffset = baseOffset
  
  if (store.isLazyLoadEnabled) {
    // Prepending tends to align the timeline start to Monday
    // If we're not starting on Monday, we might need an adjustment
    const timelineStartDay = new Date(props.startISO).getUTCDay() // 0=Sun, 1=Mon, etc.
    
    // If timeline doesn't start on Monday and we have a positive offset, 
    // apply adjustment based on how far from Monday we are
    if (timelineStartDay !== 1 && baseOffset > 0) {
      // The adjustment might depend on the day of week the timeline starts on
      adjustedOffset = baseOffset - 1
    }
  }
  
  return Math.max(0, adjustedOffset)
})
const lengthDays = computed(() => Math.max(1, businessDaysBetweenInclusive(props.assignment.start, props.assignment.end)))
const barStyle = computed(() => ({
  left: (startIndex.value * props.pxPerDay) + 'px',
  width: Math.max(1, lengthDays.value * props.pxPerDay) + 'px',
  top: (props.top ?? 8) + 'px'
}))

// Man-days badge
const md = computed(() => lengthDays.value * props.assignment.allocation)
const mdBadge = computed(() => {
  const val = md.value
  return Number.isInteger(val) ? `${val}d` : `${roundToDecimalPlaces(val)}d`
})
const mdTitle = computed(() => `Total man-days for this assignment`)
const tooltipText = computed(() => {
  const p = person.value?.name ?? props.assignment.person_id
  const proj = project.value?.name ?? props.assignment.project_id
  return `${proj} • ${p} • ${allocBadge.value} • ${props.assignment.start} → ${props.assignment.end}`
})

// Dragging and resizing state
const isDragging = ref(false)
const isResizing = ref(false)
let dragging: { 
  startX: number; 
  startIndex: number; 
  initialStart: string; 
  initialEnd: string;
  lastValidClientX: number;
  scrollContainer: HTMLElement | null;
  initialScrollLeft: number;
  animationId: number | null;
} | null = null
let resizing: { 
  side: 'left'|'right'; 
  startX: number; 
  startStart: string; 
  startEnd: string;
  scrollContainer: HTMLElement | null;
  initialScrollLeft: number;
} | null = null

// Auto-scroll state for resize operations
const autoScrollState = ref({
  isScrolling: false,
  direction: 0, // -1 for left, 1 for right, 0 for no scroll
  animationId: null as number | null
})

// Auto-scroll configuration constants
const DRAG_SCROLL_THRESHOLD = 80  // pixels from edge to trigger auto-scroll during drag
const RESIZE_SCROLL_THRESHOLD = 100  // pixels from edge to trigger auto-scroll during resize
const LEFT_SIDEBAR_WIDTH = 240  // width of the left sidebar in pixels

// Centralized cleanup function for drag event listeners
function cleanupDragListeners() {
  window.removeEventListener('mousemove', onMouseMove)
  window.removeEventListener('mouseup', onMouseUp)
}

// Auto-scroll helper functions for both resize and drag operations
function startAutoScroll(direction: number, timelineContainer: HTMLElement) {
  if (autoScrollState.value.isScrolling && autoScrollState.value.direction === direction) {
    return // Already scrolling in this direction
  }
  
  stopAutoScroll()
  autoScrollState.value.isScrolling = true
  autoScrollState.value.direction = direction
  
  const scroll = () => {
    if (!autoScrollState.value.isScrolling || (!resizing && !dragging)) {
      return
    }
    
    const scrollSpeed = 8
    timelineContainer.scrollLeft += direction * scrollSpeed
    
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

// Smooth mouse-based drag implementation
function onMouseDown(e: MouseEvent) {
  // Prevent drag when in read-only mode
  if (store.isReadOnly) return

  // Ignore when resizing is active or when clicking on resize handles
  if (resizing || (e.target as HTMLElement).classList.contains('handle')) return

  // Prevent event bubbling to avoid conflicts
  e.stopPropagation()
  e.preventDefault()

  isDragging.value = true
  
  // Find the scrollable timeline container
  const scrollContainer = (e.target as HTMLElement).closest('.overflow-auto') as HTMLElement

  dragging = {
    startX: e.clientX,
    startIndex: startIndex.value,
    initialStart: props.assignment.start,
    initialEnd: props.assignment.end,
    lastValidClientX: e.clientX,
    scrollContainer,
    initialScrollLeft: scrollContainer?.scrollLeft || 0,
    animationId: null
  }

  window.addEventListener('mousemove', onMouseMove, { passive: false })
  window.addEventListener('mouseup', onMouseUp)
}

function onMouseMove(e: MouseEvent) {
  if (!dragging) return

  // Prevent text selection during drag
  e.preventDefault()  // Auto-scroll when dragging near the edges of the timeline
  const timelineContainer = dragging.scrollContainer
  if (timelineContainer) {
    const containerRect = timelineContainer.getBoundingClientRect()
    
    // Check if mouse is near right edge and should trigger auto-scroll
    if (e.clientX > containerRect.right - DRAG_SCROLL_THRESHOLD) {
      startAutoScroll(1, timelineContainer)
    }
    // Auto-scroll left when near left edge
    else if (e.clientX < containerRect.left + DRAG_SCROLL_THRESHOLD + LEFT_SIDEBAR_WIDTH && timelineContainer.scrollLeft > 0) {
      startAutoScroll(-1, timelineContainer)
    }
    // Stop auto-scroll when mouse is in the middle area
    else if (autoScrollState.value.isScrolling) {
      stopAutoScroll()
    }
  }
  
  // Update last valid position
  dragging.lastValidClientX = e.clientX
  
  // Use requestAnimationFrame for smooth updates
  if (dragging.animationId) {
    cancelAnimationFrame(dragging.animationId)
  }
  
  dragging.animationId = requestAnimationFrame(() => {
    if (dragging) {
      applyDragByClientX(dragging.lastValidClientX)
      dragging.animationId = null
    }
  })
}

function onMouseUp() {
  isDragging.value = false
  
  // Cancel any pending animation frame
  if (dragging?.animationId) {
    cancelAnimationFrame(dragging.animationId)
  }
  
  dragging = null
  
  // Stop any active auto-scrolling
  stopAutoScroll()
  
  // Clean up event listeners
  cleanupDragListeners()
}

function applyDragByClientX(clientX: number) {
  if (!dragging) return

  // Use clientX if valid, otherwise use last known position
  const effectiveClientX = clientX > 0 ? clientX : dragging.lastValidClientX
  if (effectiveClientX === 0) return  // Account for scroll changes since drag started
  const currentScrollLeft = dragging.scrollContainer?.scrollLeft || 0
  const scrollDelta = currentScrollLeft - dragging.initialScrollLeft
  
  // Adjust for scroll change in pixel calculation
  const deltaPx = (effectiveClientX - dragging.startX) + scrollDelta
  const deltaDays = Math.round(deltaPx / props.pxPerDay)
  
  // Calculate new start position by adding business days from the timeline start
  const newStartIndex = dragging.startIndex + deltaDays
  let newStart = props.startISO
  let businessDaysToAdd = newStartIndex
  
  // Move forward/backward to reach the target business day
  while (businessDaysToAdd !== 0) {
    if (businessDaysToAdd > 0) {
      newStart = addDaysISO(newStart, 1)
      if (!isWeekendISO(newStart)) businessDaysToAdd--
    } else {
      newStart = addDaysISO(newStart, -1)
      if (!isWeekendISO(newStart)) businessDaysToAdd++
    }
  }
  
  // Use business days for length calculation to match the display
  const lengthBusinessDays = businessDaysBetweenInclusive(dragging.initialStart, dragging.initialEnd)
  
  // Calculate end date by adding business days to start
  let newEnd = newStart
  let businessDaysLeft = lengthBusinessDays - 1
  while (businessDaysLeft > 0) {
    newEnd = addDaysISO(newEnd, 1)
    if (!isWeekendISO(newEnd)) businessDaysLeft--
  }
  
  emit('update', { id: props.assignment.id, start: newStart, end: newEnd })
}

function onResizeStart(side: 'left'|'right', e: MouseEvent) {
  // Prevent resize when in read-only mode
  if (store.isReadOnly) return
  
  // Prevent drag from interfering with resize
  isDragging.value = false
  isResizing.value = true
  if (dragging) dragging = null
  
  // Prevent event bubbling to avoid triggering drag on the parent
  e.stopPropagation()
  
  // Find the scrollable timeline container
  const scrollContainer = (e.target as HTMLElement).closest('.overflow-auto') as HTMLElement
  
  resizing = { 
    side, 
    startX: e.clientX, 
    startStart: props.assignment.start, 
    startEnd: props.assignment.end,
    scrollContainer,
    initialScrollLeft: scrollContainer?.scrollLeft || 0
  }
  window.addEventListener('mousemove', onResize)
  window.addEventListener('mouseup', onResizeEnd)
}

function onResize(e: MouseEvent) {
  emit('resize', true);
  if (!resizing) return
  
  // Auto-scroll when resizing near the edges of the timeline
  const timelineContainer = (e.target as HTMLElement)?.closest('.overflow-auto') as HTMLElement
  if (timelineContainer) {
    const containerRect = timelineContainer.getBoundingClientRect()
    
    // Check if mouse is near right edge and should trigger auto-scroll
    if (e.clientX > containerRect.right - RESIZE_SCROLL_THRESHOLD) {
      startAutoScroll(1, timelineContainer)
    }
    // Auto-scroll left when near left edge
    else if (e.clientX < containerRect.left + RESIZE_SCROLL_THRESHOLD && timelineContainer.scrollLeft > 0) {
      startAutoScroll(-1, timelineContainer)
    }
    // Stop auto-scroll when mouse is in the middle area
    else if (autoScrollState.value.isScrolling) {
      stopAutoScroll()
    }
  }
  
  // Account for scroll changes since resize started
  const currentScrollLeft = resizing.scrollContainer?.scrollLeft || 0
  const scrollDelta = currentScrollLeft - resizing.initialScrollLeft
  
  // Adjust for scroll change in pixel calculation
  const deltaPx = (e.clientX - resizing.startX) + scrollDelta
  const deltaDays = Math.round(deltaPx / props.pxPerDay)
  
  if (resizing.side === 'left') {
    // Left resize: change start date while keeping end date fixed
    let newStart = resizing.startStart
    let businessDaysToAdd = deltaDays
    
    // Move forward/backward to reach the target business day
    while (businessDaysToAdd !== 0) {
      if (businessDaysToAdd > 0) {
        newStart = addDaysISO(newStart, 1)
        if (!isWeekendISO(newStart)) businessDaysToAdd--
      } else {
        newStart = addDaysISO(newStart, -1)
        if (!isWeekendISO(newStart)) businessDaysToAdd++
      }
    }
    
    // Ensure new start is not after the end date
    if (newStart <= resizing.startEnd) {
      emit('update', { id: props.assignment.id, start: newStart })
    }
  } else {
    // Right resize: change end date while keeping start date fixed
    let newEnd = resizing.startEnd
    let businessDaysToAdd = deltaDays
    
    // Move forward/backward to reach the target business day
    while (businessDaysToAdd !== 0) {
      if (businessDaysToAdd > 0) {
        newEnd = addDaysISO(newEnd, 1)
        if (!isWeekendISO(newEnd)) businessDaysToAdd--
      } else {
        newEnd = addDaysISO(newEnd, -1)
        if (!isWeekendISO(newEnd)) businessDaysToAdd++
      }
    }
    
    // Ensure new end is not before the start date
    if (newEnd >= resizing.startStart) {
      emit('update', { id: props.assignment.id, end: newEnd })
    }
  }
}
function onResizeEndEvent() {  
  setTimeout(() => {
    emit('resize', false);
  }, 0);
}

function onResizeEnd() {  
  isResizing.value = false
  resizing = null
  
  // Stop any active auto-scrolling
  stopAutoScroll()
  
  window.removeEventListener('mousemove', onResize)
  window.removeEventListener('mouseup', onResizeEnd)
  onResizeEndEvent();
}

function onRightClick(e: MouseEvent) {
  // Prevent edit when in read-only mode
  if (store.isReadOnly) return
  
  emit('edit', { 
    assignment: props.assignment, 
    x: e.clientX, 
    y: e.clientY 
  })
}

// Component cleanup to prevent memory leaks
onUnmounted(() => {
  cleanupDragListeners()
  
  // Stop any active auto-scrolling
  stopAutoScroll()
  
  // Cleanup mouse-based drag listeners if they exist
  window.removeEventListener('mousemove', onMouseMove)
  window.removeEventListener('mouseup', onMouseUp)
  
  // Cleanup resize listeners if they exist
  window.removeEventListener('mousemove', onResize)
  window.removeEventListener('mouseup', onResizeEnd)
})
</script>

<style scoped>
.handle { 
  position: absolute; 
  top: 0; 
  width: 6px; 
  min-width: 6px;
  height: 100%; 
  background: transparent; 
  cursor: ew-resize; 
  z-index: 10;
  border-radius: 3px;
  transition: background-color 0.2s ease, border 0.2s ease;
  pointer-events: auto;
}

.handle:hover {
  background: rgba(59, 130, 246, 0.2);
  border: 1px solid rgba(59, 130, 246, 0.4);
}

.left { left: -3px; }
.right { right: -3px; }

/* Dragging and resizing states */
.dragging {
  opacity: 0.9;
  box-shadow: 0 8px 25px -5px rgba(0, 0, 0, 0.3), 0 4px 12px -2px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  transform: scale(1.02);
  filter: brightness(1.05);
}

.resizing {
  box-shadow: 0 4px 15px -2px rgba(0, 0, 0, 0.15);
  z-index: 1000;
}

.resizing .handle {
  background: rgba(59, 130, 246, 0.3);
  border: 1px solid rgba(59, 130, 246, 0.6);
}

/* Make the entire bar draggable by default */
.draggable-content {
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
}

/* Only show drag cursor and hover effects when not in readonly mode */
.draggable-content:not(.readonly) {
  cursor: move;
}

/* Readonly mode styling */
.draggable-content.readonly {
  cursor: default;
}

/* Ensure draggable area remains accessible even when resizing */
.resizing .draggable-content {
  cursor: move;
  pointer-events: auto;
}

/* Resize handles should be smaller and only active on hover */
.handle {
  cursor: ew-resize;
  pointer-events: auto;
}

/* Ensure the content area remains draggable */
.resizing .handle {
  pointer-events: auto;
}

/* Smooth dragging transitions */
.dragging {
  transition: none !important;
}

/* Prevent text selection during drag operations */
.dragging * {
  user-select: none !important;
  -webkit-user-select: none !important;
  -moz-user-select: none !important;
  -ms-user-select: none !important;
}

.assignment-bar {
  height: 30px;
}
</style>
 
