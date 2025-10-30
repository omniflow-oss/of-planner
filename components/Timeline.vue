<template>
  <div class="flex-1 w-full flex flex-col">
    <!-- Header rows: Month+Year (top) / Day (bottom) (right only) -->
    <div class="grid" style="grid-template-columns: 240px 1fr;">
      <!-- Left placeholders to match 2 header rows: month+year / day -->
      <div class="flex flex-col border-r">
        <div class="py-3 px-3 text-center my-auto">
          <div class="text-xs text-slate-500 tracking-tight flex flex-wrap items-center gap-2">
            {{ view.mode === 'person' ? 'People View' : 'Project View' }} 
              <!-- Add Project Button (only show in project view) -->
              <button 
              v-if="view.mode === 'project'"
              @click="addNewProject"
              class="px-3 py-1 text-xs bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors shadow-sm font-medium"
              title="Add a new project to the timeline"
            >
              ➕ Add Project
            </button>
            <!-- Add Person Button (only show in people view) -->
            <button 
              v-if="view.mode === 'person'"
              @click="addNewPerson"
              class="px-3 py-1 text-xs bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors shadow-sm font-medium"
              title="Add a new person to the timeline"
            >
              ➕ Add Person
            </button>
          </div>          
        </div>     
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
    <div ref="scrollArea" class="overflow-auto h-full flex-1  border-y border-slate-200 rounded-md shadow-sm" @scroll.passive="handleScroll">
      <template v-if="view.mode==='person'">
        <RowGroup v-for="p in people" :key="p.id" :label="p.name"
          :groupType="'person'" :groupId="p.id"
          :subrows="personSubrows(p.id)" :days="days" :pxPerDay="view.px_per_day"
          :startISO="view.start" :projectsMap="projectsMap" :peopleMap="peopleMap"
          @create="onCreate" @update="onUpdate" @createFromSidebar="onAddFromSidebar" @edit="onEdit" @createPopover="onCreatePopover" />
      </template>
      <template v-else>
        <RowGroup v-for="proj in projects" :key="proj.id" :label="proj.name"
          :groupType="'project'" :groupId="proj.id"
          :subrows="projectSubrows(proj.id)" :days="days" :pxPerDay="view.px_per_day"
          :startISO="view.start" :projectsMap="projectsMap" :peopleMap="peopleMap"
          @create="onCreate" @update="onUpdate" @createFromSidebar="onAddFromSidebar" @edit="onEdit" @createPopover="onCreatePopover" />
      </template>
    </div>


      <div v-if="editPopover" data-popover="edit" :style="{ position: 'fixed', left: editPopover?.x + 'px', top: editPopover?.y + 'px', zIndex: 9999 }" class="bg-white border border-slate-200 rounded-md p-4 shadow-lg w-72">
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
    <div v-if="createPopover" data-popover="create" :style="{ position: 'fixed', left: createPopover.x + 'px', top: createPopover.y + 'px', zIndex: 9999 }" class="bg-white border border-slate-200 rounded-md p-3 shadow-md w-56">
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
const peopleMap = computed(() => Object.fromEntries(people.value.map(p => [p.id, p])))

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
  return [...rows, { key: `${personId}:__add__`, label: '➕ Assigner un projet', person_id: personId, project_id: null }]
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
  
  // If missing person, create a new one or select existing
  if (!person_id) {
    if (people.value.length === 0) {
      // No people exist, create a new one
      const personName = window.prompt('Enter person name:', '')
      if (!personName) return // User cancelled, abort creation
      
      const newPerson = store.createPerson({ name: personName })
      person_id = newPerson.id
    } else {
      // People exist, offer to create new or select existing
      const createNew = window.confirm('Create a new person?\n\nClick OK to create new person, Cancel to select existing person.')
      if (createNew) {
        const personName = window.prompt('Enter person name:', '')
        if (!personName) return // User cancelled, abort creation
        
        const newPerson = store.createPerson({ name: personName })
        person_id = newPerson.id
      } else {
        // Show existing people
        const peopleList = people.value.map(p => `${p.id}: ${p.name}`).join('\n')
        const selectedId = window.prompt(`Select person ID:\n\n${peopleList}`, people.value[0]?.id)
        if (!selectedId) return // User cancelled
        person_id = selectedId
      }
    }
  }
  
  // If missing project, create a new one or select existing
  if (!project_id) {
    if (projects.value.length === 0) {
      // No projects exist, create a new one
      const projectName = window.prompt('Enter project name:', '')
      if (!projectName) return // User cancelled, abort creation
      
      const newProject = store.createProject({ name: projectName })
      project_id = newProject.id
    } else {
      // Projects exist, offer to create new or select existing
      const createNew = window.confirm('Create a new project?\n\nClick OK to create new project, Cancel to select existing project.')
      if (createNew) {
        const projectName = window.prompt('Enter project name:', '')
        if (!projectName) return // User cancelled, abort creation
        
        const newProject = store.createProject({ name: projectName })
        project_id = newProject.id
      } else {
        // Show existing projects
        const projectsList = projects.value.map(p => `${p.id}: ${p.name}`).join('\n')
        const selectedId = window.prompt(`Select project ID:\n\n${projectsList}`, projects.value[0]?.id)
        if (!selectedId) return // User cancelled
        project_id = selectedId
      }
    }
  }
  
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
  closeCreatePopover();
  const { assignment, x, y } = payload
  
  // Calculate better positioning to avoid viewport edges
  const popoverWidth = 290 // 72 * 4 = 288px + padding
  const popoverHeight = 200 // Approximate height
  let adjustedX = x + 8
  let adjustedY = y + 8
  
  // Adjust if popover would go off right edge
  if (adjustedX + popoverWidth > window.innerWidth) {
    adjustedX = x - popoverWidth - 8
  }
  
  // Adjust if popover would go off bottom edge
  if (adjustedY + popoverHeight > window.innerHeight) {
    adjustedY = y - popoverHeight - 8
  }
  
  // Ensure popover doesn't go off top or left edges
  adjustedX = Math.max(8, adjustedX)
  adjustedY = Math.max(8, adjustedY)
  
  editPopover.value = {
    visible: true,
    assignment,
    x: adjustedX,
    y: adjustedY,
    editedStart: assignment.start,
    editedEnd: assignment.end,
    editedAllocation: assignment.allocation
  }
}

