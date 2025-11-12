import { computed, type Ref } from 'vue'
import { addDaysISO } from '@/composables/useDate'
import type { Assignment, ViewState } from '@/types/planner'

/**
 * Composable for timeline initialization and assignment range calculations
 */
export const useTimelineInit = (
  assignments: Ref<Assignment[]>,
  view: Ref<ViewState>,
  todayISO: string
) => {
  // Function to calculate the date range needed to show all assignments
  function calculateAssignmentDateRange() {
    if (assignments.value.length === 0) {
      return null
    }
    
    let earliestDate = assignments.value[0]!.start
    let latestDate = assignments.value[0]!.end
    
    for (const assignment of assignments.value) {
      if (assignment.start < earliestDate) earliestDate = assignment.start
      if (assignment.end > latestDate) latestDate = assignment.end
    }
    
    return { start: earliestDate, end: latestDate }
  }

  // Function to initialize timeline with assignment coverage
  async function initTimelineWithAssignments() {
    const assignmentRange = calculateAssignmentDateRange()

    // Always start 20 days before today to ensure buffer space for drag operations
    const today = new Date(todayISO)
    const timelineStart = new Date(today)
    timelineStart.setUTCDate(timelineStart.getUTCDate() - 20)


    // If timelineStart is a weekend, move to next Monday
    let timelineStartDay = timelineStart.getUTCDay()
    if (timelineStartDay === 0) { // Sunday
      timelineStart.setUTCDate(timelineStart.getUTCDate() + 1)
    } else if (timelineStartDay === 6) { // Saturday
      timelineStart.setUTCDate(timelineStart.getUTCDate() + 2)
    }

    if (!assignmentRange) {
      // No assignments, create timeline from -20 days to +60 days from today
      const timelineEnd = new Date(today)
      timelineEnd.setUTCDate(timelineEnd.getUTCDate() + 60)

      view.value.start = timelineStart.toISOString().slice(0, 10)
      view.value.days = Math.floor((timelineEnd.getTime() - timelineStart.getTime()) / (1000 * 60 * 60 * 24)) + 1
      return
    }

    // Calculate end date to include all assignments with some padding
    const assignmentStart = new Date(assignmentRange.start)
    const assignmentEnd = new Date(assignmentRange.end)

    // Timeline starts 20 days before today, but extend if assignments go earlier
    const finalStart = new Date(Math.min(timelineStart.getTime(), assignmentStart.getTime() - 14 * 24 * 60 * 60 * 1000)) // 14 days padding before earliest assignment
    // Align finalStart to previous Monday
    const finalStartDay = finalStart.getUTCDay()
    const finalDaysFromMonday = (finalStartDay + 6) % 7
    finalStart.setUTCDate(finalStart.getUTCDate() - finalDaysFromMonday)

    // Timeline ends at least 14 days after latest assignment or 60 days after today, whichever is later
    const minEndFromToday = new Date(today)
    minEndFromToday.setUTCDate(minEndFromToday.getUTCDate() + 60)
    const minEndFromAssignments = new Date(assignmentEnd)
    minEndFromAssignments.setUTCDate(minEndFromAssignments.getUTCDate() + 14)
    const finalEnd = new Date(Math.max(minEndFromToday.getTime(), minEndFromAssignments.getTime()))

    // Calculate total days
    const totalDays = Math.floor((finalEnd.getTime() - finalStart.getTime()) / (1000 * 60 * 60 * 24)) + 1

    view.value.start = finalStart.toISOString().slice(0, 10)
    view.value.days = Math.max(35, totalDays) // Remove 365-day limit to show all assignments
  }

  // Check if timeline needs expansion based on assignment range
  const needsTimelineExpansion = computed(() => {
    const assignmentRange = calculateAssignmentDateRange()
    if (!assignmentRange) return false
    
    // Check if any assignments are outside current timeline view
    const currentStart = view.value.start
    const currentEnd = addDaysISO(currentStart, view.value.days - 1)
    
    return assignmentRange.start < currentStart || assignmentRange.end > currentEnd
  })

  return {
    calculateAssignmentDateRange,
    initTimelineWithAssignments,
    needsTimelineExpansion
  }
}