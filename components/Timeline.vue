<template>
  <div class="flex-1 w-full h-full flex flex-col overflow-hidden relative">
    <!-- Scrollable content with aligned rows -->
    <div
      ref="scrollArea"
      class="overflow-auto h-full flex flex-col flex-1 border-y border-default rounded-md shadow-sm scrollbar-hidden"
      @scroll.passive="handleScroll"
    >
      <div class="relative"
        :style="{ width: timelineWidth+'px' }"
      >
      <TimelineHeader
        :days="days"
        :day-columns="dayColumns"
        :month-segments="monthSegments"
        :month-columns="monthColumns"
        :today-i-s-o="todayISO"
        :day-label="dayLabel"
        :px-per-day="view.px_per_day"
        :day-offsets="dayOffsets"
        :week-starts="weekStarts"      
        :view-mode="view.mode"
        :expanded="allExpanded"
        :has-data="hasData"
        @toggle-expand-all="toggleExpandAll"
      />
      <template v-if="view.mode==='person'">
        <VueDraggableNext
          :list="sortablePeople"
          item-key="id"
          handle=".group-drag-handle"
          @end="onPersonSortEnd"
          tag="div"
        >
          <RowGroup
            v-for="p in sortablePeople"
            :key="p.id"
            :label="p.name"
            :group-type="'person'"
            :group-id="p.id"
            :subrows="personSubrows(p.id)"
            :days="days"
            :px-per-day="view.px_per_day"
            :start-i-s-o="view.start"
            :projects-map="projectsMap"
            :people-map="peopleMap"
            @create="onCreate"
            @update="onUpdate"
            @create-from-sidebar="onAddFromSidebar"
            @edit="onEdit"
            @create-popover="onCreatePopover"
          />
        </VueDraggableNext>
      </template>
      <template v-else>
        <VueDraggableNext
          :list="sortableProjects"
          item-key="id"
          handle=".group-drag-handle"
          @end="onProjectSortEnd"
          tag="div"
        >
          <RowGroup
            v-for="proj in sortableProjects"
            :key="proj.id"
            :label="proj.name"
            :group-type="'project'"
            :group-id="proj.id"
            :subrows="projectSubrows(proj.id)"
            :days="days"
            :px-per-day="view.px_per_day"
            :start-i-s-o="view.start"
            :projects-map="projectsMap"
            :people-map="peopleMap"
            @create="onCreate"
            @update="onUpdate"
            @create-from-sidebar="onAddFromSidebar"
            @edit="onEdit"
            @create-popover="onCreatePopover"
          />
        </VueDraggableNext>
      </template>
      </div>

      <!-- empty rows filler -->
           <!-- Left: empty label -->
      <div
        style="width: 240px;"
        class="border-t pane-border absolute left-0 bottom-0 border-r-2  z-10 bg-default flex flex-col items-center justify-center gap-3 p-4"
      >
        <UButton 
          v-if="view.mode === 'project'"
          size="sm"
          color="primary"
          variant="outline"
          :leading-icon="'i-lucide-plus'"
          title="Add a new project"
          @click="addNewProject"
        >
          Add Project
        </UButton>
        
        <UButton 
          v-if="view.mode === 'person'"
          size="sm"
          color="primary"
          variant="outline"
          :leading-icon="'i-lucide-plus'"
          title="Add a new person"
          @click="addNewPerson"
        >
          Add Person
        </UButton>
      </div>
      <div class="grid empty-rows-filler sticky bottom-0 z-1" 
        style="grid-template-columns: 240px 1fr; height: 100%; left:240px;"
        :style="{ width: timelineWidth+'px' }"
        
      >    
        <!-- Right: empty timeline track with grid overlay -->
        <div
          class="relative border-b border-r pane-border w-full h-full"
          style="min-height: 60px;"
          :class="{ 'data-empty': people.length === 0 && projects.length === 0 }"
        >
          <GridOverlay
            :days="days"
            :px-per-day="view.px_per_day"
            :offsets="dayOffsets"
            :week-starts="weekStarts"
            
          />
        </div>
      </div> 
      <div class="empty-sidebar absolute z-1 top-0 bottom-0 bg-default border-r-2 pane-border" style="width: 240px;"></div>     
    </div>

    <div
      v-if="editOpen && editState"
      class="fixed inset-0 z-[1000] grid place-items-center bg-black/30"
    >
      <div class="bg-default text-default border border-default rounded-md shadow-lg w-[28rem] max-w-[95vw] p-4 overflow-visible">
        <div class="flex items-center justify-between text-sm font-medium mb-3">
          <div>Edit Assignment</div>
          <UButton
            color="neutral"
            variant="ghost"
            size="xs"
            :icon="'i-lucide-x'"
            aria-label="Close"
            @click="closeEditModal"
          />
        </div>
        <div class="space-y-3">
          <div class="flex items-center gap-2 text-sm">
            <label class="w-20">Start</label>
            <UInput
              v-model="editState.start"
              class="flex-1"
              type="date"
              size="xs"
            />
          </div>
          <div class="flex items-center gap-2 text-sm">
            <label class="w-20">End</label>
            <UInput
              v-model="editState.end"
              class="flex-1"
              type="date"
              size="xs"
            />
          </div>
          <div class="flex items-center gap-2 text-sm">
            <label class="w-20">Allocation</label>
            <USelect
              v-model="editState.allocation"
              class="flex-1"
              size="xs"
              :items="[
                { label: '100% (1)', value: 1 },
                { label: '75% (¾)', value: 0.75 },
                { label: '50% (½)', value: 0.5 },
                { label: '25% (¼)', value: 0.25 }
              ]"
            />
          </div>
        </div>
        <div class="flex justify-between mt-4 pt-3 border-t border-default">
          <UButton
            color="error"
            size="xs"
            @click="deleteAssignment"
          >
            Delete
          </UButton>
          <div class="flex gap-2">
            <UButton
              variant="outline"
              size="xs"
              @click="closeEditModal"
            >
              Cancel
            </UButton>
            <UButton
              color="neutral"
              size="xs"
              @click="saveAssignmentChanges"
            >
              Save
            </UButton>
          </div>
        </div>
      </div>
    </div>

    <!-- New Project dialog -->
    <div
      v-if="newProjectOpen"
      class="fixed inset-0 z-[1000] grid place-items-center bg-black/30"
    >
      <div class="bg-default text-default border border-default rounded-md shadow-lg w-[22rem] max-w-[95vw] p-3">
        <div class="text-sm font-medium mb-2">
          New project
        </div>
        <div class="space-y-2">
          <UFormField
            label="Name"
            help="Enter a unique project name"
          >
            <UInput
              v-model="newProjectName"
              size="xs"
              placeholder="e.g. Aurora"
            />
          </UFormField>
          <div
            v-if="newProjectError"
            class="text-xs text-error"
          >
            {{ newProjectError }}
          </div>
        </div>
        <div class="mt-3 flex justify-end gap-2">
          <UButton
            size="xs"
            variant="outline"
            @click="newProjectOpen=false"
          >
            Cancel
          </UButton>
          <UButton
            size="xs"
            color="primary"
            @click="confirmCreateProject"
          >
            Create
          </UButton>
        </div>
      </div>
    </div>

    <!-- New Person dialog -->
    <div
      v-if="newPersonOpen"
      class="fixed inset-0 z-[1000] grid place-items-center bg-black/30"
    >
      <div class="bg-default text-default border border-default rounded-md shadow-lg w-[22rem] max-w-[95vw] p-3">
        <div class="text-sm font-medium mb-2">
          New person
        </div>
        <div class="space-y-2">
          <UFormField
            label="Name"
            help="Enter a unique person name"
          >
            <UInput
              v-model="newPersonName"
              size="xs"
              placeholder="e.g. Ada"
            />
          </UFormField>
          <div
            v-if="newPersonError"
            class="text-xs text-error"
          >
            {{ newPersonError }}
          </div>
        </div>
        <div class="mt-3 flex justify-end gap-2">
          <UButton
            size="xs"
            variant="outline"
            @click="newPersonOpen=false"
          >
            Cancel
          </UButton>
          <UButton
            size="xs"
            color="primary"
            @click="confirmCreatePerson"
          >
            Create
          </UButton>
        </div>
      </div>
    </div>

    <!-- Delete assignment confirm -->
    <div
      v-if="deleteOpen"
      class="fixed inset-0 z-[1000] grid place-items-center bg-black/30"
    >
      <div class="bg-default text-default border border-default rounded-md shadow-lg w-[22rem] max-w-[95vw] p-3">
        <div class="text-sm font-medium mb-2">
          Delete assignment
        </div>
        <div class="text-sm">
          This action cannot be undone. Continue?
        </div>
        <div class="mt-3 flex justify-end gap-2">
          <UButton
            size="xs"
            variant="outline"
            @click="deleteOpen=false"
          >
            Cancel
          </UButton>
          <UButton
            size="xs"
            color="error"
            @click="confirmDeleteAssignment"
          >
            Delete
          </UButton>
        </div>
      </div>
    </div>

    <!-- Create popover (moved from RowGroup.vue) -->
    <div
      v-if="createOpen"
      class="fixed inset-0 z-[1000] grid place-items-center bg-black/30"
    >
      <div class="bg-default text-default border border-default rounded-md shadow-lg w-[22rem] max-w-[95vw] p-3 overflow-visible">
        <div class="flex items-center justify-between text-xs mb-2">
          <div>Quick create</div>
          <UButton
            size="xs"
            variant="outline"
            :icon="'i-lucide-x'"
            aria-label="Close"
            @click.stop="closeCreateModal"
          />
        </div>
        <div class="mt-1 flex items-center gap-2 text-sm">
          <label class="w-20">Durée</label>
          <UInput
            v-model.number="duration"
            size="xs"
            class="w-full"
            type="number"
            min="1"
          />
        </div>
        <div class="mt-2 flex items-center gap-2 text-sm">
          <label class="w-20">Allocation</label>
          <USelect
            v-model="allocation"
            size="xs"
            class="w-full"
            :items="[
              { label: '1', value: 1 },
              { label: '0.75', value: 0.75 },
              { label: '0.5', value: 0.5 },
              { label: '0.25', value: 0.25 }
            ]"
          />
        </div>
        <div class="mt-3 flex justify-end gap-2">
          <UButton
            size="xs"
            variant="outline"
            @click.stop="closeCreateModal"
          >
            Cancel
          </UButton>
          <UButton
            size="xs"
            color="neutral"
            @click.stop="confirmCreate"
          >
            Create
          </UButton>
        </div>
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
import GridOverlay from '@/components/internal/shared/GridOverlay.vue'
import { VueDraggableNext } from 'vue-draggable-next'

