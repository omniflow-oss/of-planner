<template>
  <div class="h-full flex flex-col gap-2">
    <div class="flex items-center justify-between">
      <div class="text-xs text-slate-500 tracking-tight">{{ view.mode === 'person' ? 'People View' : 'Project View' }}</div>
      <div class="flex items-center gap-2">
        <label class="text-[11px] text-slate-500">Start</label>
        <input class="px-2 py-1 text-xs rounded-md border border-slate-200" style="width: 130px;" type="date" v-model="localStart" @change="onStartChange" />
        <label class="text-[11px] text-slate-500">Days</label>
        <input class="px-2 py-1 text-xs rounded-md border border-slate-200 w-16" type="number" min="7" max="90" v-model.number="localDays" @change="onDaysChange" />
      </div>
    </div>

    <!-- Header rows: Year / Month / Day (right only) -->
    <div class="grid" style="grid-template-columns: 240px 1fr;">
      <!-- Left placeholders to match 3 header rows: year / month / day -->
      <div class="flex flex-col">
        <div class="py-1"></div>
        <div class="py-1"></div>
        <div class="py-1.5"></div>
      </div>
      <div class="relative">
        <div class="overflow-hidden">
          <div class="relative">
            <!-- weekend removed: use zero-width for Sat/Sun; background bands follow computed widths/offsets -->
            <div v-for="(day, i) in days" :key="'hbg'+i" class="day-bg" :style="{ left: (dayOffsets[i]||0)+'px', width: (dayWidths[i]||0)+'px', transform: `translateX(-${scrollLeft}px)` }" />

            <!-- Year row -->
            <div class="grid text-[11px] text-slate-500 select-none border-b border-slate-200" :style="{ gridTemplateColumns: yearColumns, transform: `translateX(-${scrollLeft}px)` }">
              <div v-for="seg in yearSegments" :key="seg.key" class="text-center py-1 font-medium">{{ seg.label }}</div>
            </div>
            <!-- Month row -->
            <div class="grid text-[11px] text-slate-600 select-none border-b border-slate-200" :style="{ gridTemplateColumns: monthColumns, transform: `translateX(-${scrollLeft}px)` }">
              <div v-for="seg in monthSegments" :key="seg.key" class="text-center py-1">{{ seg.label }}</div>
            </div>
            <!-- Day row (dd-mm) -->
            <div class="grid text-[11px] text-slate-700 select-none" :style="{ gridTemplateColumns: dayColumns, transform: `translateX(-${scrollLeft}px)` }">
              <div v-for="day in days" :key="day" class="text-center py-1.5">
                <span :class="['px-1.5 py-0.5 rounded-md', day===todayISO ? 'bg-slate-900 text-white' : '']">{{ dayLabel(day) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Scrollable content with aligned rows -->
    <div ref="scrollArea" class="overflow-auto border border-slate-200 rounded-md shadow-sm" @scroll.passive="onScroll">
      <template v-if="view.mode==='person'">
        <RowGroup v-for="p in people" :key="p.id" :label="p.name"
          :groupType="'person'" :groupId="p.id"
          :subrows="personSubrows(p.id)" :days="days" :pxPerDay="view.px_per_day"
          :startISO="view.start" :projectsMap="projectsMap" :dayOffsets="dayOffsets" :weekStarts="weekStarts"
          @create="onCreate" @update="onUpdate" @createFromSidebar="onAddFromSidebar" />
      </template>
      <template v-else>
        <RowGroup v-for="proj in projects" :key="proj.id" :label="proj.name"
          :groupType="'project'" :groupId="proj.id"
          :subrows="projectSubrows(proj.id)" :days="days" :pxPerDay="view.px_per_day"
          :startISO="view.start" :projectsMap="projectsMap" :dayOffsets="dayOffsets" :weekStarts="weekStarts"
          @create="onCreate" @update="onUpdate" @createFromSidebar="onAddFromSidebar" />
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { usePlannerStore } from '@/stores/usePlannerStore'
import { eachDay, addDaysISO } from '@/composables/useDate'
import RowGroup from '@/components/internal/RowGroup.vue'

const store = usePlannerStore()
const { people, projects, view, assignments } = storeToRefs(store)

const localStart = ref(view.value.start)
const localDays = ref(view.value.days)
const days = computed(() => eachDay(view.value.start, view.value.days))
function isWeekend(iso: string) { const d = new Date(iso).getUTCDay(); return d===0 || d===6 }
const dayWidths = computed(() => days.value.map(d => isWeekend(d) ? 0 : view.value.px_per_day))
const dayOffsets = computed(() => {
  const out:number[] = []
  let acc = 0
  for (let i=0;i<days.value.length;i++){ out.push(acc); acc += dayWidths.value[i] }
  return out
})
const weekStarts = computed(() => days.value.map((d,i)=> ({i, wd: new Date(d).getUTCDay()})).filter(e=>e.wd===1).map(e=>e.i))
const dayColumns = computed(() => dayWidths.value.map(w => `${w}px`).join(' '))

function monthLabel(iso: string) { const d = new Date(iso); return d.toLocaleString('en-US', { month: 'long' }).toUpperCase() }
function yearLabel(iso: string) { const d = new Date(iso); return String(d.getUTCFullYear()) }
function dayLabel(iso: string) { const d = new Date(iso); const dd = String(d.getUTCDate()).padStart(2,'0'); const mm = String(d.getUTCMonth()+1).padStart(2,'0'); return `${dd}-${mm}` }
function isWeekend(iso: string) { const d = new Date(iso); const wd = d.getUTCDay(); return wd===0 || wd===6 }

const monthSegments = computed(() => {
  const out: { key:string; label:string; width:number }[] = []
  let current: { key:string; label:string; width:number } | null = null
  for (let i=0;i<days.value.length;i++) {
    const iso = days.value[i]
    const key = iso.slice(0,7)
    const label = monthLabel(iso)
    if (!current || current.key !== key) { if (current) out.push(current); current = { key, label, width: 0 } }
    current.width += dayWidths.value[i]
  }
  if (current) out.push(current)
  return out
})
const monthColumns = computed(() => monthSegments.value.map(s => `${s.width}px`).join(' '))

const yearSegments = computed(() => {
  const out: { key:string; label:string; width:number }[] = []
  let current: { key:string; label:string; width:number } | null = null
  for (let i=0;i<days.value.length;i++) {
    const iso = days.value[i]
    const key = iso.slice(0,4)
    const label = yearLabel(iso)
    if (!current || current.key !== key) { if (current) out.push(current); current = { key, label, width: 0 } }
    current.width += dayWidths.value[i]
  }
  if (current) out.push(current)
  return out
})
const yearColumns = computed(() => yearSegments.value.map(s => `${s.width}px`).join(' '))

const projectsMap = computed(() => Object.fromEntries(projects.value.map(p => [p.id, p])))

function onStartChange() { store.setStart(localStart.value) }
function onDaysChange() { store.setDays(localDays.value) }

function personProjects(personId: string) {
  const set = new Set(assignments.value.filter(a => a.person_id === personId).map(a => a.project_id))
  return Array.from(set)
}
function projectPeople(projectId: string) {
  const set = new Set(assignments.value.filter(a => a.project_id === projectId).map(a => a.person_id))
  return Array.from(set)
}

function personSubrows(personId: string) {
  const projIds = personProjects(personId)
  const rows = projIds.map(pid => ({ key: `${personId}:${pid}`, label: projectName(pid), person_id: personId, project_id: pid }))
  return [...rows, { key: `${personId}:__add__`, label: '➕ Ajouter un projet', person_id: personId, project_id: null }]
}
function projectSubrows(projectId: string) {
  const peopleIds = projectPeople(projectId)
  const rows = peopleIds.map(pers => ({ key: `${projectId}:${pers}`, label: personName(pers), person_id: pers, project_id: projectId }))
  return [...rows, { key: `${projectId}:__add__`, label: '➕ Ajouter une personne', person_id: null, project_id: projectId }]
}
function projectName(id: string) { return projects.value.find(p => p.id === id)?.name ?? id }
function personName(id: string) { return people.value.find(p => p.id === id)?.name ?? id }

function onCreate(payload: { person_id: string|null; project_id: string|null; start: string; duration: number; allocation: 1|0.75|0.5|0.25 }) {
  let { person_id, project_id, start, duration, allocation } = payload
  // If missing complementary entity ask user via prompt (simple fallback)
  if (!person_id) person_id = window.prompt('Select person id', people.value[0]?.id) || people.value[0]?.id
  if (!project_id) project_id = window.prompt('Select project id', projects.value[0]?.id) || projects.value[0]?.id
  const end = addDaysISO(start, Math.max(1, duration) - 1)
  store.createAssignment({ person_id: person_id!, project_id: project_id!, start, end, allocation })
}

function onUpdate(payload: { id: string; start?: string; end?: string }) {
  store.updateAssignment(payload.id, payload)
}

function onAddFromSidebar(sr: { person_id: string|null; project_id: string|null }) {
  // Default create from start date with duration 5, allocation 1
  onCreate({ person_id: sr.person_id, project_id: sr.project_id, start: view.value.start, duration: 5, allocation: 1 })
}

// Provide assignments ref to children (RowGroup) for lane computation
const assignmentsKey = Symbol.for('assignmentsRef')
provide(assignmentsKey, assignments)

const gridEl = ref<HTMLElement | null>(null)
const scrollArea = ref<HTMLElement | null>(null)
const todayISO = (() => { const d = new Date(); d.setUTCHours(0,0,0,0); return d.toISOString().slice(0,10) })()
const scrollLeft = ref(0)

async function prependDays(n: number) {
  const before = scrollArea.value?.scrollLeft || 0
  store.setStart(addDaysISO(view.value.start, -n))
  store.setDays(view.value.days + n)
  await nextTick()
  if (scrollArea.value) scrollArea.value.scrollLeft = before + n * view.value.px_per_day
}
async function appendDays(n: number) {
  store.setDays(view.value.days + n)
  await nextTick()
}

function onScroll() {
  const el = scrollArea.value
  if (!el) return
  const left = el.scrollLeft
  const right = left + el.clientWidth
  scrollLeft.value = left
  const nearLeft = left < view.value.px_per_day * 2
  const nearRight = right > el.scrollWidth - view.value.px_per_day * 2
  if (nearLeft) prependDays(14)
  else if (nearRight) appendDays(14)
}

onMounted(async () => {
  await nextTick()
  const el = scrollArea.value
  if (!el) return
  const px = view.value.px_per_day
  const visibleDays = Math.ceil(el.clientWidth / px)
  const buffer = 28
  const need = Math.max(view.value.days, visibleDays + buffer)
  store.setDays(need)
  const start = addDaysISO(todayISO, -Math.floor(need / 2))
  store.setStart(start)
  await nextTick()
  const todayIndex = Math.floor(need / 2)
  el.scrollLeft = Math.max(0, todayIndex * px - (el.clientWidth / 2 - px / 2))
})
</script>
