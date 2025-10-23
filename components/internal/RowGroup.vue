<template>
  <div class="grid" style="grid-template-columns: 240px 1fr;">
    <!-- Group header row -->
    <div class="px-3 py-2 border-b pane-border font-medium flex items-center gap-2 sticky left-0 z-10 bg-white">
      <button class="w-5 h-5 grid place-items-center rounded border border-slate-200 text-slate-600 hover:bg-slate-50" @click="expanded = !expanded">{{ expanded ? '–' : '+' }}</button>
      <span>{{ label }}</span>
    </div>
    <div class="relative border-b pane-border timeline-bg" :style="{ height: headerHeight+'px' }">
      <!-- background bands using computed offsets/widths -->
      <div v-for="(day, i) in days" :key="'hb'+i" class="day-bg" :style="{ left: lineLeft(i)+'px', width: dayWidth(i)+'px' }" />
      <div v-for="(day, i) in days" :key="'h'+i" :class="['grid-v', (isWeekStart(i)?'week':'')]" :style="{ left: lineLeft(i)+'px' }" />
      <div v-if="todayIndex>=0 && todayIndex<days.length" class="today-line" :style="{ left: (todayIndex*pxPerDay)+'px' }" />
      <AssignmentBar v-for="a in headerAssignments" :key="'h_'+a.id" :assignment="a" :startISO="startISO" :pxPerDay="pxPerDay" :projectsMap="projectsMap" :top="laneTop(a._lane)" @update="onUpdate" />
    </div>

    <!-- Subrows -->
    <template v-if="expanded" v-for="sr in subrows" :key="sr.key">
      <!-- Left: label and add button -->
      <div class="flex items-center gap-2 px-3 text-xs border-b pane-border sticky left-0 z-10 bg-white" :style="{ height: rowHeights.get(sr.key)+'px' }">
        <template v-if="isAddRow(sr)">
          <button class="w-6 h-6 grid place-items-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50" @click="$emit('createFromSidebar', sr)">+</button>
          <span class="text-slate-500">{{ cleanAddLabel(sr.label) }}</span>
        </template>
        <template v-else>
          <span>{{ sr.label }}</span>
        </template>
      </div>

      <!-- Right: timeline track -->
      <div class="relative border-b pane-border timeline-bg" :style="{ height: rowHeights.get(sr.key)+'px' }" @click.self="onEmptyClick($event, sr)">
        <!-- background bands using computed offsets/widths -->
        <div v-for="(day, i) in days" :key="'b'+sr.key+i" class="day-bg" :style="{ left: lineLeft(i)+'px', width: dayWidth(i)+'px' }" />
        <div v-for="(day, i) in days" :key="day + i" :class="['grid-v', (isWeekStart(i)?'week':'')]" :style="{ left: lineLeft(i)+'px' }" />
        <div v-if="todayIndex>=0 && todayIndex<days.length" class="today-line" :style="{ left: (todayIndex*pxPerDay)+'px' }" />
        <AssignmentBar v-for="a in subAssignmentsLaned(sr)" :key="a.id" :assignment="a" :startISO="startISO" :pxPerDay="pxPerDay" :projectsMap="projectsMap" :top="laneTop(a._lane)" @update="onUpdate" />

        <!-- Quick create popover -->
        <div v-if="popover && popover.key===sr.key" :style="popoverStyle" class="z-20">
          <div class="bg-white border border-slate-200 rounded-md p-3 shadow-md w-56">
            <div class="flex items-center justify-between text-xs text-slate-500">
              <div>Quick create</div>
              <button class="px-2 py-1 border border-slate-200 rounded" @click.stop="closePopover">✕</button>
            </div>
            <div class="mt-2 flex items-center gap-2 text-sm">
              <label class="w-20 text-slate-500">Durée</label>
              <input class="px-2 py-1 border border-slate-200 rounded w-full" type="number" v-model.number="duration" min="1" />
            </div>
            <div class="mt-2 flex items-center gap-2 text-sm">
              <label class="w-20 text-slate-500">Allocation</label>
              <select class="px-2 py-1 border border-slate-200 rounded w-full" v-model.number="allocation">
                <option :value="1">1</option>
                <option :value="0.75">0.75</option>
                <option :value="0.5">0.5</option>
                <option :value="0.25">0.25</option>
              </select>
            </div>
            <div class="mt-3 flex justify-end gap-2">
              <button class="px-2 py-1 text-sm border border-slate-200 rounded" @click.stop="closePopover">Cancel</button>
              <button class="px-2 py-1 text-sm bg-slate-900 text-white rounded" @click.stop="confirmCreate(sr)">Create</button>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import AssignmentBar from '@/components/internal/shared/AssignmentBar.vue'