const store = usePlannerStore()
const { people, projects, view, assignments, peopleSortOrder, projectsSortOrder } = storeToRefs(store)
const hasData = computed(() => store.hasData)

// Sortable arrays for drag-and-drop reordering
const sortablePeople = ref<typeof people.value>([])
const sortableProjects = ref<typeof projects.value>([])

// Update sortable arrays when store data changes, respecting sort order
watch([people, peopleSortOrder], ([newPeople, sortOrder]) => {
  if (sortOrder.length === 0) {
    sortablePeople.value = [...newPeople]
  } else {
    // Sort according to stored order, placing unordered items at the end
    const ordered = sortOrder
      .map(id => newPeople.find(p => p.id === id))
      .filter(Boolean) as typeof newPeople
    const unordered = newPeople.filter(p => !sortOrder.includes(p.id))
    sortablePeople.value = [...ordered, ...unordered]
  }
}, { immediate: true })

watch([projects, projectsSortOrder], ([newProjects, sortOrder]) => {
  if (sortOrder.length === 0) {
    sortableProjects.value = [...newProjects]
  } else {
    // Sort according to stored order, placing unordered items at the end
    const ordered = sortOrder
      .map(id => newProjects.find(p => p.id === id))
      .filter(Boolean) as typeof newProjects
    const unordered = newProjects.filter(p => !sortOrder.includes(p.id))
    sortableProjects.value = [...ordered, ...unordered]
  }
}, { immediate: true })

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

