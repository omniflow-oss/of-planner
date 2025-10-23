import { defineStore } from 'pinia'
import type { PlannerState, Assignment, Person, Project, Allocation, ViewMode } from '@/types/planner'
import { addDaysISO, clampDateRange, parseISO, toISO } from '@/composables/useDate'

function uid(prefix = 'id') { return `${prefix}_${Math.random().toString(36).slice(2, 9)}` }

export const usePlannerStore = defineStore('planner', {
  state: (): PlannerState => ({
    people: [
      { id: 'p1', name: 'Alice' },
      { id: 'p2', name: 'Bob' },
      { id: 'p3', name: 'Chloé' }
    ],
    projects: [
      { id: 'j1', name: 'Aurora', color: '#6bc6ff', emoji: '🟦' },
      { id: 'j2', name: 'Nebula', color: '#ffd166', emoji: '🟨' },
      { id: 'j3', name: 'Helios', color: '#ff7e6b', emoji: '🟥' }
    ],
    assignments: [
      { id: 'a1', person_id: 'p1', project_id: 'j1', start: toISO(new Date()), end: addDaysISO(toISO(new Date()), 4), allocation: 1 },
      { id: 'a2', person_id: 'p1', project_id: 'j2', start: addDaysISO(toISO(new Date()), 7), end: addDaysISO(toISO(new Date()), 10), allocation: 0.5 },
      { id: 'a3', person_id: 'p2', project_id: 'j2', start: addDaysISO(toISO(new Date()), 2), end: addDaysISO(toISO(new Date()), 8), allocation: 0.75 }
    ],
    view: {
      mode: 'person',
      start: (() => {
        const d = new Date()
        d.setUTCHours(0, 0, 0, 0)
        return toISO(d)
      })(),
      days: 21,
      px_per_day: 36,
      selected_id: null
    },
    meta: { version: '2.9.0' }
  }),
  getters: {
    byPerson: (s) => (personId: string) => s.assignments.filter(a => a.person_id === personId),
    byProject: (s) => (projectId: string) => s.assignments.filter(a => a.project_id === projectId),
  },
  actions: {
    switchMode(mode: ViewMode) { this.view.mode = mode },
    setStart(startISO: string) { this.view.start = startISO },
    setDays(days: number) { this.view.days = Math.max(7, Math.min(90, days)) },
    setPxPerDay(px: number) { this.view.px_per_day = Math.max(24, Math.min(64, px)) },
    select(id: string | null) { this.view.selected_id = id },

    createAssignment(input: { person_id: string; project_id: string; start: string; end: string; allocation: Allocation; subtitle?: string | null }) {
      const { start, end } = clampDateRange(input.start, input.end)
      const a: Assignment = { id: uid('a'), ...input, start, end }
      this.assignments.push(a)
      this.view.selected_id = a.id
      return a
    },

    updateAssignment(id: string, patch: Partial<Assignment>) {
      const idx = this.assignments.findIndex(a => a.id === id)
      if (idx === -1) return
      const curr = this.assignments[idx]
      const next = { ...curr, ...patch }
      if (patch.start || patch.end) {
        const clamped = clampDateRange(next.start, next.end)
        next.start = clamped.start
        next.end = clamped.end
      }
      this.assignments[idx] = next
    },

    deleteAssignment(id: string) { this.assignments = this.assignments.filter(a => a.id !== id) }
  }
})
