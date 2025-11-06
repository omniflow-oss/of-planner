import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { usePlannerStore } from '@/stores/usePlannerStore'

describe('Project Name Validation in Store', () => {
  let store: ReturnType<typeof usePlannerStore>

  beforeEach(() => {
    // Set up Pinia for each test
    setActivePinia(createPinia())
    // Get a fresh store instance for each test
    store = usePlannerStore()
    store.clearState() // Clear any existing data
  })

  describe('createProject validation', () => {
    it('should create project with unique name', () => {
      const project = store.createProject({ name: 'Unique Project' })
      expect(project.name).toBe('Unique Project')
      expect(store.projects).toHaveLength(1)
    })

    it('should throw error when creating project with duplicate name', () => {
      // Create first project
      store.createProject({ name: 'Test Project' })
      
      // Try to create another project with same name (case-insensitive)
      expect(() => {
        store.createProject({ name: 'Test Project' })
      }).toThrow('Project already exists')
      
      expect(store.projects).toHaveLength(1) // Should still have only one project
    })

    it('should be case-insensitive for duplicate detection in create', () => {
      store.createProject({ name: 'Test Project' })
      
      expect(() => {
        store.createProject({ name: 'TEST PROJECT' })
      }).toThrow('Project already exists')
      
      expect(() => {
        store.createProject({ name: 'test project' })
      }).toThrow('Project already exists')
    })
  })

  describe('updateProject validation', () => {
    it('should update project name when unique', () => {
      const project1 = store.createProject({ name: 'Original Name' })
      store.createProject({ name: 'Other Project' })
      
      // Should be able to update to a unique name
      store.updateProject(project1.id, { name: 'New Unique Name' })
      
      const updatedProject = store.projects.find(p => p.id === project1.id)
      expect(updatedProject?.name).toBe('New Unique Name')
    })

    it('should allow updating project to same name', () => {
      const project = store.createProject({ name: 'Same Name' })
      
      // Should be able to "update" to the same name (no actual change)
      expect(() => {
        store.updateProject(project.id, { name: 'Same Name' })
      }).not.toThrow()
      
      const updatedProject = store.projects.find(p => p.id === project.id)
      expect(updatedProject?.name).toBe('Same Name')
    })

    it('should throw error when updating to duplicate name', () => {
      const project1 = store.createProject({ name: 'Project One' })
      store.createProject({ name: 'Project Two' })
      
      // Should throw error when trying to rename project1 to same name as project2
      expect(() => {
        store.updateProject(project1.id, { name: 'Project Two' })
      }).toThrow('Project already exists')
      
      // Original name should be preserved
      const unchangedProject = store.projects.find(p => p.id === project1.id)
      expect(unchangedProject?.name).toBe('Project One')
    })

    it('should be case-insensitive for duplicate detection in update', () => {
      const project1 = store.createProject({ name: 'Project One' })
      store.createProject({ name: 'Project Two' })
      
      expect(() => {
        store.updateProject(project1.id, { name: 'PROJECT TWO' })
      }).toThrow('Project already exists')
      
      expect(() => {
        store.updateProject(project1.id, { name: 'project two' })
      }).toThrow('Project already exists')
    })

    it('should not validate name when only updating other fields', () => {
      const project = store.createProject({ name: 'Test Project' })
      
      // Should be able to update estimatedDays without name validation
      expect(() => {
        store.updateProject(project.id, { estimatedDays: 10 })
      }).not.toThrow()
      
      const updatedProject = store.projects.find(p => p.id === project.id)
      expect(updatedProject?.estimatedDays).toBe(10)
      expect(updatedProject?.name).toBe('Test Project') // Name unchanged
    })
  })
})