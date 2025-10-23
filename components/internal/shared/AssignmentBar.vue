<template>
  <div class="absolute flex items-center overflow-hidden rounded-md bar-shadow border border-slate-200 bg-white/80" :style="barStyle" @mousedown.stop="onDragStart">
    <div class="h-full w-1" :style="{ background: color }"></div>
    <div class="flex items-center gap-1.5 px-2 text-[11px] text-slate-800">
      <span>{{ project?.name ?? assignment.project_id }}</span>
      <span class="px-1 rounded border border-slate-200 bg-white/70">{{ allocBadge }}</span>
    </div>
    <div class="handle left" @mousedown.stop.prevent="onResizeStart('left', $event)"></div>
    <div class="handle right" @mousedown.stop.prevent="onResizeStart('right', $event)"></div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { daysBetweenInclusive, parseISO, addDaysISO, toISO } from '@/composables/useDate'
import type { Assignment } from '@/types/planner'

const props = defineProps<{ assignment: Assignment; startISO: string; pxPerDay: number; projectsMap: Record<string, { id:string; name:string; color?:string|null; emoji?:string|null }>; top?: number }>()
const emit = defineEmits(['update'])

const project = computed(() => props.projectsMap[props.assignment.project_id])
const color = computed(() => project.value?.color ?? '#3a84ff')
const allocBadge = computed(() => {
  const a = props.assignment.allocation
  return a === 1 ? '1' : a === 0.75 ? '¾' : a === 0.5 ? '½' : '¼'
})

const startIndex = computed(() => Math.max(0, Math.round((parseISO(props.assignment.start).getTime() - parseISO(props.startISO).getTime()) / 86400000)))
const lengthDays = computed(() => daysBetweenInclusive(props.assignment.start, props.assignment.end))
const barStyle = computed(() => ({
  position: 'absolute',
  left: (startIndex.value * props.pxPerDay) + 'px',
  width: Math.max(1, lengthDays.value * props.pxPerDay - 2) + 'px',
  top: (props.top ?? 8) + 'px',
  height: '28px',
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
function onResizeEnd() {
  resizing = null
  window.removeEventListener('mousemove', onResize)
  window.removeEventListener('mouseup', onResizeEnd)
}
</script>

<style scoped>
.handle { position:absolute; top:0; width:8px; height:100%; background: transparent; cursor: ew-resize; }
.left { left: -2px; }
.right { right: -2px; }
</style>