// Timeline width calculation
const timelineWidth = computed(() => days.value.length * view.value.px_per_day)



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
  // Filter out time off project ID to prevent duplicates
  const regularProjIds = projIds.filter(pid => pid !== 'TIMEOFF')
  const rows = regularProjIds.map(pid => ({ key: `${personId}:${pid}`, label: projectName(pid), person_id: personId, project_id: pid }))
  
  // Add time off row for each person (first in the list)
  const timeOffRow = { key: `${personId}:TIMEOFF`, label: 'Time Off', person_id: personId, project_id: 'TIMEOFF', isTimeOff: true }
  
  return [timeOffRow, ...rows, { key: `${personId}:__add__`, label: 'Assign a project', person_id: personId, project_id: null }]
}
function projectSubrows(projectId: string) {
  const peopleIds = projectPeople(projectId)
  const rows = peopleIds.map(pers => ({ key: `${projectId}:${pers}`, label: personName(pers), person_id: pers, project_id: projectId }))
  return [...rows, { key: `${projectId}:__add__`, label: 'Ajouter une personne', person_id: null, project_id: projectId }]
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
  createOpen.value = false
}

function onAddFromSidebar(sr: { person_id: string|null; project_id: string|null }) {
  // Default create from start date with duration 5, allocation 1
  onCreate({ person_id: sr.person_id, project_id: sr.project_id, start: view.value.start, duration: 5, allocation: 1 })
}

