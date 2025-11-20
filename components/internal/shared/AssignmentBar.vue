<template>
  <div 
    :class="[
      'absolute flex items-center overflow-hidden rounded-md bar-shadow border text-default assignment-bar',
      isTimeOff 
        ? 'border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800' 
        : 'border-transparent',
      { 
        'dragging': isDragging,
        'resizing': isResizing,
        'hover:brightness-95 dark:hover:brightness-110': !store.isReadOnly
      }
    ]"
    :style="barStyle"
    @mousedown.self="onMouseDown"
    @contextmenu.prevent.stop="onRightClick"
  >
    <!-- Solid Color Bar Content -->
    <UTooltip :text="tooltipText">
      <div 
        :class="[
          'flex items-center gap-1.5 px-1.5 text-[10.5px] font-medium w-full h-full draggable-content truncate',
          { 'readonly': store.isReadOnly }
        ]"
        :style="{ color: textColor }"
        @mousedown="onMouseDown"
      >
        <!-- Task Type Icon -->
        <UIcon :name="taskIcon" class="flex-shrink-0 w-3.5 h-3.5 opacity-80" />
        
        <!-- Main Label -->
        <span class="truncate leading-tight tracking-tight">
          {{ mainLabel }}
        </span>

        <!-- Man-days Badge & Allocation -->
        <div class="ml-auto flex items-center gap-1.5">
          <span class="opacity-70 text-[10px] font-medium" title="Total man-days">
            {{ totalManDays }}d
          </span>
          <span v-if="assignment.allocation < 1" class="opacity-70 text-[10px] font-bold">
            {{ Math.round(assignment.allocation * 100) }}%
          </span>
        </div>
      </div>
    </UTooltip>

    <!-- Resize Handles -->
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
import { inject } from 'vue'
import { addDaysISO, businessDaysBetweenInclusive, businessOffset, isWeekendISO } from '@/composables/useDate'
import { getAllocationColor, getAllocationTextColor, enhanceProjectColor } from '@/utils/colors'
import { roundToDecimalPlaces } from '@/composables/useProjectEstimation'
import { usePlannerStore } from '@/stores/usePlannerStore'
import { manDays } from '@/utils/alloc'
import type { Assignment } from '@/types/planner'

// --- Helper Functions ---
function getFirstBusinessDay(days?: string[], fallbackISO?: string) {
  if (!days || days.length === 0) return fallbackISO || '';
  const firstBusinessDay = days.find(d => {
    const wd = new Date(d).getUTCDay();
    return wd >= 1 && wd <= 5;
  });
  return firstBusinessDay || days[0] || fallbackISO || '';
}

function moveBusinessDays(startISO: string, offset: number) {
  let result = startISO;
  let businessDaysToAdd = offset;
  while (businessDaysToAdd !== 0) {
    if (businessDaysToAdd > 0) {
      result = addDaysISO(result, 1);
      if (!isWeekendISO(result)) businessDaysToAdd--;
    } else {
      result = addDaysISO(result, -1);
      if (!isWeekendISO(result)) businessDaysToAdd++;
    }
  }
  return result;
}

function getBaseISO(props: any) {
  return getFirstBusinessDay(props.days, props.startISO);
}

function getStartIndex(props: any) {
  return Math.max(0, businessOffset(getBaseISO(props), props.assignment.start));
}

function getBarDatesForDrag(props: any, dragging: any, deltaPx: number) {
  const pxPerDay = props.pxPerDay;
  let deltaDays = 0;
  if (deltaPx >= pxPerDay) {
    deltaDays = Math.floor(deltaPx / pxPerDay);
  } else if (deltaPx <= -pxPerDay) {
    deltaDays = Math.ceil(deltaPx / pxPerDay);
  }
  const baseISO = getBaseISO(props);
  const newStartIndex = dragging.startIndex + deltaDays;
  const newStart = moveBusinessDays(baseISO, newStartIndex);
  const lengthBusinessDays = businessDaysBetweenInclusive(dragging.initialStart, dragging.initialEnd);
  let newEnd = newStart;
  let businessDaysLeft = lengthBusinessDays - 1;
  while (businessDaysLeft > 0) {
    newEnd = addDaysISO(newEnd, 1);
    if (!isWeekendISO(newEnd)) businessDaysLeft--;
  }
  return { newStart, newEnd };
}

function getBarDatesForResize(props: any, resizing: any, deltaPx: number) {
  const pxPerDay = props.pxPerDay;
  const deltaDays = Math.round(deltaPx / pxPerDay);
  if (resizing.side === 'left') {
    let newStart = moveBusinessDays(resizing.startStart, deltaDays);
    return { newStart };
  } else {
    let newEnd = moveBusinessDays(resizing.startEnd, deltaDays);
    return { newEnd };
  }
}

