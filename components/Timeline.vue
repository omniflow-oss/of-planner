<template>
  <div class="h-full flex flex-col gap-2">
    <div class="flex items-center justify-between">
      <div class="text-xs text-slate-500 tracking-tight">{{ view.mode === 'person' ? 'People View' : 'Project View' }}</div>
    </div>

    <!-- Header + body via viewport: left sidebar separated from timeline tracks -->
    <TimelineViewport :left-width="240" @scroll="onViewportScroll" ref="viewport">
      <template #headerLeft>
        <div class="flex flex-col">
          <div class="py-1"></div>
          <div class="py-1.5"></div>
        </div>
      </template>
      <template #headerRight>
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
      </template>

      <template #bodyLeft>
        <template v-if="view.mode==='person'">
          <LeftSidebarPane v-for="p in people" :key="'ls_'+p.id" :label="p.name" :groupType="'person'" :groupId="p.id" :expanded="isExpanded('person', p.id)" :startISO="view.start" :subrows="personSubrows(p.id)" @toggle="() => toggleExpanded('person', p.id)" @createFromSidebar="onAddFromSidebar" />
        </template>
        <template v-else>
          <LeftSidebarPane v-for="proj in projects" :key="'ls_'+proj.id" :label="proj.name" :groupType="'project'" :groupId="proj.id" :expanded="isExpanded('project', proj.id)" :startISO="view.start" :subrows="projectSubrows(proj.id)" @toggle="() => toggleExpanded('project', proj.id)" @createFromSidebar="onAddFromSidebar" />
        </template>
      </template>

      <template #bodyRight>
        <!-- Sizer to enable horizontal scroll -->
        <div :style="{ width: (days.length * view.px_per_day) + 'px', height: '1px' }" />
        <template v-if="view.mode==='person'">
          <RightTracksPane v-for="p in people" :key="'rt_'+p.id" :label="p.name" :groupType="'person'" :groupId="p.id" :expanded="isExpanded('person', p.id)" :subrows="personSubrows(p.id)" :days="days" :pxPerDay="view.px_per_day" :dayOffsets="dayOffsets" :weekStarts="weekStarts" :startISO="view.start" :projectsMap="projectsMap" @create="onCreate" @update="onUpdate" />
        </template>
        <template v-else>
          <RightTracksPane v-for="proj in projects" :key="'rt_'+proj.id" :label="proj.name" :groupType="'project'" :groupId="proj.id" :expanded="isExpanded('project', proj.id)" :subrows="projectSubrows(proj.id)" :days="days" :pxPerDay="view.px_per_day" :dayOffsets="dayOffsets" :weekStarts="weekStarts" :startISO="view.start" :projectsMap="projectsMap" @create="onCreate" @update="onUpdate" />
        </template>
      </template>
    </TimelineViewport>

    <!-- Visible horizontal slider synced with timeline -->
    <div ref="hScroll" class="mt-2 h-5 overflow-x-auto overflow-y-hidden rounded border border-slate-200 bg-white">
      <div :style="{ width: contentWidth + 'px', height: '1px' }" />
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
import TimelineViewport from '@/components/internal/layout/TimelineViewport.vue'
import LeftSidebarPane from '@/components/internal/LeftSidebarPane.vue'
import RightTracksPane from '@/components/internal/RightTracksPane.vue'

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
  weekStarts
} = useTimeline(view)

// (Day-by-day display; no week row)

const projectsMap = computed(() => Object.fromEntries(projects.value.map(p => [p.id, p])))
const contentWidth = computed(() => days.value.length * view.value.px_per_day)

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
  const rows = projIds.map(pid => ({ kind: 'item' as const, key: `${personId}:${pid}`, label: projectName(pid), person_id: personId, project_id: pid }))
  return [...rows, { kind: 'add' as const, key: `${personId}:__add__`, label: '➕ Ajouter un projet', add: 'project', person_id: personId }]
}
function projectSubrows(projectId: string) {
  const peopleIds = projectPeople(projectId)
  const rows = peopleIds.map(pers => ({ kind: 'item' as const, key: `${projectId}:${pers}`, label: personName(pers), person_id: pers, project_id: projectId }))
  return [...rows, { kind: 'add' as const, key: `${projectId}:__add__`, label: '➕ Ajouter une personne', add: 'person', project_id: projectId }]
}
function projectName(id: string) { return projects.value.find(p => p.id === id)?.name ?? id }
function personName(id: string) { return people.value.find(p => p.id === id)?.name ?? id }

// Expansion per group (reactive record for reliable updates)
const expandedState = ref<Record<string, boolean>>({})
function keyFor(groupType: 'person'|'project', id: string) { return `${groupType}:${id}` }
function isExpanded(groupType: 'person'|'project', id: string) {
  const k = keyFor(groupType, id)
  const v = expandedState.value[k]
  return v === undefined ? true : !!v
}
function toggleExpanded(groupType: 'person'|'project', id: string) {
  const k = keyFor(groupType, id)
  const next = !isExpanded(groupType, id)
  expandedState.value = { ...expandedState.value, [k]: next }
}

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

// Provide assignments ref to children for lane computation
const assignmentsKey = Symbol.for('assignmentsRef')
provide(assignmentsKey, assignments)

const scrollLeft = ref(0)
const viewport = ref<any>(null)
const hScroll = ref<HTMLElement | null>(null)

const { onScroll, init } = useTimelineScroll(view, computed(() => viewport.value?.rightBody?.value ?? null))

function onViewportScroll(pos: { left: number; top: number }) {
  scrollLeft.value = pos.left
  onScroll()
  if (hScroll.value && hScroll.value.scrollLeft !== pos.left) {
    hScroll.value.scrollLeft = pos.left
  }
}

onMounted(async () => {
  await init(todayISO)
  if (hScroll.value && viewport.value?.rightBody?.value) {
    // Sync from slider to right body
    hScroll.value.addEventListener('scroll', () => {
      const rb = viewport.value.rightBody.value as HTMLElement
      if (rb && rb.scrollLeft !== hScroll.value!.scrollLeft) rb.scrollLeft = hScroll.value!.scrollLeft
    }, { passive: true })
  }
})

// When the visible window origin changes (step back/forward), reset horizontal scroll to the start
watch(() => view.value.start, () => {
  const rb = viewport.value?.rightBody?.value as HTMLElement | undefined
  if (rb) rb.scrollLeft = 0
  if (hScroll.value) hScroll.value.scrollLeft = 0
  scrollLeft.value = 0
})
</script>