// Edit modal state
const editOpen = ref(false)
const editState = ref<{ id: string; start: string; end: string; allocation: 1|0.75|0.5|0.25 } | null>(null)

// Create modal state
const createOpen = ref(false)
const createState = ref<{ dayISO: string; person_id: string|null; project_id: string|null } | null>(null)
// New entity dialogs
const newProjectOpen = ref(false)
const newPersonOpen = ref(false)
const newProjectName = ref('')
const newPersonName = ref('')
const newProjectError = ref('')
const newPersonError = ref('')
// Delete confirm
const deleteOpen = ref(false)
const duration = ref(5)
const allocation = ref(1 as 1|0.75|0.5|0.25)

function onEdit(payload: { assignment: any; x: number; y: number }) {
  createOpen.value = false
  editState.value = {
    id: payload.assignment.id,
    start: payload.assignment.start,
    end: payload.assignment.end,
    allocation: payload.assignment.allocation
  }
  editOpen.value = true
}

function onCreatePopover(payload: { key: string; x: number; y: number; dayISO: string; person_id: string|null; project_id: string|null }) {
  editOpen.value = false
  createState.value = { dayISO: payload.dayISO, person_id: payload.person_id, project_id: payload.project_id }
  createOpen.value = true
}

function closeEditModal() { editOpen.value = false }

function saveAssignmentChanges() {
  if (!editState.value) return
  const { id, start, end, allocation } = editState.value
  store.updateAssignment(id, { start, end, allocation })
  closeEditModal()
}

function deleteAssignment() {
  if (!editState.value) return
  deleteOpen.value = true
}
function confirmDeleteAssignment() {
  if (!editState.value) return
  store.deleteAssignment(editState.value.id)
  deleteOpen.value = false
  closeEditModal()
}

// Create popover functions
function confirmCreate() {
  if (!createState.value) return
  onCreate({ 
    person_id: createState.value.person_id, 
    project_id: createState.value.project_id, 
    start: createState.value.dayISO, 
    duration: duration.value, 
    allocation: allocation.value 
  })
  createOpen.value = false
}

function closeCreateModal() { createOpen.value = false }

// Add new project function
function addNewProject() {
  newProjectName.value = ''
  newProjectError.value = ''
  newProjectOpen.value = true
}
function confirmCreateProject() {
  const name = newProjectName.value.trim()
  if (!name) { newProjectError.value = 'Name is required'; return }
  const exists = projects.value.some(p => p.name.toLowerCase() === name.toLowerCase())
  if (exists) { newProjectError.value = 'Project already exists'; return }
  store.createProject({ name })
  newProjectOpen.value = false
}

// Add new person function
function addNewPerson() {
  newPersonName.value = ''
  newPersonError.value = ''
  newPersonOpen.value = true
}
function confirmCreatePerson() {
  const name = newPersonName.value.trim()
  if (!name) { newPersonError.value = 'Name is required'; return }
  const exists = people.value.some(p => p.name.toLowerCase() === name.toLowerCase())
  if (exists) { newPersonError.value = 'Person already exists'; return }
  store.createPerson({ name })
  newPersonOpen.value = false
}

// Provide assignments ref to children (RowGroup) for lane computation
const assignmentsKey = Symbol.for('assignmentsRef')
provide(assignmentsKey, assignments)

const scrollArea = ref<HTMLElement | null>(null)

const { onScroll, init, prependWeekdays, appendWeekdays } = useTimelineScroll(view, scrollArea)

