import { beforeEach, describe, expect, it } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { usePlannerStore } from '@/stores/usePlannerStore'
import { addDaysISO } from '@/composables/useDate'

describe('planner store actions', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('creates people/projects with sequential ids', () => {
    const s = usePlannerStore()
    const p = s.createPerson({ name: 'Chloe' })
    const q = s.createPerson({ name: 'Dev' })
    expect(p.id).toBe('p3')
    expect(q.id).toBe('p4')

    const pr = s.createProject({ name: 'Cosmos' })
    const pr2 = s.createProject({ name: 'Delta' })
    expect(pr.id).toBe('j3')
    expect(pr2.id).toBe('j4')
  })

  it('creates, updates and deletes assignments', () => {
    const s = usePlannerStore()
    const base = s.view.start
    const a = s.createAssignment({ person_id: 'p2', project_id: 'j2', start: addDaysISO(base, 2), end: base, allocation: 0.5 })
    // clamped to ensure start <= end
    expect(a.start <= a.end).toBe(true)
    // id increments from existing a1 -> a2
    expect(a.id).toBe('a2')
    // update and verify clamping logic
    s.updateAssignment(a.id, { start: addDaysISO(a.end, 3), end: addDaysISO(a.end, 1) })
    const updated = s.assignments.find(x => x.id === a.id)!
    expect(updated.end >= updated.start).toBe(true)
    // delete
    s.deleteAssignment(a.id)
    expect(s.assignments.find(x => x.id === a.id)).toBeUndefined()
  })

  it('updates view state and handles load/reset/clear', () => {
    const s = usePlannerStore()
    // view setters
    s.switchMode('project')
    s.setDays(5) // below min -> clamped to 7
    s.setPxPerDay(10) // below min -> clamped to 24
    const newStart = addDaysISO(s.view.start, 7)
    s.setStart(newStart)
    s.select('a1')
    expect(s.view.mode).toBe('project')
    expect(s.view.days).toBe(7)
    expect(s.view.px_per_day).toBe(24)
    expect(s.view.start).toBe(newStart)
    expect(s.view.selected_id).toBe('a1')

    // load data, then reset and clear
    s.loadDataFromObject({
      people: [{ id: 'p9', name: 'Zoe' }],
      projects: [{ id: 'j9', name: 'Zeta' }],
      assignments: [{ id: 'a9', person_id: 'p9', project_id: 'j9', start: newStart, end: addDaysISO(newStart, 1), allocation: 1 }]
    })
    expect(s.people[0].id).toBe('p9')
    expect(s.isDataModified).toBe(false)
    s.resetToInitialData()
    expect(s.people[0].id).toBe('p9')
    s.clearState()
    expect(s.people.length).toBe(0)
    expect(s.projects.length).toBe(0)
    expect(s.assignments.length).toBe(0)
    expect(s.isDataModified).toBe(false)
  })
})
