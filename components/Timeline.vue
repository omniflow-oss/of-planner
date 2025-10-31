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
              <UButton 
                v-if="view.mode === 'project'"
                size="xs"
                color="primary"
                @click="addNewProject"
                :leading-icon="'i-lucide-plus'"
                title="Add a new project to the timeline"
              >
                Add Project
              </UButton>
            <!-- Add Person Button (only show in people view) -->
            <UButton 
              v-if="view.mode === 'person'"
              size="xs"
              color="primary"
              @click="addNewPerson"
              :leading-icon="'i-lucide-plus'"
              title="Add a new person to the timeline"
            >
              Add Person
            </UButton>
            <!-- Expand/Collapse all -->
            <span class="mx-1 w-px h-4 bg-slate-200"></span>
            <UButton size="xs" variant="outline" color="neutral" :leading-icon="'i-lucide-chevrons-down'" @click="expandAll()">Expand all</UButton>
            <UButton size="xs" variant="outline" color="neutral" :leading-icon="'i-lucide-chevrons-up'" @click="collapseAll()">Collapse all</UButton>
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
    <div ref="scrollArea" class="overflow-auto h-full flex-1 border-y border-default rounded-md shadow-sm" @scroll.passive="handleScroll">
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


      <div v-if="editOpen && editState" class="fixed inset-0 z-[1000] grid place-items-center bg-black/30">
        <div class="bg-default text-default border border-default rounded-md shadow-lg w-[28rem] max-w-[95vw] p-4">
          <div class="flex items-center justify-between text-sm font-medium mb-3">
            <div>Edit Assignment</div>
            <UButton color="neutral" variant="ghost" size="xs" :icon="'i-lucide-x'" aria-label="Close" @click="closeEditModal" />
          </div>
          <div class="space-y-3">
            <div class="flex items-center gap-2 text-sm">
              <label class="w-20">Start</label>
              <UInput class="flex-1" type="date" v-model="editState.start" size="xs" />
            </div>
            <div class="flex items-center gap-2 text-sm">
              <label class="w-20">End</label>
              <UInput class="flex-1" type="date" v-model="editState.end" size="xs" />
            </div>
            <div class="flex items-center gap-2 text-sm">
              <label class="w-20">Allocation</label>
              <USelect class="flex-1" size="xs" v-model="editState.allocation" :options="[
                { label: '100% (1)', value: 1 },
                { label: '75% (¾)', value: 0.75 },
                { label: '50% (½)', value: 0.5 },
                { label: '25% (¼)', value: 0.25 }
              ]" />
            </div>
          </div>
          <div class="flex justify-between mt-4 pt-3 border-t border-default">
            <UButton color="error" size="xs" @click="deleteAssignment">Delete</UButton>
            <div class="flex gap-2">
              <UButton variant="outline" size="xs" @click="closeEditModal">Cancel</UButton>
              <UButton color="neutral" size="xs" @click="saveAssignmentChanges">Save</UButton>
            </div>
          </div>
        </div>
      </div>

      <!-- New Project dialog -->
      <div v-if="newProjectOpen" class="fixed inset-0 z-[1000] grid place-items-center bg-black/30">
        <div class="bg-default text-default border border-default rounded-md shadow-lg w-[22rem] max-w-[95vw] p-3">
          <div class="text-sm font-medium mb-2">New project</div>
          <div class="space-y-2">
            <UFormField label="Name" help="Enter a unique project name">
              <UInput v-model="newProjectName" size="xs" placeholder="e.g. Aurora" />
            </UFormField>
            <div v-if="newProjectError" class="text-xs text-error">{{ newProjectError }}</div>
          </div>
          <div class="mt-3 flex justify-end gap-2">
            <UButton size="xs" variant="outline" @click="newProjectOpen=false">Cancel</UButton>
            <UButton size="xs" color="primary" @click="confirmCreateProject">Create</UButton>
          </div>
        </div>
      </div>

      <!-- New Person dialog -->
      <div v-if="newPersonOpen" class="fixed inset-0 z-[1000] grid place-items-center bg-black/30">
        <div class="bg-default text-default border border-default rounded-md shadow-lg w-[22rem] max-w-[95vw] p-3">
          <div class="text-sm font-medium mb-2">New person</div>
          <div class="space-y-2">
            <UFormField label="Name" help="Enter a unique person name">
              <UInput v-model="newPersonName" size="xs" placeholder="e.g. Ada" />
            </UFormField>
            <div v-if="newPersonError" class="text-xs text-error">{{ newPersonError }}</div>
          </div>
          <div class="mt-3 flex justify-end gap-2">
            <UButton size="xs" variant="outline" @click="newPersonOpen=false">Cancel</UButton>
            <UButton size="xs" color="primary" @click="confirmCreatePerson">Create</UButton>
          </div>
        </div>
      </div>

      <!-- Delete assignment confirm -->
      <div v-if="deleteOpen" class="fixed inset-0 z-[1000] grid place-items-center bg-black/30">
        <div class="bg-default text-default border border-default rounded-md shadow-lg w-[22rem] max-w-[95vw] p-3">
          <div class="text-sm font-medium mb-2">Delete assignment</div>
          <div class="text-sm">This action cannot be undone. Continue?</div>
          <div class="mt-3 flex justify-end gap-2">
            <UButton size="xs" variant="outline" @click="deleteOpen=false">Cancel</UButton>
            <UButton size="xs" color="error" @click="confirmDeleteAssignment">Delete</UButton>
          </div>
        </div>
      </div>

    <!-- Create popover (moved from RowGroup.vue) -->
    <div v-if="createOpen" class="fixed inset-0 z-[1000] grid place-items-center bg-black/30">
      <div class="bg-default text-default border border-default rounded-md shadow-lg w-[22rem] max-w-[95vw] p-3">
        <div class="flex items-center justify-between text-xs mb-2">
          <div>Quick create</div>
          <UButton size="xs" variant="outline" :icon="'i-lucide-x'" aria-label="Close" @click.stop="closeCreateModal" />
        </div>
        <div class="mt-1 flex items-center gap-2 text-sm">
          <label class="w-20">Durée</label>
          <UInput size="xs" class="w-full" type="number" v-model.number="duration" min="1" />
        </div>
        <div class="mt-2 flex items-center gap-2 text-sm">
          <label class="w-20">Allocation</label>
          <USelect size="xs" class="w-full" v-model="allocation" :options="[
            { label: '1', value: 1 },
            { label: '0.75', value: 0.75 },
            { label: '0.5', value: 0.5 },
            { label: '0.25', value: 0.25 }
          ]" />
        </div>
        <div class="mt-3 flex justify-end gap-2">
          <UButton size="xs" variant="outline" @click.stop="closeCreateModal">Cancel</UButton>
          <UButton size="xs" color="neutral" @click.stop="confirmCreate">Create</UButton>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { usePlannerStore } from '@/stores/usePlannerStore'
