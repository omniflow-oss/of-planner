<template>
  <div>
    <!-- Group header right track with overlay and aggregated assignments -->
    <div class="relative border-b pane-border timeline-bg" :style="{ height: headerHeight+'px' }">
      <GridOverlay :days="days" :weekStarts="weekStarts" :geometry="geometry" />
      <AssignmentBar v-for="a in headerAssignments" :key="'h_'+a.id" :assignment="a" :startISO="startISO" :pxPerDay="pxPerDay" :projectsMap="projectsMap" :top="laneTop(a._lane)" @update="onUpdate" />
    </div>

    <!-- Subrows right tracks -->
    <div v-if="expanded" v-for="sr in subrows" :key="sr.key" class="relative border-b pane-border timeline-bg" :style="{ height: rowHeights.get(sr.key)+'px' }" @click.self="onEmptyClick($event, sr)">
      <GridOverlay :days="days" :weekStarts="weekStarts" :geometry="geometry" />
      <AssignmentBar v-for="a in subAssignmentsLaned(sr)" :key="a.id" :assignment="a" :startISO="startISO" :pxPerDay="pxPerDay" :projectsMap="projectsMap" :top="laneTop(a._lane)" @update="onUpdate" />
    </div>

    <!-- Quick create popover -->
    <CreatePopover v-if="popover" :x="popover.x + 8" :y="popover.y + 8" :duration="duration" :allocation="allocation" @cancel="closePopover" @confirm="(p)=>confirmCreate(p)" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, inject } from 'vue'
import AssignmentBar from '@/components/internal/shared/AssignmentBar.vue'
import GridOverlay from '@/components/internal/shared/GridOverlay.vue'
import CreatePopover from '@/components/internal/CreatePopover.vue'
import { computeLanes } from '@/utils/lanes'
import { useTimelineGeometry } from '@/composables/useTimelineGeometry'
import { useRowHeights, type Subrow } from '@/composables/useRowHeights'
import { LANE_H, PAD_Y, ROW_MIN } from '@/utils/layout'
import { addDaysISO } from '@/composables/useDate'

const props = defineProps<{
  label: string
  groupType: 'person'|'project'
  groupId: string
  subrows: Subrow[]
  startISO: string
  days: string[]
  pxPerDay: number
  dayOffsets: number[]
  weekStarts: number[]
  projectsMap: Record<string, { id: string; name: string; color?: string|null; emoji?: string|null }>
  expanded?: boolean
}>()
const emit = defineEmits(['create','update'])

const assignmentsKey = Symbol.for('assignmentsRef')
function usePlanner() { return inject<any>(assignmentsKey)! }
const assignmentsRef = usePlanner()

const daysRef = computed(() => props.days)
const pxRef = computed(() => props.pxPerDay)
const offsetsRef = computed(() => props.dayOffsets)
const startRef = computed(() => props.startISO)

const { rowHeights } = useRowHeights(startRef, computed(()=>props.subrows), assignmentsRef)
const geometry = useTimelineGeometry(daysRef, pxRef, offsetsRef)

function laneTop(lane: number) { return PAD_Y + lane*LANE_H }
function onUpdate(payload: { id: string; start?: string; end?: string }) { emit('update', payload) }

// Header aggregated assignments for group
const headerLaneCount = ref(1)
const headerAssignments = computed(() => {
  const list = assignmentsRef.value.filter(a => (props.groupType === 'person' ? a.person_id === props.groupId : a.project_id === props.groupId))
  const { items, laneCount } = computeLanes(props.startISO, list)
  headerLaneCount.value = laneCount
  return items
})
const headerHeight = computed(() => Math.max(ROW_MIN, 16 + headerLaneCount.value*LANE_H))
const expanded = computed(() => props.expanded ?? true)

// Empty click popover
const popover = ref<{ x: number; y: number; sr: Subrow; dayISO: string } | null>(null)
const duration = ref(5)
const allocation = ref(1 as 1|0.75|0.5|0.25)
function onEmptyClick(e: MouseEvent, sr: Subrow) {
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
  const x = e.clientX - rect.left
  const { indexFromX } = useTimelineGeometry(daysRef, pxRef, offsetsRef)
  const idx = indexFromX(x)
  const start = daysRef.value[Math.max(0, Math.min(daysRef.value.length-1, idx))]
  popover.value = { x: e.clientX, y: e.clientY, sr, dayISO: start }
}
function confirmCreate(p?: { duration: number; allocation: 1|0.75|0.5|0.25 }) {
  if (!popover.value) return
  const { sr, dayISO } = popover.value
  const d = p?.duration ?? duration.value
  const a = p?.allocation ?? allocation.value
  emit('create', { person_id: sr.person_id, project_id: sr.project_id, start: dayISO, duration: d, allocation: a })
  popover.value = null
}
function closePopover() { popover.value = null }

function subAssignmentsLaned(sr: Subrow) {
  if (sr.kind === 'add') return []
  const list = assignmentsRef.value.filter(a => a.person_id === sr.person_id && a.project_id === sr.project_id)
  const { items } = computeLanes(props.startISO, list)
  return items
}

const startISO = computed(() => props.startISO)
const days = computed(() => props.days)
const pxPerDay = computed(() => props.pxPerDay)
const dayOffsets = computed(() => props.dayOffsets)
const geometryRef = computed(() => geometry)
const weekStarts = computed(() => props.weekStarts)
const projectsMap = computed(() => props.projectsMap)
</script>
