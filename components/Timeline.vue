<template>
  <div class="flex-1 w-full h-full flex flex-col overflow-hidden relative">
    <!-- Scrollable content with aligned rows -->
    <div
      ref="scrollArea"
      class="overflow-auto h-full flex flex-col flex-1 border-y border-default rounded-md shadow-sm "
      @scroll.passive="handleScroll"
    >
      <div
        class="relative"
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
            tag="div"
            @end="sorting.onPersonSortEnd"
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
              @create="actions.onCreate"
              @update="actions.onUpdate"
              @create-from-sidebar="(sr: any) => actions.onAddFromSidebar(sr, view.start)"
              @edit="handleEdit"
              @create-popover="handleCreatePopover"
              @edit-project="handleEditProject"
              @edit-person="handleEditPerson"
              @project-click="handleProjectClick"
            />
          </VueDraggableNext>
        </template>
        <template v-else>
          <VueDraggableNext
            :list="sortableProjects"
            item-key="id"
            handle=".group-drag-handle"
            tag="div"
            @end="sorting.onProjectSortEnd"
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
              @create="actions.onCreate"
              @update="actions.onUpdate"
              @create-from-sidebar="(sr: any) => actions.onAddFromSidebar(sr, view.start)"
              @edit="handleEdit"
              @create-popover="handleCreatePopover"
              @edit-project="handleEditProject"
              @edit-person="handleEditPerson"
              @person-click="handlePersonClick"
            />
          </VueDraggableNext>
        </template>
      </div>

      <!-- Empty rows filler -->
      <div
        ref="addButtons"
        style="width: 240px; height:59px;"
        :style="{ bottom: addButtonsBottomStyle }"
        class="border-t-2 pane-border absolute left-0 border-r-2 border-b-2 z-10 bg-default flex flex-col items-center justify-center gap-3 p-4"
      >
        <UButton 
          v-if="view.mode === 'project'"
          size="sm"
          color="primary"
          variant="outline"
          :leading-icon="'i-lucide-plus'"
          title="Add a new project"
          @click="modals.openNewProjectModal"
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
          @click="modals.openNewPersonModal"
        >
          Add Person
        </UButton>
      </div>
      
      <div
        class="grid empty-rows-filler sticky bottom-0 z-1"
        style="grid-template-columns: 240px 1fr; height: 100%; left:240px;"
        :style="{ width: timelineWidth+'px' }"
      >    
        <div
          class="relative border-b border-r pane-border w-full h-full"
          style="min-height: 58px;"
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
      <div
        class="empty-sidebar absolute z-1 top-0 bottom-10 bg-default border-r-2 pane-border"
        style="width: 240px;"
      />     
    </div>

    <!-- Modals -->
    <EditModal
      :open="modals.editOpen.value"
      :edit-state="modals.editState.value"
      @close="modals.closeEditModal"
      @save="handleSaveEdit"
      @delete="handleDirectDelete"
    />
    
    <CreateModal
      :open="modals.createOpen.value"
      :create-state="modals.createState.value"
      @close="handleCloseCreate"
      @create="handleConfirmCreate"
    />
    
    <NewProjectModal
      :open="modals.newProjectOpen.value"
      :external-error="modals.newProjectError.value"
      @close="modals.closeNewProjectModal"
      @create="handleCreateProject"
    />
    
    <NewPersonModal
      :open="modals.newPersonOpen.value"
      :external-error="modals.newPersonError.value"
      @close="modals.closeNewPersonModal"
      @create="handleCreatePerson"
    />
    
    <EditProjectModal
      :open="editProjectOpen"
      :project="editingProject"
      :has-assignments="projectHasAssignments"
      @close="() => { editProjectOpen = false; editingProject = null }"
      @save="handleSaveProjectEdit"
      @delete="handleDeleteProject"
    />
    
    <EditPersonModal
      :open="editPersonOpen"
      :person="editingPerson"
      :has-assignments="personHasAssignments"
      :existing-names="existingPersonNames"
      @close="() => { editPersonOpen = false; editingPerson = null }"
      @save="handleSavePersonEdit"
      @delete="handleDeletePerson"
    />
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { usePlannerStore } from '@/stores/usePlannerStore'
import { addDaysISO } from '@/composables/useDate'
import { useTimeline } from '@/composables/useTimeline'
import { useTimelineScroll } from '@/composables/useTimelineScroll'
import { useTimelineActions } from '@/composables/useTimelineActions'
import { useTimelineModals } from '@/composables/useTimelineModals'
import { useTimelineSorting } from '@/composables/useTimelineSorting'
import TimelineHeader from '@/components/timeline/TimelineHeader.vue'
import RowGroup from '@/components/internal/RowGroup.vue'
import GridOverlay from '@/components/internal/shared/GridOverlay.vue'
import EditModal from '@/components/timeline/EditModal.vue'
import CreateModal from '@/components/timeline/CreateModal.vue'
import NewProjectModal from '@/components/timeline/NewProjectModal.vue'
import NewPersonModal from '@/components/timeline/NewPersonModal.vue'
import EditProjectModal from '@/components/timeline/EditProjectModal.vue'
import EditPersonModal from '@/components/timeline/EditPersonModal.vue'
import { VueDraggableNext } from 'vue-draggable-next'

