import type { Assignment } from '@/types/planner'

export function useTimelineModals() {
  // Modal states
  const editOpen = ref(false)
  const createOpen = ref(false)
  const newProjectOpen = ref(false)
  const newPersonOpen = ref(false)
  const deleteOpen = ref(false)

  // Modal data
  const editState = ref<{ id: string; start: string; end: string; allocation: 1|0.75|0.5|0.25 } | null>(null)
  const createState = ref<{ dayISO: string; person_id: string|null; project_id: string|null } | null>(null)
  
  // Error states
  const newProjectError = ref<string>('')
  const newPersonError = ref<string>('')

  function openEditModal(assignment: Assignment) {
    closeAllModals()
    editState.value = {
      id: assignment.id,
      start: assignment.start,
      end: assignment.end,
      allocation: assignment.allocation
    }
    editOpen.value = true
  }

  function openCreateModal(payload: { dayISO: string; person_id: string|null; project_id: string|null }) {
    closeAllModals()
    createState.value = payload
    createOpen.value = true
  }

  function openNewProjectModal() {
    closeAllModals()
    newProjectError.value = ''
    newProjectOpen.value = true
  }

  function openNewPersonModal() {
    closeAllModals()
    newPersonError.value = ''
    newPersonOpen.value = true
  }

  function setNewProjectError(error: string) {
    newProjectError.value = error
  }

  function setNewPersonError(error: string) {
    newPersonError.value = error
  }

  function openDeleteModal() {
    deleteOpen.value = true
  }

  function closeAllModals() {
    editOpen.value = false
    createOpen.value = false
    newProjectOpen.value = false
    newPersonOpen.value = false
    deleteOpen.value = false
  }

  function closeEditModal() {
    editOpen.value = false
  }

  function closeCreateModal() {
    createOpen.value = false
  }

  function closeNewProjectModal() {
    newProjectOpen.value = false
    newProjectError.value = ''
  }

  function closeNewPersonModal() {
    newPersonOpen.value = false
    newPersonError.value = ''
  }

  function closeDeleteModal() {
    deleteOpen.value = false
  }

  return {
    // States
    editOpen,
    createOpen,
    newProjectOpen,
    newPersonOpen,
    deleteOpen,
    
    // Data
    editState,
    createState,
    newProjectError,
    newPersonError,
    
    // Actions
    openEditModal,
    openCreateModal,
    openNewProjectModal,
    openNewPersonModal,
    openDeleteModal,
    closeAllModals,
    closeEditModal,
    closeCreateModal,
    closeNewProjectModal,
    closeNewPersonModal,
    closeDeleteModal,
    setNewProjectError,
    setNewPersonError
  }
}