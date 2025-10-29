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
          @create="onCreate" @update="onUpdate" @createFromSidebar="onAddFromSidebar" @edit="onEdit" @createPopover="onCreatePopover" />
      </template>
      <template v-else>
        <RowGroup v-for="proj in projects" :key="proj.id" :label="proj.name"
          :groupType="'project'" :groupId="proj.id"
          :subrows="projectSubrows(proj.id)" :days="days" :pxPerDay="view.px_per_day"
          :startISO="view.start" :projectsMap="projectsMap"
          @create="onCreate" @update="onUpdate" @createFromSidebar="onAddFromSidebar" @edit="onEdit" @createPopover="onCreatePopover" />
      </template>
    </div>


      <div v-if="editPopover" data-popover="edit" :style="{ position: 'fixed', left: editPopover?.x + 8 + 'px', top: editPopover?.y + 8 + 'px', zIndex: 50 }" class="bg-white border border-slate-200 rounded-md p-4 shadow-lg w-72">
        <div class="flex items-center justify-between text-sm font-medium text-slate-700 mb-3">
          <div>Edit Assignment</div>
          <button class="text-slate-400 hover:text-slate-600" @click="closeEditPopover">✕</button>
        </div>
        
        <div class="space-y-3">
          <div class="flex items-center gap-2 text-sm">
            <label class="w-20 text-slate-600">Start</label>
            <input 
              class="px-2 py-1 border border-slate-200 rounded flex-1 text-sm" 
              type="date" 
              v-model="editPopover.editedStart" 
            />
          </div>
          
          <div class="flex items-center gap-2 text-sm">
            <label class="w-20 text-slate-600">End</label>
            <input 
              class="px-2 py-1 border border-slate-200 rounded flex-1 text-sm" 
              type="date" 
              v-model="editPopover.editedEnd" 
            />
          </div>
          
          <div class="flex items-center gap-2 text-sm">
            <label class="w-20 text-slate-600">Allocation</label>
            <select class="px-2 py-1 border border-slate-200 rounded flex-1 text-sm" v-model.number="editPopover.editedAllocation">
              <option :value="1">100% (1)</option>
              <option :value="0.75">75% (¾)</option>
              <option :value="0.5">50% (½)</option>
              <option :value="0.25">25% (¼)</option>
            </select>
          </div>
        </div>
        
        <div class="flex justify-between mt-4 pt-3 border-t border-slate-200">
          <button 
            class="px-3 py-1.5 text-sm bg-red-600 text-white rounded hover:bg-red-700" 
            @click="deleteAssignment"
          >
            Delete
          </button>
          <div class="flex gap-2">
            <button 
              class="px-3 py-1.5 text-sm border border-slate-200 rounded hover:bg-slate-50" 
              @click="closeEditPopover"
            >
              Cancel
            </button>
            <button 
              class="px-3 py-1.5 text-sm bg-slate-900 text-white rounded hover:bg-slate-800" 
              @click="saveAssignmentChanges"
            >
              Save
            </button>
          </div>
        </div>
      </div>

    <!-- Create popover (moved from RowGroup.vue) -->
    <div v-if="createPopover" data-popover="create" :style="{ position: 'fixed', left: createPopover.x + 8 + 'px', top: createPopover.y + 8 + 'px', zIndex: 50 }" class="bg-white border border-slate-200 rounded-md p-3 shadow-md w-56">
      <div class="flex items-center justify-between text-xs text-slate-500">
        <div>Quick create</div>
        <button class="px-2 py-1 border border-slate-200 rounded" @click.stop="closeCreatePopover">✕</button>
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
        <button class="px-2 py-1 text-sm border border-slate-200 rounded" @click.stop="closeCreatePopover">Cancel</button>
        <button class="px-2 py-1 text-sm bg-slate-900 text-white rounded" @click.stop="confirmCreate">Create</button>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { usePlannerStore } from '@/stores/usePlannerStore'
import { addDaysISO, calendarSpanForWeekdays } from '@/composables/useDate'
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
  closeCreatePopover();
}

function onAddFromSidebar(sr: { person_id: string|null; project_id: string|null }) {
  // Default create from start date with duration 5, allocation 1
  onCreate({ person_id: sr.person_id, project_id: sr.project_id, start: view.value.start, duration: 5, allocation: 1 })
}

// Edit popover state
const editPopover = ref<{ 
  visible: boolean; 
  assignment: any; 
  x: number; 
  y: number;
  editedStart: string;
  editedEnd: string;
  editedAllocation: 1 | 0.75 | 0.5 | 0.25;
} | null>(null)