const store = usePlannerStore()
const { people, projects, view, assignments } = storeToRefs(store)
const hasData = computed(() => store.hasData)

// Composables
const actions = useTimelineActions()
const modals = useTimelineModals()
const sorting = useTimelineSorting()

// Force reactivity by using computed properties
const sortablePeople = computed(() => sorting.sortablePeople.value)
const sortableProjects = computed(() => sorting.sortableProjects.value)

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

const projectsMap = computed(() => Object.fromEntries(projects.value.map(p => [p.id, p])))
const peopleMap = computed(() => Object.fromEntries(people.value.map(p => [p.id, p])))
const timelineWidth = computed(() => days.value.length * view.value.px_per_day)

const addButtons = ref<HTMLElement | null>(null)

// Calculate scrollbar height and position addButtons accordingly
const addButtonsBottomStyle = ref('0px')

function updateAddButtonsPosition() {
  if (scrollArea.value) {
    // Calculate scrollbar height (difference between offsetHeight and clientHeight)
    const scrollbarHeight = scrollArea.value.offsetHeight - scrollArea.value.clientHeight
    addButtonsBottomStyle.value = `${scrollbarHeight}px`
  }
}

// Subrow logic
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
  const regularProjIds = projIds.filter(pid => pid !== 'TIMEOFF')
  const rows = regularProjIds.map(pid => ({ key: `${personId}:${pid}`, label: projectName(pid), person_id: personId, project_id: pid }))
  const timeOffRow = { key: `${personId}:TIMEOFF`, label: 'Time Off', person_id: personId, project_id: 'TIMEOFF', isTimeOff: true }
  return [timeOffRow, ...rows, { key: `${personId}:__add__`, label: 'Assign a project', person_id: personId, project_id: null }]
}
function projectSubrows(projectId: string) {
  const peopleIds = projectPeople(projectId)
  const rows = peopleIds.map(pers => ({ key: `${projectId}:${pers}`, label: personName(pers), person_id: pers, project_id: projectId }))
  return [...rows, { key: `${projectId}:__add__`, label: 'Add person', person_id: null, project_id: projectId }]
}
function projectName(id: string) { return projects.value.find(p => p.id === id)?.name ?? id }
function personName(id: string) { return people.value.find(p => p.id === id)?.name ?? id }

// Modal handlers
function handleEdit(payload: { assignment: any; x: number; y: number }) {
  modals.openEditModal(payload.assignment)
}

function handleCreatePopover(payload: { key: string; x: number; y: number; dayISO: string; person_id: string|null; project_id: string|null }) {
  modals.openCreateModal({ dayISO: payload.dayISO, person_id: payload.person_id, project_id: payload.project_id })
}

function handleSaveEdit(editData: { start: string; end: string; allocation: 1|0.75|0.5|0.25 }) {
  if (!modals.editState.value) return
  const { id } = modals.editState.value
  const { start, end, allocation } = editData
  actions.updateAssignment(id, { start, end, allocation })
  modals.closeEditModal()
}

function handleDirectDelete() {
  if (!modals.editState.value) return
  actions.deleteAssignment(modals.editState.value.id)
  modals.closeEditModal()
}

function handleCloseCreate() {
  modals.closeCreateModal()
}

function handleConfirmCreate(payload: { person_id: string|null; project_id: string|null; start: string; duration: number; allocation: 1|0.75|0.5|0.25 }) {
  actions.onCreate(payload)
  modals.closeCreateModal()
}

function handleCreateProject(input: { name: string; estimatedDays: number | null }) {
  try {
    actions.createProject(input)
    modals.closeNewProjectModal()
    
    // Scroll to bottom to show the new project
    nextTick(() => {
      if (scrollArea.value) {
        scrollArea.value.scrollTo({
          top: scrollArea.value.scrollHeight,
          behavior: 'smooth'
        })
      }
    })
  } catch (error) {
    // Display error message to user in the modal
    const errorMessage = error instanceof Error ? error.message : 'Failed to create project'
    modals.setNewProjectError(errorMessage)
  }
}

// Edit project modal state
const editProjectOpen = ref(false)
const editingProject = ref<{ id: string; name: string; estimatedDays?: number | null } | null>(null)

// Check if project has assignments
const projectHasAssignments = computed(() => {
  if (!editingProject.value) return false
  return assignments.value.some(a => a.project_id === editingProject.value!.id)
})

// Edit person modal state
const editPersonOpen = ref(false)
const editingPerson = ref<{ id: string; name: string } | null>(null)

// Check if person has assignments
const personHasAssignments = computed(() => {
  if (!editingPerson.value) return false
  return assignments.value.some(a => a.person_id === editingPerson.value!.id)
})

// Get existing person names for validation
const existingPersonNames = computed(() => {
  return people.value.map(p => p.name)
})

function handleEditProject(projectId: string) {
  const project = store.projects.find(p => p.id === projectId)
  if (project) {
    editingProject.value = {
      id: project.id,
      name: project.name,
      estimatedDays: project.estimatedDays || null
    }
    editProjectOpen.value = true
  }
}

