import { ref, computed } from 'vue'
import type { Assignment, Person, Project, ExternalPlannerData } from '@/types/planner'
import { addDaysISO, businessDaysBetweenInclusive } from '@/composables/useDate'

export interface DataFragment {
  id: string
  startDate: string  // ISO date
  endDate: string    // ISO date
  assignments: Assignment[]
  isLoaded: boolean
  isLoading: boolean
}

export interface LazyLoadOptions {
  fragmentSizeWeeks: number  // How many weeks per fragment
  preloadBufferWeeks: number // How many weeks to preload ahead/behind
}

export function useLazyDataLoader(options: LazyLoadOptions = { fragmentSizeWeeks: 4, preloadBufferWeeks: 2 }) {
  const fragments = ref<Map<string, DataFragment>>(new Map())
  const allPeople = ref<Person[]>([])
  const allProjects = ref<Project[]>([])
  const allAssignments = ref<Assignment[]>([]) // Complete dataset, kept for reference
  const isInitializing = ref(false)
  
  // Generate fragment ID from start date
  const getFragmentId = (startDate: string): string => {
    return `fragment-${startDate}`
  }
  
  // Calculate fragment start date (align to Monday of the week)
  const getFragmentStartDate = (anyDate: string): string => {
    const date = new Date(anyDate + 'T00:00:00.000Z')
    const dayOfWeek = date.getUTCDay()
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek // Sunday = 0, Monday = 1
    date.setUTCDate(date.getUTCDate() + mondayOffset)
    return date.toISOString().slice(0, 10)
  }
  
  // Calculate fragment end date
  const getFragmentEndDate = (startDate: string): string => {
    const date = new Date(startDate + 'T00:00:00.000Z')
    date.setUTCDate(date.getUTCDate() + (options.fragmentSizeWeeks * 7) - 1)
    return date.toISOString().slice(0, 10)
  }
  
  // Check if assignment overlaps with date range
  const assignmentOverlapsRange = (assignment: Assignment, startDate: string, endDate: string): boolean => {
    return assignment.start <= endDate && assignment.end >= startDate
  }
  
  // Check if assignment is primarily within the date range (more conservative)
  const assignmentPrimarilyInRange = (assignment: Assignment, startDate: string, endDate: string): boolean => {
    // Assignment start must be within range, or assignment must be short relative to range
    const assignmentDuration = Math.abs(new Date(assignment.end).getTime() - new Date(assignment.start).getTime())
    const rangeDuration = Math.abs(new Date(endDate).getTime() - new Date(startDate).getTime())
    
    // If assignment is short (< 25% of range), allow if it overlaps
    // If assignment is long, require start to be within range
    if (assignmentDuration < rangeDuration * 0.25) {
      return assignmentOverlapsRange(assignment, startDate, endDate)
    } else {
      return assignment.start >= startDate && assignment.start <= endDate
    }
  }
  
  // Create a fragment for a date range
  const createFragment = (startDate: string): DataFragment => {
    const alignedStart = getFragmentStartDate(startDate)
    const endDate = getFragmentEndDate(alignedStart)
    const id = getFragmentId(alignedStart)
    
    return {
      id,
      startDate: alignedStart,
      endDate,
      assignments: [],
      isLoaded: false,
      isLoading: false
    }
  }
  
  // Load assignments for a specific fragment
  const loadFragment = async (fragmentId: string): Promise<void> => {
    const fragment = fragments.value.get(fragmentId)
    if (!fragment || fragment.isLoaded || fragment.isLoading) {
      return
    }
    
    fragment.isLoading = true
    
    // Simulate async loading (in real implementation, this might be an API call)
    await new Promise(resolve => setTimeout(resolve, 50))
    
    // Filter assignments that overlap with this fragment's date range
    const overlappingAssignments = allAssignments.value.filter(assignment =>
      assignmentOverlapsRange(assignment, fragment.startDate, fragment.endDate)
    )
    
    fragment.assignments = [...overlappingAssignments]
    fragment.isLoaded = true
    fragment.isLoading = false
    
    fragments.value.set(fragmentId, fragment)
  }
  
  // Get or create fragment for a date
  const getOrCreateFragment = (date: string): DataFragment => {
    const startDate = getFragmentStartDate(date)
    const id = getFragmentId(startDate)
    
    let fragment = fragments.value.get(id)
    if (!fragment) {
      fragment = createFragment(startDate)
      fragments.value.set(id, fragment)
    }
    
    return fragment
  }
  
  // Load fragments for a date range
  const loadFragmentsForRange = async (viewStart: string, viewEnd: string): Promise<void> => {
    const fragmentIds = new Set<string>()
    
    // Add buffer before and after the view range
    const bufferDays = options.preloadBufferWeeks * 7
    const bufferedStart = addDaysISO(viewStart, -bufferDays)
    const bufferedEnd = addDaysISO(viewEnd, bufferDays)
    
    // Find all fragments that overlap with the buffered range
    let currentDate = getFragmentStartDate(bufferedStart)
    const endDate = getFragmentStartDate(bufferedEnd)
    
    while (currentDate <= endDate) {
      const fragment = getOrCreateFragment(currentDate)
      fragmentIds.add(fragment.id)
      currentDate = addDaysISO(currentDate, options.fragmentSizeWeeks * 7)
    }
    
    // Load all identified fragments
    const loadPromises = Array.from(fragmentIds).map(id => loadFragment(id))
    await Promise.all(loadPromises)
  }
  
  // Get all loaded assignments for a date range
  const getAssignmentsForRange = (startDate: string, endDate: string, conservative = false): Assignment[] => {
    const result: Assignment[] = []
    const processedIds = new Set<string>()
    const filterFn = conservative ? assignmentPrimarilyInRange : assignmentOverlapsRange
  
    for (const fragment of fragments.value.values()) {
      if (!fragment.isLoaded) continue
      
      // Check if fragment overlaps with requested range
      if (fragment.startDate <= endDate && fragment.endDate >= startDate) {
        for (const assignment of fragment.assignments) {
          // Avoid duplicates (assignments can span multiple fragments)
          if (!processedIds.has(assignment.id) && 
              filterFn(assignment, startDate, endDate)) {
            result.push(assignment)
            processedIds.add(assignment.id)

          }
        }
      }
    }
    
    return result
  }
  
  // Initialize with full dataset (this breaks it into fragments)
  const initializeFromData = async (data: ExternalPlannerData): Promise<void> => {
    isInitializing.value = true
    
    try {
      // Store complete datasets
      allPeople.value = data.people || []
      allProjects.value = data.projects || []
      allAssignments.value = data.assignments || []
      
      // Clear existing fragments
      fragments.value.clear()
      
      // If we have assignments, create fragments based on their date ranges
      if (allAssignments.value.length > 0) {
        // Find the date range of all assignments
        const dates = allAssignments.value.flatMap(a => [a.start, a.end])
        const minDate = dates.reduce((min, date) => date < min ? date : min)
        const maxDate = dates.reduce((max, date) => date > max ? date : max)
        
        // Pre-create fragments for the entire range (but don't load them yet)
        let currentDate = getFragmentStartDate(minDate)
        const endDate = getFragmentStartDate(maxDate)
        
        while (currentDate <= endDate) {
          getOrCreateFragment(currentDate)
          currentDate = addDaysISO(currentDate, options.fragmentSizeWeeks * 7)
        }
      }
      
    } finally {
      isInitializing.value = false
    }
  }
  
  // Get fragment statistics
  const fragmentStats = computed(() => {
    const total = fragments.value.size
    const loaded = Array.from(fragments.value.values()).filter(f => f.isLoaded).length
    const loading = Array.from(fragments.value.values()).filter(f => f.isLoading).length
    
    return {
      total,
      loaded,
      loading,
      unloaded: total - loaded - loading
    }
  })
  
  // Clear all data
  const clearData = (): void => {
    fragments.value.clear()
    allPeople.value = []
    allProjects.value = []
    allAssignments.value = []
  }
  
  return {
    // State
    fragments: computed(() => fragments.value),
    allPeople: computed(() => allPeople.value),
    allProjects: computed(() => allProjects.value),
    allAssignments: computed(() => allAssignments.value),
    isInitializing: computed(() => isInitializing.value),
    fragmentStats,
    
    // Methods
    initializeFromData,
    loadFragmentsForRange,
    getAssignmentsForRange,
    getOrCreateFragment,
    loadFragment,
    clearData,
    
    // Utilities
    getFragmentId,
    getFragmentStartDate,
    getFragmentEndDate
  }
}