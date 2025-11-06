import { describe, it, expect } from 'vitest'
import { ref } from 'vue'
import { useProjectEstimation, WARNING_DAYS_THRESHOLD, OVERDUE_THRESHOLD } from '@/composables/useProjectEstimation'
import type { Assignment, Project } from '@/types/planner'

describe('useProjectEstimation', () => {
  const createMockAssignments = (): Assignment[] => [
    {
      id: '1',
      person_id: 'person1',
      project_id: 'project1',
      start: '2025-01-01', // Wednesday
      end: '2025-01-03',   // Friday (3 business days)
      allocation: 1.0,
      subtitle: null
    },
    {
      id: '2',
      person_id: 'person2',
      project_id: 'project1',
      start: '2025-01-02', // Thursday
      end: '2025-01-02',   // Thursday (1 business day)
      allocation: 0.5,
      subtitle: null
    },
    {
      id: '3',
      person_id: 'person1',
      project_id: 'project2',
      start: '2025-01-06', // Monday
      end: '2025-01-10',   // Friday (5 business days)
      allocation: 0.75,
      subtitle: null
    }
  ]

  const createMockProjects = (): Record<string, Project> => ({
    project1: {
      id: 'project1',
      name: 'Project 1',
      estimatedDays: 5
    },
    project2: {
      id: 'project2',
      name: 'Project 2',
      estimatedDays: 3
    },
    project3: {
      id: 'project3',
      name: 'Project 3',
      estimatedDays: null
    }
  })

  it('should calculate total assigned days correctly', () => {
    const assignments = ref(createMockAssignments())
    const projects = ref(createMockProjects())
    const { calculateProjectTotalDays } = useProjectEstimation(assignments, projects)

    // Project 1: person1 (3 days * 1.0) + person2 (1 day * 0.5) = 3.5 days
    expect(calculateProjectTotalDays('project1')).toBe(3.5)
    
    // Project 2: person1 (5 days * 0.75) = 3.75 days, rounded to 3.8
    expect(calculateProjectTotalDays('project2')).toBe(3.8)
    
    // Non-existent project should return 0
    expect(calculateProjectTotalDays('nonexistent')).toBe(0)
  })

  it('should return correct notification status', () => {
    const assignments = ref(createMockAssignments())
    const projects = ref(createMockProjects())
    const { getProjectNotificationStatus } = useProjectEstimation(assignments, projects)

    // Project 1: 5 estimated - 3.5 current = 1.5 remaining (< WARNING_DAYS_THRESHOLD)
    const project1Status = getProjectNotificationStatus('project1')
    expect(project1Status).toEqual({ color: 'orange', remaining: 1.5 })

    // Project 2: 3 estimated - 3.8 current = -0.8 remaining (< OVERDUE_THRESHOLD)
    const project2Status = getProjectNotificationStatus('project2')
    expect(project2Status?.color).toBe('red')
    expect(Math.round((project2Status?.remaining || 0) * 10) / 10).toBe(-0.8)

    // Project 3: no estimated days, should return null
    expect(getProjectNotificationStatus('project3')).toBeNull()

    // Non-existent project should return null
    expect(getProjectNotificationStatus('nonexistent')).toBeNull()
  })

  it('should return correct badge colors', () => {
    const assignments = ref(createMockAssignments())
    const projects = ref(createMockProjects())
    const { getProjectBadgeColor } = useProjectEstimation(assignments, projects)

    // Project 1: remaining < WARNING_DAYS_THRESHOLD but > OVERDUE_THRESHOLD
    expect(getProjectBadgeColor('project1')).toBe('warning')

    // Project 2: remaining < OVERDUE_THRESHOLD
    expect(getProjectBadgeColor('project2')).toBe('error')

    // Project 3: no estimated days
    expect(getProjectBadgeColor('project3')).toBe('neutral')

    // Non-existent project
    expect(getProjectBadgeColor('nonexistent')).toBe('neutral')
  })

  it('should format badge text correctly', () => {
    const assignments = ref(createMockAssignments())
    const projects = ref(createMockProjects())
    const { formatProjectBadgeText } = useProjectEstimation(assignments, projects)

    // Project with estimated days
    expect(formatProjectBadgeText('project1')).toBe('3.5/5d')
    expect(formatProjectBadgeText('project2')).toBe('3.8/3d')

    // Project without estimated days
    expect(formatProjectBadgeText('project3')).toBe('0d')

    // Non-existent project
    expect(formatProjectBadgeText('nonexistent')).toBe('0d')
  })

  it('should export correct threshold constants', () => {
    expect(WARNING_DAYS_THRESHOLD).toBe(5)
    expect(OVERDUE_THRESHOLD).toBe(0)
  })
})