export type Allocation = 1 | 0.75 | 0.5 | 0.25

export type Person = { id: string; name: string; avatar?: string | null }
export type Project = { id: string; name: string; color?: string | null; emoji?: string | null }

export type Assignment = {
  id: string
  person_id: string
  project_id: string
  start: string // ISO date, UTC 00:00
  end: string   // ISO date, UTC 00:00, inclusive
  allocation: Allocation
  subtitle?: string | null
}

export type ViewMode = 'person' | 'project'

export type ViewState = {
  mode: ViewMode
  start: string
  days: number
  px_per_day: number
  selected_id: string | null
}

export type PlannerState = {
  people: Person[]
  projects: Project[]
  assignments: Assignment[]
  view: ViewState
  meta: { version: '2.9.0' }
}