function handleScroll() {
  // Hide modals when scrolling to keep UX coherent on large moves
  editOpen.value = false
  createOpen.value = false
  
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

// Watch for view mode changes and apply the correct expand/collapse state
watch(() => view.value.mode, (newMode) => {
  nextTick(() => {
    if (expandState.value[newMode]) {
      // Apply expand state
      rowGroupControls.expandAllToken.value = Date.now()
    } else {
      // Apply collapse state
      rowGroupControls.collapseAllToken.value = Date.now()
    }
  })
})

// Watch for go to today events
watch(() => timelineEvents?.goToTodayEvent.value, async (todayISO) => {
  if (todayISO) {
    // Find today's index in the current days array
    let todayIndex = days.value.findIndex(d => d === todayISO)
    
    // If today is not found in the current timeline, we need to ensure it's included
    if (todayIndex < 0) {
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
  
  // No external click handlers needed with UModal

// Function to calculate the date range needed to show all assignments
function calculateAssignmentDateRange() {
  if (assignments.value.length === 0) {
    return null
  }
  
  let earliestDate = assignments.value[0]!.start
  let latestDate = assignments.value[0]!.end
  
  for (const assignment of assignments.value) {
    if (assignment.start < earliestDate) earliestDate = assignment.start
    if (assignment.end > latestDate) latestDate = assignment.end
  }
  
  return { start: earliestDate, end: latestDate }
}

// Function to initialize timeline with assignment coverage
async function initTimelineWithAssignments() {
  const assignmentRange = calculateAssignmentDateRange()
  
  // Always start 20 days before today to ensure buffer space for drag operations
  const today = new Date(todayISO)
  const timelineStart = new Date(today)
  timelineStart.setUTCDate(timelineStart.getUTCDate() - 20)
  
  if (!assignmentRange) {
    // No assignments, create timeline from -20 days to +60 days from today
    const timelineEnd = new Date(today)
    timelineEnd.setUTCDate(timelineEnd.getUTCDate() + 60)
    
    view.value.start = timelineStart.toISOString().slice(0, 10)
    view.value.days = Math.floor((timelineEnd.getTime() - timelineStart.getTime()) / (1000 * 60 * 60 * 24)) + 1
    return
  }
  
  // Calculate end date to include all assignments with some padding
  const assignmentStart = new Date(assignmentRange.start)
  const assignmentEnd = new Date(assignmentRange.end)
  
  // Timeline starts 20 days before today, but extend if assignments go earlier
  const finalStart = new Date(Math.min(timelineStart.getTime(), assignmentStart.getTime() - 14 * 24 * 60 * 60 * 1000)) // 14 days padding before earliest assignment
  
  // Timeline ends at least 14 days after latest assignment or 60 days after today, whichever is later
  const minEndFromToday = new Date(today)
  minEndFromToday.setUTCDate(minEndFromToday.getUTCDate() + 60)
  const minEndFromAssignments = new Date(assignmentEnd)
  minEndFromAssignments.setUTCDate(minEndFromAssignments.getUTCDate() + 14)
  const finalEnd = new Date(Math.max(minEndFromToday.getTime(), minEndFromAssignments.getTime()))
  
  // Calculate total days
  const totalDays = Math.floor((finalEnd.getTime() - finalStart.getTime()) / (1000 * 60 * 60 * 24)) + 1
  
  view.value.start = finalStart.toISOString().slice(0, 10)
  view.value.days = Math.min(365, Math.max(35, totalDays))
}

// Watch for assignment changes and re-initialize timeline if needed
watch(assignments, async (_newAssignments) => {
  const assignmentRange = calculateAssignmentDateRange()
  if (!assignmentRange) return
  
  // Check if any assignments are outside current timeline view
  const currentStart = view.value.start
  const currentEnd = addDaysISO(currentStart, view.value.days - 1)
  
  const needsExpansion = assignmentRange.start < currentStart || assignmentRange.end > currentEnd
  
  if (needsExpansion) {
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
  // Initialize timeline considering existing assignments (includes extra buffer for drag operations)
  await initTimelineWithAssignments()
  
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

// Expand/Collapse state and handlers (separate for each view)
const expandState = ref({
  person: true,  // Default to expanded for person view
  project: true  // Default to expanded for project view
})

// Computed property to get current view's expand state
const allExpanded = computed(() => expandState.value[view.value.mode])

function expandAll() { 
  rowGroupControls.expandAllToken.value = Date.now()
  expandState.value[view.value.mode] = true
}

function collapseAll() { 
  rowGroupControls.collapseAllToken.value = Date.now()
  expandState.value[view.value.mode] = false
}

function toggleExpandAll() {
  if (allExpanded.value) {
    collapseAll()
  } else {
    expandAll()
  }
}

// Drag-and-drop sort handlers
function onPersonSortEnd() {
  const newOrder = sortablePeople.value.map(p => p.id)
  store.updatePeopleSortOrder(newOrder)
}

function onProjectSortEnd() {
  const newOrder = sortableProjects.value.map(p => p.id)
  store.updateProjectsSortOrder(newOrder)
}
</script>
