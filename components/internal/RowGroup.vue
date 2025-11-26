<template>
  <div
    class="grid rows-group relative z-2 drag-group-row"
    style="-webkit-user-select: none; user-select: none;"  
    draggable="false"
    :data-group-id="groupId"
  >
    <!-- Group Header Component -->
    <RowGroupHeader
      :label="label"
      :group-type="groupType"
      :group-id="groupId"
      :expanded="expanded"
      :days="days"
      :px-per-day="pxPerDay"
      :day-offsets="dayOffsets"
      :week-starts="weekStarts"
      :header-height="headerHeight"
      :capacity-daily="capacityDaily"
      :total-m-d-badge="totalMDBadge"
      :badge-color="badgeColor"
      :line-left="lineLeft"
      :day-width="dayWidth"
      :readonly="readonly"
      :coverage-class="coverageClass"
      :assignments-options="assignmentsOptions"
      :assignments="assignments"      
      @toggle-expanded="()=> { expanded = !expanded, $emit('collapse-toggle-row') }"
      @add-click="(payload) => handleAddClick(payload?.selectedId)"
      @create-popover="(p) => { 
        emit(p?.newItem === 'person'?'open-new-person':'open-new-project')
      }"
      @edit-person="handleEditPerson"
      @edit-project="handleEditProject"
    />   
    <!-- Subrows Container -->
    <div class="draggable-container">
      <VueDraggableNext
        v-if="expanded"
        :list="sorting.sortableSubrows.value"
        item-key="key"
        handle=".drag-handle"
        tag="div"
        @end="sorting.onSortEnd"
      >
        <SubrowTrack
          v-for="sr in sorting.sortableSubrows.value"
          :key="sr.key"
          :subrow="sr"
          :group-type="groupType"
          :readonly="readonly"
          :days="days"
          :px-per-day="pxPerDay"
          :day-offsets="dayOffsets"
          :week-starts="weekStarts"
          :start-iso="startIso"
          :projects-map="projectsMap"
          :people-map="peopleMap"
          :assignments="assignmentsRef"
          :row-heights="rowHeights"
          :base-row-min="baseRowMin"
          :drag-state="dragToCreate.dragState.value"
          :line-left="lineLeft"
          :day-width="dayWidth"
          :has-user-timeoff-on-day="hasUserTimeoffOnDay"
          @context-menu="handleContextMenu"
          @mouse-down="handleMouseDown"
          @mouse-move="handleMouseMove"
          @mouse-up="handleMouseUp"
          @update="onUpdate"
          @edit="onEdit"
          @resize="(e: any) => onResizeEvent = e"
          @height-updated="updateRowHeight"
          @project-click="(projectId: string) => emit('project-click', projectId)"
          @person-click="(personId: string) => emit('person-click', personId)"
        />
      </VueDraggableNext>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { VueDraggableNext } from 'vue-draggable-next'
import { useTimelineGrid } from '@/composables/useTimeline'
import { indexFromX } from '@/utils/grid'
import { useCapacity } from '@/composables/useCapacity'
import { useRowSorting } from '@/composables/useRowSorting'
import { useDragToCreate } from '@/composables/useDragToCreate'
import { useProjectEstimation, roundToDecimalPlaces } from '@/composables/useProjectEstimation'
import RowGroupHeader from '@/components/internal/RowGroupHeader.vue'
import SubrowTrack from '@/components/internal/SubrowTrack.vue'
import type { Person, Project, Assignment } from '@/types/planner'

const props = defineProps<{
  label: string
  groupType: 'person' | 'project'
  groupId: string
  subrows: { key: string; label: string; person_id: string | null; project_id: string | null; isTimeOff?: boolean }[]
  startIso: string
  days: string[]
  pxPerDay: number
  projectsMap: Record<string, Project>
  peopleMap: Record<string, Person>
  readonly: boolean,
  assignments: Assignment[] 
  assignmentsOptions: Array<Project | Person>
}>()

const emit = defineEmits(['create', 'update', 'createFromSidebar', 'edit', 'createPopover', 'edit-project', 'edit-person', 'project-click', 'person-click', 'open-new-project', 'open-new-person', 'collapse-toggle-row'])

// Reactive references
const pxPerDay = computed(() => props.pxPerDay)
const days = computed(() => props.days)
const startIso = computed(() => props.startIso)
const groupId = computed(() => props.groupId)
const subrows = computed(() => props.subrows)

// Grid layout composable
const { dayOffsets, weekStarts } = useTimelineGrid(days, pxPerDay)
function lineLeft(i: number) { return dayOffsets.value[i] ?? i * pxPerDay.value }
function dayWidth(i: number) { 
  const next = dayOffsets.value[i + 1] ?? (lineLeft(i) + pxPerDay.value)
  return Math.max(0, next - lineLeft(i)) 
}

const rowHeights = ref<Record<string, number>>({})
const baseRowMin = 36
const expanded = ref(true)
const onResizeEvent = ref(false)

// Row sorting composable
const sorting = useRowSorting(groupId, subrows)

// Drag-to-create composable
const dragToCreate = useDragToCreate(days, pxPerDay, dayOffsets, startIso, sorting.filteredSubrows, onResizeEvent)

// Event handlers
function onUpdate(payload: { id: string; start?: string; end?: string }) { 
  emit('update', payload) 
}

function onEdit(payload: { assignment: any; x: number; y: number }) { 
  emit('edit', payload) 
}

function updateRowHeight(key: string, height: number) {
  rowHeights.value[key] = height
}

