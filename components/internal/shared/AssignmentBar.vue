<template>
  <div 
    class="absolute flex items-center overflow-hidden rounded-full bar-shadow border border-slate-200 bg-white" 
    :style="barStyle" 
    @mousedown.stop="onDragStart"
    @contextmenu.prevent.stop="onRightClick"
    @touchstart="onTouchStart"
    @touchend="onTouchEnd"
  >
    <div class="h-full w-1.5" :style="{ background: color }"></div>
    <div class="flex items-center gap-2 px-3 text-[12px] text-slate-800">
      <span>{{ project?.name ?? assignment.project_id }}</span>
      <span class="px-1.5 rounded-full border border-slate-200 bg-white/80 text-[11px]">{{ allocBadge }}</span>
    </div>
    <div class="handle left" @mousedown.stop.prevent="onResizeStart('left', $event)"></div>
    <div class="handle right" @mousedown.stop.prevent="onResizeStart('right', $event)"></div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { daysBetweenInclusive, parseISO, addDaysISO, toISO, businessDaysBetweenInclusive, businessOffset } from '@/composables/useDate'
import type { Assignment } from '@/types/planner'

const props = defineProps<{ assignment: Assignment; startISO: string; pxPerDay: number; projectsMap: Record<string, { id:string; name:string; color?:string|null; emoji?:string|null }>; top?: number }>()
const emit = defineEmits(['update', 'edit', 'delete', 'resize'])

const project = computed(() => props.projectsMap[props.assignment.project_id])
const color = computed(() => project.value?.color ?? '#3a84ff')
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
  height: '30px',
  background: '#f9fafb'
}))

let dragging: { startX: number; startIndex: number } | null = null
let resizing: { side: 'left'|'right'; startX: number; startStart: string; startEnd: string } | null = null

function onDragStart(e: MouseEvent) {
  dragging = { startX: e.clientX, startIndex: startIndex.value }
  window.addEventListener('mousemove', onDrag)
  window.addEventListener('mouseup', onDragEnd)
}
function onDrag(e: MouseEvent) {
  if (!dragging) return
  const deltaPx = e.clientX - dragging.startX
  const deltaDays = Math.round(deltaPx / props.pxPerDay)
  const newStart = addDaysISO(props.startISO, dragging.startIndex + deltaDays)
  const len = daysBetweenInclusive(props.assignment.start, props.assignment.end)
  const newEnd = addDaysISO(newStart, len - 1)
  emit('update', { id: props.assignment.id, start: newStart, end: newEnd })
}
function onDragEnd() {
  dragging = null
  window.removeEventListener('mousemove', onDrag)
  window.removeEventListener('mouseup', onDragEnd)
}

function onResizeStart(side: 'left'|'right', e: MouseEvent) {
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
    const newStart = addDaysISO(resizing.startStart, deltaDays)
    emit('update', { id: props.assignment.id, start: newStart })
  } else {
    const newEnd = addDaysISO(resizing.startEnd, deltaDays)
    emit('update', { id: props.assignment.id, end: newEnd })
  }
}
function onResizeEndEvent() {  
  setTimeout(() => {
    emit('resize', false);
  }, 0);
}

function onResizeEnd() {  
  resizing = null
  window.removeEventListener('mousemove', onResize)
  window.removeEventListener('mouseup', onResizeEnd)
  onResizeEndEvent();
}

// Touch and context menu handling for edit popover
let touchStartTime = 0
let touchCount = 0
let touchTimeout: number | null = null

function onRightClick(e: MouseEvent) {
  emit('edit', { 
    assignment: props.assignment, 
    x: e.clientX, 
    y: e.clientY 
  })
}

function onTouchStart(e: TouchEvent) {
  touchStartTime = Date.now()
  touchCount++
  
  if (touchTimeout) {
    clearTimeout(touchTimeout)
    touchTimeout = null
  }
  
  if (touchCount === 1) {
    // Start timeout for double-touch detection
    touchTimeout = window.setTimeout(() => {
      touchCount = 0
    }, 300)
  } else if (touchCount === 2) {
    // Double touch detected
    touchCount = 0
    if (touchTimeout) {
      clearTimeout(touchTimeout)
      touchTimeout = null
    }
    
    const touch = e.touches[0] || e.changedTouches[0]
    emit('edit', { 
      assignment: props.assignment, 
      x: touch.clientX, 
      y: touch.clientY 
    })
    e.preventDefault()
  }
}

function onTouchEnd(e: TouchEvent) {
  // Reset if touch was too long (not a tap)
  const touchDuration = Date.now() - touchStartTime
  if (touchDuration > 300) {
    touchCount = 0
    if (touchTimeout) {
      clearTimeout(touchTimeout)
      touchTimeout = null
    }
  }
}
</script>

<style scoped>
.handle { position:absolute; top:0; width:8px; height:100%; background: transparent; cursor: ew-resize; }
.left { left: -2px; }
.right { right: -2px; }
</style>
