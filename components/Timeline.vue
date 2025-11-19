<template>
  <div class="flex-1 w-full h-full flex flex-col overflow-hidden relative">
    <!-- Scrollable content with aligned rows -->
    <div
      ref="scrollArea"
      class="overflow-auto h-full flex flex-col flex-1 border-y border-default rounded-md shadow-sm relative"
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
              @collapse-toggle-row="setTimelineHeight"
              @create="actions.onCreate"
              @update="actions.onUpdate"
              @create-from-sidebar="(sr: any) => actions.onAddFromSidebar(sr, getTodayWorkingDay())"
              @open-new-project="modals.openNewProjectModal"
              @open-new-person="modals.openNewPersonModal"
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
              @create-from-sidebar="(sr: any) => actions.onAddFromSidebar(sr, getTodayWorkingDay())"
              @open-new-project="modals.openNewProjectModal"
              @open-new-person="modals.openNewPersonModal"
              @edit="handleEdit"
              @create-popover="handleCreatePopover"
              @edit-project="handleEditProject"
              @edit-person="handleEditPerson"
              @person-click="handlePersonClick"
            />
          </VueDraggableNext>
        </template>
      </div>
      
      <div
        class="grid empty-rows-filler absolute top-0 z-0"
        style="grid-template-columns: 280px 1fr; min-height: 100%; left:280px;"
        :style="{ width: timelineWidth+'px', height: timelineHeight }"
      >    
        <div
          class="relative  border-r pane-border w-full h-full"
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
    </div>
    <!-- Empty rows filler -->
    <div
      v-if="!store.isReadOnly || (people.length === 0 && projects.length === 0)"
      ref="addButtons"
      style="width: 280px; height:59px;"
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
      class="empty-sidebar absolute z-1 top-0 bg-default border-r-2 pane-border"
      style="width: 280px;bottom:25px;"
    ></div>    
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
      :projects="projects"
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
import { useTimeline } from '@/composables/useTimeline'
import { useTimelineScroll } from '@/composables/useTimelineScroll'
import { useTimelineActions } from '@/composables/useTimelineActions'
import { useTimelineModals } from '@/composables/useTimelineModals'
import { useTimelineSorting } from '@/composables/useTimelineSorting'
import { useTimelineInit } from '@/composables/useTimelineInit'
import { useViewNavigation } from '@/composables/useViewNavigation'
import { useSubrows } from '@/composables/useSubrows'
import { useTimelineHandlers } from '@/composables/useTimelineHandlers'
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
import { addDaysISO, isWeekendISO } from '@/composables/useDate'

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

// Initialize timeline and subrow composables after todayISO is available
const timelineInit = useTimelineInit(assignments, view, todayISO)
const subrows = useSubrows(assignments, people, projects)

const projectsMap = computed(() => Object.fromEntries(projects.value.map(p => [p.id, p])))
const peopleMap = computed(() => Object.fromEntries(people.value.map(p => [p.id, p])))
const timelineWidth = computed(() => days.value.length * view.value.px_per_day)
const timelineHeight = ref('100%')

const addButtons = ref<HTMLElement | null>(null)

// Calculate scrollbar height and position addButtons accordingly
const addButtonsBottomStyle = ref('0px')

function updateAddButtonsPosition() {
  if (scrollArea.value) {
    // Calculate scrollbar height (difference between offsetHeight and clientHeight)
    const scrollbarHeight = scrollArea.value.offsetHeight - scrollArea.value.clientHeight
    addButtonsBottomStyle.value = `${scrollbarHeight-1}px`
  }
}

// Subrow logic from composable
const { personSubrows, projectSubrows } = subrows

// Timeline handlers composable (needs scrollArea ref, so initialize after it's declared)
// Will be initialized after scrollArea declaration

// Modal handlers moved to useTimelineHandlers composable

// Provide assignments ref to children (RowGroup) for lane computation
const assignmentsKey = Symbol.for('assignmentsRef')
provide(assignmentsKey, assignments)

const scrollArea = ref<HTMLElement | null>(null)

// View navigation composable (needs scrollArea ref)
const viewNavigation = useViewNavigation(scrollArea, sortablePeople, sortableProjects, store.switchMode)
const { handleProjectClick, handlePersonClick } = viewNavigation

// Timeline handlers composable (needs scrollArea ref)
const timelineHandlers = useTimelineHandlers(scrollArea, assignments, people, store, actions, modals)
const {
  editProjectOpen,
  editingProject,
  editPersonOpen,
  editingPerson,
  projectHasAssignments,
  personHasAssignments,
  existingPersonNames,
  handleEdit,
  handleCreatePopover,
  handleSaveEdit,
  handleDirectDelete,
  handleCloseCreate,
  handleConfirmCreate,
  handleCreateProject,
  handleCreatePerson,
  handleEditProject,
  handleSaveProjectEdit,
  handleDeleteProject,
  handleEditPerson,
  handleSavePersonEdit,
  handleDeletePerson
} = timelineHandlers

