<template>
  <div>
    <div v-for="sr in subrows" :key="sr.key" class="subrow" :style="rowStyleFor(sr)" @click.self="onEmptyClick($event, sr)">
      <div class="track relative" ref="setTrack" :data-key="sr.key" :style="{ height: rowHeights.get(sr.key)+'px', overflow:'visible' }">
        <!-- vertical day grid lines -->
        <div v-for="(day, i) in days" :key="day + i" :class="['grid-v', (i%7===0)?'week':'']" :style="{ left: (i*pxPerDay)+'px' }" />
        <div v-if="todayIndex>=0 && todayIndex<days.length" class="today-line" :style="{ left: (todayIndex*pxPerDay)+'px' }" />
        <!-- assignments only -->
        <AssignmentBar v-for="a in subAssignmentsLaned(sr)" :key="a.id"
          :assignment="a" :startISO="startISO" :pxPerDay="pxPerDay"
          :projectsMap="projectsMap" :top="laneTop(a._lane)" @update="onUpdate" />
      </div>
      <!-- quick create popover (right pane only) -->
      <div v-if="popover && popover.key===sr.key" :style="popoverStyle">
        <div class="panel" style="padding:10px; width:220px;">
          <div class="row" style="justify-content: space-between;">
            <div class="muted">Créer rapide</div>
            <button class="button ghost" @click.stop="closePopover">✕</button>
          </div>
          <div class="row" style="margin-top:8px;">
            <label class="muted" style="width:90px;">Durée</label>
            <input class="button" type="number" v-model.number="duration" min="1" style="flex:1;" />
          </div>
          <div class="row" style="margin-top:8px;">
            <label class="muted" style="width:90px;">Allocation</label>
            <select class="button" v-model.number="allocation" style="flex:1;">
              <option :value="1">1</option>
              <option :value="0.75">0.75</option>
              <option :value="0.5">0.5</option>
              <option :value="0.25">0.25</option>
            </select>
          </div>
          <div class="row" style="margin-top:12px; justify-content: flex-end; gap:6px;">
            <button class="button ghost" @click.stop="closePopover">Annuler</button>
            <button class="button primary" @click.stop="confirmCreate(sr)">Créer</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { usePlannerStore } from '@/stores/usePlannerStore'
import AssignmentBar from '@/components/internal/shared/AssignmentBar.vue'
import { addDaysISO } from '@/composables/useDate'
import { computeLanes } from '@/utils/lanes'

const props = defineProps<{
  subrows: { key: string; label: string; person_id: string|null; project_id: string|null }[]
  startISO: string
  days: string[]
  pxPerDay: number
  projectsMap: Record<string, { id: string; name: string; color?: string|null; emoji?: string|null }>
}>()
const emit = defineEmits(['create','update'])

const store = usePlannerStore()
const { assignments } = storeToRefs(store)

const baseRowMin = 56
const pxPerDay = computed(() => props.pxPerDay)
const days = computed(() => props.days)
const rowHeights = new Map<string, number>()
function rowStyleFor(sr: any) {
  const h = rowHeights.get(sr.key) || baseRowMin
  return { borderBottom: '1px solid #1b2026', minHeight: `${h}px`, position: 'relative' }
}

const tracks = new Map<string, HTMLElement>()
function setTrack(el: HTMLElement | null) { if (el) tracks.set(el.dataset.key!, el) }

function isAddRow(sr:any) { return String(sr.key).includes('__add__') || sr.person_id === null || sr.project_id === null }
function subAssignmentsLaned(sr: { key:string; person_id: string|null; project_id: string|null }) {
  if (isAddRow(sr)) return []
  const list = assignments.value.filter(a => a.person_id === sr.person_id && a.project_id === sr.project_id)
  const { items, laneCount } = computeLanes(props.startISO, list)
  const laneHeight = 28
  const padding = 10
  const totalH = padding*2 + laneCount*laneHeight
  rowHeights.set(sr.key, Math.max(baseRowMin, totalH))
  return items
}
function laneTop(lane: number) { const padding = 10; const laneHeight = 28; return padding + lane*laneHeight }

const popover = ref<{ key: string; x: number; y: number; dayISO: string } | null>(null)
const duration = ref(5)
const allocation = ref(1 as 1|0.75|0.5|0.25)

function onEmptyClick(e: MouseEvent, sr: any) {
  const el = tracks.get(sr.key)
  if (!el) return
  const rect = el.getBoundingClientRect()
  const x = e.clientX - rect.left
  const dayIndex = Math.round(x / pxPerDay.value)
  const start = addDaysISO(props.startISO, dayIndex)
  
  // Calculate better positioning to avoid viewport edges
  const popoverWidth = 220
  const popoverHeight = 150
  let adjustedX = e.clientX + 8
  let adjustedY = e.clientY + 8
  
  // Adjust if popover would go off right edge
  if (adjustedX + popoverWidth > window.innerWidth) {
    adjustedX = e.clientX - popoverWidth - 8
  }
  
  // Adjust if popover would go off bottom edge
  if (adjustedY + popoverHeight > window.innerHeight) {
    adjustedY = e.clientY - popoverHeight - 8
  }
  
  // Ensure popover doesn't go off top or left edges
  adjustedX = Math.max(8, adjustedX)
  adjustedY = Math.max(8, adjustedY)
  
  popover.value = { key: sr.key, x: adjustedX, y: adjustedY, dayISO: start }
}
function confirmCreate(sr: any) {
  if (!popover.value) return
  emit('create', { person_id: sr.person_id, project_id: sr.project_id, start: popover.value.dayISO, duration: duration.value, allocation: allocation.value })
  popover.value = null
}
function closePopover() { popover.value = null }
const popoverStyle = computed(() => popover.value ? ({ position: 'fixed', left: `${popover.value.x}px`, top: `${popover.value.y}px`, zIndex: 9999 }) : {})

function onUpdate(payload: { id: string; start?: string; end?: string }) { emit('update', payload) }

// Today line index within current range
const todayISO = (() => { const d = new Date(); d.setUTCHours(0,0,0,0); return d.toISOString().slice(0,10) })()
const todayIndex = computed(() => days.value.findIndex(d => d === todayISO))
</script>
