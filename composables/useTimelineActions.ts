import { addBusinessDaysISO } from '@/composables/useDate'
import { usePlannerStore } from '@/stores/usePlannerStore'
import { storeToRefs } from 'pinia'

export function useTimelineActions() {
  const store = usePlannerStore()
  const { people, projects } = storeToRefs(store)

  function onCreate(payload: { person_id: string|null; project_id: string|null; start: string; duration: number; allocation: 1|0.75|0.5|0.25 }) {
    let { person_id, project_id, start, duration, allocation } = payload
    
    // Duration represents business days, so calculate end date by adding business days
    const end = addBusinessDaysISO(start, Math.max(1, duration) - 1)
    store.createAssignment({ person_id: person_id!, project_id: project_id!, start, end, allocation })
  }

  function onUpdate(payload: { id: string; start?: string; end?: string }) {
    store.updateAssignment(payload.id, payload)
  }

  function onAddFromSidebar(sr: { person_id: string|null; project_id: string|null }, viewStart: string) {
    // Default create from start date with duration 5, allocation 1
    onCreate({ person_id: sr.person_id, project_id: sr.project_id, start: viewStart, duration: 5, allocation: 1 })
  }

  function createProject(input: { name: string; estimatedDays?: number | null }) {
    const exists = projects.value.some(p => p.name.toLowerCase() === input.name.toLowerCase())
    if (exists) {
      throw new Error('Project already exists')
    }
    store.createProject({ name: input.name, estimatedDays: input.estimatedDays })
  }

  function createPerson(name: string) {
    const exists = people.value.some(p => p.name.toLowerCase() === name.toLowerCase())
    if (exists) {
      throw new Error('Person already exists')
    }
    store.createPerson({ name })
  }

  function updateAssignment(id: string, updates: { start?: string; end?: string; allocation?: 1|0.75|0.5|0.25 }) {
    store.updateAssignment(id, updates)
  }

  function deleteAssignment(id: string) {
    store.deleteAssignment(id)
  }

  function updateProject(id: string, updates: { name?: string; estimatedDays?: number | null }) {
    store.updateProject(id, updates)
  }

  function deleteProject(id: string) {
    store.deleteProject(id)
  }

  function updatePerson(id: string, updates: { name?: string }) {
    store.updatePerson(id, updates)
  }

  function deletePerson(id: string) {
    store.deletePerson(id)
  }

  return {
    onCreate,
    onUpdate,
    onAddFromSidebar,
    createProject,
    createPerson,
    updateAssignment,
    deleteAssignment,
    updateProject,
    deleteProject,
    updatePerson,
    deletePerson
  }
}