function onCreatePopover(payload: { key: string; x: number; y: number; dayISO: string; person_id: string|null; project_id: string|null }) {
  closeEditPopover();
  
  // Calculate better positioning to avoid viewport edges
  const popoverWidth = 224 // 56 * 4 = 224px
  const popoverHeight = 150 // Approximate height
  let adjustedX = payload.x + 8
  let adjustedY = payload.y + 8
  
  // Adjust if popover would go off right edge
  if (adjustedX + popoverWidth > window.innerWidth) {
    adjustedX = payload.x - popoverWidth - 8
  }
  
  // Adjust if popover would go off bottom edge
  if (adjustedY + popoverHeight > window.innerHeight) {
    adjustedY = payload.y - popoverHeight - 8
  }
  
  // Ensure popover doesn't go off top or left edges
  adjustedX = Math.max(8, adjustedX)
  adjustedY = Math.max(8, adjustedY)
  
  createPopover.value = {
    ...payload,
    x: adjustedX,
    y: adjustedY
  }
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

// Add new project function
function addNewProject() {
  const projectName = window.prompt('Enter project name:', '')
  if (!projectName?.trim()) return // User cancelled or entered empty name
  
  // Check if project name already exists
  const exists = projects.value.some(p => p.name.toLowerCase() === projectName.trim().toLowerCase())
  if (exists) {
    alert('A project with this name already exists!')
    return
  }
  
  const newProject = store.createProject({ name: projectName.trim() })
  console.log(`Created new project: ${newProject.name} (${newProject.id})`)
}

// Add new person function
function addNewPerson() {
  const personName = window.prompt('Enter person name:', '')
  if (!personName?.trim()) return // User cancelled or entered empty name
  
  // Check if person name already exists
  const exists = people.value.some(p => p.name.toLowerCase() === personName.trim().toLowerCase())
  if (exists) {
    alert('A person with this name already exists!')
    return
  }
  
  const newPerson = store.createPerson({ name: personName.trim() })
  console.log(`Created new person: ${newPerson.name} (${newPerson.id})`)
}

// Provide assignments ref to children (RowGroup) for lane computation
const assignmentsKey = Symbol.for('assignmentsRef')
provide(assignmentsKey, assignments)

const gridEl = ref<HTMLElement | null>(null)
const scrollArea = ref<HTMLElement | null>(null)
const scrollLeft = ref(0)



const { onScroll, init, prependWeekdays, appendWeekdays } = useTimelineScroll(view, scrollArea)

function handleScroll() {
  if (scrollArea.value) {
    scrollLeft.value = scrollArea.value.scrollLeft
  }
  
  // Hide popovers when scrolling to prevent positioning issues
  closeEditPopover()
  closeCreatePopover()
  
  onScroll()
}

// Inject timeline events from app.vue
const timelineEvents = inject<{
  goToTodayEvent: Ref<string | null>
  addWeeksEvent: Ref<{ direction: 'previous' | 'next', weeks: number } | null>
}>('timelineEvents')

// Watch for go to today events
watch(() => timelineEvents?.goToTodayEvent.value, (todayISO) => {
  if (todayISO) {
    // Find today's index in the current days array
    const todayIndex = days.value.findIndex(d => d === todayISO)
    
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
})

// Watch for add weeks events
watch(() => timelineEvents?.addWeeksEvent.value, (data) => {
  if (data) {
    const { direction, weeks } = data
    
    // Convert weeks to weekdays (5 working days per week)
    const weekdays = weeks * 5
    
    if (direction === 'previous') {
      prependWeekdays(weekdays, true)
    } else {
      appendWeekdays(weekdays, true)
    }
  }
})
  
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
      if (createPopoverElement && !createPopoverElement.contains(event.target as Node) ) {
        closeCreatePopover()
      }
    }
  }

// Handle window scroll to hide popovers (prevents positioning issues)
const handleWindowScroll = () => {
  closeEditPopover()
  closeCreatePopover()
}

// Initialize timeline and auto-scroll to today
onMounted(async () => { 
  // Ensure we have a valid todayISO before calling init
  await init(todayISO);
  
  document.addEventListener('click', handleClickOutside)
  window.addEventListener('scroll', handleWindowScroll, { passive: true })
  
  // Auto-scroll to today on app initialization
  await nextTick()
  if (timelineEvents?.goToTodayEvent) {
    timelineEvents.goToTodayEvent.value = todayISO
    nextTick(() => {
      if (timelineEvents?.goToTodayEvent) {
        timelineEvents.goToTodayEvent.value = null
      }
    })
  }
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  window.removeEventListener('scroll', handleWindowScroll)
})
</script>