function handleSaveProjectEdit(data: { id: string; estimatedDays: number | null }) {
  try {
    actions.updateProject(data.id, { estimatedDays: data.estimatedDays })
    editProjectOpen.value = false
    editingProject.value = null
  } catch (error) {
    console.error('Failed to update project:', error)
  }
}

function handleDeleteProject(projectId: string) {
  try {
    actions.deleteProject(projectId)
    editProjectOpen.value = false
    editingProject.value = null
  } catch (error) {
    console.error('Failed to delete project:', error)
  }
}

function handleEditPerson(personId: string) {
  const person = store.people.find(p => p.id === personId)
  if (person) {
    editingPerson.value = {
      id: person.id,
      name: person.name
    }
    editPersonOpen.value = true
  }
}

function handleSavePersonEdit(data: { id: string; name: string }) {
  try {
    actions.updatePerson(data.id, { name: data.name })
    editPersonOpen.value = false
    editingPerson.value = null
  } catch (error) {
    console.error('Failed to update person:', error)
  }
}

function handleDeletePerson(personId: string) {
  try {
    actions.deletePerson(personId)
    editPersonOpen.value = false  
    editingPerson.value = null
  } catch (error) {
    console.error('Failed to delete person:', error)
  }
}

// Generic function to handle view switching and scrolling to a specific item
function handleViewSwitchAndScroll(targetId: string, targetMode: 'person' | 'project') {
  // Switch to the target view mode
  store.switchMode(targetMode)
  
  // Wait for the view to update then scroll to the target item
  nextTick(() => {
    // Wait a bit more for the DOM to fully render with the new view
    setTimeout(() => {
      if (!scrollArea.value) return
      
      // Try to find the actual DOM element for the target group
      const targetSelector = `.drag-group-row[data-group-id="${targetId}"]`
      const groupElement = scrollArea.value.querySelector(targetSelector) as HTMLElement
      
      if (groupElement) {
        // Use the actual DOM element position for precise scrolling
        const containerRect = scrollArea.value.getBoundingClientRect()
        const targetRect = groupElement.getBoundingClientRect()
        const currentScrollTop = scrollArea.value.scrollTop
        
        // Calculate the position relative to the scroll container
        const targetScrollPosition = currentScrollTop + (targetRect.top - containerRect.top)
        
        // Account for sticky header height - find the TimelineHeader element
        const headerElement = scrollArea.value.querySelector('.header-grid') as HTMLElement
        const headerHeight = headerElement ? headerElement.offsetHeight : 0
        
        // Add some offset to show the target below the sticky header with padding
        const scrollOffset = headerHeight + 10 // header height + 10px padding
        
        scrollArea.value.scrollTo({
          top: Math.max(0, targetScrollPosition - scrollOffset),
          behavior: 'smooth'
        })
      } else {
        // Fallback to approximate calculation if DOM element not found
        const sortedList = targetMode === 'person' ? sortablePeople.value : sortableProjects.value
        const targetIndex = sortedList.findIndex(item => item.id === targetId)
        
        if (targetIndex >= 0) {
          // Use a more conservative estimate
          const approximateRowHeight = 150
          const scrollPosition = targetIndex * approximateRowHeight
          
          scrollArea.value.scrollTo({
            top: scrollPosition,
            behavior: 'smooth'
          })
        }
      }
    }, 100) // Small delay to ensure DOM is fully rendered
  })
}

// Handle click on project name to switch view and scroll to project
function handleProjectClick(projectId: string) {
  handleViewSwitchAndScroll(projectId, 'project')
}

// Handle click on person name to switch view and scroll to person
function handlePersonClick(personId: string) {
  handleViewSwitchAndScroll(personId, 'person')
}

function handleCreatePerson(name: string) {
  try {
    actions.createPerson(name)
    modals.closeNewPersonModal()
    
    // Scroll to bottom to show the new person
    nextTick(() => {
      if (scrollArea.value) {
        scrollArea.value.scrollTo({
          top: scrollArea.value.scrollHeight,
          behavior: 'smooth'
        })
      }
    })
  } catch (error) {
    // Display error message to user in the modal
    const errorMessage = error instanceof Error ? error.message : 'Failed to create person'
    modals.setNewPersonError(errorMessage)
  }
}

// Removed: All modal state and handlers are now managed by useTimelineModals composable

// Provide assignments ref to children (RowGroup) for lane computation
const assignmentsKey = Symbol.for('assignmentsRef')
provide(assignmentsKey, assignments)

const scrollArea = ref<HTMLElement | null>(null)

const { onScroll, init: _init, prependWeekdays, appendWeekdays } = useTimelineScroll(view, scrollArea)

function handleScroll() {
  // Hide modals when scrolling to keep UX coherent on large moves
  modals.closeAllModals()
  
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
  
  // Update addButtons position based on scrollbar height
  await nextTick()
  updateAddButtonsPosition()
  
  // Auto-scroll to today on app initialization
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

// Drag-and-drop sort handlers are now provided by useTimelineSorting composable
</script>