import { addBusinessDaysISO } from '@/composables/useDate'
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
  return [...rows, { key: `${personId}:__add__`, label: 'Assigner un projet', person_id: personId, project_id: null }]
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
const scrollLeft = ref(0)



const { onScroll, init, prependWeekdays, appendWeekdays } = useTimelineScroll(view, scrollArea)

function handleScroll() {
  if (scrollArea.value) {
    scrollLeft.value = scrollArea.value.scrollLeft
  }
  
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

// Watch for go to today events
watch(() => timelineEvents?.goToTodayEvent.value, async (todayISO) => {
  if (todayISO) {
    // Find today's index in the current days array
    let todayIndex = days.value.findIndex(d => d === todayISO)
    
    // If today's index is too high (suggesting timeline has expanded too much), 
    // or if today is not found, reinitialize the timeline
    if (todayIndex < 0 || todayIndex > 25) { // 25 is roughly where today should be in a 35-day range
      await init(todayISO)
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

// Initialize timeline and auto-scroll to today
onMounted(async () => { 
  // Ensure we have a valid todayISO before calling init
  await init(todayISO);
  
  // No global listeners needed here
  
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
  // No cleanup necessary for modal listeners
})

// Expand/Collapse handlers
function expandAll() { rowGroupControls.expandAllToken.value = Date.now() }
function collapseAll() { rowGroupControls.collapseAllToken.value = Date.now() }
</script>
