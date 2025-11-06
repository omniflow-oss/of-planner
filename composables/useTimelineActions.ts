import { addBusinessDaysISO } from '@/composables/useDate'
import { usePlannerStore } from '@/stores/usePlannerStore'
import { storeToRefs } from 'pinia'

export function useTimelineActions() {
  const store = usePlannerStore()
  const { people, projects } = storeToRefs(store)

  function onCreate(payload: { person_id: string|null; project_id: string|null; start: string; duration: number; allocation: 1|0.75|0.5|0.25 }) {
    let { person_id, project_id, start, duration, allocation } = payload
    
    // If missing person, create a new one or select existing
    if (!person_id) {
      person_id = handleMissingPerson()
      if (!person_id) return // User cancelled
    }
    
    // If missing project, create a new one or select existing
    if (!project_id) {
      project_id = handleMissingProject()
      if (!project_id) return // User cancelled
    }
    
    // Duration represents business days, so calculate end date by adding business days
    const end = addBusinessDaysISO(start, Math.max(1, duration) - 1)
    store.createAssignment({ person_id: person_id!, project_id: project_id!, start, end, allocation })
  }

  function handleMissingPerson(): string | null {
    if (people.value.length === 0) {
      // No people exist, create a new one
      const personName = window.prompt('Enter person name:', '')
      if (!personName) return null // User cancelled
      
      const newPerson = store.createPerson({ name: personName })
      return newPerson.id
    } else {
      // People exist, offer to create new or select existing
      const createNew = window.confirm('Create a new person?\n\nClick OK to create new person, Cancel to select existing person.')
      if (createNew) {
        const personName = window.prompt('Enter person name:', '')
        if (!personName) return null // User cancelled
        
        const newPerson = store.createPerson({ name: personName })
        return newPerson.id
      } else {
        // Show existing people
        const peopleList = people.value.map(p => `${p.id}: ${p.name}`).join('\n')
        const selectedId = window.prompt(`Select person ID:\n\n${peopleList}`, people.value[0]?.id)
        return selectedId || null
      }
    }
  }

  function handleMissingProject(): string | null {
    if (projects.value.length === 0) {
      // No projects exist, create a new one
      const projectName = window.prompt('Enter project name:', '')
      if (!projectName) return null // User cancelled
      
      const newProject = store.createProject({ name: projectName })
      return newProject.id
    } else {
      // Projects exist, offer to create new or select existing
      const createNew = window.confirm('Create a new project?\n\nClick OK to create new project, Cancel to select existing project.')
      if (createNew) {
        const projectName = window.prompt('Enter project name:', '')
        if (!projectName) return null // User cancelled
        
        const newProject = store.createProject({ name: projectName })
        return newProject.id
      } else {
        // Show existing projects
        const projectsList = projects.value.map(p => `${p.id}: ${p.name}`).join('\n')
        const selectedId = window.prompt(`Select project ID:\n\n${projectsList}`, projects.value[0]?.id)
        return selectedId || null
      }
    }
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

  function updateProject(id: string, updates: { estimatedDays?: number | null }) {
    store.updateProject(id, updates)
  }

  function deleteProject(id: string) {
    store.deleteProject(id)
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
    deleteProject
  }
}