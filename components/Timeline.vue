<template>
  <div class="h-full flex flex-col gap-2">
    <div class="flex items-center justify-between">
      <div class="text-xs text-slate-500 tracking-tight">{{ view.mode === 'person' ? 'People View' : 'Project View' }}</div>
    </div>

    <!-- Header rows: Month+Year (top) / Day (bottom) (right only) -->
    <div class="grid" style="grid-template-columns: 240px 1fr;">
      <!-- Left placeholders to match 2 header rows: month+year / day -->
      <div class="flex flex-col">
        <div class="py-1"></div>
        <div class="py-1.5"></div>
      </div>
      <div class="relative">
        <div class="overflow-hidden">
          <TimelineHeader
            :days="days"
            :dayColumns="dayColumns"
            :monthSegments="monthSegments"
            :monthColumns="monthColumns"
            :todayISO="todayISO"
            :dayLabel="dayLabel"
            :pxPerDay="view.px_per_day"
            :dayOffsets="dayOffsets"
            :weekStarts="weekStarts"
            :scrollLeft="scrollLeft"
          />
        </div>
      </div>
    </div>

    <!-- Scrollable content with aligned rows -->
    <div ref="scrollArea" class="overflow-auto border border-slate-200 rounded-md shadow-sm" @scroll.passive="handleScroll">
      <template v-if="view.mode==='person'">
        <RowGroup v-for="p in people" :key="p.id" :label="p.name"
          :groupType="'person'" :groupId="p.id"
          :subrows="personSubrows(p.id)" :days="days" :pxPerDay="view.px_per_day"
          :startISO="view.start" :projectsMap="projectsMap"
          @create="onCreate" @update="onUpdate" @createFromSidebar="onAddFromSidebar" />
      </template>
      <template v-else>
        <RowGroup v-for="proj in projects" :key="proj.id" :label="proj.name"
          :groupType="'project'" :groupId="proj.id"
          :subrows="projectSubrows(proj.id)" :days="days" :pxPerDay="view.px_per_day"
          :startISO="view.start" :projectsMap="projectsMap"
          @create="onCreate" @update="onUpdate" @createFromSidebar="onAddFromSidebar" />
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { usePlannerStore } from '@/stores/usePlannerStore'
import { addDaysISO } from '@/composables/useDate'
import { useTimeline } from '@/composables/useTimeline'
import { useTimelineScroll } from '@/composables/useTimelineScroll'
import TimelineHeader from '@/components/timeline/TimelineHeader.vue'
import RowGroup from '@/components/internal/RowGroup.vue'

const store = usePlannerStore()
const { people, projects, view, assignments } = storeToRefs(store)

const {
  todayISO,
  isWeekend,
  days,
  dayOffsets,
  dayColumns,
  dayLabel,
  monthSegments,
  monthColumns,
  yearSegments,
  yearColumns,
  weekStarts
} = useTimeline(view)

// (Day-by-day display; no week row)

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

const { onScroll, init } = useTimelineScroll(view, scrollArea)

function handleScroll() {
  if (scrollArea.value) {
    scrollLeft.value = scrollArea.value.scrollLeft
  }
  onScroll()
}

onMounted(async () => { await init(todayISO) })
</script>
