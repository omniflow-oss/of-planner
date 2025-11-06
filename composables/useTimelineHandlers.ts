import { ref, computed, nextTick, type Ref } from 'vue'
import type { Assignment, Person, Project } from '@/types/planner'
import type { useTimelineActions } from '@/composables/useTimelineActions'
import type { useTimelineModals } from '@/composables/useTimelineModals'

/**
 * Composable for handling timeline modal operations and creation functions
 */
export const useTimelineHandlers = (
  scrollArea: Ref<HTMLElement | null>,
  assignments: Ref<Assignment[]>,
  people: Ref<Person[]>,
  store: any,
  actions: ReturnType<typeof useTimelineActions>,
  modals: ReturnType<typeof useTimelineModals>
) => {
  // Edit project modal state
  const editProjectOpen = ref(false)
  const editingProject = ref<{ id: string; name: string; estimatedDays?: number | null } | null>(null)

  // Edit person modal state
  const editPersonOpen = ref(false)
  const editingPerson = ref<{ id: string; name: string } | null>(null)

  // Check if project has assignments
  const projectHasAssignments = computed(() => {
    if (!editingProject.value) return false
    return assignments.value.some(a => a.project_id === editingProject.value!.id)
  })

  // Check if person has assignments
  const personHasAssignments = computed(() => {
    if (!editingPerson.value) return false
    return assignments.value.some(a => a.person_id === editingPerson.value!.id)
  })

  // Get existing person names for validation
  const existingPersonNames = computed(() => {
    return people.value.map(p => p.name)
  })

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

  function handleEditProject(projectId: string) {
    const project = store.projects.find((p: Project) => p.id === projectId)
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
    const person = store.people.find((p: Person) => p.id === personId)
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

  return {
    // Modal state
    editProjectOpen,
    editingProject,
    editPersonOpen,
    editingPerson,
    projectHasAssignments,
    personHasAssignments,
    existingPersonNames,
    
    // Modal handlers
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
  }
}