<template>
  <div
    class="grid border-b pane-border drag-row"
    style="grid-template-columns: 240px 1fr;"
  >
    <!-- Left: label -->
    <div class=" border-r-2 pane-border sticky left-0 z-10 bg-default left-label">
      <div class="flex items-center h-full px-3 pl-7 py-2 text-sm text-default">
        <!-- Drag handle -->
        <div 
          v-if="!store.isReadOnly"
          class="my-auto"
        >
          <UIcon
            name="i-lucide-grip-vertical"
            class="drag-handle mr-2 size-3"
            :class="subrow.isTimeOff 
              ? 'invisible cursor-not-allowed opacity-50'
              : 'text-slate-400 cursor-grab hover:text-slate-600'"
          />
        </div>
        <div class="my-auto">
          <UIcon
            :name="subrow.isTimeOff ? 'i-lucide-calendar-x' : (groupType === 'person' ? 'i-lucide-briefcase' : 'i-lucide-user')"
            :class="subrow.isTimeOff ? 'mr-2 text-blue-600 size-3' : 'mr-2 text-slate-400 size-3'"
          />
        </div>
        <div class="flex items-center gap-2 w-full">
          <div
            class="line-clamp-2"
            :class="[
              subrow.isTimeOff 
                ? 'font-medium text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded-md' 
                : 'font-medium text-slate-500 dark:text-gray-500',
              // Make project names clickable in person view (when we have a project_id and are showing project names)
              groupType === 'person' && subrow.project_id && !subrow.isTimeOff 
                ? 'cursor-pointer hover:text-blue-600 hover:underline transition-colors' 
                : '',
              // Make person names clickable in project view (when we have a person_id and are showing person names)
              groupType === 'project' && subrow.person_id && !subrow.isTimeOff 
                ? 'cursor-pointer hover:text-green-600 hover:underline transition-colors' 
                : ''
            ]"
            @click="handleLabelClick"
          >
            {{ subrow.label }}
          </div>
          
          <!-- Notification circle for project time tracking (only in people view) -->
          <div
            v-if="notificationStatus"
            class="flex-shrink-0 w-2 h-2 rounded-full"
            :class="{
              'bg-red-500': notificationStatus.color === 'red',
              'bg-orange-500': notificationStatus.color === 'orange'
            }"
            :title="notificationStatus.color === 'red' 
              ? `Project is overdue by ${Math.abs(notificationStatus.remaining)} days` 
              : `Project has ${notificationStatus.remaining} days remaining`"
          />
        </div>
      </div>
    </div>

    <!-- Right: timeline track -->
    <div
      class="relative min-h-full"
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
        v-for="(day, i) in days"
        :key="'timeoff-sub' + i"
      >
        <div
          v-if="hasUserTimeoffOnDay(subrow.person_id, day) && groupType === 'project'"
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
import { useProjectEstimation } from '@/composables/useProjectEstimation'
import { usePlannerStore } from '@/stores/usePlannerStore'

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
  projectsMap: Record<string, { id: string; name: string; color?: string | null; emoji?: string | null; estimatedDays?: number | null }>
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
  'project-click': [projectId: string]
  'person-click': [personId: string]
}>()

const store = usePlannerStore()

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

// Project estimation composable
const assignmentsRef = computed(() => props.assignments)
const projectsMapRef = computed(() => props.projectsMap)
const projectEstimation = useProjectEstimation(assignmentsRef, projectsMapRef)

// Calculate notification status for project time tracking
const notificationStatus = computed(() => {
  if (props.groupType !== 'person' || !props.subrow.project_id || props.subrow.isTimeOff) {
    return null
  }
  
  return projectEstimation.getProjectNotificationStatus(props.subrow.project_id)
})

function laneTop(lane: number) { 
  const padding = 10
  const laneHeight = 30
  return padding + lane * laneHeight 
}

// Handle click on label - emit project-click or person-click based on view mode
function handleLabelClick() {
  // Emit project-click if we're in person view, have a project_id, and it's not time off
  if (props.groupType === 'person' && props.subrow.project_id && !props.subrow.isTimeOff) {
    emit('project-click', props.subrow.project_id)
  }
  // Emit person-click if we're in project view, have a person_id, and it's not time off
  else if (props.groupType === 'project' && props.subrow.person_id && !props.subrow.isTimeOff) {
    emit('person-click', props.subrow.person_id)
  }
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