import { defineStore } from 'pinia'
import type { PlannerState, Assignment, Person, Project, ViewMode, ExternalPlannerData, Allocation } from '@/types/planner'
import { clampDateRange, toISO, addDaysISO } from '@/composables/useDate'

// Generate sequential IDs based on existing data
function generateSequentialId(prefix: string, existingItems: { id: string }[]): string {
  // Find the highest number for this prefix
  let maxNumber = 0
  const regex = new RegExp(`^${prefix}(\\d+)$`)
  
  for (const item of existingItems) {
    const match = item.id.match(regex)
    if (match && match[1]) {
      const number = parseInt(match[1], 10)
      if (number > maxNumber) {
        maxNumber = number
      }
    }
  }
  
  const newId = `${prefix}${maxNumber + 1}`
  return newId
}

export const usePlannerStore = defineStore('planner', {
  state: (): PlannerState => ({
    people: [],
    projects: [],
    assignments: [],
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
    isDataModified: false,
    // Store initial data for reset functionality
    _initialData: null,
    // Sort orders for drag-and-drop
    peopleSortOrder: [],
    projectsSortOrder: [],
    // Subrow sort orders for each group (key: groupId, value: array of subrow keys)
    subrowSortOrders: {},
    // Read-only mode toggle
    isReadOnly: false,
    // Lazy loading state
    isLazyLoadEnabled: false
  }),
  getters: {
    byPerson: (s) => (personId: string) => s.assignments.filter(a => a.person_id === personId),
    byProject: (s) => (projectId: string) => s.assignments.filter(a => a.project_id === projectId),
    hasData: (s) => s.people.length > 0 || s.projects.length > 0 || s.assignments.length > 0,
    shouldShowDownload: (s) => (s.people.length > 0 || s.projects.length > 0 || s.assignments.length > 0) && s.isDataModified,
    canReset: (s) => s._initialData !== null && s.isDataModified,
  },
  actions: {
    switchMode(mode: ViewMode) { this.view.mode = mode },
    async setStart(startISO: string) { 
      this.view.start = startISO 
    },
    async setDays(days: number) { 
      this.view.days = Math.max(7, Math.min(90, days)) 
    },
    setPxPerDay(px: number) { this.view.px_per_day = Math.max(24, Math.min(64, px)) },
    select(id: string | null) { this.view.selected_id = id },
    toggleReadOnly() { this.isReadOnly = !this.isReadOnly },

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
      const curr = this.assignments[idx]!
      const next = { ...curr, ...patch } as Assignment
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

    updatePerson(id: string, patch: { name?: string }) {
      const idx = this.people.findIndex(p => p.id === id)
      if (idx === -1) return
      const person = this.people[idx]!
      if (patch.name !== undefined) person.name = patch.name
      this.isDataModified = true
    },

    deletePerson(id: string) {
      this.people = this.people.filter(p => p.id !== id)
      // Also remove all assignments for this person
      this.assignments = this.assignments.filter(a => a.person_id !== id)
      this.isDataModified = true
    },

    createProject(input: { name: string; color?: string; emoji?: string; estimatedDays?: number | null }) {
      // Validate name uniqueness
      const exists = this.projects.some(
        p => p.name.toLowerCase() === input.name.toLowerCase()
      )
      if (exists) {
        throw new Error('Project already exists')
      }
      
      const id = generateSequentialId('j', this.projects)
      const p: Project = { 
        id, 
        name: input.name, 
        color: input.color || '#3b82f6', 
        emoji: input.emoji || '📋',
        estimatedDays: input.estimatedDays || null
      }
      this.projects.push(p)
      this.isDataModified = true
      return p
    },

    updateProject(id: string, patch: { name?: string; color?: string | null; emoji?: string | null; estimatedDays?: number | null }) {
      // Validate name uniqueness if name is being updated
      if (patch.name) {
        const exists = this.projects.some(
          p => p.id !== id && p.name.toLowerCase() === patch.name!.toLowerCase()
        )
        if (exists) {
          throw new Error('Project already exists')
        }
      }
      
      const idx = this.projects.findIndex(p => p.id === id)
      if (idx === -1) return
      const project = this.projects[idx]!
      if (patch.name !== undefined) project.name = patch.name
      if (patch.color !== undefined) project.color = patch.color
      if (patch.emoji !== undefined) project.emoji = patch.emoji
      if (patch.estimatedDays !== undefined) project.estimatedDays = patch.estimatedDays
      this.isDataModified = true
    },

    deleteProject(id: string) {
      this.projects = this.projects.filter(p => p.id !== id)
      // Also remove all assignments for this project
      this.assignments = this.assignments.filter(a => a.project_id !== id)
      this.isDataModified = true
    },

    // Clear all data to empty state
    clearState() {
      this.people = []
      this.projects = []
      this.assignments = []
      this.view.selected_id = null
      this._initialData = null
      this.isDataModified = false      
    },

    // Reset data to initial loaded state
    resetToInitialData() {
      if (!this._initialData) {
        return
      }

      // Clear existing data first
      this.people = []
      this.projects = []
      this.assignments = []
      this.view.selected_id = null
      
      // Restore initial data
      if (this._initialData.people) this.people = [...this._initialData.people]
      if (this._initialData.projects) this.projects = [...this._initialData.projects]
      if (this._initialData.assignments) this.assignments = [...this._initialData.assignments]
      
      // Reset modified flag
      this.isDataModified = false
    },

    // Load data from external JSON data object (for local file loading)
    loadDataFromObject(data: ExternalPlannerData) {
      // Store initial data for reset functionality
      this._initialData = JSON.parse(JSON.stringify(data))
      
      // Clear existing data first
      this.people = []
      this.projects = []
      this.assignments = []
      this.view.selected_id = null
      
      // Load new data
      if (data.people) this.people = [...data.people]
      if (data.projects) this.projects = [...data.projects]
      if (data.assignments) this.assignments = [...data.assignments]
      
      // Initialize sort orders
      this.initializeSortOrders()
      
      // Reset modified flag after loading
      this.isDataModified = false

    },

    // Load data from external JSON file
    async loadDataFromJSON(filename = 'planner-data.json'): Promise<ExternalPlannerData> {
      try {
        const response = await fetch(`${filename}`)
        if (!response.ok) {
          throw new Error(`Failed to load ${filename}: ${response.status}`)
        }
        const data: ExternalPlannerData = await response.json()
        
        // Store initial data for reset functionality
        this._initialData = JSON.parse(JSON.stringify(data))
        
        // Update store data with loaded JSON
        if (data.people) this.people = [...data.people]
        if (data.projects) this.projects = [...data.projects]
          this.assignments = []
        
        // Initialize sort orders
        this.initializeSortOrders()
        
        // Reset modified flag after loading
        this.isDataModified = false
        
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
      
    },

    // Sort order management for drag-and-drop
    updatePeopleSortOrder(newOrder: string[]) {
      this.peopleSortOrder = [...newOrder]
      this.isDataModified = true
    },

    updateProjectsSortOrder(newOrder: string[]) {
      this.projectsSortOrder = [...newOrder]
      this.isDataModified = true
    },

    // Subrow sort order management
    updateSubrowSortOrder(groupId: string, newOrder: string[]) {
      this.subrowSortOrders = { ...this.subrowSortOrders, [groupId]: [...newOrder] }
      this.isDataModified = true
    },

    getSubrowSortOrder(groupId: string): string[] {
      return this.subrowSortOrders[groupId] || []
    },

    // Initialize sort orders when data is loaded
    // Note: This does NOT set isDataModified=true because it's part of initial data loading,
    // not user-initiated changes. The loading methods reset isDataModified=false afterward.
    initializeSortOrders() {
      if (this.peopleSortOrder.length === 0) {
        this.peopleSortOrder = this.people.map(p => p.id)
      }
      if (this.projectsSortOrder.length === 0) {
        this.projectsSortOrder = this.projects.map(p => p.id)
      }
    }
  }
})
