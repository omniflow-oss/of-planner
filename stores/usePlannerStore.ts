import { defineStore } from 'pinia'
import type { PlannerState, Assignment, Person, Project, Allocation, ViewMode, ExternalPlannerData } from '@/types/planner'
import { addDaysISO, clampDateRange, parseISO, toISO } from '@/composables/useDate'

// Generate sequential IDs based on existing data
function generateSequentialId(prefix: string, existingItems: { id: string }[]): string {
  // Find the highest number for this prefix
  let maxNumber = 0
  const regex = new RegExp(`^${prefix}(\\d+)$`)
  
  for (const item of existingItems) {
    const match = item.id.match(regex)
    if (match) {
      const number = parseInt(match[1], 10)
      if (number > maxNumber) {
        maxNumber = number
      }
    }
  }
  
  const newId = `${prefix}${maxNumber + 1}`
  console.log(`Generated sequential ID: ${newId} (previous max: ${prefix}${maxNumber})`)
  return newId
}

export const usePlannerStore = defineStore('planner', {
  state: (): PlannerState => ({
    people: [],
    projects: [    ],
    assignments: [  ],
    view: {
      mode: 'person',
      start: (() => {
        const d = new Date()
        d.setUTCHours(0, 0, 0, 0)
        return toISO(d)
      })(),
      days: 21,
      px_per_day: 56,
      selected_id: null
    },
    meta: { version: '2.9.0' },
    isDataModified: false
  }),
  getters: {
    byPerson: (s) => (personId: string) => s.assignments.filter(a => a.person_id === personId),
    byProject: (s) => (projectId: string) => s.assignments.filter(a => a.project_id === projectId),
    hasData: (s) => s.people.length > 0 || s.projects.length > 0 || s.assignments.length > 0,
    shouldShowDownload: (s) => (s.people.length > 0 || s.projects.length > 0 || s.assignments.length > 0) && s.isDataModified,
  },
  actions: {
    switchMode(mode: ViewMode) { this.view.mode = mode },
    setStart(startISO: string) { this.view.start = startISO },
    setDays(days: number) { this.view.days = Math.max(7, Math.min(90, days)) },
    setPxPerDay(px: number) { this.view.px_per_day = Math.max(24, Math.min(64, px)) },
    select(id: string | null) { this.view.selected_id = id },

    createAssignment(input: { person_id: string; project_id: string; start: string; end: string; allocation: Allocation; subtitle?: string | null }) {
      const { start, end } = clampDateRange(input.start, input.end)
      const id = generateSequentialId('a', this.assignments)
      const a: Assignment = { id, ...input, start, end }
      this.assignments.push(a)
      this.view.selected_id = a.id
      this.isDataModified = true
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
      this.isDataModified = true
    },

    deleteAssignment(id: string) { 
      this.assignments = this.assignments.filter(a => a.id !== id) 
      this.isDataModified = true
    },

    createPerson(input: { name: string }) {
      const id = generateSequentialId('p', this.people)
      const p: Person = { id, name: input.name }
      this.people.push(p)
      this.isDataModified = true
      return p
    },

    createProject(input: { name: string; color?: string; emoji?: string }) {
      const id = generateSequentialId('j', this.projects)
      const p: Project = { 
        id, 
        name: input.name, 
        color: input.color || '#3b82f6', 
        emoji: input.emoji || '📋' 
      }
      this.projects.push(p)
      this.isDataModified = true
      return p
    },

    // Clear all data to empty state
    clearState() {
      this.people = []
      this.projects = []
      this.assignments = []
      this.view.selected_id = null
      console.log('PlannerState cleared - all data emptied')
    },

    // Load data from external JSON data object (for local file loading)
    loadDataFromObject(data: ExternalPlannerData) {
      // Clear existing data first
      this.people = []
      this.projects = []
      this.assignments = []
      this.view.selected_id = null
      
      // Load new data
      if (data.people) this.people = data.people
      if (data.projects) this.projects = data.projects  
      if (data.assignments) this.assignments = data.assignments
      
      // Reset modified flag after loading
      this.isDataModified = false
      
      console.log('Data refreshed from local file:', {
        people: this.people.length,
        projects: this.projects.length,
        assignments: this.assignments.length
      })
    },

    // Load data from external JSON file
    async loadDataFromJSON(filename = 'planner-data.json'): Promise<ExternalPlannerData> {
      try {
        const response = await fetch(`${filename}`)
        if (!response.ok) {
          throw new Error(`Failed to load ${filename}: ${response.status}`)
        }
        const data: ExternalPlannerData = await response.json()
        
        // Update store data with loaded JSON
        if (data.people) this.people = data.people
        if (data.projects) this.projects = data.projects  
        if (data.assignments) this.assignments = data.assignments
        
        // Reset modified flag after loading
        this.isDataModified = false
        
        console.log(`Successfully loaded data from ${filename}`)
        return data
      } catch (error) {
        console.error('Error loading JSON data:', error)
        throw error
      }
    },

    // Download current planner data as JSON file
    downloadPlannerData(filename = 'planner-data.json') {
      const data: ExternalPlannerData = {
        people: this.people,
        projects: this.projects,
        assignments: this.assignments
      }

      const jsonString = JSON.stringify(data, null, 2)
      const blob = new Blob([jsonString], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      // Mark as not modified after download
      this.isDataModified = false
      
      console.log(`Downloaded planner data as ${filename}`)
    }
  }
})
