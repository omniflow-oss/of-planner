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
    const start = s.view.start
    const end = addDaysISO(start, 4)
    const a = s.createAssignment({ person_id: s.people[0].id, project_id: s.projects[0].id, start: end, end: start, allocation: 1 })
    // should clamp so start <= end
    expect(a.start <= a.end).toBe(true)
    // selected id should be new assignment
    expect(s.view.selected_id).toBe(a.id)
  })

  it('updates and clamps when end < start', () => {
    const s = usePlannerStore()
    const a = s.assignments[0]
    s.updateAssignment(a.id, { start: addDaysISO(a.start, 3), end: addDaysISO(a.start, 1) })
    const updated = s.assignments.find(x => x.id === a.id)!
    expect(updated.end >= updated.start).toBe(true)
  })
})

