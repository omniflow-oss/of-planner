import { computed, type Ref } from 'vue'
import type { Assignment } from '@/types/planner'
import { clampToWindowDate, manDays } from '@/utils/alloc'
import { isWeekendISO } from '@/composables/useDate'

type Group = { type: 'person' | 'project'; id: string }

export function useCapacity(assignmentsRef: Ref<Assignment[]>, daysRef: Ref<string[]>, group: Group) {
  // Cache project people to avoid recalculation
  const projectPeople = computed(() => {
    if (group.type !== 'project') return new Set<string>()
    return new Set(
      assignmentsRef.value
        .filter(a => a.project_id === group.id)
        .map(a => a.person_id)
    )
  })

  const filtered = computed(() => {
    if (group.type === 'person') {
      // For person view: include all assignments (including time off) for the person
      return assignmentsRef.value.filter(a => a.person_id === group.id)
    } else {
      // For project view: include project assignments + time off for people assigned to this project
      return assignmentsRef.value.filter(a =>
        a.project_id === group.id ||
        (a.project_id === 'TIMEOFF' && projectPeople.value.has(a.person_id))
      )
    }
  })

  const daily = computed<number[]>(() => {
    const days = daysRef.value
    if (!days.length) return []

    const totals = new Array(days.length).fill(0)
    const windowStart = days[0]
    const windowEnd = days[days.length - 1]

    // Create a map for O(1) lookup of day index
    const dayToIndex = new Map<string, number>()
    days.forEach((d, i) => dayToIndex.set(d, i))

    // Determine which assignments to process for daily totals
    // For project view, we only want to sum the project assignments for the "coverage" heatmap?
    // Or do we want to show if the *people* on the project are over-booked?
    // The plan says: "Project View -> per project's main row header."
    // "Daily coverage map... sum allocations of assignments that include that day"
    // If it's a project row, we probably want to sum the allocations of *this project's* assignments.
    // But if we want to show "over-assigned", maybe we care about the people's total load?
    // "People View -> per project row under a person: optional; primary total shown on the person’s main row header."
    // Let's stick to:
    // Person View: Sum of ALL assignments for that person (shows if person is overbooked).
    // Project View: Sum of assignments FOR THIS PROJECT (shows project effort).
    // Wait, if a person is on 2 projects, and we look at Project A, do we show red if they are busy on Project B?
    // Usually Project View shows "how much effort is on this project".
    // But "over-assigned" implies checking the person's total capacity.
    // The plan says: "In group header rows (main rows), show per-day coverage... over-assigned (red)..."
    // If it's a Project Row, "over-assigned" might mean "we have too many people" or "people are overbooked"?
    // Let's assume for Project View, it sums the effort on *this* project.
    // But for Person View, it sums *all* their assignments.

    const assignmentsToSum = group.type === 'person'
      ? filtered.value // All assignments for this person
      : assignmentsRef.value.filter(a => a.project_id === group.id) // Only assignments for this project

    for (const a of assignmentsToSum) {
      const clamped = clampToWindowDate(a.start, a.end, windowStart, windowEnd)
      if (!clamped) continue

      const [s, e] = clamped
      // We need to iterate days between s and e
      // Since days[] might be just the window, and s/e are clamped to window,
      // we can find the indices in days[]

      const startIdx = dayToIndex.get(s)
      const endIdx = dayToIndex.get(e)

      if (startIdx !== undefined && endIdx !== undefined) {
        for (let i = startIdx; i <= endIdx; i++) {
          // Only count business days for coverage?
          // Or count everything but highlight weekends differently?
          // Usually capacity is 0 on weekends.
          // If we add allocation on weekend, it might show up.
          // Let's add it, and let the UI handle weekend styling/ignoring if needed.
          // But man-days calculation definitely ignores weekends.
          // For the heatmap, if we show red on Saturday, it's weird.
          // Let's exclude weekends from the sum if we want to match "capacity".
          const day = days[i]
          if (day && !isWeekendISO(day)) {
            totals[i] += a.allocation
          }
        }
      }
    }

    return totals
  })

  const totalMD = computed(() => {
    const days = daysRef.value
    if (!days.length) return 0
    const windowStart = days[0]
    const windowEnd = days[days.length - 1]

    if (group.type === 'project') {
      // For project view: sum man-days of assignments to this project
      const projectAssignments = assignmentsRef.value.filter(a => a.project_id === group.id)
      return projectAssignments.reduce((sum, a) => {
        const clamped = clampToWindowDate(a.start, a.end, windowStart, windowEnd)
        if (!clamped) return sum
        return sum + manDays(clamped[0], clamped[1], a.allocation)
      }, 0)
    } else {
      // For person view: sum man-days of all assignments for this person
      return filtered.value.reduce((sum, a) => {
        const clamped = clampToWindowDate(a.start, a.end, windowStart, windowEnd)
        if (!clamped) return sum
        return sum + manDays(clamped[0], clamped[1], a.allocation)
      }, 0)
    }
  })

  const formattedDaily = computed(() => daily.value.map(v => `${Math.round(v * 100)}%`))

  return { daily, totalMD, formattedDaily }
}