// Create popover state (moved from RowGroup.vue)
const createPopover = ref<{ 
  key: string; 
  x: number; 
  y: number; 
  dayISO: string;
  person_id: string|null;
  project_id: string|null;
} | null>(null)
const duration = ref(5)
const allocation = ref(1 as 1|0.75|0.5|0.25)

function onEdit(payload: { assignment: any; x: number; y: number }) {
  const { assignment, x, y } = payload
  editPopover.value = {
    visible: true,
    assignment,
    x,
    y,
    editedStart: assignment.start,
    editedEnd: assignment.end,
    editedAllocation: assignment.allocation
  }
}

function onCreatePopover(payload: { key: string; x: number; y: number; dayISO: string; person_id: string|null; project_id: string|null }) {
  createPopover.value = payload
}

function closeEditPopover() {
  editPopover.value = null
}

function saveAssignmentChanges() {
  if (!editPopover.value) return
  
  const { assignment, editedStart, editedEnd, editedAllocation } = editPopover.value
  store.updateAssignment(assignment.id, {
    start: editedStart,
    end: editedEnd,
    allocation: editedAllocation
  })
  closeEditPopover()
}

function deleteAssignment() {
  if (!editPopover.value) return
  
  store.deleteAssignment(editPopover.value.assignment.id)
  closeEditPopover()
}

// Create popover functions
function confirmCreate() {
  if (!createPopover.value) return
  onCreate({ 
    person_id: createPopover.value.person_id, 
    project_id: createPopover.value.project_id, 
    start: createPopover.value.dayISO, 
    duration: duration.value, 
    allocation: allocation.value 
  })
  createPopover.value = null
}

function closeCreatePopover() {
  createPopover.value = null
}

// Provide assignments ref to children (RowGroup) for lane computation
const assignmentsKey = Symbol.for('assignmentsRef')
provide(assignmentsKey, assignments)

const gridEl = ref<HTMLElement | null>(null)
const scrollArea = ref<HTMLElement | null>(null)
const scrollLeft = ref(0)



const { onScroll, init } = useTimelineScroll(view, scrollArea)

function handleScroll() {
  if (scrollArea.value) {
    scrollLeft.value = scrollArea.value.scrollLeft
  }
  onScroll()
}

  // Listen for today button clicks to scroll to today
  const handleGoToToday = (event: Event) => {
    const customEvent = event as CustomEvent<string>
    const eventTodayISO = customEvent.detail 
    //init(eventTodayISO)
    // Find today's index in the current days array
    const todayIndex = days.value.findIndex(d => d === eventTodayISO)
    
    if (todayIndex >= 0 && scrollArea.value) {
      // Calculate scroll position to center today on screen
      const todayPosition = todayIndex * view.value.px_per_day
      const containerWidth = scrollArea.value.clientWidth
      const sidebarWidth = 240 // Left column width for labels
      const timelineVisibleWidth = containerWidth - sidebarWidth
      const scrollPosition = todayPosition - (timelineVisibleWidth / 2) + (view.value.px_per_day / 2)
      
      scrollArea.value.scrollTo({
        left: Math.max(0, scrollPosition),
        behavior: 'smooth',
      })
    }

  }
  
  // Handle clicks outside of popovers to close them
  const handleClickOutside = (event: MouseEvent) => {
    if (editPopover.value && event.target) {
      const editPopoverElement = document.querySelector('[data-popover="edit"]')
      if (editPopoverElement && !editPopoverElement.contains(event.target as Node)) {
        closeEditPopover()
      }
    }
    if (createPopover.value && event.target) {
      const createPopoverElement = document.querySelector('[data-popover="create"]')
      const target = event.target as HTMLElement
      if (createPopoverElement && !createPopoverElement.contains(event.target as Node) && !target.classList.contains('timeline-bg')) {
        closeCreatePopover()
      }
    }
  }

// Listen for "go to today" events from the ViewSwitcher
onMounted(async () => { 
  // Ensure we have a valid todayISO before calling init
  await init(todayISO);
  
  document.addEventListener('timeline:goToToday', handleGoToToday as EventListener)
  document.addEventListener('click', handleClickOutside)
  
})
onUnmounted(() => {
    document.removeEventListener('timeline:goToToday', handleGoToToday as EventListener)
    document.removeEventListener('click', handleClickOutside)
  })
</script>
