<template>
  <div class="h-full flex flex-col gap-2">
    <div class="flex items-center justify-between">
      <div class="text-xs text-slate-500 tracking-tight">{{ view.mode === 'person' ? 'People View' : 'Project View' }}</div>
    </div>

    <!-- Header rows: Year / Month / Week (right only) -->
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
            <!-- Year row -->
            <div class="grid text-[11px] text-slate-500 select-none border-b border-slate-200" :style="{ gridTemplateColumns: yearColumns, transform: `translateX(-${scrollLeft}px)` }">
              <div v-for="seg in yearSegments" :key="seg.key" class="text-center py-1 font-medium">{{ seg.label }}</div>
            </div>
            <!-- Month row -->
            <div class="grid text-[11px] text-slate-600 select-none border-b border-slate-200" :style="{ gridTemplateColumns: monthColumns, transform: `translateX(-${scrollLeft}px)` }">
              <div v-for="seg in monthSegments" :key="seg.key" class="text-center py-1">{{ seg.label }}</div>
            </div>
            <!-- Week ticks (Mon labels) -->
            <div class="grid text-[11px] text-slate-700 select-none" :style="{ gridTemplateColumns: weekColumns, transform: `translateX(-${scrollLeft}px)` }">
              <div v-for="wk in weekSegments" :key="wk.key" class="text-center py-1.5">{{ wk.label }}</div>
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

const allDays = computed(() => eachDay(view.value.start, view.value.days))
function isWeekend(iso: string) { const d = new Date(iso).getUTCDay(); return d===0 || d===6 }
const days = computed(() => allDays.value.filter(d => !isWeekend(d)))
const dayOffsets = computed(() => days.value.map((_, i) => i * view.value.px_per_day))
const weekStarts = computed(() => days.value.map((d,i)=> ({i, wd: new Date(d).getUTCDay()})).filter(e=>e.wd===1).map(e=>e.i))
const dayColumns = computed(() => days.value.map(() => `${view.value.px_per_day}px`).join(' '))

function monthLabel(iso: string) { const d = new Date(iso); return d.toLocaleString('en-US', { month: 'long' }).toUpperCase() }
function yearLabel(iso: string) { const d = new Date(iso); return String(d.getUTCFullYear()) }
function dayLabel(iso: string) { const d = new Date(iso); const dd = String(d.getUTCDate()).padStart(2,'0'); const mm = String(d.getUTCMonth()+1).padStart(2,'0'); return `${dd}-${mm}` }
// isWeekend already declared above

const monthSegments = computed(() => {
  const out: { key:string; label:string; span:number }[] = []
  let current: { key:string; label:string; span:number } | null = null
  for (const iso of days.value) {
    const key = iso.slice(0,7)
    const label = monthLabel(iso)
    if (!current || current.key !== key) { if (current) out.push(current); current = { key, label, span: 0 } }
    current.span += 1
  }
  if (current) out.push(current)
  return out
})
const monthColumns = computed(() => monthSegments.value.map(s => `${s.span * view.value.px_per_day}px`).join(' '))

const yearSegments = computed(() => {
  const out: { key:string; label:string; span:number }[] = []
  let current: { key:string; label:string; span:number } | null = null
  for (const iso of days.value) {
    const key = iso.slice(0,4)
    const label = yearLabel(iso)
    if (!current || current.key !== key) { if (current) out.push(current); current = { key, label, span: 0 } }
    current.span += 1
  }
  if (current) out.push(current)
  return out
})
const yearColumns = computed(() => yearSegments.value.map(s => `${s.span * view.value.px_per_day}px`).join(' '))

// Week segments (Mondays only)
const weekSegments = computed(() => {
  const out: { key:string; label:string }[] = []
  for (let i=0;i<days.value.length;i++) {
    const iso = days.value[i]
    const d = new Date(iso)
    if (d.getUTCDay() === 1) {
      const dd = String(d.getUTCDate()).padStart(2,'0')
      const mon = d.toLocaleString('en-US', { month: 'short' }).toUpperCase()
      out.push({ key: iso, label: `${dd} ${mon}` })
    }
  }
  return out
})
const weekColumns = computed(() => weekSegments.value.map(() => `${7 * view.value.px_per_day}px`).join(' '))

const projectsMap = computed(() => Object.fromEntries(projects.value.map(p => [p.id, p])))

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

// Convert a number of weekdays into a calendar-day span starting from a base date (exclusive)
function calendarSpanForWeekdays(baseISO: string, weekdays: number, dir: 1|-1) {
  let span = 0
  let counted = 0
  while (counted < weekdays) {
    span += 1
    const d = new Date(baseISO)
    d.setUTCHours(0,0,0,0)
    d.setUTCDate(d.getUTCDate() + dir * span)
    const wd = d.getUTCDay()
    if (wd !== 0 && wd !== 6) counted += 1
  }
  return span
}

async function prependWeekdays(w: number) {
  const el = scrollArea.value
  if (!el) return
  const half = el.clientWidth / 2
  const anchor = el.scrollLeft + half
  const cal = calendarSpanForWeekdays(view.value.start, w, -1)
  store.setStart(addDaysISO(view.value.start, -cal))
  store.setDays(view.value.days + cal)
  await nextTick()
  if (scrollArea.value) scrollArea.value.scrollLeft = anchor + w * view.value.px_per_day - half
}
async function appendWeekdays(w: number) {
  const el = scrollArea.value
  if (!el) return
  const half = el.clientWidth / 2
  const anchor = el.scrollLeft + half
  const endISO = addDaysISO(view.value.start, view.value.days - 1)
  const cal = calendarSpanForWeekdays(endISO, w, +1)
  store.setDays(view.value.days + cal)
  await nextTick()
  if (scrollArea.value) scrollArea.value.scrollLeft = anchor - half
}

function onScroll() {
  const el = scrollArea.value
  if (!el) return
  const left = el.scrollLeft
  const right = left + el.clientWidth
  scrollLeft.value = left
  const chunk = 5 // expand by one work-week (Mon–Fri)
  const threshold = view.value.px_per_day * 4
  const nearLeft = left < threshold
  const nearRight = right > el.scrollWidth - threshold
  if (!extending.value) {
    if (nearLeft) { extending.value = true; prependWeekdays(chunk).finally(() => { extending.value = false }) }
    else if (nearRight) { extending.value = true; appendWeekdays(chunk).finally(() => { extending.value = false }) }
  }
}
const extending = ref(false)

onMounted(async () => {
  await nextTick()
  const el = scrollArea.value
  if (!el) return
  const px = view.value.px_per_day
  const visibleWeekdays = Math.ceil(el.clientWidth / px)
  const leftBufferW = 14 // start with two weeks available to the left
  const rightBufferW = 28 // and sufficient buffer to the right
  const leftCal = calendarSpanForWeekdays(todayISO, leftBufferW, -1)
  const rightCal = calendarSpanForWeekdays(todayISO, visibleWeekdays + rightBufferW, +1)
  store.setStart(addDaysISO(todayISO, -leftCal))
  store.setDays(leftCal + rightCal + 1)
  await nextTick()
  // Position today at leftBufferW columns from the left edge
  if (scrollArea.value) scrollArea.value.scrollLeft = leftBufferW * px
})
</script>
