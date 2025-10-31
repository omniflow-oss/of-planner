import { setActivePinia, createPinia } from 'pinia'
import { describe, it, expect, beforeEach } from 'vitest'
import { usePlannerStore } from '@/stores/usePlannerStore'
import { addDaysISO } from '@/composables/useDate'

describe('planner store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('creates assignment with clamped dates and selects it', () => {
    const s = usePlannerStore()
    
    // Create initial data that the test expects
    const person = s.createPerson({ name: 'Test Person' })
    const project = s.createProject({ name: 'Test Project' })
    
    const start = s.view.start
    const end = addDaysISO(start, 4)
    const a = s.createAssignment({ person_id: person.id, project_id: project.id, start: end, end: start, allocation: 1 })
    // should clamp so start <= end
    expect(a.start <= a.end).toBe(true)
    // selected id should be new assignment
    expect(s.view.selected_id).toBe(a.id)
  })

  it('updates and clamps when end < start', () => {
    const s = usePlannerStore()
    
    // Create initial data that the test expects
    const person = s.createPerson({ name: 'Test Person' })
    const project = s.createProject({ name: 'Test Project' })
    const start = s.view.start
    const a = s.createAssignment({ person_id: person.id, project_id: project.id, start, end: addDaysISO(start, 2), allocation: 1 })
    
    s.updateAssignment(a.id, { start: addDaysISO(a.start, 3), end: addDaysISO(a.start, 1) })
    const updated = s.assignments.find(x => x.id === a.id)!
    expect(updated.end >= updated.start).toBe(true)
  })
})

