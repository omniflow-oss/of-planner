import type { ExternalPlannerData } from '@/types/planner'
import sampleData from './fixtures/sample-data.json'

/**
 * Test helper to get sample planner data
 */
export function getSampleData(): ExternalPlannerData {
  return sampleData as ExternalPlannerData
}

/**
 * Test helper to get empty planner data
 */
export function getEmptyData(): ExternalPlannerData {
  return {
    people: [],
    projects: [],
    assignments: []
  }
}

/**
 * Test helper to get minimal planner data with one person, project, and assignment
 */
export function getMinimalData(): ExternalPlannerData {
  return {
    people: [
      { id: 'test-p1', name: 'Test Person' }
    ],
    projects: [
      { id: 'test-j1', name: 'Test Project', color: '#3b82f6', emoji: '🧪' }
    ],
    assignments: [
      {
        id: 'test-a1',
        person_id: 'test-p1',
        project_id: 'test-j1',
        start: '2025-11-01',
        end: '2025-11-01',
        allocation: 1
      }
    ]
  }
}