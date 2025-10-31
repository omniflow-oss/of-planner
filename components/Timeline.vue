<template>
  <div class="flex-1 w-full flex flex-col">
    <!-- Control panel -->
    <div class="border-b border-slate-200 px-3 py-3">
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
      <!-- Expand/Collapse all -->
      <span class="mx-1 w-px h-4 bg-slate-200"></span>
      <button @click="expandAll()" class="px-2 py-1 text-[11px] border border-slate-200 rounded hover:bg-slate-50">Expand all</button>
      <button @click="collapseAll()" class="px-2 py-1 text-[11px] border border-slate-200 rounded hover:bg-slate-50">Collapse all</button>
      </div>          
    </div>

    <!-- Scrollable content with header and rows -->
    <div ref="scrollArea" class="overflow-auto h-full flex-1 border-y border-slate-200 rounded-md shadow-sm" @scroll.passive="handleScroll">
      <!-- Timeline Header inside scrollable area -->
      
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
        />
      
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
import { addBusinessDaysISO, addDaysISO } from '@/composables/useDate'
import { useTimeline } from '@/composables/useTimeline'
import { useTimelineScroll } from '@/composables/useTimelineScroll'
import TimelineHeader from '@/components/timeline/TimelineHeader.vue'
import RowGroup from '@/components/internal/RowGroup.vue'

const store = usePlannerStore()
const { people, projects, view, assignments } = storeToRefs(store)

const {
  todayISO,
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
  
  // Duration represents business days, so calculate end date by adding business days
  const end = addBusinessDaysISO(start, Math.max(1, duration) - 1)
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
}

// Provide assignments ref to children (RowGroup) for lane computation
const assignmentsKey = Symbol.for('assignmentsRef')
provide(assignmentsKey, assignments)

const scrollArea = ref<HTMLElement | null>(null)

const { onScroll, init, prependWeekdays, appendWeekdays } = useTimelineScroll(view, scrollArea)

function handleScroll() {
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

// Expand/Collapse all controls provided to RowGroup
const rowGroupControls = {
  expandAllToken: ref<number>(0),
  collapseAllToken: ref<number>(0),
}
provide('rowGroupControls', rowGroupControls)

// Watch for go to today events
watch(() => timelineEvents?.goToTodayEvent.value, async (todayISO) => {
  if (todayISO) {
    // Find today's index in the current days array
    let todayIndex = days.value.findIndex(d => d === todayISO)
    
    // If today is not found in the current timeline, we need to ensure it's included
    if (todayIndex < 0) {
      console.log('Timeline: Today not found in current view, reinitializing with assignments')
      await initTimelineWithAssignments()
      await nextTick()
      todayIndex = days.value.findIndex(d => d === todayISO)
    }
    
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

// Function to calculate the date range needed to show all assignments
function calculateAssignmentDateRange() {
  if (assignments.value.length === 0) {
    return null
  }
  
  let earliestDate = assignments.value[0].start
  let latestDate = assignments.value[0].end
  
  for (const assignment of assignments.value) {
    if (assignment.start < earliestDate) earliestDate = assignment.start
    if (assignment.end > latestDate) latestDate = assignment.end
  }
  
  return { start: earliestDate, end: latestDate }
}

// Function to initialize timeline with assignment coverage
async function initTimelineWithAssignments() {
  const assignmentRange = calculateAssignmentDateRange()
  
  if (!assignmentRange) {
    // No assignments, use default initialization around today
    await init(todayISO)
    return
  }
  
  // Calculate how many days we need to cover all assignments with some padding
  const today = new Date(todayISO)
  const startDate = new Date(Math.min(new Date(assignmentRange.start).getTime(), today.getTime()))
  const endDate = new Date(Math.max(new Date(assignmentRange.end).getTime(), today.getTime()))
  
  // Add padding: 2 weeks before earliest and 2 weeks after latest
  startDate.setUTCDate(startDate.getUTCDate() - 14)
  endDate.setUTCDate(endDate.getUTCDate() + 14)
  
  // Convert back to ISO dates
  const paddedStart = startDate.toISOString().slice(0, 10)
  const paddedEnd = endDate.toISOString().slice(0, 10)
  
  // Calculate the number of calendar days needed
  const totalDays = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
  
  // Ensure we always include today in the range
  const todayDate = new Date(todayISO)
  if (todayDate < startDate || todayDate > endDate) {
    console.log('Timeline: Expanding range to include today')
    const expandedStart = new Date(Math.min(startDate.getTime(), todayDate.getTime()))
    const expandedEnd = new Date(Math.max(endDate.getTime(), todayDate.getTime()))
    const expandedTotalDays = Math.floor((expandedEnd.getTime() - expandedStart.getTime()) / (1000 * 60 * 60 * 24)) + 1
    
    view.value.start = expandedStart.toISOString().slice(0, 10)
    view.value.days = Math.min(365, Math.max(35, expandedTotalDays))
  } else {
    view.value.start = paddedStart
    view.value.days = Math.min(365, Math.max(35, totalDays))
  }
  
  console.log('Timeline: Initialized with assignment range', {
    assignmentRange,
    paddedStart,
    paddedEnd,
    totalDays: view.value.days,
    assignmentCount: assignments.value.length
  })
}

// Watch for assignment changes and re-initialize timeline if needed
watch(assignments, async (newAssignments) => {
  const assignmentRange = calculateAssignmentDateRange()
  if (!assignmentRange) return
  
  // Check if any assignments are outside current timeline view
  const currentStart = view.value.start
  const currentEnd = addDaysISO(currentStart, view.value.days - 1)
  
  const needsExpansion = assignmentRange.start < currentStart || assignmentRange.end > currentEnd
  
  if (needsExpansion) {
    console.log('Timeline: Assignments outside current range, expanding timeline')
    await initTimelineWithAssignments()
    
    // Auto-scroll to today after expansion
    await nextTick()
    if (timelineEvents?.goToTodayEvent) {
      timelineEvents.goToTodayEvent.value = todayISO
      nextTick(() => {
        if (timelineEvents?.goToTodayEvent) {
          timelineEvents.goToTodayEvent.value = null
        }
      })
    }
  }
}, { deep: true })

// Initialize timeline and auto-scroll to today
onMounted(async () => { 
  // Initialize timeline considering existing assignments
  await initTimelineWithAssignments()
  
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

// Expand/Collapse handlers
function expandAll() { rowGroupControls.expandAllToken.value = Date.now() }
function collapseAll() { rowGroupControls.collapseAllToken.value = Date.now() }
</script>
