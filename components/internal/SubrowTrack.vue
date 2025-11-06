<template>
  <div
    class="grid border-b pane-border drag-row"
    style="grid-template-columns: 240px 1fr;"
  >
    <!-- Left: label -->
    <div class=" border-r-2 pane-border sticky left-0 z-10 bg-default">
      <div class="flex items-center h-full px-3 pl-7 py-2 text-sm text-default">
        <!-- Drag handle -->
        <UIcon
          name="i-lucide-grip-vertical"
          class="drag-handle mr-2 size-3"
          :class="subrow.isTimeOff 
            ? 'invisible cursor-not-allowed opacity-50'
            : 'text-slate-400 cursor-grab hover:text-slate-600'"
        />
        <UIcon
          :name="subrow.isTimeOff ? 'i-lucide-calendar-x' : (groupType === 'person' ? 'i-lucide-briefcase' : 'i-lucide-user')"
          :class="subrow.isTimeOff ? 'mr-2 text-orange-400 size-3' : 'mr-2 text-slate-400 size-3'"
        />
        <div :class="subrow.isTimeOff ? 'truncate font-medium text-orange-400 dark:text-orange-400' : 'truncate font-medium text-slate-500 dark:text-gray-500'">
          {{ subrow.label }}
        </div>
      </div>
    </div>

    <!-- Right: timeline track -->
    <div
      class="relative "
      :class="{'bg-violet-100/60 dark:bg-violet-50/10': subrow.isTimeOff,'timeline-bg':!subrow.isTimeOff}"
      :style="{ height: (rowHeights[subrow.key] || baseRowMin) + 'px' }"
      :data-row-key="subrow.key"
      @contextmenu="$emit('context-menu', $event, subrow)"
      @mousedown="$emit('mouse-down', $event, subrow)"
      @mousemove="$emit('mouse-move', $event, subrow)"
      @mouseup="$emit('mouse-up', $event, subrow)"
      @dragstart="$emit('drag-start')"
    >
      <GridOverlay
        :days="days"
        :px-per-day="pxPerDay"
        :offsets="dayOffsets"
        :week-starts="weekStarts"
      />
      <!-- Timeoff background overlays for this specific user (project view only) -->
      <template
        v-if="groupType === 'project'"
        v-for="(day, i) in days"
        :key="'timeoff-sub' + i"
      >
        <div
          v-if="hasUserTimeoffOnDay(subrow.person_id, day)"
          class="absolute inset-y-0 timeoff-hashed"
          :style="{ left: lineLeft(i) + 'px', width: dayWidth(i) + 'px' }"
        />
      </template>
      <AssignmentBar
        v-for="a in subAssignments"
        :key="a.id"
        :assignment="a"
        :start-i-s-o="startISO"
        :px-per-day="pxPerDay"
        :projects-map="projectsMap"
        :people-map="peopleMap"
        :top="laneTop(a._lane)"
        @update="$emit('update', $event)"
        @edit="$emit('edit', $event)"
        @resize="$emit('resize', $event)"
      />
      
      <!-- Drag-to-create preview bar -->
      <div
        v-if="dragState.active && dragState.rowKey === subrow.key"
        class="absolute bg-blue-500/30 border border-blue-500 rounded-sm pointer-events-none"
        :style="{
          left: dragState.previewLeft + 'px',
          top: '10px',
          width: dragState.previewWidth + 'px',
          height: '28px'
        }"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import AssignmentBar from '@/components/internal/shared/AssignmentBar.vue'
import GridOverlay from '@/components/internal/shared/GridOverlay.vue'
import { computeLanes } from '@/utils/lanes'

interface SubrowItem {
  key: string
  label: string
  person_id: string | null
  project_id: string | null
  isTimeOff?: boolean
}

interface DragState {
  active: boolean
  rowKey: string
  previewLeft: number
  previewWidth: number
}

const props = defineProps<{
  subrow: SubrowItem
  groupType: 'person' | 'project'
  days: string[]
  pxPerDay: number
  dayOffsets: number[]
  weekStarts: number[]
  startISO: string
  projectsMap: Record<string, { id: string; name: string; color?: string | null; emoji?: string | null }>
  peopleMap?: Record<string, { id: string; name: string }>
  assignments: any[]
  rowHeights: Record<string, number>
  baseRowMin: number
  dragState: DragState
  lineLeft: (i: number) => number
  dayWidth: (i: number) => number
  hasUserTimeoffOnDay: (personId: string | null, dayISO: string) => boolean
}>()

const emit = defineEmits<{
  'context-menu': [event: MouseEvent, subrow: SubrowItem]
  'mouse-down': [event: MouseEvent, subrow: SubrowItem]
  'mouse-move': [event: MouseEvent, subrow: SubrowItem]
  'mouse-up': [event: MouseEvent, subrow: SubrowItem]
  'drag-start': []
  'update': [payload: any]
  'edit': [payload: any]
  'resize': [event: any]
  'height-updated': [key: string, height: number]
}>()

const subAssignments = computed(() => {
  // Filter assignments for this specific subrow
  const list = props.assignments.filter((a: any) => 
    a.person_id === props.subrow.person_id && a.project_id === props.subrow.project_id
  )
  
  const { items, laneCount } = computeLanes(props.startISO, list)
  const laneHeight = 30
  const padding = 10
  const totalH = padding * 2 + laneCount * laneHeight
  const newHeight = Math.max(props.baseRowMin, totalH)
  
  // Emit height update if it changed
  if (props.rowHeights[props.subrow.key] !== newHeight) {
    emit('height-updated', props.subrow.key, newHeight)
  }
  
  return items
})

function laneTop(lane: number) { 
  const padding = 10
  const laneHeight = 30
  return padding + lane * laneHeight 
}
</script>

<style scoped>
.timeoff-hashed {
  background-image: repeating-linear-gradient(
    45deg,
    rgba(156, 163, 175, 0.15) 0px,
    rgba(156, 163, 175, 0.15) 4px,
    transparent 4px,
    transparent 8px
  );
}

.dark .timeoff-hashed {
  background-image: repeating-linear-gradient(
    45deg,
    rgba(75, 85, 99, 0.4) 0px,
    rgba(75, 85, 99, 0.4) 4px,
    transparent 4px,
    transparent 8px
  );
}

.drag-row {
  background-color: var(--background-color-default);
}
</style>