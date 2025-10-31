import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { usePlannerStore } from '@/stores/usePlannerStore'
import { getSampleData, getEmptyData, getMinimalData } from './test-data'

describe('Planner Store with JSON data', () => {
  beforeEach(() => {
    // Create a fresh pinia instance for each test
    setActivePinia(createPinia())
  })

  it('should start with empty state', () => {
    const store = usePlannerStore()
    
    expect(store.people).toEqual([])
    expect(store.projects).toEqual([])
    expect(store.assignments).toEqual([])
    expect(store.hasData).toBe(false)
  })

  it('should load sample data from JSON', () => {
    const store = usePlannerStore()
    const sampleData = getSampleData()
    
    store.loadDataFromObject(sampleData)
    
    expect(store.people).toHaveLength(3)
    expect(store.projects).toHaveLength(3)
    expect(store.assignments).toHaveLength(4)
    expect(store.hasData).toBe(true)
    
    // Check specific data
    expect(store.people[0].name).toBe('Alice Johnson')
    expect(store.projects[0].name).toBe('Website Redesign')
    expect(store.assignments[0].person_id).toBe('p1')
  })

  it('should load minimal test data', () => {
    const store = usePlannerStore()
    const minimalData = getMinimalData()
    
    store.loadDataFromObject(minimalData)
    
    expect(store.people).toHaveLength(1)
    expect(store.projects).toHaveLength(1)
    expect(store.assignments).toHaveLength(1)
    expect(store.people[0].name).toBe('Test Person')
  })

  it('should reset to initial data', () => {
    const store = usePlannerStore()
    const sampleData = getSampleData()
    
    // Load initial data
    store.loadDataFromObject(sampleData)
    expect(store.people).toHaveLength(3)
    
    // Modify data
    store.createPerson({ name: 'New Person' })
    expect(store.people).toHaveLength(4)
    expect(store.isDataModified).toBe(true)
    
    // Reset to initial
    store.resetToInitialData()
    expect(store.people).toHaveLength(3)
    expect(store.isDataModified).toBe(false)
  })

  it('should filter assignments by person', () => {
    const store = usePlannerStore()
    const sampleData = getSampleData()
    
    store.loadDataFromObject(sampleData)
    
    const aliceAssignments = store.byPerson('p1')
    expect(aliceAssignments).toHaveLength(2)
    expect(aliceAssignments[0].project_id).toBe('j1')
    expect(aliceAssignments[1].project_id).toBe('j2')
  })

  it('should filter assignments by project', () => {
    const store = usePlannerStore()
    const sampleData = getSampleData()
    
    store.loadDataFromObject(sampleData)
    
    const websiteAssignments = store.byProject('j1')
    expect(websiteAssignments).toHaveLength(2)
    expect(websiteAssignments[0].person_id).toBe('p1')
    expect(websiteAssignments[1].person_id).toBe('p2')
  })

  it('should create new assignments with proper IDs', () => {
    const store = usePlannerStore()
    const sampleData = getSampleData()
    
    store.loadDataFromObject(sampleData)
    
    const newAssignment = store.createAssignment({
      person_id: 'p1',
      project_id: 'j1',
      start: '2025-12-01',
      end: '2025-12-05',
      allocation: 0.5
    })
    
    expect(newAssignment.id).toBe('a5') // Next sequential ID
    expect(store.assignments).toHaveLength(5)
    expect(store.isDataModified).toBe(true)
  })

  it('should clear all data', () => {
    const store = usePlannerStore()
    const sampleData = getSampleData()
    
    store.loadDataFromObject(sampleData)
    expect(store.hasData).toBe(true)
    
    store.clearState()
    expect(store.people).toEqual([])
    expect(store.projects).toEqual([])
    expect(store.assignments).toEqual([])
    expect(store.hasData).toBe(false)
    expect(store.isDataModified).toBe(false)
  })
})