// Helper to determine best text color (black or white) based on background hex
function getContrastColor(hexColor: string) {
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  return yiq >= 128 ? '#0f172a' : '#ffffff'; // slate-900 or white
}

const props = defineProps<{ assignment: Assignment; startISO: string; days?: string[]; pxPerDay: number; projectsMap: Record<string, { id:string; name:string; color?:string|null; emoji?:string|null }>; peopleMap?: Record<string, { id: string; name: string }>; top?: number }>()
const emit = defineEmits(['update', 'edit', 'delete', 'resize'])
const store = usePlannerStore()
const project = computed(() => props.projectsMap[props.assignment.project_id])
const person = computed(() => props.peopleMap?.[props.assignment.person_id])

// Check if this is a time off assignment
const isTimeOff = computed(() => props.assignment.project_id === 'TIMEOFF')

// Use semantic allocation colors
const color = computed(() => {
  if (isTimeOff.value) return undefined // Let CSS handle time off styling
  return getAllocationColor(props.assignment.allocation)
})

const textColor = computed(() => {
  if (isTimeOff.value) return '#b91c1c' // Red text for PTO
  return getAllocationTextColor(props.assignment.allocation) // White for allocation bars
})

// Project color for accent (left border)
const projectColor = computed(() => enhanceProjectColor(project.value?.color))

// Task Type Icon Heuristic
const taskIcon = computed(() => {
  if (isTimeOff.value) return 'i-lucide-calendar-off'
  
  const name = (project.value?.name || '').toLowerCase()
  if (name.includes('design') || name.includes('ux') || name.includes('ui')) return 'i-lucide-palette'
  if (name.includes('test') || name.includes('qa')) return 'i-lucide-bug'
  if (name.includes('meet') || name.includes('sync')) return 'i-lucide-users'
  if (name.includes('doc')) return 'i-lucide-file-text'
  return 'i-lucide-code-2' // Default to code/dev
})

const mainLabel = computed(() => {
  if (isTimeOff.value) return 'PTO'
  // Show project name if in person view, person name if in project view
  // But since we don't explicitly know the view mode here without props, we can infer or just show what's most useful
  // Typically: Person View -> Show Project Name
  // Project View -> Show Person Name
  // Let's use a simple heuristic: if person_id matches the row group (not passed here), it's person view.
  // For now, let's show the "other" entity.
  return project.value?.name ?? props.assignment.project_id
})

// Use first visible business day for offset calculation
const startIndex = computed(() => {
  return getStartIndex(props)
})
const lengthDays = computed(() => Math.max(1, businessDaysBetweenInclusive(props.assignment.start, props.assignment.end)))
const barStyle = computed(() => ({
  left: (startIndex.value * props.pxPerDay) + 'px',
  width: Math.max(1, lengthDays.value * props.pxPerDay) + 'px',
  top: (props.top ?? 8) + 'px',
  // Semantic allocation color
  backgroundColor: isTimeOff.value ? undefined : color.value,
  // Project color as left border accent (4px)
  borderLeft: isTimeOff.value ? undefined : `4px solid ${projectColor.value}`,
  // Subtle border for definition
  borderColor: isTimeOff.value ? undefined : 'rgba(0,0,0,0.1)'
}))

const tooltipText = computed(() => {
  const p = person.value?.name ?? props.assignment.person_id
  const proj = project.value?.name ?? props.assignment.project_id
  const dur = lengthDays.value
  return `${proj} • ${p} • ${Math.round(props.assignment.allocation * 100)}% • ${dur}d`
})

const totalManDays = computed(() => {
  const md = manDays(props.assignment.start, props.assignment.end, props.assignment.allocation)
  return Number.isInteger(md) ? md : md.toFixed(1)
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
const LEFT_SIDEBAR_WIDTH = 280  // width of the left sidebar in pixels

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
    startIndex: getStartIndex(props),
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
  const { newStart, newEnd } = getBarDatesForDrag(props, dragging, deltaPx);
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
  const deltaPx = (e.clientX - resizing.startX) + scrollDelta
  const { newStart, newEnd } = getBarDatesForResize(props, resizing, deltaPx);
  if (resizing.side === 'left') {
    const safeNewStart = newStart ?? resizing.startStart;
    if (safeNewStart <= resizing.startEnd) {
      emit('update', { id: props.assignment.id, start: safeNewStart })
    }
  } else {
    const safeNewEnd = newEnd ?? resizing.startEnd;
    if (safeNewEnd >= resizing.startStart) {
      emit('update', { id: props.assignment.id, end: safeNewEnd })
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
 
