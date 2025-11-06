import type { Assignment, Person, Project } from '@/types/planner'
import { type Ref } from 'vue'

/**
 * Composable for handling subrow logic in timeline
 */
export const useSubrows = (
  assignments: Ref<Assignment[]>,
  people: Ref<Person[]>,
  projects: Ref<Project[]>
) => {
  // Get project IDs for a specific person
  function personProjects(personId: string) {
    const set = new Set(assignments.value.filter(a => a.person_id === personId).map(a => a.project_id))
    return Array.from(set)
  }

  // Get person IDs for a specific project
  function projectPeople(projectId: string) {
    const set = new Set(assignments.value.filter(a => a.project_id === projectId).map(a => a.person_id))
    return Array.from(set)
  }

  // Generate subrows for a person view
  function personSubrows(personId: string) {
    const projIds = personProjects(personId)
    const regularProjIds = projIds.filter(pid => pid !== 'TIMEOFF')
    const rows = regularProjIds.map(pid => ({ 
      key: `${personId}:${pid}`, 
      label: projectName(pid), 
      person_id: personId, 
      project_id: pid 
    }))
    const timeOffRow = { 
      key: `${personId}:TIMEOFF`, 
      label: 'Time Off', 
      person_id: personId, 
      project_id: 'TIMEOFF', 
      isTimeOff: true 
    }
    return [
      timeOffRow, 
      ...rows, 
      { 
        key: `${personId}:__add__`, 
        label: 'Assign a project', 
        person_id: personId, 
        project_id: null 
      }
    ]
  }

  // Generate subrows for a project view
  function projectSubrows(projectId: string) {
    const peopleIds = projectPeople(projectId)
    const rows = peopleIds.map(pers => ({ 
      key: `${projectId}:${pers}`, 
      label: personName(pers), 
      person_id: pers, 
      project_id: projectId 
    }))
    return [
      ...rows, 
      { 
        key: `${projectId}:__add__`, 
        label: 'Add person', 
        person_id: null, 
        project_id: projectId 
      }
    ]
  }

  // Get project name by ID
  function projectName(id: string) { 
    return projects.value.find(p => p.id === id)?.name ?? id 
  }

  // Get person name by ID
  function personName(id: string) { 
    return people.value.find(p => p.id === id)?.name ?? id 
  }

  return {
    personProjects,
    projectPeople,
    personSubrows,
    projectSubrows,
    projectName,
    personName
  }
}