// Handle the + button click in the header
function handleAddClick(selectedId?: string | null) {
  if (props.readonly) return

  const addRowData: any = {
    key: `${props.groupId}:__add__`,
    label: props.groupType === 'person' ? 'Assign project' : 'Add person',
    person_id: props.groupType === 'person' ? props.groupId : selectedId,
    project_id: props.groupType === 'project' ? props.groupId : selectedId
  }

  emit('createFromSidebar', addRowData)
}

// Handle the edit project button click
function handleEditProject() {
  if (props.groupType === 'project') {
    emit('edit-project', props.groupId)
  }
}

// Handle the edit person button click
function handleEditPerson() {
  if (props.groupType === 'person') {
    emit('edit-person', props.groupId)
  }
}

// Mouse event handlers - delegate to composable
function handleMouseDown(e: MouseEvent, sr: any) {
  if (props.readonly) return
  dragToCreate.handleMouseDown(e, sr)
}

function handleMouseUp(e: MouseEvent, sr: any) {
  if (props.readonly) return
  const result = dragToCreate.handleMouseUp(e, sr)
  if ('success' in result && result.success && result.assignment) {
    emit('create', result.assignment)
  }
}

function handleMouseMove(e: MouseEvent, sr: any) {
  if (props.readonly) return
  dragToCreate.updateDragCreate(e, sr)
}

function handleContextMenu(e: MouseEvent, sr: any) {
  if (props.readonly) return
  const shouldShowPopover = dragToCreate.handleContextMenu(e)
  if (shouldShowPopover) {
    onEmptyClick(e, sr)
  }
}

// Empty click to show create popover (now handled by Timeline.vue)
function onEmptyClick(e: MouseEvent, sr: any) {
  if (onResizeEvent.value || props.readonly) {
    return
  }
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
  const x = e.clientX - rect.left
  const idx = indexFromX(x, dayOffsets.value, pxPerDay.value, days.value.length)
  const start = days.value[idx]
  emit('createPopover', { 
    key: sr.key, 
    x: e.clientX, 
    y: e.clientY, 
    dayISO: start, 
    person_id: sr.person_id, 
    project_id: sr.project_id 
  })
}

// Get assignments reference for children
const assignmentsKey = Symbol.for('assignmentsRef')
function usePlanner() { return inject<any>(assignmentsKey)! }
const assignmentsRef = usePlanner()

// Expand/Collapse all controls
const rowGroupControls = inject<{ expandAllToken: Ref<number>; collapseAllToken: Ref<number> } | null>('rowGroupControls', null)
if (rowGroupControls) {
  watch(() => rowGroupControls.expandAllToken.value, (v) => { if (v) expanded.value = true })
  watch(() => rowGroupControls.collapseAllToken.value, (v) => { if (v) expanded.value = false })
}

// Keep main (header) row height fixed regardless of subrow lanes
const headerHeight = computed(() => baseRowMin)

// Capacity per group in visible window (header overlays and total MD badge)
const capacityApi = useCapacity(assignmentsRef, days, { type: props.groupType, id: props.groupId })

// Project estimation composable
const projectsMapRef = computed(() => props.projectsMap)
const projectEstimation = useProjectEstimation(assignmentsRef, projectsMapRef)
const capacityDaily = computed(() => capacityApi.daily.value)
const totalMD = computed(() => capacityApi.totalMD.value)
const totalMDBadge = computed(() => {
  // For project view, use the project estimation composable
  if (props.groupType === 'project') {
    return projectEstimation.formatProjectBadgeText(props.groupId)
  }
  
  // For person view, use the existing capacity calculation
  const val = totalMD.value
  const currentTotal = Number.isInteger(val) ? `${val}` : `${roundToDecimalPlaces(val)}`
  return `${currentTotal}d`
})

const badgeColor = computed(() => {
  // Only apply color logic for project view
  if (props.groupType !== 'project') {
    return 'neutral'
  }
  
  return projectEstimation.getProjectBadgeColor(props.groupId)

})

function coverageClass(i: number) {
  const v = capacityDaily.value[i] || 0
  
  if (props.groupType === 'project') {
    // For project view: uniform blue background for any capacity events
    if (v > 0) return 'bg-blue-500/15 dark:bg-blue-900/50'
    return ''
  } else {
    // For person view: original color logic
    if (v > 1) return 'bg-red-500/15 dark:bg-red-900/50'
    if (Math.abs(v - 1) < 1e-6) return 'bg-green-500/15 dark:bg-green-900/60'
    if (v > 0) return 'bg-amber-400/15 dark:bg-amber-400/50'
    return ''
  }
}

// Check if a specific user has timeoff on a specific day
function hasUserTimeoffOnDay(personId: string | null, dayISO: string) {
  if (!personId) return false
  
  // Check if this specific user has timeoff assignment on this day
  return assignmentsRef.value.some((a: any) => 
    a.project_id === 'TIMEOFF' && 
    a.person_id === personId &&
    dayISO >= a.start && 
    dayISO <= a.end
  )
}

// Global mouse handlers from drag-to-create composable
const { handleGlobalMouseUp, handleGlobalMouseMove } = dragToCreate.createGlobalMouseHandlers()

// Setup global listeners
onMounted(() => {
  document.addEventListener('mouseup', handleGlobalMouseUp)
  document.addEventListener('mousemove', handleGlobalMouseMove)
})

// Cleanup on unmount
onUnmounted(() => {
  dragToCreate.cleanup()
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

.drag-group-row:last-child{
  margin-bottom: 56px;
}

</style>
