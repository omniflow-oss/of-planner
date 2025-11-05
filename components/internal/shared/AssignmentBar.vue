<template>
  <div 
    :class="[
      'absolute flex items-center overflow-hidden rounded-full bar-shadow border text-default',
      isTimeOff 
        ? 'border-gray-500 bg-gray-300 dark:bg-gray-600 dark:text-gray-100' 
        : 'border-default bg-default dark:bg-gray-300 dark:text-gray-800',
      { 
        'dragging': isDragging,
        'resizing': isResizing
      }
    ]"
    :style="barStyle"
    draggable="true"
    @dragstart="onDragStart"
    @drag="onDrag"
    @dragend="onDragEnd"
    @mousedown.self="onMouseDown"
    @contextmenu.prevent.stop="onRightClick"
  >
    <div
      v-if="!isTimeOff"
      class="h-full w-1.5"
      :style="{ background: color }"
    />
    <UTooltip :text="tooltipText">
      <div class="flex items-center gap-2 px-3 text-[12px] w-full">
        <span :class="isTimeOff ? 'text-gray-900 dark:text-gray-200' : 'dark:text-gray-700'">{{ person?.name ?? assignment.person_id }}</span>
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
      class="handle left"
      draggable="false"
      @mousedown.stop.prevent="onResizeStart('left', $event)"
    />
    <div
      class="handle right"
      draggable="false"
      @mousedown.stop.prevent="onResizeStart('right', $event)"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { addDaysISO, businessDaysBetweenInclusive, businessOffset, isWeekendISO } from '@/composables/useDate'
import { generateUserColor } from '@/utils/colors'
import type { Assignment } from '@/types/planner'

const props = defineProps<{ assignment: Assignment; startISO: string; pxPerDay: number; projectsMap: Record<string, { id:string; name:string; color?:string|null; emoji?:string|null }>; peopleMap?: Record<string, { id: string; name: string }>; top?: number }>()
const emit = defineEmits(['update', 'edit', 'delete', 'resize'])
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

const startIndex = computed(() => Math.max(0, businessOffset(props.startISO, props.assignment.start)))
const lengthDays = computed(() => Math.max(1, businessDaysBetweenInclusive(props.assignment.start, props.assignment.end)))
const barStyle = computed(() => ({
  position: 'absolute' as const,
  left: (startIndex.value * props.pxPerDay) + 'px',
  width: Math.max(1, lengthDays.value * props.pxPerDay - 2) + 'px',
  top: (props.top ?? 8) + 'px',
  height: '30px'
}))

// Man-days badge
const md = computed(() => lengthDays.value * props.assignment.allocation)
const mdBadge = computed(() => {
  const val = md.value
  return Number.isInteger(val) ? `${val}d` : `${Math.round(val * 10) / 10}d`
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
let dragging: { startX: number; startIndex: number; initialStart: string; initialEnd: string } | null = null
let resizing: { side: 'left'|'right'; startX: number; startStart: string; startEnd: string } | null = null

function onDragStart(e: DragEvent) {
  // Prevent drag when resizing is active
  if (resizing) {
    e.preventDefault()
    return
  }
  
  isDragging.value = true
  dragging = { 
    startX: e.clientX, 
    startIndex: startIndex.value,
    initialStart: props.assignment.start,
    initialEnd: props.assignment.end
  }
  
  // Set drag effect and create a transparent drag image
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', '')
    
    // Create invisible drag image to prevent default ghost
    const dragImage = document.createElement('div')
    dragImage.style.opacity = '0'
    document.body.appendChild(dragImage)
    e.dataTransfer.setDragImage(dragImage, 0, 0)
    setTimeout(() => document.body.removeChild(dragImage), 0)
  }
}

function applyDragByClientX(clientX: number) {
  if (!dragging || clientX === 0) return
  const deltaPx = clientX - dragging.startX
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

function onDrag(e: DragEvent) {
  applyDragByClientX((e as any).clientX)
}

function onDragEnd(_e: DragEvent) {
  isDragging.value = false
  dragging = null
}

// Mouse-based drag (for environments/tests not using HTML5 drag)
function onMouseDown(e: MouseEvent) {
  // Ignore when resizing is active or when clicking on resize handles
  if (resizing) return
  
  isDragging.value = true
  dragging = {
    startX: e.clientX,
    startIndex: startIndex.value,
    initialStart: props.assignment.start,
    initialEnd: props.assignment.end,
  }
  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('mouseup', onMouseUp)
}
function onMouseMove(e: MouseEvent) {
  applyDragByClientX(e.clientX)
}
function onMouseUp() {
  onDragEnd({} as DragEvent)
  window.removeEventListener('mousemove', onMouseMove)
  window.removeEventListener('mouseup', onMouseUp)
}

function onResizeStart(side: 'left'|'right', e: MouseEvent) {
  // Prevent drag from interfering with resize
  isDragging.value = false
  isResizing.value = true
  if (dragging) dragging = null
  
  resizing = { side, startX: e.clientX, startStart: props.assignment.start, startEnd: props.assignment.end }
  window.addEventListener('mousemove', onResize)
  window.addEventListener('mouseup', onResizeEnd)
}

function onResize(e: MouseEvent) {
  emit('resize', true);
  if (!resizing) return
  
  const deltaPx = e.clientX - resizing.startX
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
  window.removeEventListener('mousemove', onResize)
  window.removeEventListener('mouseup', onResizeEnd)
  onResizeEndEvent();
}

function onRightClick(e: MouseEvent) {
  emit('edit', { 
    assignment: props.assignment, 
    x: e.clientX, 
    y: e.clientY 
  })
}
</script>

<style scoped>
.handle { 
  position: absolute; 
  top: 0; 
  width: 8px; 
  min-width: 8px;
  height: 100%; 
  background: transparent; 
  cursor: ew-resize; 
  z-index: 10;
  border-radius: 4px;
  transition: background-color 0.2s ease, border 0.2s ease;
}

.handle:hover {
  background: rgba(59, 130, 246, 0.2);
  border: 1px solid rgba(59, 130, 246, 0.4);
}

.left { left: -2px; }
.right { right: -2px; }

/* Dragging and resizing states */
.dragging {
  opacity: 0.7;
  transform: rotate(2deg);
  box-shadow: 0 8px 25px -5px rgba(0, 0, 0, 0.2);
  z-index: 1000;
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
div[draggable="true"] {
  cursor: move;
}

div[draggable="true"]:hover {
  box-shadow: 0 4px 12px -2px rgba(0, 0, 0, 0.1);
}

/* Prevent drag on resize handles */
.handle[draggable="false"] {
  cursor: ew-resize;
}
</style>
 
