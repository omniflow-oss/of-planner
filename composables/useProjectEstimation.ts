import { computed, type Ref } from 'vue'
import type { Assignment, Project } from '@/types/planner'
import { businessDaysBetweenInclusive } from '@/composables/useDate'

// Constants for project estimation thresholds
export const WARNING_DAYS_THRESHOLD = 5 // Orange notification when remaining days < 5
export const OVERDUE_THRESHOLD = 0 // Red notification when remaining days < 0

export type NotificationStatus = {
  color: 'red' | 'orange'
  remaining: number
} | null

export type BadgeColor = 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'error' | 'neutral'

/**
 * Composable for project estimation calculations and status determination
 */
export const useProjectEstimation = (
  assignments: Ref<Assignment[]>,
  projectsMap: Ref<Record<string, Project>>
) => {
  /**
   * Calculate total assigned days for a specific project
   */
  function calculateProjectTotalDays(projectId: string): number {
    const projectAssignments = assignments.value.filter(a => a.project_id === projectId)
    
    let total = 0
    projectAssignments.forEach(assignment => {
      const dayCount = businessDaysBetweenInclusive(assignment.start, assignment.end)
      total += dayCount * assignment.allocation
    })
    
    return Math.round(total * 10) / 10 // Round to 1 decimal place
  }

  /**
   * Get notification status for a project (red/orange circle or null)
   */
  function getProjectNotificationStatus(projectId: string): NotificationStatus {
    const project = projectsMap.value[projectId]
    if (!project?.estimatedDays) {
      return null
    }
    
    const estimated = project.estimatedDays
    const current = calculateProjectTotalDays(projectId)
    const remaining = estimated - current
    
    // If over estimated time (remaining < 0), show red
    if (remaining < OVERDUE_THRESHOLD) {
      return { color: 'red', remaining }
    }
    
    // If less than warning threshold remaining, show orange
    if (remaining < WARNING_DAYS_THRESHOLD) {
      return { color: 'orange', remaining }
    }
    
    return null
  }

  /**
   * Get badge color for project status (used in RowGroup badges)
   */
  function getProjectBadgeColor(projectId: string): BadgeColor {
    const project = projectsMap.value[projectId]
    if (!project?.estimatedDays) {
      return 'neutral'
    }
    
    const estimated = project.estimatedDays
    const current = calculateProjectTotalDays(projectId)
    const remaining = estimated - current
    
    // If over estimated time (remaining < 0), show red
    if (remaining < OVERDUE_THRESHOLD) {
      return 'error'
    }
    
    // If less than warning threshold remaining, show orange
    if (remaining < WARNING_DAYS_THRESHOLD) {
      return 'warning'
    }
    
    return 'neutral'
  }

  /**
   * Format badge text for project estimation display
   */
  function formatProjectBadgeText(projectId: string): string {
    const current = calculateProjectTotalDays(projectId)
    const project = projectsMap.value[projectId]
    
    if (project?.estimatedDays) {
      return `${current}/${project.estimatedDays}d`
    }
    
    return `${current}d`
  }

  return {
    calculateProjectTotalDays,
    getProjectNotificationStatus,
    getProjectBadgeColor,
    formatProjectBadgeText
  }
}