const { onScroll, expandPrevious, expandNext } = useTimelineScroll(view, scrollArea)

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

// Inject personClickEvent from index.vue
const personClickEvent = inject<Ref<string | null> | null>('personClickEvent', null)

// Watch for personClickEvent and scroll to person in people view
if (personClickEvent) {
  watch(() => personClickEvent.value, (personId) => {
    if (personId) {
      // Switch to people view and scroll to person
      store.switchMode('person')
      nextTick(() => {
        handlePersonClick(personId)
      })
    }
  })
}

// Expand/Collapse all controls provided to RowGroup
const rowGroupControls = {
  expandAllToken: ref<number>(0),
  collapseAllToken: ref<number>(0),
}
provide('rowGroupControls', rowGroupControls)

async function setTimelineHeight() {
  timelineHeight.value = '100%';
  await nextTick()
  if (scrollArea.value) {
    timelineHeight.value = `${scrollArea.value.scrollHeight}px`
  }
}

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
    setTimelineHeight();
  })
})

watch(() => [store.assignments.length, store.people.length, store.projects.length], () => {
  setTimelineHeight();
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
    
    // If lazy loading is enabled, load assignments for the target date specifically
    if (store.isLazyLoadEnabled) {
      await store.loadAssignmentsForTargetDate(todayISO)
      
      // Give extra time for the DOM to update with the loaded assignments
      await nextTick()
      await new Promise(resolve => setTimeout(resolve, 50))
      
      // Re-check the index after lazy loading in case the timeline changed
      todayIndex = days.value.findIndex(d => d === todayISO)
    }
    
    // Ensure we have the scrollArea available and the timeline is ready
    await nextTick()
    
    if (todayIndex >= 0 && scrollArea.value) {
      // Calculate scroll position to center today on screen
      const todayPosition = todayIndex * view.value.px_per_day
      const containerWidth = scrollArea.value.clientWidth
      const sidebarWidth = 240 // Left column width for labels
      const timelineVisibleWidth = containerWidth - sidebarWidth
      const scrollPosition = todayPosition - (timelineVisibleWidth / 2) + (view.value.px_per_day / 2)
      
      scrollArea.value.scrollTo({
        left: Math.max(0, scrollPosition)
      })
    } else {
      console.warn('Could not find target date in timeline:', todayISO, 'Available days:', days.value.length)
    }
  }
})

// Watch for add weeks events - use simple expansion like mouse scroll fix
watch(() => timelineEvents?.addWeeksEvent.value, (data) => {
  if (data) {
    const { direction, weeks } = data
    
    // Convert weeks to weekdays (5 working days per week)
    const weekdays = weeks * 5
    
    // Fix: direction mapping was backwards
    // 'next' should expand forward (add future dates)
    // 'previous' should expand backward (add past dates)
    if (direction === 'next') {
      expandNext(weekdays)
    } else {
      expandPrevious(weekdays)
    }
  }
})

// Timeline initialization functions from composable
const { initTimelineWithAssignments, needsTimelineExpansion } = timelineInit

// Lazy loading watcher - but WITHOUT timeline expansion
watch(() => ({ start: view.value.start, days: view.value.days }), async (newView, oldView) => {
  // Only trigger lazy loading if the view actually changed and lazy loading is enabled
  if (store.isLazyLoadEnabled && 
      (newView.start !== oldView?.start || newView.days !== oldView?.days)) {    
    try {
      // Load events for current viewport only - do NOT expand timeline
      await store.loadAssignmentsForCurrentViewportOnly()  

    } catch (error) {
      console.error('Error during lazy loading of assignments:', error)
    }
  }
}, { deep: true })

// Watch for assignment changes and re-initialize timeline if needed
watch(assignments, async (_newAssignments) => {
  if (needsTimelineExpansion.value) {
    await initTimelineWithAssignments()
    // Don't auto-scroll to today when assignments change during scrolling/lazy loading
    // This was causing unwanted navigation during user exploration
  }
}, { deep: true })

let resizeObserver: ResizeObserver | null = null;

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

function toggleExpandAll() {
  if (allExpanded.value) {
    // Collapse all
    rowGroupControls.collapseAllToken.value = Date.now()
    expandState.value[view.value.mode] = false
  } else {
    // Expand all
    rowGroupControls.expandAllToken.value = Date.now()
    expandState.value[view.value.mode] = true
  }
  setTimelineHeight();
}

function getTodayWorkingDay() {
  let todayISO = new Date().toISOString().slice(0, 10)
  while (isWeekendISO(todayISO)) {
    todayISO = addDaysISO(todayISO, 1)
  }
  return todayISO
}
</script>