import { addDaysISO, parseISO } from '@/composables/useDate'
import { computeLanes } from '@/utils/lanes'

const props = defineProps<{
  label: string
  groupType: 'person'|'project'
  groupId: string
  subrows: { key: string; label: string; person_id: string|null; project_id: string|null }[]
  startISO: string
  days: string[]
  pxPerDay: number
  projectsMap: Record<string, { id: string; name: string; color?: string|null; emoji?: string|null }>
}>()
const emit = defineEmits(['create','update','createFromSidebar'])

const pxPerDay = computed(() => props.pxPerDay)
const days = computed(() => props.days)
const offsets = computed(() => (props as any).dayOffsets as number[] | undefined)
function lineLeft(i:number){
  if (offsets.value && i < offsets.value.length) return offsets.value[i]
  return i*pxPerDay.value
}
function dayWidth(i:number){
  if (offsets.value){ const next = offsets.value[i+1] ?? (offsets.value[i] + pxPerDay.value); return Math.max(0, next - offsets.value[i]) }
  return pxPerDay.value
}
const weekStartSet = computed(() => new Set(((props as any).weekStarts as number[] | undefined) ?? []))
function isWeekStart(i:number){ return weekStartSet.value.has(i) }
const startISO = computed(() => props.startISO)
const rowHeights = new Map<string, number>()
const baseRowMin = 44
const expanded = ref(true)

function isAddRow(sr:any) { return String(sr.key).includes('__add__') || sr.person_id === null || sr.project_id === null }
function cleanAddLabel(s: string) { return s.replace(/^\s*\+\s*/, '') }
function isWeekend(dayISO: string) { const d = parseISO(dayISO).getUTCDay(); return d === 0 || d === 6 }
function subAssignmentsLaned(sr: { key:string; person_id: string|null; project_id: string|null }) {
  if (isAddRow(sr)) { rowHeights.set(sr.key, baseRowMin); return [] }
  const list = assignmentsRef.value.filter(a => a.person_id === sr.person_id && a.project_id === sr.project_id)
  const { items, laneCount } = computeLanes(props.startISO, list)
  const laneHeight = 30
  const padding = 10
  const totalH = padding*2 + laneCount*laneHeight
  rowHeights.set(sr.key, Math.max(baseRowMin, totalH))
  return items
}
function laneTop(lane: number) { const padding = 10; const laneHeight = 30; return padding + lane*laneHeight }

function onUpdate(payload: { id: string; start?: string; end?: string }) { emit('update', payload) }

// Empty click popover
const popover = ref<{ key: string; x: number; y: number; dayISO: string } | null>(null)
const duration = ref(5)
const allocation = ref(1 as 1|0.75|0.5|0.25)
function onEmptyClick(e: MouseEvent, sr: any) {
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
  const x = e.clientX - rect.left
  // Map x to closest day index based on offsets/widths
  let idx = 0
  if (offsets.value) {
    for (let i=0;i<days.value.length;i++){
      const left = lineLeft(i)
      const width = dayWidth(i)
      if (x < left + width) { idx = i; break }
      idx = i
    }
  } else {
    idx = Math.round(x / pxPerDay.value)
  }
  const start = days.value[Math.max(0, Math.min(days.value.length-1, idx))]
  popover.value = { key: sr.key, x: e.clientX, y: e.clientY, dayISO: start }
}
function confirmCreate(sr: any) {
  if (!popover.value) return
  emit('create', { person_id: sr.person_id, project_id: sr.project_id, start: popover.value.dayISO, duration: duration.value, allocation: allocation.value })
  popover.value = null
}
function closePopover() { popover.value = null }
const popoverStyle = computed(() => popover.value ? ({ position: 'fixed', left: `${popover.value.x + 8}px`, top: `${popover.value.y + 8}px` }) : {})

// Today line
const todayISO = (() => { const d = new Date(); d.setUTCHours(0,0,0,0); return d.toISOString().slice(0,10) })()
const todayIndex = computed(() => days.value.findIndex(d => d === todayISO))

// tiny pinia-less accessor for current assignments via inject to keep component pure
const assignmentsKey = Symbol.for('assignmentsRef')
function usePlanner() { return inject<any>(assignmentsKey)! }
const assignmentsRef = usePlanner()

// Header aggregated assignments
const headerLaneCount = ref(1)
const headerAssignments = computed(() => {
  const list = assignmentsRef.value.filter(a => (props.groupType === 'person' ? a.person_id === props.groupId : a.project_id === props.groupId))
  const { items, laneCount } = computeLanes(props.startISO, list)
  headerLaneCount.value = laneCount
  return items
})
const headerHeight = computed(() => Math.max(baseRowMin, 16 + headerLaneCount.value*30))

defineExpose({ rowHeights })
</script>
